// components/charts/PropertyDonutChart.jsx - SIMPLIFIED & ENHANCED VERSION
import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import { 
  Home, Building, Map, Building2, Warehouse, 
  TrendingUp, DollarSign, CheckCircle,
  Filter, PieChart, BarChart3
} from 'lucide-react';
import { directApi } from '../../utils/api.endpoints';

const PropertyDonutChart = ({ 
  theme,
  title = "Property Distribution",
  showDetails = true,
  height = "400px"
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: [],
    dataValues: [],
    colors: [],
    total: 0,
    details: {
      forSale: 0,
      forRent: 0,
      active: 0,
      totalValue: 0
    }
  });
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [viewType, setViewType] = useState('donut'); // 'donut' or 'bar'

  // Simplified property type configuration
  const propertyTypes = {
    'Residential': { 
      icon: <Home className="w-4 h-4" />, 
      color: 'bg-blue-500', 
      bgColor: theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'
    },
    'Commercial': { 
      icon: <Building className="w-4 h-4" />, 
      color: 'bg-emerald-500', 
      bgColor: theme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-50'
    },
    'Land': { 
      icon: <Map className="w-4 h-4" />, 
      color: 'bg-amber-500', 
      bgColor: theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-50'
    },
    'Luxury': { 
      icon: <Building2 className="w-4 h-4" />, 
      color: 'bg-purple-500', 
      bgColor: theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-50'
    },
    'Industrial': { 
      icon: <Warehouse className="w-4 h-4" />, 
      color: 'bg-red-500', 
      bgColor: theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'
    },
    'Agricultural': { 
      icon: <Building2 className="w-4 h-4" />, 
      color: 'bg-green-500', 
      bgColor: theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50'
    }
  };

  // Simple solid colors instead of gradients
  const getSolidColors = (count) => [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ef4444', // red
    '#22c55e', // green
  ].slice(0, count);

  // Fetch and compute property data
  useEffect(() => {
    const fetchPropertyData = async () => {
      setLoading(true);
      try {
        const properties = await directApi.getProperties({ limit: 1000 });
        const propertyList = properties?.data || properties || [];
        
        const propertyCategories = {
          'Residential': { count: 0, totalValue: 0 },
          'Commercial': { count: 0, totalValue: 0 },
          'Land': { count: 0, totalValue: 0 },
          'Luxury': { count: 0, totalValue: 0 },
          'Industrial': { count: 0, totalValue: 0 },
          'Agricultural': { count: 0, totalValue: 0 }
        };

        let totalValue = 0;
        let forSaleCount = 0;
        let forRentCount = 0;
        let activeCount = 0;

        propertyList.forEach(property => {
          const type = property.property_type?.toLowerCase() || 
                      property.type?.toLowerCase() || 
                      property.category?.toLowerCase() || 
                      '';
          const price = parseFloat(property.price) || 0;
          const status = property.status?.toLowerCase();
          const listingType = property.listing_type?.toLowerCase();

          let category = 'Residential';
          
          if (type.includes('luxury') || type.includes('premium') || type.includes('villa')) {
            category = 'Luxury';
          } else if (type.includes('commercial') || type.includes('office') || type.includes('shop')) {
            category = 'Commercial';
          } else if (type.includes('land') || type.includes('plot')) {
            category = 'Land';
          } else if (type.includes('industrial') || type.includes('factory') || type.includes('warehouse')) {
            category = 'Industrial';
          } else if (type.includes('agricultural') || type.includes('farm')) {
            category = 'Agricultural';
          }

          propertyCategories[category].count++;
          propertyCategories[category].totalValue += price;
          totalValue += price;

          if (listingType === 'sale' || status === 'for_sale') {
            forSaleCount++;
          } else if (listingType === 'rent' || status === 'for_rent') {
            forRentCount++;
          }

          if (status === 'active' || property.is_active) {
            activeCount++;
          }
        });

        const validCategories = Object.keys(propertyCategories)
          .filter(key => propertyCategories[key].count > 0);

        const labels = validCategories;
        const dataValues = validCategories.map(key => propertyCategories[key].count);
        const total = dataValues.reduce((sum, value) => sum + value, 0);

        setChartData({
          labels,
          dataValues,
          colors: getSolidColors(labels.length),
          total,
          details: {
            forSale: forSaleCount,
            forRent: forRentCount,
            active: activeCount,
            totalValue: Math.round(totalValue)
          }
        });

      } catch (error) {
        console.error('Error fetching property data:', error);
        // Fallback to sample data
        setChartData({
          labels: ['Residential', 'Commercial', 'Land', 'Luxury'],
          dataValues: [42, 28, 15, 8],
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
          total: 93,
          details: {
            forSale: 65,
            forRent: 28,
            active: 78,
            totalValue: 790500000
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, []);

  // Create/update chart
  useEffect(() => {
    if (!chartRef.current || loading) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');

    const data = {
      labels: chartData.labels,
      datasets: [{
        data: chartData.dataValues,
        backgroundColor: chartData.colors,
        borderColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        borderWidth: 3,
        hoverBorderColor: theme === 'dark' ? '#f97316' : '#f97316',
        hoverBorderWidth: 4,
        hoverOffset: 10,
        borderRadius: 5,
        spacing: 1
      }]
    };

    const isDonut = viewType === 'donut';
    
    chartInstance.current = new Chart(ctx, {
      type: isDonut ? 'doughnut' : 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: theme === 'dark' ? '#f3f4f6' : '#111827',
            bodyColor: theme === 'dark' ? '#d1d5db' : '#4b5563',
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: isDonut ? '65%' : '0%',
        radius: '90%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1500,
          easing: 'easeOutQuart'
        },
        onHover: (event, chartElements) => {
          if (chartElements && chartElements.length > 0) {
            setHoveredSlice(chartElements[0].index);
          } else {
            setHoveredSlice(null);
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [theme, chartData, loading, viewType]);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `ETB ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `ETB ${(amount / 1000).toFixed(1)}K`;
    }
    return `ETB ${amount}`;
  };

  if (loading) {
    return (
      <div className={`rounded-xl border p-4 ${theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Home className="inline w-5 h-5 mr-2 text-amber-500" />
            {title}
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-transparent border-t-amber-500 border-r-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading properties...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${theme === 'dark' 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white border-gray-200'
    }`} style={{ height }}>
      {/* Header with view toggle */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {chartData.total} properties • {formatCurrency(chartData.details.totalValue)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`flex rounded-lg overflow-hidden border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
              <button
                onClick={() => setViewType('donut')}
                className={`px-3 py-1.5 text-sm ${viewType === 'donut' 
                  ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PieChart className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType('pie')}
                className={`px-3 py-1.5 text-sm ${viewType === 'pie' 
                  ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Chart Section */}
          <div className="lg:w-2/3">
            <div className="relative h-64">
              <canvas ref={chartRef} />
              
              {/* Center text - only show for donut */}
              {viewType === 'donut' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {chartData.total}
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compact Legend */}
            <div className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {chartData.labels.map((label, index) => {
                  const typeInfo = propertyTypes[label] || propertyTypes['Residential'];
                  const value = chartData.dataValues[index];
                  const percentage = chartData.total > 0 
                    ? ((value / chartData.total) * 100).toFixed(0) 
                    : 0;
                  
                  return (
                    <div
                      key={label}
                      className={`p-2 rounded-lg flex items-center justify-between transition-colors ${
                        hoveredSlice === index
                          ? theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                          : theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                      }`}
                      onMouseEnter={() => setHoveredSlice(index)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${typeInfo.color}`}></div>
                        <span className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          {label}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {value}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats Section - Simplified */}
          {showDetails && (
            <div className="lg:w-1/3">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quick Stats
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-green-400' : 'bg-green-500'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                    </div>
                    <span className="font-semibold">{chartData.details.active}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">For Sale</span>
                    </div>
                    <span className="font-semibold">{chartData.details.forSale}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">For Rent</span>
                    </div>
                    <span className="font-semibold">{chartData.details.forRent}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-amber-400' : 'bg-amber-500'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                    </div>
                    <span className="font-semibold text-sm">{formatCurrency(chartData.details.totalValue)}</span>
                  </div>
                </div>

                {/* Active Rate Bar */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Active Rate</span>
                    <span>{((chartData.details.active / chartData.total) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                      style={{ width: `${(chartData.details.active / chartData.total) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Distribution Summary */}
                {chartData.labels.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {chartData.labels[0]}
                      </span> leads with {chartData.dataValues[0]} properties
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Simple Footer Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
              {chartData.labels[0] || 'N/A'}
            </div>
            <div className="text-lg font-bold">{chartData.dataValues[0] || 0}</div>
          </div>
          
          <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'}`}>
              Highest %
            </div>
            <div className="text-lg font-bold">
              {chartData.total > 0 ? Math.max(...chartData.dataValues.map(v => (v/chartData.total)*100)).toFixed(0) : 0}%
            </div>
          </div>
          
          <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
              Categories
            </div>
            <div className="text-lg font-bold">{chartData.labels.length}</div>
          </div>
          
          <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
              Value Ratio
            </div>
            <div className="text-lg font-bold">{chartData.total > 0 ? (chartData.details.active/chartData.total*100).toFixed(0) : 0}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDonutChart;