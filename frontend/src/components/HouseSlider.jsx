import { useState, useEffect } from 'react';

const HouseSlider = ({ theme }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        "/imgs/69 Minimalist House Designs That Make Every Detail Count 1.png",
        "/imgs/image 19.png",
        "/imgs/image 21.png",
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [slides.length]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const goToNext = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const goToPrev = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    return (
        <div className={`shadow-lg relative w-[180px] xs:w-[220px] sm:w-[280px] md:w-[340px] lg:w-[380px] xl:w-[420px] 2xl:w-[490px] h-[220px] xs:h-[280px] sm:h-[340px] md:h-[420px] lg:h-[480px] xl:h-[540px] 2xl:h-[630px] ml-2 xs:ml-3 sm:ml-4 md:ml-6 lg:ml-8 rounded-t-[40%] ${
            theme === 'dark' ? 'bg-[#332500]/50' : 'bg-[#ffe699]/50'
        }`}>
            {/* House-shaped container with rounded top */}
            <div className="absolute left-2 xs:left-3 sm:left-4 top-3 xs:top-4 sm:top-5 w-[160px] xs:w-[200px] sm:w-[260px] md:w-[320px] lg:w-[360px] xl:w-[400px] 2xl:w-[460px] h-[200px] xs:h-[260px] sm:h-[320px] md:h-[400px] lg:h-[460px] xl:h-[520px] 2xl:h-[600px] inset-0 overflow-hidden rounded-t-[40%] rounded-b-lg bg-gray-200 shadow-xl">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <img
                            src={slide}
                            alt={`House ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Navigation buttons */}
            <button
                onClick={goToPrev}
                className="absolute left-1 xs:left-2 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-opacity-70 transition-all z-10 text-xs xs:text-sm sm:text-base"
            >
                ‹
            </button>
            <button
                onClick={goToNext}
                className="absolute right-1 xs:right-2 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-opacity-70 transition-all z-10 text-xs xs:text-sm sm:text-base"
            >
                ›
            </button>

            {/* Indicator dots */}
            <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 xs:space-x-2 z-10">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                            index === currentSlide ? 'bg-amber-400' : 'bg-white bg-opacity-50'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HouseSlider;