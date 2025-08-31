// components/Loader.jsx
import { useState, useEffect } from 'react';

const Loader = ({ theme = 'dark' }) => {
    const [funFacts] = useState([
        "Did you know? The average person will spend 5 years of their life looking for property!",
        "Fun fact: The most expensive house ever sold was for $238 million in Hong Kong!",
        "Interesting: Ethiopia has some of the most unique architectural styles in Africa!",
        "Tip: Location is the most important factor in real estate value!",
        "Did you know? The concept of 'home' dates back over 15,000 years!",
        "Fun fact: The White House has 132 rooms and 35 bathrooms!",
        "Interesting: The word 'mortgage' comes from French meaning 'death pledge'!",
        "Tip: Natural light can increase a property's perceived value by up to 20%!"
    ]);

    const [currentFactIndex, setCurrentFactIndex] = useState(0);

    // Auto-rotate fun facts
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
        }, 4000); // Change fact every 4 seconds

        return () => clearInterval(interval);
    }, [funFacts.length]);

    return (
        <div className={`fixed inset-0 flex flex-col items-center justify-center z-50 transition-all duration-500 ${
            theme === 'light'
                ? 'bg-white/80 backdrop-blur-md'
                : 'bg-black/90 backdrop-blur-md'
        }`}>
            <div className="text-center mb-8 w-full max-w-2xl px-6"> {/* Increased max width */}
                {/* Custom SVG Loader */}
                <div className="loader-svg-container mx-auto mb-6 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" height="200" width="200" className="mx-auto">
                        <g style={{ order: -1 }}>
                            <polygon
                                transform="rotate(45 100 100)"
                                strokeWidth="1"
                                stroke="#d3a410"
                                fill="none"
                                points="70,70 180,90 100,140 15,100"
                                className="animate-bounce-custom"
                            />
                            <polygon
                                transform="rotate(45 100 100)"
                                strokeWidth="1"
                                stroke="#d3a410"
                                fill="none"
                                points="70,70 180,90 100,140 15,100"
                                className="animate-bounce-custom-2"
                            />
                            <polygon
                                transform="rotate(45 100 100)"
                                strokeWidth="2"
                                stroke=""
                                fill="#414750"
                                points="70,70 150,50 130,130 50,150"
                            />
                            <polygon
                                strokeWidth="2"
                                stroke=""
                                fill="url(#gradiente)"
                                points="100,70 150,100 100,130 50,100"
                            />
                            <defs>
                                <linearGradient y2="100%" x2="10%" y1="0%" x1="0%" id="gradiente">
                                    <stop style={{ stopColor: '#1e2026', stopOpacity: 1 }} offset="20%" />
                                    <stop style={{ stopColor: '#414750', stopOpacity: 1 }} offset="60%" />
                                </linearGradient>
                            </defs>
                            <polygon
                                transform="translate(20, 31)"
                                strokeWidth="2"
                                stroke=""
                                fill="#b7870f"
                                points="80,50 80,75 80,99 40,75"
                            />
                            <polygon
                                transform="translate(20, 31)"
                                strokeWidth="2"
                                stroke=""
                                fill="url(#gradiente2)"
                                points="40,-40 80,-40 80,99 40,75"
                            />
                            <defs>
                                <linearGradient y2="100%" x2="0%" y1="-17%" x1="10%" id="gradiente2">
                                    <stop style={{ stopColor: '#d3a51000', stopOpacity: 1 }} offset="20%" />
                                    <stop
                                        style={{ stopColor: '#d3a51054', stopOpacity: 1 }}
                                        offset="100%"
                                        className="animate-umbral"
                                    />
                                </linearGradient>
                            </defs>
                            <polygon
                                transform="rotate(180 100 100) translate(20, 20)"
                                strokeWidth="2"
                                stroke=""
                                fill="#d3a410"
                                points="80,50 80,75 80,99 40,75"
                            />
                            <polygon
                                transform="rotate(0 100 100) translate(60, 20)"
                                strokeWidth="2"
                                stroke=""
                                fill="url(#gradiente3)"
                                points="40,-40 80,-40 80,85 40,110.2"
                            />
                            <defs>
                                <linearGradient y2="100%" x2="10%" y1="0%" x1="0%" id="gradiente3">
                                    <stop style={{ stopColor: '#d3a51000', stopOpacity: 1 }} offset="20%" />
                                    <stop
                                        style={{ stopColor: '#d3a51054', stopOpacity: 1 }}
                                        offset="100%"
                                        className="animate-umbral"
                                    />
                                </linearGradient>
                            </defs>

                            {/* Light emission area */}
                            <circle cx="100" cy="100" r="60" fill="url(#lightGradient)" opacity="0.3" className="blur-[8px]">
                                <animate attributeName="r" values="60;65;60" dur="4s" repeatCount="indefinite" />
                            </circle>

                            <defs>
                                <radialGradient id="lightGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                    <stop offset="0%" stopColor="#d3a410" stopOpacity="0.8" />
                                    <stop offset="70%" stopColor="#d3a410" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#d3a410" stopOpacity="0" />
                                </radialGradient>
                            </defs>

                            <polygon
                                strokeWidth="2"
                                stroke=""
                                fill="#292d34"
                                points="29.5,99.8 100,142 100,172 29.5,130"
                            />
                            <polygon
                                transform="translate(50, 92)"
                                strokeWidth="2"
                                stroke=""
                                fill="#1f2127"
                                points="50,50 120.5,8 120.5,35 50,80"
                            />
                        </g>
                    </svg>

                    {/* Diamond-shaped floating objects - All with up/down animation */}
                    <div className="absolute inset-0">
                        {/* Container for all diamonds that will move together */}
                        <div className="absolute top-20 left-[50%] w-full h-full animate-float-up-down">
                            {/* Diamond 1 - Top center */}
                            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <svg width="12" height="12" viewBox="0 0 12 12" className="diamond-shape">
                                    <path d="M6 0 L12 6 L6 12 L0 6 Z" fill="#ffe4a1" />
                                </svg>
                            </div>

                            {/* Diamond 2 - Right center */}
                            <div className="absolute top-1/4 left-[47%] transform -translate-x-1/2 translate-y-1/2">
                                <svg width="10" height="10" viewBox="0 0 10 10" className="diamond-shape">
                                    <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="#ccb069" />
                                </svg>
                            </div>

                            {/* Diamond 3 - Bottom center */}
                            <div className="absolute bottom-44 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                                <svg width="8" height="8" viewBox="0 0 8 8" className="diamond-shape">
                                    <path d="M4 0 L8 4 L4 8 L0 4 Z" fill="#d3a410" />
                                </svg>
                            </div>

                            {/* Diamond 4 - Left center */}
                            <div className="absolute top-1/4 left-[53%] transform -translate-x-1/2 translate-y-1/2">
                                <svg width="9" height="9" viewBox="0 0 9 9" className="diamond-shape">
                                    <path d="M4.5 0 L9 4.5 L4.5 9 L0 4.5 Z" fill="#b7870f" />
                                </svg>
                            </div>

                            {/* Diamond 5 - Center */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <svg width="7" height="7" viewBox="0 0 7 7" className="diamond-shape">
                                    <path d="M3.5 0 L7 3.5 L3.5 7 L0 3.5 Z" fill="#fff" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading Text */}
                <div className={`text-xl font-semibold mb-6 animate-pulse ${
                    theme === 'light' ? 'text-amber-600' : 'text-amber-400'
                }`}>
                    Loading...
                </div>

                {/* Fun Fact Section - Wider container */}
                <div className="w-full max-w-3xl mx-auto"> {/* Increased max width */}
                    <div className="h-24 flex flex-col justify-center mb-2">
                        <div className={`text-sm mb-2 font-medium ${
                            theme === 'light' ? 'text-amber-700' : 'text-amber-300'
                        }`}>
                            Did You Know?
                        </div>

                        <div className="h-16 overflow-hidden relative">
                            {funFacts.map((fact, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                                        index === currentFactIndex
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                    }`}
                                >
                                    <div className={`text-lg font-light px-6 ${
                                        theme === 'light' ? 'text-gray-800' : 'text-white'
                                    }`}>
                                        {fact}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Progress indicators */}
                    <div className="flex flex-col items-center space-y-2">
                        <div className="flex justify-center space-x-3 p-2 bg-opacity-20 rounded-full">
                            {funFacts.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentFactIndex(index)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                                        index === currentFactIndex
                                            ? theme === 'light'
                                                ? 'bg-amber-600 scale-125 shadow-lg'
                                                : 'bg-amber-400 scale-125 shadow-lg'
                                            : theme === 'light'
                                                ? 'bg-amber-200 hover:bg-amber-400'
                                                : 'bg-amber-700 hover:bg-amber-500'
                                    }`}
                                    aria-label={`Go to fact ${index + 1}`}
                                />
                            ))}
                        </div>

                        {/* Fact counter */}
                        <div className={`text-xs font-medium ${
                            theme === 'light' ? 'text-amber-700' : 'text-amber-300'
                        }`}>
                            {currentFactIndex + 1} / {funFacts.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Loader;