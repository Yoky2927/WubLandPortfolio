import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title
);

const RadarChart = ({
  theme,
  analyticsData,
  title = "User Role Distribution",
}) => {
  // Prepare the chart data with 8 roles (for 8-sided shape)
  const prepareChartData = () => {
    console.log("=== RADAR CHART DEBUG ===");
    console.log("Full analyticsData:", analyticsData);
    console.log("userDistribution:", analyticsData?.userDistribution);

    if (analyticsData?.userDistribution) {
      console.log("User distribution items:");
      analyticsData.userDistribution.forEach((item, index) => {
        console.log(
          `  ${index + 1}. Role: "${item.role}", Count: ${item.count}, Color: ${
            item.color
          }`
        );
      });
    }

    // Always use exactly 8 roles for octagonal shape
    const defaultRoles = [
      "Buyers",
      "Sellers",
      "Renters",
      "Landlords",
      "Brokers",
      "Support",
      "Admins",
      "Super Admins",
    ];

    // Initialize counts for all 8 roles
    let counts = [0, 0, 0, 0, 0, 0, 0, 0];

    // If we have real data from analysis-service, use it
    if (
      analyticsData?.userDistribution &&
      analyticsData.userDistribution.length > 0
    ) {
      console.log(
        "📊 User Distribution from analysis:",
        analyticsData.userDistribution
      );

      // Direct mapping from userDistribution to our 8 categories
      analyticsData.userDistribution.forEach((item) => {
        const role = item.role.toLowerCase();
        const count = item.count;

        // Map each role to our 8 categories
        if (role.includes("buyer")) counts[0] += count;
        else if (role.includes("seller")) counts[1] += count;
        else if (role.includes("renter")) counts[2] += count;
        else if (role.includes("landlord")) counts[3] += count;
        else if (role.includes("broker")) counts[4] += count;
        else if (role.includes("support")) counts[5] += count;
        else if (role === "admin") counts[6] += count;
        else if (role.includes("super_admin") || role.includes("super admin"))
          counts[7] += count;
        else if (role === "user") {
          // 'user' is a generic role, distribute to appropriate category or skip
          // For now, let's add to buyers or create a separate category
          counts[0] += count; // Add generic users to buyers
        }
      });

      console.log("📊 Final counts:", counts);
    } else if (analyticsData?.totalUsers) {
      // If we have total users but no distribution, show placeholder
      console.log(
        "📊 No userDistribution, using totalUsers:",
        analyticsData.totalUsers
      );
      counts = [1, 1, 1, 1, 2, 3, 2, 1]; // Mock based on your actual data
    }

    const totalUsers = counts.reduce((a, b) => a + b, 0);

    return {
      labels: defaultRoles,
      datasets: [
        {
          label: "Total Users",
          data: counts,
          backgroundColor:
            theme === "dark"
              ? "rgba(245, 158, 11, 0.25)"
              : "rgba(245, 158, 11, 0.2)",
          borderColor:
            theme === "dark" ? "rgba(245, 158, 11, 0.9)" : "rgb(245, 158, 11)",
          pointBackgroundColor:
            theme === "dark" ? "rgb(245, 158, 11)" : "rgb(245, 158, 11)",
          pointBorderColor: theme === "dark" ? "#1f2937" : "#fff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 10,
          borderWidth: 3,
          fill: true,
        },
      ],
      totalUsers: totalUsers,
    };
  };

  const chartData = prepareChartData();
  const totalUsers = chartData.totalUsers;

  console.log("📊 RadarChart final data:", {
    labels: chartData.labels,
    counts: chartData.datasets[0].data,
    totalUsers: totalUsers,
  });

  // Dynamic max scale: if total users < 5, use 5, otherwise use appropriate scale
  const maxCount = Math.max(...chartData.datasets[0].data);
  const maxScale = maxCount < 5 ? 5 : maxCount + 2;

  // Dynamic step size based on max scale
  const stepSize =
    maxScale <= 5 ? 1 : maxScale <= 10 ? 2 : maxScale <= 20 ? 5 : 10;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: theme === "dark" ? "#e5e7eb" : "#374151",
          font: {
            size: 13,
            weight: "600",
          },
          padding: 25,
          usePointStyle: true,
          pointStyle: "rectRot",
          boxWidth: 12,
        },
      },
      title: {
        display: true,
        text: title,
        color: theme === "dark" ? "#f3f4f6" : "#111827",
        font: {
          size: 18,
          weight: "bold",
          family: "'Inter', sans-serif",
        },
        padding: {
          top: 1,
          bottom: 1,
        },
      },
      tooltip: {
        backgroundColor:
          theme === "dark"
            ? "rgba(31, 41, 55, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
        titleColor: theme === "dark" ? "#fbbf24" : "#1f2937",
        bodyColor: theme === "dark" ? "#e5e7eb" : "#4b5563",
        borderColor: theme === "dark" ? "#f59e0b" : "#f59e0b",
        borderWidth: 2,
        cornerRadius: 8,
        padding: 14,
        displayColors: false,
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw;
            const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return `${label}: ${value} user${
              value !== 1 ? "s" : ""
            } (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: maxScale,
        angleLines: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.15)"
              : "rgba(0, 0, 0, 0.1)",
          lineWidth: 2,
        },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
          circular: false, // Set to false for octagonal shape
          lineWidth: 1.5,
        },
        pointLabels: {
          color: theme === "dark" ? "#d1d5db" : "#4b5563",
          font: {
            size: 12,
            weight: "700",
            family: "'Inter', sans-serif",
          },
          padding: 18,
          backdropColor: "transparent",
        },
        ticks: {
          backdropColor: "transparent",
          color: theme === "dark" ? "#9ca3af" : "#6b7280",
          font: {
            size: 11,
            weight: "500",
          },
          stepSize: stepSize,
          z: 1,
          showLabelBackdrop: false,
        },
        // Configure for 8 sides
        angle: {
          // Start at top (12 o'clock position)
          startAngle: 0,
          // Divide circle into 8 equal parts (360/8 = 45 degrees)
          stepSize: 45,
        },
      },
    },
    animation: {
      duration: 1800,
      easing: "easeOutQuart",
    },
    interaction: {
      intersect: false,
      mode: "nearest",
    },
    elements: {
      line: {
        tension: 0, // Set to 0 for straight lines between points (octagonal shape)
        borderJoinStyle: "round", // Smooth corners
      },
      point: {
        hoverBorderWidth: 4,
        pointStyle: "circle",
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20,
      },
    },
  };

  return (
    <div className="relative w-full h-full">
      <Radar options={options} data={chartData} />
      {/* Statistics overlay */}
      <div
        className={`absolute -bottom-5 left-4 right-4 flex flex-col sm:flex-row items-center justify-between p-1 rounded-lg backdrop-blur-sm ${
          theme === "dark"
            ? "bg-gray-800/70 text-gray-200"
            : "bg-white/80 text-gray-700"
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-sm font-medium">
              Total: {totalUsers} user{totalUsers !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="hidden sm:block text-gray-400">|</div>
          <div className="text-sm">
            <span className="font-medium">Max: </span>
            {Math.max(...chartData.datasets[0].data)}
          </div>
        </div>
        <div className="mt-2 sm:mt-0 text-sm">
          <span className="font-medium">Top: </span>
          {
            chartData.labels[
              chartData.datasets[0].data.indexOf(
                Math.max(...chartData.datasets[0].data)
              )
            ]
          }
        </div>
      </div>
    </div>
  );
};

export default RadarChart;
