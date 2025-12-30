import { useState, useEffect, useRef } from "react";
import { Ruler } from "lucide-react";
import PropertyDetailsPopup from "./PropertyDetailsPopup";

const BestChoiceSection = ({ theme, brokers = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState(3);
  const [premiumProperties, setPremiumProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedImages, setLoadedImages] = useState({}); // Track loaded images by ID
  const autoSlideInterval = 5000;
  const slideRef = useRef(null);
  const containerRef = useRef(null);

  // Splash/Unsplash fallback images
  const splashFallbackImages = [
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  ];

  // Get a random splash image
  const getRandomSplashImage = () => {
    const randomIndex = Math.floor(Math.random() * splashFallbackImages.length);
    return splashFallbackImages[randomIndex];
  };

  // Handle image load
  const handleImageLoad = (propertyId) => {
    console.log(`✅ Image loaded for property ${propertyId}`);
    setLoadedImages(prev => ({
      ...prev,
      [propertyId]: true
    }));
  };

  // Handle image error
  const handleImageError = (e, propertyId, index) => {
    console.log(`❌ Image failed to load for property ${propertyId}, using fallback`);
    
    // Try a different splash image
    const fallbackImage = splashFallbackImages[index % splashFallbackImages.length];
    
    // Set timeout to update src
    setTimeout(() => {
      e.target.src = fallbackImage;
      // Mark as loaded after setting fallback
      handleImageLoad(propertyId);
    }, 100);
  };

  // Fetch premium properties from API
  useEffect(() => {
    const fetchPremiumProperties = async () => {
      setLoading(true);
      setError(null);
      console.log("🔍 Starting to fetch premium properties...");
      
      try {
        // Try multiple endpoints
        const endpoints = [
          { url: 'http://localhost:5002/api/properties/premium', name: 'Premium Properties (5002)' },
          { url: 'http://localhost:5002/api/properties?is_premium=true', name: 'Properties with premium flag (5002)' },
          { url: 'http://localhost:5002/api/properties?is_featured=true', name: 'Featured Properties (5002)' },
          { url: 'http://localhost:5002/api/properties', name: 'All Properties (5002)' },
        ];

        let propertiesData = [];
        let lastError = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`Trying ${endpoint.name}: ${endpoint.url}`);
            const response = await fetch(endpoint.url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
              mode: 'cors',
            });

            console.log(`Response status for ${endpoint.name}:`, response.status);

            if (response.ok) {
              const data = await response.json();
              console.log(`✅ Success from ${endpoint.name}:`, data);

              // Extract properties from response
              if (data && Array.isArray(data)) {
                propertiesData = data;
                break;
              } else if (data && data.data && Array.isArray(data.data)) {
                propertiesData = data.data;
                break;
              } else if (data && data.properties && Array.isArray(data.properties)) {
                propertiesData = data.properties;
                break;
              } else if (data && data.success && data.data && Array.isArray(data.data)) {
                propertiesData = data.data;
                break;
              } else if (data && data.success && data.properties && Array.isArray(data.properties)) {
                propertiesData = data.properties;
                break;
              }
            } else {
              const errorText = await response.text();
              console.log(`❌ ${endpoint.name} failed: ${response.status} - ${errorText}`);
              lastError = new Error(`${endpoint.name}: ${response.status} - ${errorText}`);
            }
          } catch (fetchError) {
            console.log(`❌ Fetch error for ${endpoint.name}:`, fetchError.message);
            lastError = fetchError;
          }
        }

        console.log(`Total properties found: ${propertiesData.length}`);

        // If no data from API, create demo data
        if (propertiesData.length === 0) {
          console.log("No properties from API, creating demo data...");
          propertiesData = createDemoProperties();
        }

        // Transform the data
        const transformedProperties = propertiesData.map((property, index) => {
          const imageIndex = index % splashFallbackImages.length;
          
          return {
            id: property.id || property._id || `property-${index}`,
            title: property.title || property.property_title || `Premium Property ${index + 1}`,
            description: property.description || property.property_description || "Beautiful property in a prime location",
            property_type: property.property_type || property.type || ['house', 'apartment', 'villa', 'condo'][index % 4],
            propertyStatus: property.listing_type === 'rent' || property.property_status === 'rent' ? 'for rent' : 'for sale',
            price: parseFloat(property.price) || property.asking_price || property.list_price || (index + 1) * 1000000,
            address: property.address || property.location || property.full_address || `Location ${index + 1}, Addis Ababa`,
            city: property.city || "Addis Ababa",
            state: property.state || "",
            region: property.region || property.neighborhood || ['Bole', 'Kazanchis', 'Megenagna', 'Piassa'][index % 4],
            beds: property.beds || property.bedrooms || property.num_bedrooms || (index % 4) + 2,
            baths: property.baths || property.bathrooms || property.num_bathrooms || (index % 3) + 1,
            sqft: parseFloat(property.sqft) || parseFloat(property.area) || property.square_feet || 1000 + (index * 200),
            lot_size: property.lot_size ? parseFloat(property.lot_size) : 0,
            year_built: property.year_built || property.year_constructed || 2015 + (index % 10),
            garage_spaces: property.garage_spaces || property.parking_spaces || property.num_parking || (index % 3),
            images: property.images || property.photos || property.property_images || [splashFallbackImages[imageIndex]],
            is_featured: property.is_featured || true,
            is_premium: property.is_premium || true,
          };
        });

        console.log("✅ Transformed properties:", transformedProperties);
        setPremiumProperties(transformedProperties);

      } catch (error) {
        console.error('❌ Error in fetchPremiumProperties:', error);
        setError(error.message);
        // Create demo properties as fallback
        const demoProperties = createDemoProperties();
        setPremiumProperties(demoProperties);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumProperties();
  }, []);

  // Helper function to create demo properties
  const createDemoProperties = () => {
    return Array.from({ length: 6 }, (_, index) => {
      const propertyTypes = ['house', 'apartment', 'villa', 'condo'];
      const locations = ['Bole', 'Kazanchis', 'Megenagna', 'Piassa', 'Cazanchise', 'Kirkos'];
      const imageIndex = index % splashFallbackImages.length;
      
      return {
        id: `demo-${index}`,
        title: `Premium ${propertyTypes[index % 4]} ${index + 1}`,
        description: `A beautiful ${propertyTypes[index % 4]} in ${locations[index % 6]}, featuring modern amenities and excellent location.`,
        property_type: propertyTypes[index % 4],
        propertyStatus: index % 3 === 0 ? 'for rent' : 'for sale',
        price: (index + 1) * 2500000,
        address: `${locations[index % 6]}, Addis Ababa`,
        city: "Addis Ababa",
        state: "",
        region: locations[index % 6],
        beds: (index % 4) + 2,
        baths: (index % 3) + 2,
        sqft: 1200 + (index * 300),
        lot_size: 500 + (index * 100),
        year_built: 2018 + (index % 5),
        garage_spaces: index % 3,
        images: [splashFallbackImages[imageIndex]],
        is_featured: true,
        is_premium: true,
      };
    });
  };

  const totalCards = premiumProperties.length;

  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "ETB 0";
    if (amount >= 1000000) {
      return `ETB ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `ETB ${(amount / 1000).toFixed(0)}K`;
    }
    return `ETB ${amount.toLocaleString()}`;
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
    if (totalCards === 0 || loading || totalCards <= visibleCards) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = Math.max(0, totalCards - visibleCards);
        if (maxIndex === 0) return 0;
        return (prevIndex + 1) % (maxIndex + 1);
      });
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [totalCards, visibleCards, loading]);

  const handlePrev = () => {
    const maxIndex = Math.max(0, totalCards - visibleCards);
    if (maxIndex === 0) return;
    setCurrentIndex((prev) => (prev - 1 + (maxIndex + 1)) % (maxIndex + 1));
  };

  const handleNext = () => {
    const maxIndex = Math.max(0, totalCards - visibleCards);
    if (maxIndex === 0) return;
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

  if (loading) {
    return (
      <div className="w-full max-w-[1035px] py-8 mx-auto px-4 sm:px-6 md:px-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Loading premium properties...</p>
      </div>
    );
  }

  if (premiumProperties.length === 0) {
    return (
      <div className="w-full max-w-[1035px] py-8 mx-auto px-4 sm:px-6 md:px-8 text-center">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">
            No Premium Properties Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Check back soon for featured properties or list your property to be featured here.
          </p>
          <button
            onClick={() => window.location.href = "/seller-leaser"}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            List Your Property
          </button>
        </div>
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
            className={`text-left mb-4 sm:mb-5 md:mb-6 text-2xl sm:text-3xl md:text-4xl ${theme === "dark" ? "text-white" : "text-black"
              }`}
          >
            Top Ranking Residences
          </h1>

          <div className="relative" ref={containerRef}>
            <div className="overflow-hidden">
              <div
                ref={slideRef}
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(${translateX})` }}
              >
                {premiumProperties.map((property, index) => {
                  const typeInfo = getPropertyTypeInfo(property);
                  const propertyId = property.id || `property-${index}`;
                  const imageLoaded = loadedImages[propertyId];
                  const imageUrl = property.images?.[0] || splashFallbackImages[index % splashFallbackImages.length];

                  return (
                    <div
                      key={propertyId}
                      className={`flex-shrink-0 p-2 sm:p-3 lg:mx-5 ${visibleCards === 1
                          ? "w-full"
                          : visibleCards === 2
                            ? "w-[calc(50%-8px)] min-w-[calc(50%-8px)]"
                            : "w-[calc(33.333%-12px)] min-w-[calc(33.333%-12px)]"
                        }`}
                    >
                      <div
                        className={`Cards ${theme === "dark" ? "dark" : "light"
                          } rounded-lg overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 h-full flex flex-col`}
                      >
                        {/* Badge */}
                        <div
                          className={`absolute top-3 right-3 px-3 py-1.5 text-xs font-bold text-white shadow-lg z-20 transition-all duration-300 hover:scale-110 rounded ${typeInfo.color === "green"
                              ? "bg-gradient-to-r from-green-500 to-green-600"
                              : "bg-gradient-to-r from-orange-500 to-orange-600"
                            }`}
                        >
                          {typeInfo.type}
                        </div>

                        {/* Image with loading state */}
                        <div className="w-full h-48 overflow-hidden relative">
                          {/* Loading overlay - only shows when image hasn't loaded */}
                          {!imageLoaded && (
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse z-10" />
                          )}
                          
                          {/* Actual image */}
                          <img
                            src={imageUrl}
                            alt={property.title}
                            className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => handleImageLoad(propertyId)}
                            onError={(e) => handleImageError(e, propertyId, index)}
                            loading="lazy"
                            style={{
                              transition: 'opacity 0.3s ease-in-out'
                            }}
                          />
                          
                          {/* Loading spinner (optional) */}
                          {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-4 flex-1 flex flex-col">
                          {/* Price */}
                          <div className="text-center mb-3">
                            <p className="text-base sm:text-lg font-bold">
                              <span className={`font-bold ${theme === "dark" ? "text-amber-400" : "text-amber-600"
                                }`}>
                                {formatCurrency(property.price)}
                              </span>
                              {typeInfo.type === "FOR RENT" && (
                                <span className={`text-xs ml-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                                  }`}>
                                  /month
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Location */}
                          <div className="mb-3 text-center">
                            <p className={`text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-200" : "text-gray-800"
                              }`}>
                              Location:
                            </p>
                            <p className={`text-xs sm:text-sm line-clamp-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }`}>
                              {property.address}
                            </p>
                            <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                              }`}>
                              {property.city}
                            </p>
                          </div>

                          {/* Description */}
                          {property.description && (
                            <div className="mb-4 flex-1">
                              <p className={`text-xs line-clamp-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                                }`}>
                                {property.description}
                              </p>
                            </div>
                          )}

                          {/* Property Features */}
                          <div className="mb-4">
                            <div className="flex items-center justify-center gap-4 sm:gap-6">
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 mb-1">
                                  <img
                                    src="/vectors/Bed.svg"
                                    alt="Bed"
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === "dark" ? "filter brightness-200" : ""
                                      }`}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentNode.innerHTML = `
                                        <div class="flex items-center gap-1 mb-1">
                                          <div class="w-4 h-4 sm:w-5 sm:h-5 rounded bg-amber-400"></div>
                                          <span class="text-xs font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"}">Bed</span>
                                        </div>
                                      `;
                                    }}
                                  />
                                  <span className={`text-xs font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"
                                    }`}>
                                    Bed
                                  </span>
                                </div>
                                <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                                  }`}>
                                  {property.beds} beds
                                </span>
                              </div>

                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 mb-1">
                                  <img
                                    src="/vectors/Shower.svg"
                                    alt="Bath"
                                    className={`w-4 h-4 sm:w-5 sm:h-5 ${theme === "dark" ? "filter brightness-200" : ""
                                      }`}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentNode.innerHTML = `
                                        <div class="flex items-center gap-1 mb-1">
                                          <div class="w-4 h-4 sm:w-5 sm:h-5 rounded bg-amber-400"></div>
                                          <span class="text-xs font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"}">Bath</span>
                                        </div>
                                      `;
                                    }}
                                  />
                                  <span className={`text-xs font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"
                                    }`}>
                                    Bath
                                  </span>
                                </div>
                                <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"
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
                                  <span className={`text-xs font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"
                                    }`}>
                                    Area
                                  </span>
                                </div>
                                <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                                  }`}>
                                  {property.sqft?.toLocaleString() || '0'} sqft
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* CTA Button */}
                          <div className="mt-auto flex justify-center">
                            <button
                              onClick={() => handleMoreDetails(property)}
                              className={`Button2 px-4 py-2 text-sm hover:scale-105 transition-all duration-300  `}
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

            {/* Navigation Buttons */}
            {totalCards > visibleCards && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-amber-400 rounded-full shadow-2xl border border-amber-500 items-center justify-center transition-all duration-300 opacity-100 hover:opacity-100 hover:scale-110 hidden sm:flex z-10"
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
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-amber-400 rounded-full shadow-2xl border border-amber-500 items-center justify-center transition-all duration-300 opacity-100 hover:opacity-100 hover:scale-110 hidden sm:flex z-10"
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
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentIndex
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
              className={`text-xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"
                }`}
            >
              Want Your Listings Featured Here?
            </h2>
            <p
              className={`mb-6 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
            >
              Join our premium listings and showcase your properties to
              thousands of potential buyers and renters.
            </p>
            <button 
              onClick={() => window.location.href = "/seller-leaser"}
              className="Button2 px-6 py-2.5 text-sm  transition-colors"
            >
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
        brokers={brokers}
      />
    </>
  );
};

export default BestChoiceSection;