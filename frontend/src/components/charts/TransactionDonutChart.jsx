// frontend/src/pages/admin/components/TransactionDonutChart.jsx
import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import { CreditCard, CheckCircle, Clock, XCircle, TrendingUp, DollarSign, PieChart, BarChart3 } from 'lucide-react';

const TransactionDonutChart = ({ 
  theme,
  title = "Transaction Metrics",
  transactionStats,
  metrics,
  showDetails = true,
  height = "400px"
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [loading, setLoading] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [viewType, setViewType] = useState('donut');

  const chartData = {
    labels: ['Completed', 'Pending', 'Cancelled'],
    dataValues: [
      transactionStats.completed || 0,
      transactionStats.pending || 0,
      transactionStats.cancelled || 0
    ],
    colors: ['#10b981', '#f59e0b', '#ef4444'],
    total: transactionStats.total || 0
  };

  const transactionTypes = {
    'Completed': { 
      icon: <CheckCircle className="w-4 h-4" />, 
      color: 'bg-green-500', 
      bgColor: theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50'
    },
    'Pending': { 
      icon: <Clock className="w-4 h-4" />, 
      color: 'bg-amber-500', 
      bgColor: theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-50'
    },
    'Cancelled': { 
      icon: <XCircle className="w-4 h-4" />, 
      color: 'bg-red-500', 
      bgColor: theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50'
    }
  };

  useEffect(() => {
    if (!chartRef.current) return;

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

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `ETB ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `ETB ${(amount / 1000).toFixed(1)}K`;
    }
    return `ETB ${amount?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <div className={`rounded-xl border p-4 ${theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <CreditCard className="inline w-5 h-5 mr-2 text-amber-500" />
            {title}
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-transparent border-t-amber-500 border-r-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading transaction data...
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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {chartData.total} transactions • {formatCurrency(transactionStats.totalRevenue || 0)}
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
          <div className="lg:w-2/3">
            <div className="relative h-64">
              <canvas ref={chartRef} />
              
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

            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {chartData.labels.map((label, index) => {
                  const typeInfo = transactionTypes[label] || transactionTypes['Completed'];
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

          {showDetails && (
            <div className="lg:w-1/3">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Financial Metrics
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-green-400' : 'bg-green-500'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Sale Price</span>
                    </div>
                    <span className="font-semibold text-sm">{formatCurrency(metrics.avgSalePrice || 0)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Rent Price</span>
                    </div>
                    <span className="font-semibold text-sm">{formatCurrency(metrics.avgRentPrice || 0)}/month</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Commission Rate</span>
                    </div>
                    <span className="font-semibold text-sm">{metrics.commissionRate || 0}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-amber-400' : 'bg-amber-500'}`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                    </div>
                    <span className="font-semibold text-sm">{formatCurrency(transactionStats.totalRevenue || 0)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Success Rate</span>
                    <span>{chartData.total > 0 ? ((chartData.dataValues[0] / chartData.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                      style={{ width: `${chartData.total > 0 ? (chartData.dataValues[0] / chartData.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {chartData.labels.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {chartData.labels[0]}
                      </span> leads with {chartData.dataValues[0]} transactions
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-50'}`}>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
              Completed
            </div>
            <div className="text-lg font-bold">{chartData.dataValues[0] || 0}</div>
          </div>
          
          <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
              Success Rate
            </div>
            <div className="text-lg font-bold">
              {chartData.total > 0 ? ((chartData.dataValues[0] / chartData.total) * 100).toFixed(0) : 0}%
            </div>
          </div>
          
          <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
              Avg. Price
            </div>
            <div className="text-lg font-bold">{formatCurrency(metrics.avgSalePrice || 0)}</div>
          </div>
          
          <div className={`p-2 rounded-lg text-center ${theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
            <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
              Commission
            </div>
            <div className="text-lg font-bold">{metrics.commissionRate || 0}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDonutChart;