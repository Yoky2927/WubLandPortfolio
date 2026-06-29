// components/BrokerRequestsList.jsx - FIXED THEME COLORING
import React, { useState, useEffect } from "react";
import {
  Home,
  User,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  MessageCircle,
  Eye,
  Clock,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  Building,
  Bed,
  Bath,
  Square,
  Info,
  Phone,
  Mail,
  Image as ImageIcon,
  ChevronRight,
  Star,
  Shield,
  Users,
  FileText,
} from "lucide-react";
import { api } from "../utils/api.endpoints";
import RequestActions from "./RequestActions";

const BrokerRequestsList = ({
  theme,
  requests: initialRequests = [],
  onAcceptRequest,
  onRejectRequest,
  onMessageClient,
  onViewDetails,
  onStartProfessionalTools,
  canAccessTools = true,
  isInternal = false,
  setToast,
}) => {
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    accepted: 0,
    rejected: 0,
    draft: 0,
    in_progress: 0,
  });

  // Theme-based text colors
  const textColors = {
    primary: theme === "dark" ? "text-white" : "text-gray-900",
    secondary: theme === "dark" ? "text-gray-300" : "text-gray-700",
    muted: theme === "dark" ? "text-gray-400" : "text-gray-600",
    placeholder: theme === "dark" ? "text-gray-500" : "text-gray-500",
  };

  const fixImageUrl = (url) => {
    if (!url) return null;

    // If it's a Windows path, extract just the filename
    if (url.includes("\\")) {
      const filename = url.split("\\").pop();
      return `http://localhost:5002/uploads/temp/${filename}`;
    }

    // Already a good URL
    return url;
  };

  // Theme-based background colors
  const bgColors = {
    card: theme === "dark" ? "bg-gray-800/50" : "bg-white",
    cardHover: theme === "dark" ? "hover:bg-gray-800/70" : "hover:bg-gray-50",
    input: theme === "dark" ? "bg-gray-700/50" : "bg-white",
    section: theme === "dark" ? "bg-gray-700/30" : "bg-gray-50",
    statsCard: theme === "dark" ? "bg-gray-700/50" : "bg-gray-50",
  };

  // Theme-based border colors
  const borderColors = {
    default: theme === "dark" ? "border-gray-700" : "border-gray-200",
    input: theme === "dark" ? "border-gray-600" : "border-gray-300",
    hover:
      theme === "dark" ? "hover:border-amber-500/30" : "hover:border-amber-300",
  };

  useEffect(() => {
    if (initialRequests && initialRequests.length > 0) {
      setRequests(initialRequests);
      calculateStats(initialRequests);
      setLoading(false);
    } else {
      fetchRequests();
    }
  }, [initialRequests]);

  const cleanImageUrl = (pathOrUrl) => {
    if (!pathOrUrl) return null;

    let clean = pathOrUrl.toString();

    // Convert Windows paths
    if (clean.includes("\\")) {
      clean = clean.replace(/\\/g, "/");
    }

    // Extract relative part
    const uploadsIndex = clean.indexOf("uploads/temp/");
    if (uploadsIndex !== -1) {
      clean = clean.substring(uploadsIndex);
    }

    // Remove leading slash if present
    clean = clean.startsWith("/") ? clean.substring(1) : clean;

    // Ensure it's a full URL
    if (clean.startsWith("http")) {
      return clean;
    }

    return `http://localhost:5002/${clean}`;
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log("📋 Fetching property requests...");

      const response = await api.get("GET_PENDING_REQUESTS");
      console.log("📦 Raw API response:", response);

      let requestsData = [];

      // Handle different response formats
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          requestsData = response.data;
        } else if (response.data.requests) {
          requestsData = response.data.requests;
        } else if (response.data.data) {
          requestsData = response.data.data;
        }
      } else if (Array.isArray(response)) {
        requestsData = response;
      }

      console.log("📝 Processed requests data:", requestsData);

      // Format the data properly with DEBUGGING
      const formattedRequests = requestsData
        .map((request, index) => {
          try {
            // DEBUG: Log raw image data
            console.log(
              `🔍 Request ${request.id} has property_images:`,
              request.property_images,
            );
            console.log(`🔍 Type:`, typeof request.property_images);

            // Parse images if they exist - SIMPLIFIED VERSION
            let images = [];
            if (request.property_images) {
              console.log(
                `📸 Raw property_images for request ${request.id}:`,
                request.property_images,
              );

              try {
                let parsedImages;

                // Handle stringified JSON
                if (typeof request.property_images === "string") {
                  // Remove extra quotes and escape characters
                  let cleanString = request.property_images.trim();

                  // Check if it's JSON
                  if (
                    cleanString.startsWith("[") &&
                    cleanString.endsWith("]")
                  ) {
                    try {
                      parsedImages = JSON.parse(cleanString);
                    } catch (e) {
                      // Try with unescaped quotes
                      const unescaped = cleanString
                        .replace(/\\"/g, '"')
                        .replace(/\\'/g, "'");
                      parsedImages = JSON.parse(unescaped);
                    }
                  } else {
                    // Not JSON, try as string array
                    parsedImages = cleanString
                      .split(",")
                      .map((img) => img.trim());
                  }
                } else {
                  // Already parsed
                  parsedImages = request.property_images;
                }

                // Ensure it's an array
                if (!Array.isArray(parsedImages)) {
                  parsedImages = [parsedImages];
                }

                console.log(`📸 Parsed images array:`, parsedImages);

                // Process each image object - FIXED VERSION WITH WINDOWS PATH HANDLING
                images = parsedImages
                  .map((img, imgIndex) => {
                    if (!img) return null;

                    // Handle different image formats
                    let filename, originalname, path, url;

                    if (typeof img === "string") {
                      // It's a plain filename string
                      filename = img;
                      originalname = img;
                      path = `/uploads/temp/${img}`;
                      url = `http://localhost:5002/uploads/temp/${img}`;
                    } else if (typeof img === "object" && img !== null) {
                      // It's an image object (what you have in database)
                      filename = img.filename || img.name;
                      originalname =
                        img.originalname || img.originalName || img.filename;
                      path = img.path || img.filepath || img.location;

                      // Build URL - FIXED: Handle Windows paths properly
                      if (path) {
                        let cleanPath = path;

                        // 1. Convert Windows backslashes to forward slashes
                        if (cleanPath.includes("\\")) {
                          cleanPath = cleanPath.replace(/\\/g, "/");
                        }

                        // 2. Extract only the relative part after 'uploads/temp/'
                        const uploadsIndex = cleanPath.indexOf("uploads/temp/");
                        if (uploadsIndex !== -1) {
                          cleanPath = cleanPath.substring(uploadsIndex);
                        } else {
                          // If no uploads/temp found, use just the filename
                          cleanPath = `uploads/temp/${filename}`;
                        }

                        // 3. Remove any leading slashes
                        cleanPath = cleanPath.startsWith("/")
                          ? cleanPath.substring(1)
                          : cleanPath;

                        // 4. Construct the URL
                        url = `http://localhost:5002/${cleanPath}`;

                        console.log(
                          `🔄 Path conversion: ${path} -> ${cleanPath} -> ${url}`,
                        );
                      } else if (filename) {
                        // Fallback to temp folder
                        url = `http://localhost:5002/uploads/temp/${filename}`;
                      } else {
                        // Last resort
                        url = "";
                      }
                    } else {
                      return null;
                    }

                    console.log(`📸 Image ${imgIndex} details:`, {
                      img,
                      filename,
                      originalname,
                      path,
                      url,
                    });

                    return {
                      url: url,
                      filename: filename,
                      originalname: originalname,
                      path: path,
                      type: "property",
                      is_primary: imgIndex === 0,
                      thumbnail: url, // For preview
                    };
                  })
                  .filter((img) => img !== null && img.url !== "");

                console.log(
                  `✅ Processed ${images.length} images for request ${request.id}:`,
                  images,
                );
              } catch (parseError) {
                console.error(
                  `❌ Error parsing images for request ${request.id}:`,
                  parseError.message,
                );
                console.error(
                  "❌ Raw property_images:",
                  request.property_images,
                );

                // Fallback: Try a simpler approach
                try {
                  // If it's a string that looks like JSON but failed to parse
                  if (typeof request.property_images === "string") {
                    // Extract filenames using regex
                    const filenameMatch = request.property_images.match(
                      /"filename"\s*:\s*"([^"]+)"/,
                    );
                    if (filenameMatch && filenameMatch[1]) {
                      const filename = filenameMatch[1];
                      images = [
                        {
                          url: `http://localhost:5002/uploads/temp/${filename}`,
                          filename: filename,
                          type: "property",
                          is_primary: true,
                        },
                      ];
                      console.log(`🔄 Fallback extracted filename:`, filename);
                    }
                  }
                } catch (fallbackError) {
                  console.error(
                    "❌ Fallback parsing also failed:",
                    fallbackError,
                  );
                }
              }
            }

            // Create the formatted request
            return {
              id: request.id || `req-${index}`,
              request_id: request.id,
              title:
                request.title ||
                request.property_type ||
                `Property Request ${index + 1}`,
              description: request.description || "No description provided",
              budget:
                request.budget || request.price || request.estimated_price || 0,
              price: request.price || request.budget || 0,
              property_type: request.property_type || request.type || "house",
              location:
                request.location || request.address || "Location not specified",
              client_name:
                request.client_name ||
                (request.user
                  ? `${request.user.first_name || ""} ${request.user.last_name || ""}`.trim()
                  : "Unknown Client") ||
                "Unknown Client",
              client_phone:
                request.client_phone ||
                request.phone ||
                request.phone_number ||
                "N/A",
              client_email: request.client_email || request.email || "N/A",
              status: request.status || "pending",
              created_at: request.created_at || new Date().toISOString(),
              updated_at: request.updated_at,
              assigned_broker_id: request.assigned_broker_id,
              broker_id: request.assigned_broker_id,
              client_id: request.user_id || request.client_id,
              user_id: request.user_id || request.client_id,
              // Property details
              beds: request.beds || request.bedrooms || 0,
              baths: request.baths || request.bathrooms || 0,
              sqft: request.sqft || request.area || 0,
              // Images handling
              images: images,
              // Additional data
              schedule_date: request.schedule_date,
              schedule_time: request.schedule_time,
              schedule_notes: request.schedule_notes,
            };
          } catch (error) {
            console.error("Error formatting request:", error, request);
            return null;
          }
        })
        .filter((req) => req !== null);

      console.log("✅ Formatted requests:", formattedRequests);
      setRequests(formattedRequests);
      calculateStats(formattedRequests);
    } catch (error) {
      console.error("❌ Error fetching requests:", error);
      if (setToast) {
        setToast({
          show: true,
          message: `Failed to load property requests: ${error.message}`,
          type: "error",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartTools = async (request) => {
    console.log("🛠️ Starting professional tools for request:", request.id);

    try {
      const requestId = request.id || request.request_id;

      // First, let's debug the API call
      console.log("🔍 Making API call with:", { requestId });

      try {
        // Test if the endpoint exists
        const testResponse = await fetch(
          `http://localhost:5002/api/workflow/drafts/create-from-request/${requestId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          },
        );

        console.log("🔍 Direct fetch response:", {
          status: testResponse.status,
          statusText: testResponse.statusText,
          url: testResponse.url,
        });

        if (!testResponse.ok) {
          throw new Error(
            `HTTP ${testResponse.status}: ${testResponse.statusText}`,
          );
        }

        const data = await testResponse.json();
        console.log("✅ Direct fetch success:", data);

        if (setToast) {
          setToast({
            show: true,
            message: "Draft created successfully!",
            type: "success",
          });
        }

        // Redirect to professional tools
        window.location.href = `/broker/professional-tools?requestId=${requestId}&draftId=${data.data?.property_id}`;
      } catch (directError) {
        console.error("❌ Direct API call failed:", directError);

        // Try using the API wrapper
        const response = await api.post("CREATE_DRAFT_FROM_REQUEST", {
          requestId: requestId,
        });

        console.log("✅ API wrapper response:", response);

        if (response.success) {
          if (setToast) {
            setToast({
              show: true,
              message: "Draft created successfully!",
              type: "success",
            });
          }

          window.location.href = `/broker/professional-tools?requestId=${requestId}&draftId=${response.data?.property_id}`;
        } else {
          throw new Error(response.message || "Failed to create draft");
        }
      }
    } catch (error) {
      console.error("❌ Error starting professional tools:", error);

      if (error.message.includes("404")) {
        console.error("❌ Endpoint not found. Trying alternative...");

        // Try alternative endpoint
        try {
          const altResponse = await api.post("BROKER_ACCEPT_REQUEST", {
            requestId: request.id,
          });
          console.log("✅ Alternative response:", altResponse);

          if (setToast) {
            setToast({
              show: true,
              message: "Request accepted! You can now create property draft.",
              type: "success",
            });
          }

          // Refresh requests to update status
          fetchRequests();
        } catch (altError) {
          console.error("❌ Alternative also failed:", altError);
        }
      }

      if (setToast) {
        setToast({
          show: true,
          message: `Failed to create draft: ${error.message}`,
          type: "error",
        });
      }
    }
  };

  const calculateStats = (requestsData) => {
    const stats = {
      total: requestsData.length,
      pending: requestsData.filter((r) => r.status === "pending").length,
      assigned: requestsData.filter((r) => r.status === "assigned").length,
      accepted: requestsData.filter((r) => r.status === "accepted").length,
      rejected: requestsData.filter((r) => r.status === "rejected").length,
      draft: requestsData.filter((r) => r.status === "draft").length,
      in_progress: requestsData.filter((r) => r.status === "in_progress")
        .length,
    };
    setStats(stats);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleAcceptRequest = async (requestId) => {
    console.log("✅ Accepting request:", requestId);

    try {
      if (onAcceptRequest) {
        onAcceptRequest(requestId);
      } else {
        // DEBUG: Log what we're sending
        console.log("📤 Sending request ID:", requestId);
        console.log("📤 Type of requestId:", typeof requestId);

        // Make sure requestId is a number
        const numericRequestId = Number(requestId);
        if (isNaN(numericRequestId)) {
          throw new Error(`Invalid request ID: ${requestId}`);
        }

        const response = await api.post(
          "BROKER_ACCEPT_REQUEST",
          {},
          {
            requestId: numericRequestId,
          },
        );

        console.log("📥 Response:", response);

        if (response.success) {
          setRequests((prev) =>
            prev.map((req) =>
              req.id === requestId ? { ...req, status: "assigned" } : req,
            ),
          );

          if (setToast) {
            setToast({
              show: true,
              message: "Request accepted successfully!",
              type: "success",
            });
          }
          fetchRequests();
        } else {
          throw new Error(response.message || "Failed to accept request");
        }
      }
    } catch (error) {
      console.error("❌ Error accepting request:", error);
      if (setToast) {
        setToast({
          show: true,
          message: `Failed to accept request: ${error.message}`,
          type: "error",
        });
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    console.log("❌ Rejecting request:", requestId);

    try {
      if (onRejectRequest) {
        onRejectRequest(requestId);
      } else {
        setRequests((prev) => prev.filter((req) => req.id !== requestId));

        if (setToast) {
          setToast({
            show: true,
            message: "Request rejected successfully",
            type: "success",
          });
        }
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      if (setToast) {
        setToast({
          show: true,
          message: `Failed to reject request: ${error.message}`,
          type: "error",
        });
      }
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (filter === "pending" && request.status !== "pending") return false;
    if (filter === "assigned" && request.status !== "assigned") return false;
    if (filter === "accepted" && request.status !== "accepted") return false;
    if (filter === "rejected" && request.status !== "rejected") return false;
    if (filter === "draft" && request.status !== "draft") return false;
    if (filter === "in_progress" && request.status !== "in_progress")
      return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (request.client_name || "").toLowerCase().includes(searchLower) ||
        (request.location || "").toLowerCase().includes(searchLower) ||
        (request.property_type || "").toLowerCase().includes(searchLower) ||
        (request.description || "").toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Price not specified";
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "Invalid price";

    return `ETB ${numAmount.toLocaleString("en-ET")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          class:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          icon: <Clock className="w-3.5 h-3.5" />,
          label: "Pending",
        };
      case "assigned":
        return {
          class:
            "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
          icon: <User className="w-3.5 h-3.5" />,
          label: "Assigned",
        };
      case "accepted":
        return {
          class:
            "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          label: "Accepted",
        };
      case "rejected":
        return {
          class:
            "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
          icon: <XCircle className="w-3.5 h-3.5" />,
          label: "Rejected",
        };
      case "draft":
        return {
          class:
            "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20",
          icon: <FileText className="w-3.5 h-3.5" />,
          label: "Draft",
        };
      case "in_progress":
        return {
          class:
            "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
          icon: <RefreshCw className="w-3.5 h-3.5" />,
          label: "In Progress",
        };
      default:
        return {
          class:
            "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20",
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          label: "Unknown",
        };
    }
  };

  const getPropertyTypeIcon = (type) => {
    switch ((type || "").toLowerCase()) {
      case "villa":
        return <Home className="w-5 h-5" />;
      case "house":
        return <Home className="w-5 h-5" />;
      case "apartment":
        return <Building className="w-5 h-5" />;
      case "condo":
        return <Building className="w-5 h-5" />;
      case "commercial":
        return <Building className="w-5 h-5" />;
      case "land":
        return <Square className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div
        className={`p-6 rounded-2xl ${bgColors.card} border ${borderColors.default} backdrop-blur-sm`}
      >
        <div className="flex flex-col items-center justify-center h-96">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <p className={`mt-4 text-lg font-medium ${textColors.primary}`}>
            Loading Property Requests
          </p>
          <p className={`mt-2 text-sm ${textColors.muted}`}>
            Fetching available property listings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-2xl ${bgColors.card} border ${borderColors.default} backdrop-blur-sm`}
    >
      {/* Header with Gradient */}
      <div className="relative mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 rounded-t-2xl"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-3 rounded-xl ${theme === "dark" ? "bg-amber-500/10" : "bg-amber-100"}`}
                >
                  <Users className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
                    Property Requests
                  </h1>
                  <p className={`text-sm mt-1 ${textColors.muted}`}>
                    Review and manage property listings from sellers & landlords
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto">
              <div
                className={`p-3 rounded-xl ${bgColors.statsCard} border ${borderColors.default}`}
              >
                <div className={`text-xs font-medium ${textColors.muted}`}>
                  Total
                </div>
                <div className={`text-xl font-bold mt-1 ${textColors.primary}`}>
                  {stats.total}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl ${theme === "dark" ? "bg-amber-500/10" : "bg-amber-50"} border border-amber-500/20`}
              >
                <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Pending
                </div>
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {stats.pending}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"} border border-blue-500/20`}
              >
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Assigned
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {stats.assigned}
                </div>
              </div>
              <div
                className={`p-3 rounded-xl ${theme === "dark" ? "bg-green-500/10" : "bg-green-50"} border border-green-500/20`}
              >
                <div className="text-xs font-medium text-green-600 dark:text-green-400">
                  Accepted
                </div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats.accepted}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${textColors.placeholder} w-5 h-5`}
              />
              <input
                type="text"
                placeholder="Search by client, location, or property type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all ${bgColors.input} ${borderColors.input} ${textColors.primary} placeholder:${textColors.placeholder} focus:border-amber-400`}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all ${bgColors.input} ${borderColors.input} ${textColors.primary}`}
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending ({stats.pending})</option>
              <option value="assigned">Assigned ({stats.assigned})</option>
              <option value="accepted">Accepted ({stats.accepted})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
              <option value="draft">Draft ({stats.draft})</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`px-4 py-3 rounded-xl border flex items-center gap-2 transition-all ${
                refreshing ? "opacity-50 cursor-not-allowed" : ""
              } ${bgColors.input} ${borderColors.input} ${textColors.secondary} ${theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-50"}`}
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 ? (
        <div
          className={`py-16 text-center rounded-2xl ${bgColors.section} border ${borderColors.default}`}
        >
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <Building className="w-12 h-12 text-amber-500" />
          </div>
          <h3 className={`text-xl font-semibold mb-3 ${textColors.primary}`}>
            {searchTerm || filter !== "all"
              ? "No matching requests found"
              : "No property requests available"}
          </h3>
          <p className={`text-sm max-w-md mx-auto mb-6 ${textColors.muted}`}>
            {searchTerm || filter !== "all"
              ? "Try adjusting your search or filter criteria to find what you're looking for."
              : "When sellers submit property requests, they'll appear here for you to review and accept."}
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 mx-auto shadow-lg hover:shadow-amber-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Check for New Requests
          </button>
        </div>
      ) : (
        <>
          {/* Request List */}
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const propertyIcon = getPropertyTypeIcon(request.property_type);

              return (
                <div
                  key={request.id}
                  className={`group rounded-2xl border transition-all duration-300 hover:shadow-lg ${bgColors.card} ${borderColors.default} ${bgColors.cardHover} ${borderColors.hover}`}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Column - Property Info */}
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                            >
                              {propertyIcon}
                            </div>
                            <div>
                              <h3
                                className={`text-lg font-bold ${textColors.primary}`}
                              >
                                {request.client_name}
                              </h3>
                              <div className="flex items-center gap-3 mt-1">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${statusConfig.class}`}
                                >
                                  {statusConfig.icon}
                                  {statusConfig.label}
                                </span>
                                <span className={`text-sm ${textColors.muted}`}>
                                  {formatDate(request.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Property Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                              >
                                <MapPin className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <p className={`text-xs ${textColors.muted}`}>
                                  Location
                                </p>
                                <p
                                  className={`font-medium ${textColors.primary}`}
                                >
                                  {request.location}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                              >
                                <DollarSign className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <p className={`text-xs ${textColors.muted}`}>
                                  Budget
                                </p>
                                <p className="font-medium text-amber-600 dark:text-amber-400">
                                  {formatCurrency(request.price)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {request.beds && (
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                                >
                                  <Bed className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                  <p className={`text-xs ${textColors.muted}`}>
                                    Bedrooms
                                  </p>
                                  <p
                                    className={`font-medium ${textColors.primary}`}
                                  >
                                    {request.beds}
                                  </p>
                                </div>
                              </div>
                            )}

                            {request.sqft && (
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}
                                >
                                  <Square className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                  <p className={`text-xs ${textColors.muted}`}>
                                    Area
                                  </p>
                                  <p
                                    className={`font-medium ${textColors.primary}`}
                                  >
                                    {request.sqft} sqft
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {request.description && (
                          <div className="mb-4">
                            <p
                              className={`text-sm ${textColors.secondary} line-clamp-2`}
                            >
                              {request.description}
                            </p>
                          </div>
                        )}

                        {/* Images Preview */}
                        {request.images && request.images.length > 0 ? (
                          <div className="mt-4">
                            <p
                              className={`text-sm font-medium mb-2 ${textColors.muted}`}
                            >
                              Property Images ({request.images.length})
                            </p>
                            <div className="flex gap-2">
                              {request.images.slice(0, 4).map((img, index) => {
                                const imageUrl = fixImageUrl(
                                  img.url || img.thumbnail,
                                );

                                return (
                                  <div
                                    key={index}
                                    className="relative group/image"
                                  >
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                      {imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={`Property image ${index + 1}`}
                                          className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                                          onError={(e) => {
                                            console.error(
                                              `❌ Failed to load image:`,
                                              imageUrl,
                                            );
                                            e.target.onerror = null;
                                            e.target.src = `https://via.placeholder.com/100x100/${
                                              theme === "dark"
                                                ? "374151"
                                                : "f3f4f6"
                                            }/${
                                              theme === "dark"
                                                ? "6b7280"
                                                : "9ca3af"
                                            }?text=Image`;
                                          }}
                                          onLoad={() =>
                                            console.log(
                                              `✅ Image loaded:`,
                                              imageUrl,
                                            )
                                          }
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <ImageIcon className="w-6 h-6 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    {index === 3 &&
                                      request.images.length > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                                          <span className="text-white text-xs font-medium">
                                            +{request.images.length - 4}
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* DEBUG: Show image URLs */}
                            <div className="mt-2 text-xs">
                              <details>
                                <summary className="cursor-pointer text-gray-500">
                                  Debug Image URLs
                                </summary>
                                <div className="mt-1 space-y-1">
                                  {request.images
                                    .slice(0, 4)
                                    .map((img, index) => (
                                      <div key={index} className="truncate">
                                        <span className="font-mono text-gray-400">
                                          Image {index + 1}:
                                        </span>{" "}
                                        {img.url || "No URL"}
                                      </div>
                                    ))}
                                </div>
                              </details>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`mt-4 p-4 rounded-xl ${bgColors.section} border ${borderColors.default}`}
                          >
                            <div className="flex items-center gap-3">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <p className={`text-sm ${textColors.muted}`}>
                                No images provided
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Actions */}
                      <div className="lg:w-64">
                        <RequestActions
                          request={request}
                          theme={theme}
                          canAccessTools={canAccessTools}
                          isInternal={isInternal}
                          onAcceptRequest={handleAcceptRequest}
                          onRejectRequest={handleRejectRequest}
                          onMessageClient={onMessageClient}
                          onViewDetails={onViewDetails}
                          onStartProfessionalTools={handleStartTools}
                          setToast={setToast}
                        />

                        {/* Client Contact */}
                        {(request.client_phone !== "N/A" ||
                          request.client_email !== "N/A") && (
                          <div
                            className={`mt-4 p-4 rounded-xl ${bgColors.section} border ${borderColors.default}`}
                          >
                            <p
                              className={`text-xs font-medium mb-2 ${textColors.muted}`}
                            >
                              Client Contact
                            </p>
                            {request.client_phone !== "N/A" && (
                              <div className="flex items-center gap-2 mb-2">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span
                                  className={`text-sm ${textColors.secondary}`}
                                >
                                  {request.client_phone}
                                </span>
                              </div>
                            )}
                            {request.client_email !== "N/A" && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span
                                  className={`text-sm ${textColors.secondary}`}
                                >
                                  {request.client_email}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className={`mt-8 pt-6 border-t ${borderColors.default}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className={`text-sm font-medium ${textColors.primary}`}>
                  Showing{" "}
                  <span className="text-amber-600 dark:text-amber-400">
                    {filteredRequests.length}
                  </span>{" "}
                  of <span className="font-bold">{requests.length}</span>{" "}
                  requests
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className={`text-xs ${textColors.muted}`}>
                      {stats.pending} pending
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className={`text-xs ${textColors.muted}`}>
                      {stats.assigned} assigned
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className={`text-xs ${textColors.muted}`}>
                      {stats.accepted} accepted
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${
                    refreshing ? "opacity-50 cursor-not-allowed" : ""
                  } ${bgColors.input} ${borderColors.input} ${textColors.secondary} ${theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh List
                </button>

                {filter !== "all" && (
                  <button
                    onClick={() => setFilter("all")}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-medium transition-all"
                  >
                    Show All Requests
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BrokerRequestsList;
