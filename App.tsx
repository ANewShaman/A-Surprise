import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMicrophone } from './hooks/useMicrophone';
import AnimatedBackground from './components/AnimatedBackground';
import ThreeScene from './components/ThreeScene';
import BirthdayMessage from './components/BirthdayMessage';
import Spinner from './components/Spinner';
import { gsap } from 'gsap';
import { db } from './firebase/config';
import { collection, addDoc, getDoc, doc, DocumentData } from 'firebase/firestore';


type View = 'landing' | 'creatorName' | 'creatorNote' | 'bakingFlavor' | 'bakingFrosting' | 'bakingToppings' | 'creatorCode' | 'codeEntry' | 'envelope' | 'letter' | 'cake';

// --- Data Definitions ---
const FLAVORS = {
    'Vanilla': { body: '#FFF4E3', note: 'creamy ivory' },
    'Chocolate': { body: '#6B3E26', note: 'deep, matte cocoa' },
    'Strawberry': { body: '#F8AFA6', note: 'pastel pink' },
    'Lemon': { body: '#FFE28A', note: 'soft yellow' },
    'Red Velvet': { body: '#B33A3A', note: 'muted burgundy' },
    'Blueberry': { body: '#A9BCE0', note: 'dusty lilac' },
};

const FROSTINGS = {
    'Vanilla Cream': { color: '#FFF7EE' },
    'Chocolate Ganache': { color: '#5A2D0C' },
    'Strawberry Whip': { color: '#F8AFA6' },
    'Blueberry Mousse': { color: '#C7C3F4' },
    'Lemon Glaze': { color: '#FFF3B0' },
    'Red Velvet Cream Cheese': { color: '#FDE2E4' },
};

const TOPPINGS = {
    'Sprinkles': '🌈',
    'Cherries': '🍒',
    'Chocolate Drizzle': '🍫',
    'Star Edibles': '🌟',
    'Pearl Edibles': '⚪',
    'Choco Chips': '🍪',
};

interface CakeConfig {
    flavor: string;
    frosting: string;
    toppings: string[];
}

interface InviteData {
    name: string;
    note: string;
    cake: CakeConfig;
}

const initialCakeConfig: CakeConfig = {
    flavor: FLAVORS['Vanilla'].body,
    frosting: FROSTINGS['Vanilla Cream'].color,
    toppings: [],
};

