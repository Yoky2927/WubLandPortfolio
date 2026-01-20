// components/charts/LineChart.jsx - ENHANCED USER DISTRIBUTION VERSION
import React, { useState, useEffect } from 'react';
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
import { Users, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { directApi } from '../../utils/api.endpoints';

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

const LineChart = ({ 
  theme, 
  title = "User Growth & Distribution", 
  height = "300px"
}) => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [timeRange, setTimeRange] = useState('monthly'); // monthly, quarterly, yearly
  const [growthRate, setGrowthRate] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  // Fetch user data from API
  useEffect(() => {
    fetchUserData();
  }, [timeRange]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get users data
      const usersResponse = await directApi.getUsers();
      const users = usersResponse?.data || usersResponse || [];
      setTotalUsers(users.length);

      // Process user data based on time range
      const processedData = processUserData(users);
      
      // Calculate growth rate
      if (processedData.userGrowthData.length >= 2) {
        const lastMonth = processedData.userGrowthData[processedData.userGrowthData.length - 1];
        const prevMonth = processedData.userGrowthData[processedData.userGrowthData.length - 2];
        const rate = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth * 100).toFixed(1) : 0;
        setGrowthRate(rate);
      }

      setChartData({
        labels: processedData.labels,
        datasets: [
          {
            label: 'Total Users',
            data: processedData.userGrowthData,
            borderColor: theme === "dark" ? 'rgb(245, 158, 11)' : 'rgb(217, 119, 6)', // Amber
            backgroundColor: theme === "dark" 
              ? 'rgba(245, 158, 11, 0.15)' 
              : 'rgba(245, 158, 11, 0.08)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: theme === "dark" ? 'rgb(245, 158, 11)' : 'rgb(217, 119, 6)',
            pointBorderColor: theme === "dark" ? '#1f2937' : '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
          },
          {
            label: 'New Users',
            data: processedData.newUsersData,
            borderColor: theme === "dark" ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)', // Blue
            backgroundColor: theme === "dark" 
              ? 'rgba(59, 130, 246, 0.1)' 
              : 'rgba(59, 130, 246, 0.05)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            borderDash: [5, 5],
            pointBackgroundColor: theme === "dark" ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)',
            pointBorderColor: theme === "dark" ? '#1f2937' : '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
          {
            label: 'Active Users',
            data: processedData.activeUsersData,
            borderColor: theme === "dark" ? 'rgb(34, 197, 94)' : 'rgb(21, 128, 61)', // Green
            backgroundColor: theme === "dark" 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(34, 197, 94, 0.05)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            borderDash: [3, 3],
            pointBackgroundColor: theme === "dark" ? 'rgb(34, 197, 94)' : 'rgb(21, 128, 61)',
            pointBorderColor: theme === "dark" ? '#1f2937' : '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
          }
        ]
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback sample data
      setChartData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Total Users',
            data: [150, 220, 320, 410, 520, 650],
            borderColor: theme === "dark" ? 'rgb(245, 158, 11)' : 'rgb(217, 119, 6)',
            backgroundColor: theme === "dark" ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
          },
          {
            label: 'New Users',
            data: [50, 70, 100, 90, 110, 130],
            borderColor: theme === "dark" ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            borderDash: [5, 5],
          },
          {
            label: 'Active Users',
            data: [120, 180, 250, 320, 400, 520],
            borderColor: theme === "dark" ? 'rgb(34, 197, 94)' : 'rgb(21, 128, 61)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            borderDash: [3, 3],
          }
        ]
      });
      setGrowthRate(18.5);
      setTotalUsers(650);
      setLoading(false);
    }
  };

  const processUserData = (users) => {
    const now = new Date();
    const labels = [];
    const userGrowthData = [];
    const newUsersData = [];
    const activeUsersData = [];

    // Determine number of periods based on time range
    let periods = 6;
    let periodType = 'month';
    
    if (timeRange === 'quarterly') {
      periods = 4;
      periodType = 'quarter';
    } else if (timeRange === 'yearly') {
      periods = 5;
      periodType = 'year';
    }

    // Create labels and initialize data arrays
    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now);
      if (periodType === 'month') {
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleString('default', { month: 'short' }));
      } else if (periodType === 'quarter') {
        date.setMonth(date.getMonth() - (i * 3));
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        labels.push(`Q${quarter} ${date.getFullYear().toString().slice(-2)}`);
      } else {
        date.setFullYear(date.getFullYear() - i);
        labels.push(date.getFullYear().toString());
      }
      
      userGrowthData.push(0);
      newUsersData.push(0);
      activeUsersData.push(0);
    }

    // Process each user
    users.forEach(user => {
      const createdAt = user.created_at ? new Date(user.created_at) : null;
      if (!createdAt) return;

      // Find which period this user belongs to
      const periodIndex = getPeriodIndex(createdAt, periods, periodType);
      if (periodIndex >= 0 && periodIndex < periods) {
        userGrowthData[periodIndex]++;
        
        // If user was created in this period, count as new user
        if (periodIndex === periods - 1) {
          newUsersData[periodIndex]++;
        }

        // Count active users (users active within last 30 days)
        const lastActive = user.last_login ? new Date(user.last_login) : createdAt;
        const daysSinceActive = (now - lastActive) / (1000 * 60 * 60 * 24);
        if (daysSinceActive <= 30) {
          activeUsersData[periodIndex]++;
        }
      }
    });

    // Calculate cumulative totals
    for (let i = 1; i < periods; i++) {
      userGrowthData[i] += userGrowthData[i - 1];
    }

    return { labels, userGrowthData, newUsersData, activeUsersData };
  };

  const getPeriodIndex = (date, periods, periodType) => {
    const now = new Date();
    const diffInMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    
    if (periodType === 'month') {
      if (diffInMonths >= periods) return -1; // Too old
      return periods - 1 - diffInMonths;
    } else if (periodType === 'quarter') {
      const diffInQuarters = Math.floor(diffInMonths / 3);
      if (diffInQuarters >= periods) return -1;
      return periods - 1 - diffInQuarters;
    } else {
      const diffInYears = now.getFullYear() - date.getFullYear();
      if (diffInYears >= periods) return -1;
      return periods - 1 - diffInYears;
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: theme === "dark" ? "#d1d5db" : "#4b5563",
          font: { 
            size: 12,
            weight: '500'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label,
              fillStyle: dataset.borderColor,
              strokeStyle: dataset.borderColor,
              lineWidth: 2,
              pointStyle: i === 0 ? 'circle' : 'rectRot',
              hidden: !chart.isDatasetVisible(i),
              index: i
            }));
          }
        },
      },
      title: {
        display: false, // We'll use custom header
      },
      tooltip: {
        backgroundColor: theme === "dark" 
          ? "rgba(31, 41, 55, 0.95)" 
          : "rgba(255, 255, 255, 0.95)",
        titleColor: theme === "dark" ? "#f3f4f6" : "#111827",
        bodyColor: theme === "dark" ? "#d1d5db" : "#4b5563",
        borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          title: (tooltipItems) => {
            return tooltipItems[0].label;
          },
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw;
            return `${label}: ${value} users`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: theme === "dark" 
            ? "rgba(255, 255, 255, 0.05)" 
            : "rgba(0, 0, 0, 0.04)",
          drawBorder: false,
        },
        ticks: {
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
          font: {
            size: 11,
            weight: '500'
          },
          padding: 5,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme === "dark" 
            ? "rgba(255, 255, 255, 0.05)" 
            : "rgba(0, 0, 0, 0.04)",
          drawBorder: false,
        },
        ticks: {
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
          font: {
            size: 11,
            weight: '500'
          },
          padding: 5,
          callback: function(value) {
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'k';
            }
            return value;
          }
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    elements: {
      line: {
        tension: 0.3,
        borderCapStyle: 'round',
      },
    },
  };

  if (loading) {
    return (
      <div className={`rounded-xl border p-4 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"}`}>
              <Users className={`w-5 h-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {title}
              </h3>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Loading user data...
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-3 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      {/* Custom Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"}`}>
              <Users className={`w-5 h-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                {title}
              </h3>
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {totalUsers.toLocaleString()} total users
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className={`flex rounded-lg overflow-hidden border ${theme === "dark" ? "border-gray-600" : "border-gray-300"}`}>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`px-3 py-1.5 text-sm ${timeRange === 'monthly' 
                  ? theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
                  : theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeRange('quarterly')}
                className={`px-3 py-1.5 text-sm ${timeRange === 'quarterly' 
                  ? theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
                  : theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Quarterly
              </button>
              <button
                onClick={() => setTimeRange('yearly')}
                className={`px-3 py-1.5 text-sm ${timeRange === 'yearly' 
                  ? theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"
                  : theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Yearly
              </button>
            </div>
            
            <button
              onClick={fetchUserData}
              className={`p-1.5 rounded-lg ${theme === "dark" 
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="p-4">
        <div style={{ height }}>
          <Line options={options} data={chartData} />
        </div>

        {/* Stats Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-blue-50"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-blue-600"}`}>
                  Growth Rate
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {growthRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-xl font-bold ${growthRate >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(growthRate)}%
                  </span>
                </div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${growthRate >= 0 
                ? theme === "dark" ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                : theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
              }`}>
                {growthRate >= 0 ? 'Positive' : 'Negative'}
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-amber-50"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-amber-600"}`}>
                  Current Month
                </p>
                <p className={`text-xl font-bold mt-1 ${theme === "dark" ? "text-white" : "text-amber-700"}`}>
                  {chartData.datasets[1]?.data[chartData.datasets[1]?.data.length - 1] || 0}
                </p>
                <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-amber-500"}`}>
                  New users
                </p>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${theme === "dark" ? "bg-amber-900/30 text-amber-400" : "bg-amber-100 text-amber-700"}`}>
                Latest
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-green-50"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-green-600"}`}>
                  Active Users
                </p>
                <p className={`text-xl font-bold mt-1 ${theme === "dark" ? "text-white" : "text-green-700"}`}>
                  {chartData.datasets[2]?.data[chartData.datasets[2]?.data.length - 1] || 0}
                </p>
                <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-green-500"}`}>
                  Last 30 days
                </p>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${theme === "dark" ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"}`}>
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Data Points Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {chartData.labels.map((label, index) => {
              const total = chartData.datasets[0]?.data[index] || 0;
              const newUsers = chartData.datasets[1]?.data[index] || 0;
              const active = chartData.datasets[2]?.data[index] || 0;
              
              return (
                <div key={index} className={`p-2 rounded ${theme === "dark" ? "bg-gray-700/30" : "bg-gray-50"}`}>
                  <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    {label}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Total:</span>
                    <span className="text-sm font-semibold">{total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">New:</span>
                    <span className="text-xs text-blue-500 font-medium">{newUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Active:</span>
                    <span className="text-xs text-green-500 font-medium">{active}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineChart;