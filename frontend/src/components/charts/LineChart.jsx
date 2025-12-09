import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LineChart = ({ theme, analyticsData, title = "Monthly Revenue Trend" }) => {
  // Process chart data from analysis-service
  const processChartData = () => {
    // If we have real revenue data from analysis-service
    if (analyticsData?.revenueData && analyticsData.revenueData.length > 0) {
      const revenueData = analyticsData.revenueData;
      
      return {
        labels: revenueData.map(item => item.month),
        datasets: [
          {
            label: 'Revenue (ETB)',
            data: revenueData.map(item => item.revenue),
            borderColor: theme === "dark" ? 'rgb(245, 158, 11)' : 'rgb(217, 119, 6)', // Amber
            backgroundColor: theme === "dark" 
              ? 'rgba(245, 158, 11, 0.15)' 
              : 'rgba(245, 158, 11, 0.08)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: theme === "dark" ? 'rgb(245, 158, 11)' : 'rgb(217, 119, 6)',
            pointBorderColor: theme === "dark" ? '#1f2937' : '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: theme === "dark" ? '#1f2937' : '#fff',
            pointHoverBorderColor: theme === "dark" ? 'rgb(245, 158, 11)' : 'rgb(217, 119, 6)',
            pointHoverBorderWidth: 3,
          },
          {
            label: 'Transactions',
            data: revenueData.map(item => item.count),
            borderColor: theme === "dark" ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)', // Blue
            backgroundColor: theme === "dark" 
              ? 'rgba(59, 130, 246, 0.15)' 
              : 'rgba(59, 130, 246, 0.08)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: theme === "dark" ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)',
            pointBorderColor: theme === "dark" ? '#1f2937' : '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: theme === "dark" ? '#1f2937' : '#fff',
            pointHoverBorderColor: theme === "dark" ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)',
            pointHoverBorderWidth: 3,
            yAxisID: 'y1',
          }
        ]
      };
    }
    
    // Empty data if no revenue data
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue (ETB)',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: theme === "dark" ? 'rgb(245, 158, 11)' : 'rgb(217, 119, 6)',
          backgroundColor: theme === "dark" 
            ? 'rgba(245, 158, 11, 0.15)' 
            : 'rgba(245, 158, 11, 0.08)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: theme === "dark" ? 'rgb(245, 158, 11)' : 'rgb(217, 119, 6)',
          pointBorderColor: theme === "dark" ? '#1f2937' : '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
        {
          label: 'Transactions',
          data: [0, 0, 0, 0, 0, 0],
          borderColor: theme === "dark" ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)',
          backgroundColor: theme === "dark" 
            ? 'rgba(59, 130, 246, 0.15)' 
            : 'rgba(59, 130, 246, 0.08)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: theme === "dark" ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)',
          pointBorderColor: theme === "dark" ? '#1f2937' : '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme === "dark" ? "#e5e7eb" : "#374151",
          font: { 
            size: 13,
            weight: '600'
          },
          padding: 25,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
        },
      },
      title: {
        display: true,
        text: title,
        color: theme === "dark" ? "#f3f4f6" : "#111827",
        font: { 
          size: 18, 
          weight: "bold"
        },
        padding: {
          top: 1,
          bottom: 1
        }
      },
      tooltip: {
        backgroundColor: theme === "dark" 
          ? "rgba(31, 41, 55, 0.95)" 
          : "rgba(255, 255, 255, 0.95)",
        titleColor: theme === "dark" ? "#fbbf24" : "#1e40af",
        bodyColor: theme === "dark" ? "#e5e7eb" : "#4b5563",
        borderColor: theme === "dark" ? "#f59e0b" : "#3b82f6",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 14,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            const value = context.raw;
            
            if (label.includes('Revenue')) {
              return `${label}: ETB ${value.toLocaleString()}`;
            } else {
              return `${label}: ${value}`;
            }
          },
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: theme === "dark" 
            ? "rgba(255, 255, 255, 0.08)" 
            : "rgba(0, 0, 0, 0.06)",
          drawBorder: false,
        },
        ticks: {
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
          font: {
            size: 12,
            weight: '500'
          },
          padding: 1,
        },
      },
      y: {
        beginAtZero: true,
        position: "left",
        grid: {
          color: theme === "dark" 
            ? "rgba(255, 255, 255, 0.08)" 
            : "rgba(0, 0, 0, 0.06)",
          drawBorder: false,
        },
        ticks: {
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
          font: {
            size: 12,
            weight: '500'
          },
          padding: 10,
          callback: function(value) {
            if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'k';
            }
            return value;
          }
        },
        title: {
          display: true,
          text: "Revenue (ETB)",
          color: theme === "dark" ? "#fbbf24" : "#d97706",
          font: {
            size: 13,
            weight: '600'
          },
          padding: { top: 0, bottom: 20 }
        }
      },
      y1: {
        beginAtZero: true,
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: theme === "dark" ? "#93c5fd" : "#1e40af",
          font: {
            size: 12,
            weight: '500'
          },
          padding: 10,
        },
        title: {
          display: true,
          text: "Transactions",
          color: theme === "dark" ? "#93c5fd" : "#1e40af",
          font: {
            size: 13,
            weight: '600'
          },
          padding: { top: 0, bottom: 20 }
        }
      }
    },
    animation: {
      duration: 1800,
      easing: "easeOutQuart",
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    elements: {
      line: {
        tension: 0.4,
        borderCapStyle: 'round',
      },
      point: {
        hoverBorderWidth: 3,
      }
    },
  };

  const chartData = processChartData();

  return (
    <div className="relative w-full h-full">
      <Line options={options} data={chartData} />
      
      {/* Summary Statistics */}
      <div className={`absolute -bottom-10 left-4 right-4 flex items-center justify-between p-1 rounded-lg backdrop-blur-sm ${
        theme === "dark" 
          ? "bg-gray-800/70 text-gray-200" 
          : "bg-white/80 text-gray-700"
      }`}>
        <div className="text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="font-medium">Revenue: </span>
            <span className="ml-1">ETB {
              chartData.datasets[0].data.length > 0 
                ? chartData.datasets[0].data[chartData.datasets[0].data.length - 1].toLocaleString()
                : '0'
            }</span>
          </div>
        </div>
        
        <div className="hidden sm:block text-gray-400">|</div>
        
        <div className="text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="font-medium">Transactions: </span>
            <span className="ml-1">{
              chartData.datasets[1].data.length > 0
                ? chartData.datasets[1].data[chartData.datasets[1].data.length - 1]
                : '0'
            }</span>
          </div>
        </div>
        
        <div className="hidden sm:block text-gray-400">|</div>
        
        <div className="text-sm">
          <span className="font-medium">Trend: </span>
          <span className="ml-1 text-green-500">
            {analyticsData?.dealAnalytics?.revenueTrend || '0%'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LineChart;