// --- Sub-component: Landing Page ---
const Landing: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => (
    <div className="w-full max-w-md mx-auto p-8 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg text-center animate-fade-in border border-white/30">
        <h1 className="text-3xl md:text-4xl font-sacramento font-bold text-[#C88EA7] mb-2">A Birthday Surprise</h1>
        <p className="text-stone-600 mb-8">Send or open a personalized digital birthday card!</p>
        <div className="flex flex-col gap-4">
            <button
                onClick={() => onNavigate('creatorName')}
                className="w-full px-8 py-3 bg-[#DAB88B] text-white font-bold rounded-lg shadow-md hover:bg-[#C1A27A] transition-transform transform hover:scale-105"
            >
                Create an Invite ✨
            </button>
            <button
                onClick={() => onNavigate('codeEntry')}
                className="w-full px-8 py-3 bg-[#F4EAD5] text-stone-800 font-bold rounded-lg shadow-md hover:bg-[#E9DCC3] transition-transform transform hover:scale-105"
            >
                Enter Invite Code 💌
            </button>
        </div>
        <style>{`
            @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
    </div>
);

// --- Sub-component: Baking Flow ---
const CakeBaker: React.FC<{ cakeConfig: CakeConfig, setCakeConfig: (c: CakeConfig) => void, onNext: () => void, onBack: () => void, currentStep: View }> = ({ cakeConfig, setCakeConfig, onNext, onBack, currentStep }) => {
    
    const SelectionPanel: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
         <div className="w-full md:w-1/3 p-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg animate-slide-in border border-white/30">
            <h2 className="text-2xl font-semibold text-[#8B4513]/80 mb-4 text-center">{title}</h2>
            <div className="flex flex-wrap gap-3 justify-center">
                {children}
            </div>
            <div className="mt-6 flex justify-between items-center">
                <button onClick={onBack} className="text-stone-600 hover:text-[#C88EA7] transition">&larr; Back</button>
                <button onClick={onNext} className="px-6 py-2 bg-[#DAB88B] text-white font-bold rounded-lg shadow-md hover:bg-[#C1A27A] transition-transform transform hover:scale-105">
                   {currentStep === 'bakingToppings' ? "Done!" : "Next"} &rarr;
                </button>
            </div>
        </div>
    );

    const renderStep = () => {
        switch(currentStep) {
            case 'bakingFlavor':
                return (
                    <SelectionPanel title="Choose a flavor">
                        {Object.entries(FLAVORS).map(([name, {body, note}]) => (
                            <button key={name} onClick={() => setCakeConfig({...cakeConfig, flavor: body})} className={`p-2 rounded-lg text-sm font-semibold border-2 transition ${cakeConfig.flavor === body ? 'border-[#C88EA7] ring-2 ring-[#C88EA7]/30' : 'border-stone-200'}`}>
                                <div style={{backgroundColor: body}} className="w-8 h-8 rounded-full mx-auto mb-1 border border-stone-200"></div>
                                {name}
                            </button>
                        ))}
                    </SelectionPanel>
                );
            case 'bakingFrosting':
                return (
                    <SelectionPanel title="Choose a frosting">
                        {Object.entries(FROSTINGS).map(([name, {color}]) => (
                            <button key={name} onClick={() => setCakeConfig({...cakeConfig, frosting: color})} className={`p-2 rounded-lg text-sm font-semibold border-2 transition ${cakeConfig.frosting === color ? 'border-[#C88EA7] ring-2 ring-[#C88EA7]/30' : 'border-stone-200'}`}>
                                <div style={{backgroundColor: color}} className="w-8 h-8 rounded-full mx-auto mb-1 border border-stone-200"></div>
                                {name}
                            </button>
                        ))}
                    </SelectionPanel>
                );
            case 'bakingToppings':
                 return (
                    <SelectionPanel title="Add some toppings">
                        {Object.entries(TOPPINGS).map(([name, icon]) => (
                             <button key={name} onClick={() => {
                                 const newToppings = cakeConfig.toppings.includes(name)
                                     ? cakeConfig.toppings.filter(t => t !== name)
                                     : [...cakeConfig.toppings, name];
                                 setCakeConfig({...cakeConfig, toppings: newToppings});
                             }} className={`p-2 rounded-lg text-sm font-semibold border-2 transition ${cakeConfig.toppings.includes(name) ? 'border-[#C88EA7] ring-2 ring-[#C88EA7]/30' : 'border-stone-200'}`}>
                                <div className="text-2xl">{icon}</div>
                                {name}
                            </button>
                        ))}
                    </SelectionPanel>
                );
            default: return null;
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-8 p-4">
            <div className="w-full md:w-2/3 h-1/2 md:h-full relative">
                 <ThreeScene isBlowing={false} onCandlesOut={() => {}} cakeConfig={cakeConfig} isPreview={true} />
            </div>
            {renderStep()}
             <style>{`
                @keyframes slide-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-in { animation: slide-in 0.5s ease-out forwards; }
             `}</style>
        </div>
    );
};


// --- Sub-component: Invite Creator ---
const CreatorFlow: React.FC<{ view: View, onNavigate: (v: View) => void, inviteData: InviteData, setInviteData: (d: InviteData) => void }> = ({ view, onNavigate, inviteData, setInviteData }) => {
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (view === 'creatorName' && inviteData.name.trim()) onNavigate('creatorNote');
        if (view === 'creatorNote' && inviteData.note.trim()) onNavigate('bakingFlavor');
    };

    const renderCreatorStep = () => {
        switch(view) {
            case 'creatorName':
                return (
                    <>
                        <h1 className="text-3xl font-semibold text-[#8B4513]/80 mb-6">Whom is this for? 🎀</h1>
                        <input
                            type="text"
                            value={inviteData.name}
                            onChange={(e) => setInviteData({...inviteData, name: e.target.value})}
                            placeholder="Enter their name"
                            className="w-full px-4 py-3 mb-4 text-lg bg-white/80 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-[#DAB88B]"
                            required
                        />
                        <button type="submit" disabled={!inviteData.name.trim()} className="w-full px-8 py-3 bg-[#DAB88B] text-white font-bold rounded-lg shadow-md hover:bg-[#C1A27A] transition disabled:bg-stone-300">
                           Next &rarr;
                        </button>
                    </>
                );
            case 'creatorNote':
                 return (
                    <>
                        <h1 className="text-3xl font-semibold text-[#8B4513]/80 mb-6">Write a little note ✏️</h1>
                         <textarea
                            value={inviteData.note}
                            onChange={(e) => setInviteData({...inviteData, note: e.target.value})}
                            placeholder="Happy birthday! Hope you have a wonderful day..."
                            className="w-full px-4 py-3 mb-6 text-lg bg-white/80 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-[#DAB88B] h-32 resize-none"
                            required
                        />

                        <button type="submit" disabled={!inviteData.note.trim()} className="w-full px-8 py-3 bg-[#DAB88B] text-white font-bold rounded-lg shadow-md hover:bg-[#C1A27A] transition disabled:bg-stone-300">
                           Let's bake a cake for them!
                        </button>
                    </>
                );
        }
    }

    return (
        <div className="w-full max-w-md mx-auto p-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg text-center animate-fade-in border border-white/30">
            <button onClick={() => onNavigate(view === 'creatorName' ? 'landing' : 'creatorName')} className="absolute top-4 left-4 text-stone-600 hover:text-[#C88EA7] transition">
                &larr; Back
            </button>
            <form onSubmit={handleSubmit} className="flex flex-col items-center">
                {renderCreatorStep()}
            </form>
        </div>
    );
};

const GeneratedCode: React.FC<{ inviteData: InviteData, onNavigate: (v: View) => void }> = ({ inviteData, onNavigate }) => {
    const [copied, setCopied] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const saveInvite = async () => {
            setLoading(true);
            setError('');
            try {
                if (!db.app.options.apiKey || db.app.options.apiKey === 'YOUR_API_KEY') {
                    setError('Firebase is not configured. Please add your config in firebase/config.ts');
                    setLoading(false);
                    return;
                }
                const docRef = await addDoc(collection(db, "invites"), inviteData);
                setInviteCode(docRef.id);
            } catch (e) {
                console.error("Error adding document: ", e);
                setError('Could not save invite. Check console and Firebase config.');
            } finally {
                setLoading(false);
            }
        };

        saveInvite();
    }, [inviteData]);

    const handleCopy = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-md mx-auto p-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg text-center animate-fade-in border border-white/30">
            <h1 className="text-3xl font-semibold text-[#8B4513]/80 mb-4">All done! 💌</h1>
            <p className="text-stone-700 font-semibold mb-2">Your invite is ready!</p>
            <p className="text-stone-600 text-sm mb-3">Share this code with {inviteData.name}.</p>
            
            {loading && (
                <div className="flex items-center justify-center p-4">
                    <Spinner />
                    <p className="ml-2">Generating your code...</p>
                </div>
            )}

            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md my-2">{error}</p>}
            
            {!loading && !error && inviteCode && (
                 <div className="flex items-center gap-2">
                    <input type="text" readOnly value={inviteCode} className="flex-grow p-2 bg-white border border-amber-200 rounded-md truncate font-mono text-center text-lg" />
                    <button onClick={handleCopy} className="px-4 py-2 bg-[#F4EAD5] text-stone-800 font-semibold rounded-md hover:bg-[#E9DCC3] transition">
                        {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                </div>
            )}
           
            <button onClick={() => onNavigate('landing')} className="mt-6 text-sm text-stone-600 hover:text-[#C88EA7]">Create another invite</button>
        </div>
    );
};


// --- Sub-component: Code Entry ---
const CodeEntry: React.FC<{ onNavigate: (view: View) => void, onCodeSubmit: (data: InviteData) => void }> = ({ onNavigate, onCodeSubmit }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!code.trim()) {
            setError('Please enter a code.');
            return;
        }
        setLoading(true);
        try {
            if (!db.app.options.apiKey || db.app.options.apiKey === 'YOUR_API_KEY') {
                setError('Firebase is not configured. Cannot retrieve invites.');
                setLoading(false);
                return;
            }
            const docRef = doc(db, "invites", code.trim());
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as InviteData;
                if (data.name && data.cake && data.note) {
                    onCodeSubmit(data);
                } else {
                    throw new Error('Invalid data structure in invite');
                }
            } else {
                setError('Invite not found. Please check the code.');
            }
        } catch (err) {
            console.error(err);
            if (!error) {
                setError('Could not retrieve invite. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg text-center animate-fade-in border border-white/30">
            <button onClick={() => onNavigate('landing')} className="absolute top-4 left-4 text-stone-600 hover:text-[#C88EA7] transition">&larr; Back</button>
            <h1 className="text-3xl font-semibold text-[#8B4513]/80 mb-6">Enter Invite Code</h1>
            <form onSubmit={handleSubmit} className="flex flex-col items-center">
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your code here"
                    className="w-full px-4 py-3 mb-4 text-lg bg-white/80 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-[#DAB88B] font-mono" required />
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <button type="submit" disabled={loading} className="w-full px-8 py-3 bg-[#F4EAD5] text-stone-800 font-bold rounded-lg shadow-md hover:bg-[#E9DCC3] transition-transform transform hover:scale-105 flex items-center justify-center disabled:bg-stone-300">
                    {loading ? <Spinner /> : 'Open Invite 💌'}
                </button>
            </form>
        </div>
    );
};

// --- Sub-components: Recipient Flow (Envelope, Letter) ---
const Envelope: React.FC<{ recipientName: string, onOpen: () => void }> = ({ recipientName, onOpen }) => {
    const envelopeRef = useRef<HTMLDivElement>(null);
    const flapRef = useRef<HTMLDivElement>(null);
    
    const handleClick = () => {
        console.log("=== ENVELOPE CLICKED ===");
        console.log("envelopeRef.current:", envelopeRef.current);
        console.log("flapRef.current:", flapRef.current);
        console.log("onOpen function:", onOpen);
        
        try {
            gsap.timeline({ onComplete: () => {
                console.log("GSAP animation complete, calling onOpen");
                onOpen();
            }})
                .to(flapRef.current, { duration: 0.5, rotationX: 180, ease: 'power2.inOut' })
                .to(envelopeRef.current, { duration: 0.7, scale: 1.5, autoAlpha: 0, ease: 'power2.in' }, ">-0.2");
            console.log("GSAP animation started successfully");
        } catch (error) {
            console.error("Error in GSAP animation:", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center cursor-pointer group" onClick={handleClick} role="button" aria-label="Open invitation envelope">
             <div ref={envelopeRef} className="relative w-80 h-48 [transform-style:preserve-3d]">
                <div className="absolute w-full h-full bg-[#E9DCC3] rounded-md shadow-lg"></div>
                {/* Back of envelope */}
                <div ref={flapRef} className="absolute top-0 left-0 w-full h-1/2 bg-[#F4EAD5] rounded-t-md origin-bottom [transform-style:preserve-3d]">
                    {/* Inner flap */}
                    <div className="absolute w-full h-full bg-[#E9DCC3] [transform:rotateX(180deg)] [backface-visibility:hidden]"></div>
                    {/* Outer flap */}
                    <div className="absolute w-full h-full bg-[#F4EAD5] [backface-visibility:hidden]"></div>
                </div>
                 {/* Front of envelope */}
                <div className="absolute w-full h-full bg-[#F4EAD5] flex items-center justify-center rounded-md shadow-inner">
                    <div className="text-center">
                         <p className="font-caveat text-3xl text-stone-600">To: {recipientName} 💕</p>
                         <p className="absolute top-2 right-4 text-3xl transform -rotate-12 group-hover:animate-bounce">📨</p>
                    </div>
                </div>
             </div>
             <div className="mt-8 text-xl text-stone-600 font-semibold group-hover:text-[#C88EA7] transition">
                Click to open your letter 💌
            </div>
        </div>
    );
};

const Letter: React.FC<{ inviteData: InviteData, onClose: () => void }> = ({ inviteData, onClose }) => {
    console.log("=== LETTER COMPONENT RENDERING ===", inviteData);
    const letterRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        console.log("Letter useEffect running, letterRef:", letterRef.current);
        if (letterRef.current) {
            gsap.fromTo(letterRef.current, 
                { y: '100vh', scale: 0.8, opacity: 0 },
                { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
            );
        }
    }, []);

    const handleClose = () => {
        console.log("Letter close button clicked");
        gsap.to(letterRef.current, { duration: 0.5, y: '-100vh', opacity: 0, ease: 'power2.in', onComplete: onClose });
    };

    return (
        <div ref={letterRef} className="w-full max-w-lg mx-auto p-10 bg-[#FBF6EE] rounded-lg shadow-2xl text-center border-4 border-amber-100 relative">
            <h2 className="font-caveat text-4xl text-[#8B4513]/80 mb-6">A little note for you...</h2>
            <p className="font-caveat text-2xl text-stone-700 whitespace-pre-wrap min-h-[100px]">{inviteData.note}</p>
            <button onClick={handleClose} className="mt-8 px-6 py-2 bg-[#DAB88B] text-white font-bold rounded-lg shadow-md hover:bg-[#C1A27A] transition">
                See your surprise &rarr;
            </button>
             <div className="absolute top-4 right-4 text-4xl text-amber-300 animate-pulse">✨</div>
        </div>
    );
}

// --- Main Application Component ---
const App: React.FC = () => {
    const [inviteData, setInviteData] = useState<InviteData>({name: '', note: '', cake: initialCakeConfig});
    const [view, setView] = useState<View>('landing');
    const [showBirthdayMessage, setShowBirthdayMessage] = useState(false);
    const { volume, isBlowing, startListening, stopListening, error } = useMicrophone();
    const hasStartedListening = useRef(false);

    const handleNavigate = useCallback((newView: View) => {
        console.log("Navigating to:", newView);
        setView(newView);
    }, []);

    const handleCodeSubmit = useCallback((data: InviteData) => {
        console.log("Code submitted, data:", data);
        setInviteData(data);
        setView('envelope');
    }, []);

    const handleBakingComplete = () => {
        setView('creatorCode');
    };
    
    const onCandlesOut = useCallback(() => {
        setShowBirthdayMessage(true);
        stopListening();
        hasStartedListening.current = false;
    }, [stopListening]);
    
    const handleReplay = useCallback(() => {
        if (view === 'cake') {
            stopListening();
            hasStartedListening.current = false;
        }
        setShowBirthdayMessage(false);
        setView('envelope');
    }, [view, stopListening]);

    const handleSendOwn = useCallback(() => {
        setInviteData({name: '', note: '', cake: initialCakeConfig});
        setShowBirthdayMessage(false);
        setView('landing');
    }, []);

    useEffect(() => {
        if (view === 'cake' && !hasStartedListening.current && !showBirthdayMessage) {
            hasStartedListening.current = true;
            startListening();
        }
    }, [view, startListening, showBirthdayMessage]);
    
    const bakerBackMap: Record<string, View> = {
        'creatorNote': 'creatorName',
        'bakingFlavor': 'creatorNote',
        'bakingFrosting': 'bakingFlavor',
        'bakingToppings': 'bakingFrosting'
    };
    
    const bakerNextMap: Record<string, View> = {
        'bakingFlavor': 'bakingFrosting',
        'bakingFrosting': 'bakingToppings',
    };

    const renderContent = () => {
        console.log("Current view:", view);
        
        switch (view) {
            case 'landing':
                return <Landing onNavigate={handleNavigate} />;
            case 'creatorName':
            case 'creatorNote':
                return <CreatorFlow view={view} onNavigate={handleNavigate} inviteData={inviteData} setInviteData={setInviteData} />;
            case 'bakingFlavor':
            case 'bakingFrosting':
            case 'bakingToppings':
                return <CakeBaker 
                    cakeConfig={inviteData.cake} 
                    setCakeConfig={(cake) => setInviteData({...inviteData, cake})}
                    currentStep={view}
                    onNext={() => view === 'bakingToppings' ? handleBakingComplete() : handleNavigate(bakerNextMap[view])}
                    onBack={() => handleNavigate(bakerBackMap[view])}
                />;
            case 'creatorCode':
                return <GeneratedCode inviteData={inviteData} onNavigate={handleNavigate} />
            case 'codeEntry':
                return <CodeEntry onNavigate={handleNavigate} onCodeSubmit={handleCodeSubmit} />;
            case 'envelope':
                return <Envelope recipientName={inviteData.name} onOpen={() => {
                    console.log("onOpen called! Switching to letter view");
                    setView('letter');
                    console.log("View should now be: letter");
                }} />;
            case 'letter':
                return <Letter inviteData={inviteData} onClose={() => {
                    console.log("Letter onClose called, switching to cake");
                    setView('cake');
                }} />;
            case 'cake':
                return (
                    <div className="w-full h-full relative">
                        <ThreeScene isBlowing={isBlowing} onCandlesOut={onCandlesOut} cakeConfig={inviteData.cake} />
                        
                        {!showBirthdayMessage && (
                             <>
                                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-white bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full text-center shadow-sm z-10">
                                    <p>Make a wish and blow out the candles 🕯️</p>
                                </div>

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-1/2 max-w-xs h-3 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm shadow-sm z-10">
                                    <div 
                                        className="h-full bg-[#FADADD] rounded-full transition-[width] duration-200 ease-out"
                                        style={{ width: `${Math.min(volume, 100)}%` }}>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {error && !showBirthdayMessage && <p className="absolute top-4 left-1/2 -translate-x-1/2 text-red-500 bg-white/80 p-2 rounded-md z-10">{error}</p>}

                        {showBirthdayMessage && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in-fast">
                                <BirthdayMessage name={inviteData.name} onReplay={handleReplay} onSendOwn={handleSendOwn} />
                            </div>
                        )}
                        <style>{`
                            @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
                            .animate-fade-in-fast { animation: fade-in-fast 0.5s ease-out forwards; }
                        `}</style>
                    </div>
                );
            default:
                return <Landing onNavigate={handleNavigate} />;
        }
    };

    return (
        <main className="w-screen h-screen bg-[#F5EFE6] flex items-center justify-center p-4 relative overflow-hidden">
             <AnimatedBackground />
             <div className="absolute inset-0 bg-gradient-to-br from-amber-100/30 via-transparent to-rose-100/30"></div>
            {renderContent()}
        </main>
    );
};

export default App;