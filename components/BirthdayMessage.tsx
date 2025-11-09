import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface BirthdayMessageProps {
    name: string;
    onReplay: () => void;
    onSendOwn: () => void;
}

const BirthdayMessage: React.FC<BirthdayMessageProps> = ({ name, onReplay, onSendOwn }) => {
    useEffect(() => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        // Refined palette and shapes for more festivity
        const colors = ['#fde68a', '#fecdd3', '#FBF6EE', '#a0c4ff', '#ffc6ff'];
        const shapes: ('circle' | 'square')[] = ['circle', 'square'];

        // A big, celebratory burst to start!
        confetti({
            ...defaults,
            particleCount: 150,
            spread: 180,
            origin: { y: 0.6 },
            colors,
            shapes,
            gravity: 0.8, // a little lighter
            scalar: 1.1,
        });

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);

            // Continuous streams from the sides
            confetti({ ...defaults, particleCount, colors, shapes, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, gravity: 0.9 });
            confetti({ ...defaults, particleCount, colors, shapes, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, gravity: 0.9 });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 z-10 animate-fade-in">
            <h1 className="text-6xl md:text-8xl font-sacramento font-bold text-white/90 drop-shadow-lg">
                Happy Birthday, {name}!
            </h1>
            <p className="mt-4 text-3xl text-amber-200">🎉💖</p>
            <div className="mt-12">
                 <button
                    onClick={onSendOwn}
                    className="px-8 py-3 bg-[#DAB88B]/80 text-white font-semibold rounded-full shadow-md hover:bg-[#C1A27A] transition-all transform hover:scale-105 backdrop-blur-sm"
                >
                    Bake your own cake 🍰
                </button>
            </div>
            
            <button
                onClick={onReplay}
                className="absolute bottom-6 left-6 px-6 py-2 bg-[#F4EAD5]/70 text-stone-700 font-semibold rounded-full shadow-md hover:bg-[#E9DCC3] transition-all transform hover:scale-105 backdrop-blur-sm"
            >
                View Envelope Again 💌
            </button>

             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 1s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default BirthdayMessage;