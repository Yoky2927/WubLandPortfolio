import { useEffect, useState } from 'react';

const FloatingElements = ({ theme, reduced }) => {
    const [positions, setPositions] = useState([]);

    useEffect(() => {
        // Generate fewer positions for floating elements when reduced is true
        const count = reduced ? 15 : 40;
        const newPositions = Array.from({ length: count }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 20 + 15,
            delay: Math.random() * 8,
            duration: Math.random() * 15 + 10,
            rotation: Math.random() * 360,
            type: Math.random() > 0.5 ? 'star' : 'rectangle',
            rectangleType: Math.random() > 0.5 ? '29' : '31',
            scale: Math.random() * 0.8 + 0.6
        }));
        setPositions(newPositions);
    }, [reduced]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating stars (dusty white circles) in dark mode */}
            {theme === 'dark' && positions.filter(pos => pos.type === 'star').map((pos, i) => (
                <div
                    key={`star-${i}`}
                    className="absolute rounded-full bg-white animate-pulse"
                    style={{
                        left: `${pos.x}%`,
                        top: `${pos.y}%`,
                        width: `${pos.size / 12}px`,
                        height: `${pos.size / 12}px`,
                        opacity: Math.random() * 0.5 + 0.1,
                        animationDelay: `${pos.delay}s`,
                        animationDuration: `${pos.duration}s`,
                        filter: 'blur(1px)'
                    }}
                />
            ))}

            {/* Floating rectangles with different sizes */}
            {positions.filter(pos => pos.type === 'rectangle').map((pos, i) => {
                const size = pos.size * pos.scale;

                return (
                    <img
                        key={`rect-${i}`}
                        src={`/vectors/Rectangle ${pos.rectangleType}.svg`}
                        className="absolute transition-all duration-300 ease-out"
                        style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            width: `${size}px`,
                            height: `${size}px`,
                            opacity: theme === 'dark' ? 0.5 : 0.7,
                            animation: `float-slow ${pos.duration}s ease-in-out infinite`,
                            animationDelay: `${pos.delay}s`,
                            transform: `rotate(${pos.rotation}deg)`,
                            filter: theme === 'dark'
                                ? 'brightness(1.2)'
                                : 'brightness(0.9)'
                        }}
                        alt="Floating decoration"
                    />
                );
            })}

            {/* Additional larger decorative rectangles - reduced to 2 when reduced is true */}
            {[1, 2].map((_, index) => (
                <img
                    key={`large-rect-${index}`}
                    src={`/vectors/Rectangle ${index % 2 === 0 ? '29' : '31'}.svg`}
                    className="absolute animate-float-slow transition-all duration-500"
                    style={{
                        left: index === 0 ? '5%' : '85%',
                        top: index === 0 ? '15%' : '70%',
                        width: '80px',
                        opacity: theme === 'dark' ? 0.4 : 0.6,
                        filter: theme === 'dark'
                            ? 'brightness(1.5)'
                            : 'brightness(0.9)',
                        transform: 'rotate(45deg)'
                    }}
                    alt="Large floating decoration"
                />
            ))}

            {/* Star SVGs - reduced to 6 when reduced is true */}
            {Array.from({ length: reduced ? 10 : 20 }).map((_, i) => {
                const starX = 5 + (i * 8) % 90;
                const starY = 10 + Math.sin(i * 0.7) * 70;
                const twinkleDelay = Math.random() * 5;
                const twinkleDuration = 2 + Math.random() * 3;


                return (
                    <svg
                        key={`star-svg-${i}`}
                        className="absolute animate-twinkle transition-all duration-300 ease-out"
                        style={{
                            left: `${starX}%`,
                            top: `${starY}%`,
                            width: `${12 + (i % 3 * 6)}px`, // Varied sizes
                            height: `${12 + (i % 3 * 6)}px`,
                            opacity: theme === 'dark' ? 0.8 : 0.2,
                            filter: theme === 'dark'
                                ? 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.5))'
                                : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                            animationDelay: `${twinkleDelay}s`,
                            animationDuration: `${twinkleDuration}s`,
                            zIndex: 1
                        }}
                        viewBox="0 0 24 24"
                        fill={theme === 'dark' ? '#ffffff' : '#cbd5e1'}
                    >
                        <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
                    </svg>
                );
            })}

            {/* Additional small twinkling stars */}
            {Array.from({ length: reduced ? 15 : 30 }).map((_, i) => {
                const starX = Math.random() * 100;
                const starY = Math.random() * 100;
                const twinkleDelay = Math.random() * 6;
                const twinkleDuration = 1.5 + Math.random() * 2;

                return (
                    <div
                        key={`tiny-star-${i}`}
                        className="absolute rounded-full bg-white animate-twinkle"
                        style={{
                            left: `${starX}%`,
                            top: `${starY}%`,
                            width: '2px',
                            height: '2px',
                            opacity: theme === 'dark' ? 0.6 : 0.1,
                            animationDelay: `${twinkleDelay}s`,
                            animationDuration: `${twinkleDuration}s`,
                            filter: 'blur(0.5px)',
                            zIndex: 1
                        }}
                    />
                );
            })}
        </div>
    );
};

export default FloatingElements;