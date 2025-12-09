import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

const DonutChart = ({ 
  theme, 
  analyticsData, 
  title = "Property Distribution",
  chartType = "property" // "property" or "transaction"
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    // Get data based on chart type
    let labels, dataValues, colors;
    
    if (chartType === "property" && analyticsData?.propertyDistribution) {
      // Property distribution from analysis-service
      const propertyData = analyticsData.propertyDistribution;
      labels = propertyData.map(item => item.type);
      dataValues = propertyData.map(item => item.count);
      colors = propertyData.map(item => item.color);
    } 
    else if (chartType === "transaction" && analyticsData?.transactionStatus) {
      // Transaction status from analysis-service
      const transactionData = analyticsData.transactionStatus;
      labels = transactionData.map(item => item.status);
      dataValues = transactionData.map(item => item.count);
      colors = transactionData.map(item => item.color);
    }
    else {
      // Default empty data
      if (chartType === "property") {
        labels = ['Residential', 'Commercial', 'Land', 'Apartments', 'Houses'];
        dataValues = [0, 0, 0, 0, 0];
      } else {
        labels = ['Completed', 'Pending', 'Cancelled', 'In Review'];
        dataValues = [0, 0, 0, 0];
      }
      colors = [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Amber
        'rgba(139, 92, 246, 0.8)',   // Purple
        'rgba(239, 68, 68, 0.8)',    // Red
      ];
    }

    const chartData = {
      labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colors,
        borderColor: theme === 'dark' ? '#374151' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 15,
        hoverBorderWidth: 3
      }]
    };

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: theme === 'dark' ? '#d1d5db' : '#374151',
              font: {
                size: 12
              },
              padding: 20,
              usePointStyle: true,
            }
          },
          tooltip: {
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            titleColor: theme === 'dark' ? '#d1d5db' : '#374151',
            bodyColor: theme === 'dark' ? '#d1d5db' : '#374151',
            borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          },
          title: {
            display: !!title,
            text: title,
            color: theme === 'dark' ? '#f9fafb' : '#111827',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          }
        },
        cutout: '65%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [theme, analyticsData, title, chartType]);

  // Calculate total for display
  const total = analyticsData ? 
    (chartType === "property" && analyticsData.propertyDistribution ? 
      analyticsData.propertyDistribution.reduce((sum, item) => sum + item.count, 0) :
      chartType === "transaction" && analyticsData.transactionStatus ?
        analyticsData.transactionStatus.reduce((sum, item) => sum + item.count, 0) : 0)
    : 0;

  return (
    <div className="relative h-full">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {total}
          </div>
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Total {chartType === 'property' ? 'Properties' : 'Transactions'}
          </div>
        </div>
      </div>
      <canvas ref={chartRef} />
    </div>
  );
};

export default DonutChart;