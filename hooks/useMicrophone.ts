import { useState, useRef, useCallback, useEffect } from 'react';

// INFO: Further adjusted blow detection sensitivity to make it even easier to trigger.
const BLOW_THRESHOLD = 25; // Sensitivity for 'blow' detection (average volume)
const VARIANCE_THRESHOLD = 45; // Sensitivity for "white-noise-like" sound, higher is less strict

interface UseMicrophoneResult {
    volume: number;
    isBlowing: boolean;
    startListening: () => Promise<void>;
    stopListening: () => void;
    isListening: boolean;
    error: string | null;
}

export const useMicrophone = (): UseMicrophoneResult => {
    const [volume, setVolume] = useState(0);
    const [isBlowing, setIsBlowing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);
    const isBlowingRef = useRef(false);

    const detectBlow = useCallback(() => {
        if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            
            const averageVolume = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            setVolume(averageVolume);

            // Calculate spectrum variance to distinguish breath from sharp sounds
            const variance = dataArray.reduce((acc, val) => acc + Math.abs(val - averageVolume), 0) / dataArray.length;

            // A "blow" is a combination of sufficient volume and low variance (flat, breathy noise)
            if (averageVolume > BLOW_THRESHOLD && variance < VARIANCE_THRESHOLD && !isBlowingRef.current) {
                isBlowingRef.current = true;
                setIsBlowing(true);
            }

            animationFrameIdRef.current = requestAnimationFrame(detectBlow);
        }
    }, []);

    const stopListening = useCallback(() => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        setVolume(0);
        setIsBlowing(false);
        isBlowingRef.current = false;
        setIsListening(false);
    }, []);

    // FIX: Replaced corrupted function body with a valid implementation.
    const startListening = useCallback(async () => {
        if (isListening) return;
        
        setError(null);
        isBlowingRef.current = false;
        setIsBlowing(false);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = context;
            
            const source = context.createMediaStreamSource(stream);
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            
            setIsListening(true);
            detectBlow();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please check permissions.');
            stopListening();
        }
    }, [isListening, detectBlow, stopListening]);

    // FIX: Added useEffect for cleanup on component unmount.
    useEffect(() => {
        return () => {
            stopListening();
        };
    }, [stopListening]);

    // FIX: Added missing return statement for the hook.
    return { volume, isBlowing, startListening, stopListening, isListening, error };
};