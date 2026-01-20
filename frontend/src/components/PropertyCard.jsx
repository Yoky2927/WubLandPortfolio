import React, { useState, useEffect } from 'react';
import {
  Heart, MapPin, Bed, Bath, Eye, ChevronLeft, ChevronRight,
  Home, Ruler, Tag, Calendar, Star, Image as ImageIcon,
  Building, Briefcase, Crown, Handshake
} from 'lucide-react';

const PropertyCard = ({
  property = {}, // Default to empty object
  theme = 'light',
  onViewDetails = () => console.log('View details handler not provided'),
  onSave = () => console.log('Save handler not provided'),
  isSaved = false, // Default to false
  user = null,
  isVerified = true
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});
  const [localIsSaved, setLocalIsSaved] = useState(isSaved);
  const [hasImageError, setHasImageError] = useState(false);

  // Safely get property fields with defaults
  const safeProperty = {
    id: property?.id || 0,
    title: property?.title || 'Untitled Property',
    price: property?.price || 0,
    address: property?.address || property?.location || 'No address provided',
    city: property?.city || property?.region || '',
    description: property?.description || '',
    listing_type: property?.listing_type || 'sale',
    property_source: property?.property_source || 'client_listed',
    is_exclusive: property?.is_exclusive || false,
    is_premium: property?.is_premium || false,
    is_featured: property?.is_featured || false,
    beds: property?.beds || property?.bedrooms || 0,
    baths: property?.baths || property?.bathrooms || 0,
    sqft: property?.sqft || property?.square_meters || property?.area_sqm || 0,
    views_count: property?.views_count || property?.views || 0,
    created_at: property?.created_at || property?.updated_at || new Date().toISOString(),
    features: Array.isArray(property?.features) ? property.features :
      typeof property?.features === 'string' ?
        JSON.parse(property.features || '[]') :
        ['Parking', 'Security'],
    amenities: Array.isArray(property?.amenities) ? property.amenities :
      typeof property?.amenities === 'string' ?
        JSON.parse(property.amenities || '[]') :
        [],
    images: Array.isArray(property?.images) ? property.images :
      Array.isArray(property?.property_images) ? property.property_images :
        [],
    company_project_name: property?.company_project_name || ''
  };

  // Safely get images
  const images = safeProperty.images || [];
  const totalImages = Math.min(images.length, 10); // Limit to prevent excessive loading

  // Update localIsSaved when isSaved prop changes
  useEffect(() => {
    console.log('🔄 PropertyCard - isSaved prop changed:', {
      propertyId: safeProperty.id,
      isSaved,
      localIsSaved
    });
    setLocalIsSaved(isSaved);
  }, [isSaved, safeProperty.id]);

  // Auto-slide functionality
  useEffect(() => {
    if (!isAutoSliding || totalImages <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoSliding, totalImages]);

  const handleSaveClick = async (e) => {
    e?.stopPropagation?.();
    console.log('💾 PropertyCard Save button clicked:', {
      propertyId: safeProperty.id,
      isSaved: localIsSaved,
      user: user?.id,
    });

    if (user) {
      try {
        // Call parent save handler and wait for response
        const newSavedStatus = await onSave(safeProperty.id, localIsSaved);

        // Update local state with the returned new status
        if (newSavedStatus !== undefined && newSavedStatus !== null) {
          console.log('✅ Save handler returned:', newSavedStatus);
          setLocalIsSaved(newSavedStatus);
        } else {
          // If no status returned, assume toggle worked
          const toggledStatus = !localIsSaved;
          console.log('✅ Toggling saved status to:', toggledStatus);
          setLocalIsSaved(toggledStatus);
        }
      } catch (error) {
        console.error('❌ Error in save handler:', error);
        // Revert local state on error
        setLocalIsSaved(localIsSaved);
      }
    } else {
      // Show login message
      const shouldLogin = window.confirm("Please login to save properties. Would you like to login now?");
      if (shouldLogin) {
        window.location.href = '/login-register';
      }
    }
  };

  const handleNextImage = (e) => {
    e?.stopPropagation?.();
    setIsAutoSliding(false);
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    setTimeout(() => setIsAutoSliding(true), 10000);
  };

  const handlePrevImage = (e) => {
    e?.stopPropagation?.();
    setIsAutoSliding(false);
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    setTimeout(() => setIsAutoSliding(true), 10000);
  };

  const handleImageLoad = (index) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  const handleImageError = (e, index) => {
    setHasImageError(true);
    const fallbackImages = [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
    ];
    e.target.src = fallbackImages[index % fallbackImages.length];
    handleImageLoad(index);
  };

  const getCurrentImage = () => {
    if (totalImages > 0 && images[currentImageIndex]) {
      const img = images[currentImageIndex];
      if (typeof img === 'object') {
        return img.url || img.image_url || img.thumbnail_url;
      }
      return img;
    }
    return 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80';
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return 'Price on request';
    const numericPrice = Number(price);
    if (numericPrice >= 1000000) return `ETB ${(numericPrice / 1000000).toFixed(1)}M`;
    if (numericPrice >= 1000) return `ETB ${(numericPrice / 1000).toFixed(0)}K`;
    return `ETB ${numericPrice.toLocaleString()}`;
  };

  const getPropertySourceInfo = () => {
    const source = safeProperty.property_source;

    switch (source) {
      case 'company_owned':
        return {
          label: safeProperty.company_project_name || 'Our Development',
          icon: <Building className="w-4 h-4 text-green-300" />,
          style: 'bg-gradient-to-r from-green-500 to-green-600'
        };
      case 'joint_venture':
        return {
          label: 'Joint Venture',
          icon: <Handshake className="w-4 h-4 text-purple-300" />,
          style: 'bg-gradient-to-r from-purple-500 to-purple-600'
        };
      case 'client_listed':
      default:
        if (safeProperty.is_exclusive) {
          return {
            label: 'Exclusive',
            icon: <Briefcase className="w-4 h-4 text-blue-300" />,
            style: 'bg-gradient-to-r from-blue-500 to-blue-600'
          };
        }
        return {
          label: 'Listed',
          icon: <Home className="w-4 h-4 text-blue-300" />,
          style: 'bg-gradient-to-r from-blue-500 to-blue-600'
        };
    }
  };

  const sourceInfo = getPropertySourceInfo();
  const keywords = safeProperty.features || safeProperty.amenities || ['Parking', 'Security'].slice(0, 3);

  // If property is invalid, show placeholder
  if (!property || Object.keys(property).length === 0) {
    return (
      <div className={`rounded-lg overflow-hidden relative h-full flex flex-col ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
        <div className="w-full h-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
        <div className="p-4 flex-1 flex flex-col">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-4 animate-pulse" />
          <div className="flex gap-4 justify-center mb-4">
            <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="mt-auto">
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`Cards rounded-lg overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 h-full flex flex-col ${theme === "dark" ? "dark" : "light"}`}>
      {/* Image section */}
      <div className="w-full h-48 overflow-hidden relative">
        {/* Loading overlay */}
        {!loadedImages[currentImageIndex] && !hasImageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse z-10" />
        )}

        {/* Main image */}
        <img
          src={getCurrentImage()}
          alt={safeProperty.title}
          className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${loadedImages[currentImageIndex] ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => handleImageLoad(currentImageIndex)}
          onError={(e) => handleImageError(e, currentImageIndex)}
          loading="lazy"
          style={{ transition: 'opacity 0.3s ease-in-out' }}
        />

        {/* Property source badge */}
        <div className="absolute top-3 left-3 z-20">
          <div className={`${sourceInfo.style} px-3 py-1.5 text-xs font-bold text-white shadow-lg rounded transition-all duration-300 hover:scale-110 flex items-center gap-2`}>
            {sourceInfo.icon}
            <span>{sourceInfo.label}</span>
          </div>
        </div>

        {/* Listing type badge */}
        <div className="absolute top-3 right-3 z-20">
          <div className={`px-3 py-1.5 text-xs font-bold text-white shadow-lg rounded transition-all duration-300 hover:scale-110 ${safeProperty.listing_type === 'rent'
            ? 'bg-gradient-to-r from-orange-500 to-orange-600'
            : 'bg-gradient-to-r from-green-500 to-green-600'
            }`}>
            {safeProperty.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
          </div>
        </div>

        {/* Premium badge */}
        {safeProperty.is_premium && (
          <div className="absolute top-12 left-3 px-3 py-1.5 text-xs font-bold text-white shadow-lg rounded transition-all duration-300 hover:scale-110 bg-gradient-to-r from-amber-500 to-yellow-500 z-20 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            PREMIUM
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSaveClick}
          className={`absolute bottom-3 right-3 p-2.5 rounded-full shadow-lg transition-all hover:scale-110 z-20 ${!user ? 'opacity-50 cursor-not-allowed' : ''
            } ${localIsSaved
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 text-gray-700 hover:bg-white dark:bg-gray-800/90 dark:text-gray-300 dark:hover:bg-gray-800'
            } backdrop-blur-sm`}
          title={!user ? "Login to save" : localIsSaved ? "Remove from saved" : "Save property"}
        >
          <Heart className={`w-4 h-4 ${localIsSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Image navigation arrows */}
        {totalImages > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-20"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-20"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Image counter */}
        {totalImages > 1 && (
          <div className="absolute top-12 right-3 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm z-20 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span>{currentImageIndex + 1}/{totalImages}</span>
          </div>
        )}

        {/* Image dots */}
        {totalImages > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.slice(0, 5).map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                  setIsAutoSliding(false);
                  setTimeout(() => setIsAutoSliding(true), 10000);
                }}
                className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/80'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Price */}
        <div className="text-center mb-3">
          <p className="text-base sm:text-lg font-bold">
            <span className={`font-bold ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
              {formatPrice(safeProperty.price)}
            </span>
            {safeProperty.listing_type === 'rent' && (
              <span className={`text-xs ml-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                /month
              </span>
            )}
          </p>
        </div>

        {/* Location */}
        <div className="mb-3 text-center">
          <p className={`text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
            Location:
          </p>
          <p className={`text-xs sm:text-sm line-clamp-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            {safeProperty.address}
          </p>
          <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            {safeProperty.city}
          </p>
        </div>

        {/* Property Description */}
        {safeProperty.description && (
          <div className="mb-4 flex-1">
            <p className={`text-xs line-clamp-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              {safeProperty.description}
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
                <span className={`text-xs font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                  Bed
                </span>
              </div>
              <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {safeProperty.beds} beds
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
                <span className={`text-xs font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                  Bath
                </span>
              </div>
              <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {safeProperty.baths} baths
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-1">
                <Ruler size={16} className={theme === "dark" ? "text-amber-400" : "text-amber-600"} />
                <span className={`text-xs font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                  Area
                </span>
              </div>
              <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                {safeProperty.sqft.toLocaleString()} sqft
              </span>
            </div>
          </div>
        </div>

        {/* Keywords/Features */}
        {keywords.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <Tag className={`w-3 h-3 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Features
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-full text-xs ${theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 border border-gray-600'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                >
                  {keyword}
                </span>
              ))}
              {keywords.length > 3 && (
                <span className={`text-xs px-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  +{keywords.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto flex justify-center">
          <button
            onClick={() => onViewDetails(safeProperty)}
            className="Button2 px-4 py-2 text-sm hover:scale-105 transition-all duration-300 w-full max-w-[200px]"
          >
            View Details
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            {safeProperty.created_at && (
              <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <Calendar className="w-3 h-3" />
                <span>{new Date(safeProperty.created_at).toLocaleDateString()}</span>
              </div>
            )}
            {safeProperty.views_count > 0 && (
              <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <Eye className="w-3 h-3" />
                <span>{safeProperty.views_count.toLocaleString()}</span>
              </div>
            )}
            {safeProperty.is_featured && (
              <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                <Star className="w-3 h-3" />
                <span>Featured</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;