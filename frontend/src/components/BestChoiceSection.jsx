import { useState, useEffect, useRef } from "react";
import { Ruler } from "lucide-react";
import PropertyDetailsPopup from "./PropertyDetailsPopup";
import { sampleProperties } from "../data/sampleProperties";

const BestChoiceSection = ({ theme }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState(3);
  const autoSlideInterval = 5000;
  const slideRef = useRef(null);

  // Filter premium properties for the Best Choice section
  const premiumProperties = sampleProperties.filter(property => property.premium);
  const totalCards = premiumProperties.length;

  // Format currency for display
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `ETB ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `ETB ${(amount / 1000).toFixed(0)}K`;
    }
    return `ETB ${amount}`;
  };

  // Get property type display text and color
  const getPropertyTypeInfo = (property) => {
    const isForRent = property.propertyStatus === "for rent";
    return {
      type: isForRent ? "FOR RENT" : "FOR SALE",
      color: isForRent ? "orange" : "green"
    };
  };

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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-slide effect with looping
  useEffect(() => {
    if (totalCards === 0) return;

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

  const handleMoreDetails = (property) => {
    setSelectedProperty(property);
    setIsPopupOpen(true);
  };

  const handleNavigateToProperties = () => {
    setIsPopupOpen(false);
    window.location.href = "/properties";
  };

  const translateX = `-${currentIndex * (100 / visibleCards)}%`;

  if (premiumProperties.length === 0) {
    return (
      <div className="w-full max-w-[1035px] py-8 mx-auto px-4 sm:px-6 md:px-8 text-center">
        <p className="text-gray-500">No premium properties available at the moment.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-[1035px] py-4 sm:py-6 md:py-8 mx-auto px-4 sm:px-6 md:px-8">
        <div className="container">
          <p className="text-amber-400 text-lg sm:text-xl md:text-2xl pb-2">
            BEST CHOICES
          </p>
          <h1
            className={`text-left mb-4 sm:mb-5 md:mb-6 text-2xl sm:text-3xl md:text-4xl ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
          >
            Top Ranking Residences
          </h1>
          
          <div className="relative group">
            <div className="overflow-hidden">
              <div
                ref={slideRef}
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(${translateX})` }}
              >
                {premiumProperties.map((property) => {
                  const typeInfo = getPropertyTypeInfo(property);
                  
                  return (
                    <div
                      key={property.id}
                      className={`flex-shrink-0 p-2 sm:p-3 lg:mx-5 ${
                        visibleCards === 1
                          ? "w-full"
                          : visibleCards === 2
                          ? "w-[calc(50%-8px)] min-w-[calc(50%-8px)]"
                          : "w-[calc(33.333%-12px)] min-w-[calc(33.333%-12px)]"
                      }`}
                    >
                      <div
                        className={`Cards ${
                          theme === "dark" ? "dark" : "light"
                        } rounded-lg overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 h-full flex flex-col`}
                      >
                        {/* Badge */}
                        <div
                          className={`absolute top-3 right-3 px-3 py-1.5 text-xs font-bold text-white shadow-lg z-10 transition-all duration-300 hover:scale-110 rounded ${
                            typeInfo.color === "green"
                              ? "bg-gradient-to-r from-green-500 to-green-600"
                              : "bg-gradient-to-r from-orange-500 to-orange-600"
                          }`}
                        >
                          {typeInfo.type}
                        </div>
                        
                        {/* Image */}
                        <div className="w-full h-48 overflow-hidden">
                          <img
                            src={property.image}
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-500"
                          />
                        </div>
                        
                        {/* Card Content */}
                        <div className="p-4 flex-1 flex flex-col">
                          {/* Price - High Contrast */}
                          <div className="text-center mb-3">
                            <p className="text-base sm:text-lg font-bold">
                              <span className={`font-bold ${
                                theme === "dark" ? "text-amber-400" : "text-amber-600"
                              }`}>
                                {formatCurrency(property.price)}
                              </span>
                              {typeInfo.type === "FOR RENT" && (
                                <span className={`text-xs ml-1 ${
                                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                                }`}>
                                  /month
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Location - Improved Visibility */}
                          <div className="mb-3 text-center">
                            <p className={`text-sm font-medium mb-1 ${
                              theme === "dark" ? "text-gray-200" : "text-gray-800"
                            }`}>
                              Location:
                            </p>
                            <p className={`text-xs sm:text-sm line-clamp-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              {property.address}
                            </p>
                            <p className={`text-xs sm:text-sm font-medium ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              {property.city}
                            </p>
                          </div>

                          {/* Description - Added if available */}
                          {property.description && (
                            <div className="mb-4 flex-1">
                              <p className={`text-xs line-clamp-2 ${
                                theme === "dark" ? "text-gray-300" : "text-gray-600"
                              }`}>
                                {property.description}
                              </p>
                            </div>
                          )}

                          {/* Property Features - Improved Visibility */}
                          <div className="mb-4">
                            <div className="flex items-center justify-center gap-4 sm:gap-6">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 mb-1">
                                  <img
                                    src="/vectors/Bed.svg"
                                    alt="Bed"
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                      theme === "dark" ? "filter brightness-200" : ""
                                    }`}
                                  />
                                  <span className={`text-xs font-semibold ${
                                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                                  }`}>
                                    Bed
                                  </span>
                                </div>
                                <span className={`text-xs ${
                                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                                }`}>
                                  {property.beds} beds
                                </span>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 mb-1">
                                  <img
                                    src="/vectors/Shower.svg"
                                    alt="Bath"
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                      theme === "dark" ? "filter brightness-200" : ""
                                    }`}
                                  />
                                  <span className={`text-xs font-semibold ${
                                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                                  }`}>
                                    Bath
                                  </span>
                                </div>
                                <span className={`text-xs ${
                                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                                }`}>
                                  {property.baths} baths
                                </span>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 mb-1">
                                  <Ruler
                                    size={16}
                                    className={theme === "dark" ? "text-amber-400" : "text-amber-600"}
                                  />
                                  <span className={`text-xs font-semibold ${
                                    theme === "dark" ? "text-gray-200" : "text-gray-800"
                                  }`}>
                                    Area
                                  </span>
                                </div>
                                <span className={`text-xs ${
                                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                                }`}>
                                  {property.sqft} sqft
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <div className="mt-auto">
                            <button
                              onClick={() => handleMoreDetails(property)}
                              className={`Button2 ml-20 px-4 py-2 text-sm hover:scale-105 transition-all duration-300 rounded ${
                                theme === "dark" 
                                  ? "border-amber-400 text-white hover:bg-amber-500 hover:text-gray-900" 
                                  : "border-amber-500 text-gray-900 hover:bg-amber-500 hover:text-white"
                              }`}
                            >
                              More Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons - Hidden on mobile */}
            {totalCards > visibleCards && (
              <>
                <button
                  onClick={handlePrev}
                  className="hidden sm:flex absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-amber-400 rounded-full shadow-2xl border border-amber-500 items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 hover:scale-110"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={handleNext}
                  className="hidden sm:flex absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-amber-400 rounded-full shadow-2xl border border-amber-500 items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 hover:scale-110"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Indicator Dots */}
            {totalCards > visibleCards && (
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({
                  length: Math.max(1, totalCards - visibleCards + 1),
                }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "bg-amber-400 scale-125"
                        : "bg-gray-300 dark:bg-gray-600 hover:bg-amber-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Registration CTA Section */}
          <div className="mt-8 text-center">
            <h2
              className={`text-xl font-bold mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              Want Your Listings Featured Here?
            </h2>
            <p
              className={`mb-6 text-sm ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Join our premium listings and showcase your properties to
              thousands of potential buyers and renters.
            </p>
            <button className="Button2 px-6 py-2.5 text-sm">
              Subscribe Your Property Now
            </button>
          </div>
        </div>
      </div>

      {/* Property Details Popup */}
      <PropertyDetailsPopup
        property={selectedProperty}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onNavigateToProperties={handleNavigateToProperties}
      />
    </>
  );
};

export default BestChoiceSection;