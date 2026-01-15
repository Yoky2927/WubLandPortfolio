import React, { useState, useEffect } from 'react';
import { MapPin, Filter } from 'lucide-react';
import ethiopianRegions from '../data/ethiopian-regions';

const EthiopianRegionFilter = ({ 
  selectedRegion, 
  setSelectedRegion, 
  selectedCity, 
  setSelectedCity, 
  selectedSubCity, 
  setSelectedSubCity,
  theme = 'light'
}) => {
  const [cities, setCities] = useState([]);
  const [subCities, setSubCities] = useState([]);

  useEffect(() => {
    if (selectedRegion) {
      const region = ethiopianRegions[selectedRegion];
      setCities(region?.cities || []);
      setSelectedCity('');
      setSelectedSubCity('');
    } else {
      setCities([]);
      setSubCities([]);
    }
  }, [selectedRegion, setSelectedCity, setSelectedSubCity]);

  useEffect(() => {
    if (selectedRegion && selectedCity) {
      const region = ethiopianRegions[selectedRegion];
      const city = region?.cities?.find(c => c.value === selectedCity);
      setSubCities(city?.subCities || []);
      setSelectedSubCity('');
    } else {
      setSubCities([]);
    }
  }, [selectedCity, selectedRegion, setSelectedSubCity]);

  return (
    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-amber-50'} border ${theme === 'dark' ? 'border-gray-700' : 'border-amber-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        <MapPin className={`w-5 h-5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
        <h4 className={`font-semibold ${theme === 'dark' ? 'text-amber-300' : 'text-amber-800'}`}>
          🇪🇹 Search Properties Across Ethiopia
        </h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Region (ክልል)
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300'}`}
          >
            <option value="">All Regions</option>
            {Object.entries(ethiopianRegions).map(([key, region]) => (
              <option key={key} value={key}>{region.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            City/Zone (ከተማ/ዞን)
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedRegion}
            className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white disabled:bg-gray-800' 
              : 'bg-white border-gray-300 disabled:bg-gray-100'}`}
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city.value} value={city.value}>{city.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {selectedRegion === 'addis_ababa' ? 'Sub-city (ክፍለ ከተማ)' : 'Woreda (ወረዳ)'}
          </label>
          <select
            value={selectedSubCity}
            onChange={(e) => setSelectedSubCity(e.target.value)}
            disabled={!selectedCity}
            className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white disabled:bg-gray-800' 
              : 'bg-white border-gray-300 disabled:bg-gray-100'}`}
          >
            <option value="">All Areas</option>
            {subCities.map(subCity => (
              <option key={subCity.value} value={subCity.value}>{subCity.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
        💡 Tip: Select specific regions to find local brokers (Delala) in that area
      </p>
    </div>
  );
};

export default EthiopianRegionFilter;