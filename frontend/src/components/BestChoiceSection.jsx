import { useState, useEffect, useRef } from 'react';

const BestChoiceSection = ({ theme }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const totalCards = 6;
    const [visibleCards, setVisibleCards] = useState(3);
    const autoSlideInterval = 5000;
    const slideRef = useRef(null);

    const cardData = [
        { id: 1, image: '/imgs/1.png', title: 'Luxury Villa', price: '26,000,000', location: 'Summit St. George, Bole, Addis Ababa', bedrooms: 3, bathrooms: 3, type: 'FOR SALE', color: 'green' },
        { id: 2, image: '/imgs/OIP2.png', title: 'Modern Apartment', price: '20,000', location: 'Yeho Street, Arada, Gondar', bedrooms: 2, bathrooms: 1, type: 'FOR RENT', color: 'orange' },
        { id: 3, image: '/imgs/OIP3.png', title: 'Cozy Cottage', price: '30,000,000', location: 'Mekele Road, Kebele 18, Mekelle', bedrooms: 4, bathrooms: 3, type: 'FOR SALE', color: 'green' },
        { id: 4, image: '/imgs/OIP4.png', title: 'Penthouse Suite', price: '45,000,000', location: 'Addis Ababa', bedrooms: 5, bathrooms: 4, type: 'FOR SALE', color: 'green' },
        { id: 5, image: '/imgs/OIP5.png', title: 'Beach House', price: '38,000,000', location: 'Bahirdar', bedrooms: 4, bathrooms: 3, type: 'FOR SALE', color: 'green' },
        { id: 6, image: '/imgs/Normal32.png', title: 'Urban Loft', price: '18,000', location: 'Adama', bedrooms: 2, bathrooms: 1, type: 'FOR RENT', color: 'orange' },
    ];

    // Responsive card count
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setVisibleCards(1);
            } else if (window.innerWidth < 768) {
                setVisibleCards(2);
            } else {
                setVisibleCards(3);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-slide effect with looping
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                const maxIndex = Math.max(0, totalCards - visibleCards);
                return (prevIndex + 1) % (maxIndex + 1);
            });
        }, autoSlideInterval);
        return () => clearInterval(interval);
    }, [totalCards, visibleCards]);

    const handlePrev = () => {
        const maxIndex = Math.max(0, totalCards - visibleCards);
        setCurrentIndex((prev) => (prev - 1 + (maxIndex + 1)) % (maxIndex + 1));
    };

    const handleNext = () => {
        const maxIndex = Math.max(0, totalCards - visibleCards);
        setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1));
    };

    const translateX = `-${currentIndex * (100 / visibleCards)}%`;

    return (
        <div className="w-full max-w-[1035px] py-4 sm:py-6 md:py-8 mx-auto px-4 sm:px-6 md:px-8">
            <div className="container">
                <p className="text-amber-400 text-lg sm:text-xl md:text-2xl pb-2">BEST CHOICES</p>
                <h1 className={`text-left mb-4 sm:mb-5 md:mb-6 text-2xl sm:text-3xl md:text-4xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    Top Ranking Residences
                </h1>
                <div className="relative group">
                    <div className="overflow-hidden">
                        <div
                            ref={slideRef}
                            className="flex transition-transform duration-700 ease-out"
                            style={{ transform: `translateX(${translateX})` }}
                        >
                            {cardData.map((card) => (
                                <div key={card.id} className={`flex-shrink-0 p-2 sm:p-3 lg:mx-5 ${
                                    visibleCards === 1 ? 'w-full' :
                                        visibleCards === 2 ? 'w-[calc(50%-8px)] min-w-[calc(50%-8px)]' :
                                            'w-[calc(33.333%-12px)] min-w-[calc(33.333%-12px)]'
                                }`}>
                                    <div className={`Cards ${theme === 'dark' ? 'dark' : 'light'} h-full`}>
                                        {/* Badge */}
                                        <div
                                            className={`absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs font-bold text-white shadow-lg z-10 transition-transform duration-300 hover:scale-110 ${
                                                card.color === 'green'
                                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                                    : 'bg-gradient-to-r from-orange-500 to-orange-600'
                                            }`}
                                        >
                                            {card.type}
                                        </div>
                                        {/* Image */}
                                        <div className="w-full h-40 sm:h-48 overflow-hidden">
                                            <img
                                                src={card.image}
                                                alt={card.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Info */}
                                        <div className="p-3 sm:p-4 md:p-5 text-center mt-10">
                                            <p className="text-sm sm:text-base"><span className='text-amber-400 font-bold'>ETB</span> {card.price}</p>
                                            <p className='p-1 sm:p-2 text-xs sm:text-sm'>{card.location}</p>
                                            <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                                                <div className="flex items-center gap-1 sm:gap-2">
                                                    <img src="/vectors/Bed.svg" alt="Bed" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 opacity-90" />
                                                    <span className="text-xs sm:text-sm">{card.bedrooms} beds</span>
                                                </div>
                                                <div className="flex items-center gap-1 sm:gap-2">
                                                    <img src="/vectors/Shower.svg" alt="Bath" className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 opacity-90" />
                                                    <span className="text-xs sm:text-sm">{card.bathrooms} baths</span>
                                                </div>
                                            </div>
                                            <button className="mt-1 sm:mt-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-2 text-xs sm:text-sm hover:from-amber-500 hover:to-amber-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                                                More Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons - Hidden on mobile */}
                    <button
                        onClick={handlePrev}
                        className="hidden sm:flex absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-amber-400 rounded-full shadow-2xl border border-amber-500 items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 hover:scale-110"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={handleNext}
                        className="hidden sm:flex absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-amber-400 rounded-full shadow-2xl border border-amber-500 items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 hover:scale-110"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Indicator Dots */}
                    <div className="flex justify-center mt-4 sm:mt-6 md:mt-8 space-x-1 sm:space-x-2">
                        {Array.from({ length: Math.max(1, totalCards - visibleCards + 1) }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                                    index === currentIndex
                                        ? 'bg-amber-400 scale-125'
                                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-amber-300'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Registration CTA Section */}
                <div className={`mt-4 sm:mt-5 text-center transition-all duration-500`}>
                    <h2 className={`text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        Want Your Listings Featured Here?
                    </h2>
                    <p className={`mb-4 sm:mb-5 md:mb-6 text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Join our premium listings and showcase your properties to thousands of potential buyers and renters.
                    </p>
                    <button className="Button2 px-5 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 text-sm sm:text-base">
                        Subscribe Your Property Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BestChoiceSection;