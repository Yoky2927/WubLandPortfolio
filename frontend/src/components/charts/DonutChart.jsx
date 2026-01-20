// components/charts/DonutChart.jsx - UPDATED VERSION
import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import { directApi } from '../../utils/api.endpoints'; // Assuming this path is correct

const DonutChart = ({ 
  theme, 
  title = "Property Distribution",
  chartType = "property" // "property", "transaction", or "user"
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState({
    labels: [],
    dataValues: [],
    colors: [],
    total: 0
  });

  // Fetch data based on chart type
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let labels = [];
        let dataValues = [];
        let colors = [];
        let total = 0;

        if (chartType === "property") {
          // Fetch properties data and compute distribution
          const properties = await directApi.getProperties({ limit: 1000 });
          const propertyList = properties?.data || properties || [];
          
          // Categorize properties by type
          const propertyTypes = {
            'Residential': 0,
            'Commercial': 0,
            'Land': 0,
            'Apartment': 0,
            'House': 0,
            'Villa': 0,
            'Other': 0
          };

          propertyList.forEach(property => {
            const type = property.property_type?.toLowerCase() || 
                        property.type?.toLowerCase() || 
                        'other';
            
            if (type.includes('residential') || type.includes('house') || type.includes('villa')) {
              propertyTypes['Residential']++;
            } else if (type.includes('commercial') || type.includes('office') || type.includes('shop')) {
              propertyTypes['Commercial']++;
            } else if (type.includes('land') || type.includes('plot')) {
              propertyTypes['Land']++;
            } else if (type.includes('apartment') || type.includes('flat')) {
              propertyTypes['Apartment']++;
            } else if (type.includes('house')) {
              propertyTypes['House']++;
            } else if (type.includes('villa')) {
              propertyTypes['Villa']++;
            } else {
              propertyTypes['Other']++;
            }
          });

          // Filter out empty categories
          labels = Object.keys(propertyTypes).filter(key => propertyTypes[key] > 0);
          dataValues = labels.map(key => propertyTypes[key]);
          total = dataValues.reduce((sum, value) => sum + value, 0);
          
          // Colors for property types
          const propertyColors = [
            'rgba(59, 130, 246, 0.8)',   // Blue - Residential
            'rgba(16, 185, 129, 0.8)',   // Green - Commercial
            'rgba(245, 158, 11, 0.8)',   // Amber - Land
            'rgba(139, 92, 246, 0.8)',   // Purple - Apartment
            'rgba(239, 68, 68, 0.8)',    // Red - House
            'rgba(14, 165, 233, 0.8)',   // Sky - Villa
            'rgba(107, 114, 128, 0.8)',  // Gray - Other
          ];
          
          colors = propertyColors.slice(0, labels.length);

        } else if (chartType === "user") {
          // Fetch users data and compute role distribution
          const users = await directApi.getUsers();
          const userList = users?.data || users || [];
          
          // Categorize users by role
          const userRoles = {
            'Buyer': 0,
            'Seller': 0,
            'Broker': 0,
            'Admin': 0,
            'Support': 0,
            'Other': 0
          };

          userList.forEach(user => {
            const role = user.role?.toLowerCase() || 
                        user.user_type?.toLowerCase() || 
                        'other';
            
            if (role.includes('buyer') || role.includes('client')) {
              userRoles['Buyer']++;
            } else if (role.includes('seller')) {
              userRoles['Seller']++;
            } else if (role.includes('broker') || role.includes('agent')) {
              userRoles['Broker']++;
            } else if (role.includes('admin') || role.includes('super_admin')) {
              userRoles['Admin']++;
            } else if (role.includes('support')) {
              userRoles['Support']++;
            } else {
              userRoles['Other']++;
            }
          });

          // Filter out empty categories
          labels = Object.keys(userRoles).filter(key => userRoles[key] > 0);
          dataValues = labels.map(key => userRoles[key]);
          total = dataValues.reduce((sum, value) => sum + value, 0);
          
          // Colors for user roles
          const userColors = [
            'rgba(59, 130, 246, 0.8)',   // Blue - Buyer
            'rgba(16, 185, 129, 0.8)',   // Green - Seller
            'rgba(245, 158, 11, 0.8)',   // Amber - Broker
            'rgba(139, 92, 246, 0.8)',   // Purple - Admin
            'rgba(239, 68, 68, 0.8)',    // Red - Support
            'rgba(107, 114, 128, 0.8)',  // Gray - Other
          ];
          
          colors = userColors.slice(0, labels.length);

        } else if (chartType === "transaction") {
          // Fetch transactions data and compute status distribution
          const transactions = await directApi.getTransactionHistory('all');
          const transactionList = transactions?.data || transactions || [];
          
          // Categorize transactions by status
          const transactionStatus = {
            'Completed': 0,
            'Pending': 0,
            'Cancelled': 0,
            'Failed': 0,
            'In Review': 0
          };

          transactionList.forEach(transaction => {
            const status = transaction.status?.toLowerCase() || 
                          transaction.payment_status?.toLowerCase() || 
                          'pending';
            
            if (status.includes('complete') || status.includes('success') || status.includes('paid')) {
              transactionStatus['Completed']++;
            } else if (status.includes('pending') || status.includes('processing')) {
              transactionStatus['Pending']++;
            } else if (status.includes('cancel') || status.includes('void')) {
              transactionStatus['Cancelled']++;
            } else if (status.includes('fail') || status.includes('error')) {
              transactionStatus['Failed']++;
            } else {
              transactionStatus['In Review']++;
            }
          });

          // Filter out empty categories
          labels = Object.keys(transactionStatus).filter(key => transactionStatus[key] > 0);
          dataValues = labels.map(key => transactionStatus[key]);
          total = dataValues.reduce((sum, value) => sum + value, 0);
          
          // Colors for transaction status
          const transactionColors = [
            'rgba(16, 185, 129, 0.8)',   // Green - Completed
            'rgba(245, 158, 11, 0.8)',   // Amber - Pending
            'rgba(239, 68, 68, 0.8)',    // Red - Cancelled
            'rgba(107, 114, 128, 0.8)',  // Gray - Failed
            'rgba(59, 130, 246, 0.8)',   // Blue - In Review
          ];
          
          colors = transactionColors.slice(0, labels.length);
        }

        setChartData({
          labels,
          dataValues,
          colors,
          total
        });

      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Fallback to sample data
        setChartData({
          labels: chartType === 'property' ? ['Residential', 'Commercial', 'Land'] : 
                  chartType === 'user' ? ['Buyers', 'Sellers', 'Brokers'] : 
                  ['Completed', 'Pending', 'Cancelled'],
          dataValues: [30, 20, 10],
          colors: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          total: 60
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chartType]);

  // Create/update chart when data or theme changes
  useEffect(() => {
    if (!chartRef.current || loading) return;

    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    const data = {
      labels: chartData.labels,
      datasets: [{
        data: chartData.dataValues,
        backgroundColor: chartData.colors,
        borderColor: theme === 'dark' ? '#374151' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 15,
        hoverBorderWidth: 3
      }]
    };

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: theme === 'dark' ? '#d1d5db' : '#374151',
              font: {
                size: 11
              },
              padding: 15,
              usePointStyle: true,
              boxWidth: 8
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
              size: 14,
              weight: '600'
            },
            padding: {
              top: 10,
              bottom: 15
            }
          }
        },
        cutout: '65%',
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1500,
          easing: 'easeOutQuart'
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [theme, chartData, loading, title]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-64">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {chartData.total}
          </div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Total {chartType === 'property' ? 'Properties' : 
                  chartType === 'user' ? 'Users' : 'Transactions'}
          </div>
        </div>
      </div>
      <canvas ref={chartRef} />
    </div>
  );
};

export default DonutChart;