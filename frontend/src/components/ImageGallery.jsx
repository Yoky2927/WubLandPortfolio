// components/ImageGallery.jsx
import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";

const ImageGallery = ({ images, theme, propertyTitle = "Property" }) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const getImageUrl = (img) => {
    if (!img) return null;

    if (typeof img === "string") {
      // Handle various path formats
      if (img.startsWith("http")) return img;
      if (img.startsWith("/uploads/")) return img;
      if (img.startsWith("temp/")) return `/uploads/${img}`;
      if (img.includes("/")) return `/uploads/${img}`;
      return `/uploads/temp/${img}`;
    }

    if (typeof img === "object") {
      const url = img.url || img.path || img.src;
      if (url) {
        if (url.startsWith("http")) return url;
        if (url.startsWith("/uploads/")) return url;
        if (url.startsWith("temp/")) return `/uploads/${url}`;
        if (url.includes("/")) return `/uploads/${url}`;
        return `/uploads/temp/${url}`;
      }

      // Try filename
      const filename = img.filename;
      if (filename) {
        if (filename.startsWith("http")) return filename;
        if (filename.startsWith("/uploads/")) return filename;
        if (filename.startsWith("temp/")) return `/uploads/${filename}`;
        if (filename.includes("/")) return `/uploads/${filename}`;
        return `/uploads/temp/${filename}`;
      }
    }

    return null;
  };

  if (!images || images.length === 0) {
    return (
      <div
        className={`w-full h-48 rounded-xl flex items-center justify-center ${
          theme === "dark" ? "bg-gray-800/30" : "bg-gray-100"
        } border ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`}
      >
        <div className="text-center">
          <ImageIcon
            className={`w-12 h-12 mx-auto mb-2 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`}
          />
          <p
            className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}
          >
            No images available
          </p>
        </div>
      </div>
    );
  }

  const currentImage = getImageUrl(images[selectedIndex]);

  return (
    <div className="space-y-3">
      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((img, index) => {
          const imgUrl = getImageUrl(img);
          return (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedIndex === index
                  ? "border-amber-500 ring-2 ring-amber-500/30"
                  : theme === "dark"
                    ? "border-gray-700 hover:border-gray-600"
                    : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={`${propertyTitle} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://via.placeholder.com/100x100/${
                      theme === "dark" ? "374151" : "f3f4f6"
                    }/${
                      theme === "dark" ? "6b7280" : "9ca3af"
                    }?text=Image+${index + 1}`;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Image Display */}
      {selectedIndex >= 0 && currentImage ? (
        <div
          className={`relative rounded-xl overflow-hidden border ${
            theme === "dark" ? "border-gray-700" : "border-gray-300"
          }`}
        >
          <div className="relative h-64 md:h-80">
            <img
              src={currentImage}
              alt={`${propertyTitle} - Main view`}
              className="w-full h-full object-contain bg-gray-100 dark:bg-gray-900"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/800x400/${
                  theme === "dark" ? "374151" : "f3f4f6"
                }/${
                  theme === "dark" ? "6b7280" : "9ca3af"
                }?text=Property+Image`;
              }}
            />

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setSelectedIndex((prev) =>
                      prev > 0 ? prev - 1 : images.length - 1,
                    )
                  }
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setSelectedIndex((prev) =>
                      prev < images.length - 1 ? prev + 1 : 0,
                    )
                  }
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={() => setSelectedIndex(-1)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-2 right-2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      ) : (
        // Preview of first image
        <div
          className={`relative rounded-xl overflow-hidden border ${
            theme === "dark" ? "border-gray-700" : "border-gray-300"
          }`}
        >
          <div className="relative h-48">
            <img
              src={getImageUrl(images[0])}
              alt={`${propertyTitle} - Preview`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/800x300/${
                  theme === "dark" ? "374151" : "f3f4f6"
                }/${theme === "dark" ? "6b7280" : "9ca3af"}?text=Property`;
              }}
            />
            <button
              onClick={() => setSelectedIndex(0)}
              className="absolute bottom-2 right-2 px-3 py-1 rounded-full bg-black/50 hover:bg-black/70 text-white text-sm flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" />
              View All ({images.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
