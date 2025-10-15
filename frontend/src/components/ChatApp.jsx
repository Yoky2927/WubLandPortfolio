import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import {
  Users,
  X,
  Send,
  File,
  Image,
  FileText,
  Archive,
  Download,
  MessageSquare,
  Loader2,
  Search,
  Smile,
  Edit,
  Trash,
  Paperclip,
  Type,
  Save,
  Filter,
  MoreVertical,
  Check,
  Copy,
  Camera,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-red-100 dark:bg-red-900">
          <h1 className="text-2xl text-red-600 dark:text-red-200">
            Something went wrong. Please try again later.
          </h1>
        </div>
      );
    }
    return this.props.children;
  }
}

const ChatApp = ({
  user,
  isChatMaximized = false,
  setIsChatMaximized = () => {},
  showUserInfoModal = false,
  setShowUserInfoModal = () => {},
  setSelectedUser = () => {},
}) => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [selectedUser, setLocalSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isTyping, setIsTyping] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userCategories, setUserCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userRole, setUserRole] = useState("");
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextMessageId, setContextMessageId] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Image editor states
  const [imageEditMode, setImageEditMode] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#ff0000");
  const [drawingWidth, setDrawingWidth] = useState(3);
  const [annotations, setAnnotations] = useState([]);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);

  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const contextMenuRef = useRef(null);
  const dropZoneRef = useRef(null);
  const imageCanvasRef = useRef(null);
  const annotationCanvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);

  const socket = useRef(null);
  const navigate = useNavigate();

  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  // Amber color gradient definition
  const amberGradient =
    "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600";
  const amberGradientText =
    "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent";

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // Optimized message handlers with optimistic updates
  const handleNewMessage = useCallback(
    (newMessage) => {
      console.log("New message received:", newMessage);
      if (
        (newMessage.receiverId === user?.id &&
          newMessage.senderId === selectedUser?.id) ||
        (newMessage.senderId === user?.id &&
          newMessage.receiverId === selectedUser?.id)
      ) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === newMessage.id);
          if (!exists) {
            return [...prev, { ...newMessage, status: "delivered" }];
          }
          return prev;
        });
      }
    },
    [user?.id, selectedUser?.id]
  );

  const handleMessageRead = useCallback((data) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === data.messageId ? { ...msg, status: "read" } : msg
      )
    );
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && showSidebar && selectedUser) {
        setShowSidebar(false);
      } else if (!mobile) {
        setShowSidebar(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showSidebar, selectedUser]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        setShowContextMenu(false);
      }
      if (showFilters && !event.target.closest(".filters-container")) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  // Drag and drop handling
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    };

    const dropZone = dropZoneRef.current;
    if (dropZone) {
      dropZone.addEventListener("dragover", handleDragOver);
      dropZone.addEventListener("dragleave", handleDragLeave);
      dropZone.addEventListener("drop", handleDrop);
    }

    return () => {
      if (dropZone) {
        dropZone.removeEventListener("dragover", handleDragOver);
        dropZone.removeEventListener("dragleave", handleDragLeave);
        dropZone.removeEventListener("drop", handleDrop);
      }
    };
  }, []);

  // File icon mapping
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "image":
        return <Image size={20} />;
      case "document":
        return <FileText size={20} />;
      case "archive":
        return <Archive size={20} />;
      default:
        return <File size={20} />;
    }
  };

  // Optimized file selection handler
  const handleFileSelect = useCallback(
    (file) => {
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        return;
      }

      const extension = file.name.split(".").pop().toLowerCase();
      const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
      const documentExtensions = ["pdf", "doc", "docx", "txt", "rtf"];
      const archiveExtensions = ["zip", "rar", "7z"];

      let detectedFileType = "other";
      if (imageExtensions.includes(extension)) detectedFileType = "image";
      else if (documentExtensions.includes(extension))
        detectedFileType = "document";
      else if (archiveExtensions.includes(extension))
        detectedFileType = "archive";

      setFileType(detectedFileType);
      setFileName(file.name);
      setSelectedFile(file);

      if (detectedFileType === "image") {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    },
    [MAX_FILE_SIZE]
  );

  // Remove selected file
  const removeFile = () => {
    setFilePreview(null);
    setFileType(null);
    setFileName("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Initialize socket and fetch data - OPTIMIZED
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch authenticated user and users in parallel
        const [authResponse, usersResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/auth/check", {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }),
          axios.get("http://localhost:5001/api/messages/users", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 5000,
          }),
        ]);

        if (!isMounted) return;

        const currentUser = authResponse.data;
        setUserRole(currentUser.role || "user");

        // Set categories based on role
        const categories = ["all"];
        if (
          currentUser.role === "admin" ||
          currentUser.role === "super_admin"
        ) {
          categories.push(
            "broker",
            "support_agent",
            "seller",
            "renter",
            "buyer",
            "admin"
          );
        } else if (currentUser.role === "broker") {
          categories.push("clients", "broker", "support_agent");
        } else if (currentUser.role === "support_agent") {
          categories.push("admin", "broker", "buyer", "seller", "renter");
        } else {
          categories.push("admin", "broker", "support_agent");
        }
        setUserCategories(categories);

        // Process users
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          const processedUsers = usersResponse.data.map((userItem) => ({
            id: userItem.id.toString(),
            fullName: userItem.full_name || "Unknown User",
            userType: userItem.role || "user",
            profile_pic: userItem.profile_pic || null,
            email: userItem.email || "No email",
            lastMessageTime: userItem.last_message_time
              ? new Date(userItem.last_message_time)
              : new Date(0),
          }));

          setUsers(processedUsers);
          setHasFetchedUsers(true);
        }

        // Initialize socket connection (non-blocking)
        try {
          socket.current = io("http://localhost:5001", {
            auth: { token },
            transports: ["websocket", "polling"],
            timeout: 5000,
          });

          socket.current.on("connect", () => {
            console.log("✅ Socket connected");
          });

          socket.current.on("newMessage", handleNewMessage);
          socket.current.on("messageRead", handleMessageRead);

          socket.current.on("getOnlineUsers", (onlineUsersList) => {
            setOnlineUsers(onlineUsersList);
          });

          socket.current.on("userTyping", ({ userId, userName }) => {
            if (userId === selectedUser?.id) {
              setIsTyping(userName);
            }
          });

          socket.current.on("userStoppedTyping", () => {
            setIsTyping(null);
          });
        } catch (socketError) {
          console.warn("⚠️ Socket init failed:", socketError.message);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("💥 INITIALIZATION ERROR:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          toast.error(`Failed to initialize: ${error.message}`);
        }
      }
    };

    // Start initialization immediately
    initialize();

    return () => {
      isMounted = false;
      if (socket.current) {
        socket.current.off("newMessage", handleNewMessage);
        socket.current.off("messageRead", handleMessageRead);
        socket.current.disconnect();
      }
    };
  }, [navigate, handleNewMessage, handleMessageRead, selectedUser?.id]);

  // Fetch messages for selected user
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5001/api/messages/${selectedUser.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const formattedMessages = response.data.map((msg) => ({
          ...msg,
          id: msg.id || msg._id,
          senderId: msg.sender_id || msg.senderId,
          receiverId: msg.receiver_id || msg.receiverId,
          status: msg.status || "sent",
          created_at: msg.created_at || msg.timestamp,
          file: msg.file_url || msg.file,
          file_type: msg.file_type || msg.mime_type,
          file_name: msg.file_name || msg.original_filename,
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      }
    };

    fetchMessages();
  }, [selectedUser]);

  // Optimized scroll to bottom
  useEffect(() => {
    if (messageEndRef.current) {
      const shouldScroll = messagesContainerRef.current
        ? messagesContainerRef.current.scrollHeight - messagesContainerRef.current.scrollTop - messagesContainerRef.current.clientHeight < 100
        : true;
      
      if (shouldScroll) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  // OPTIMIZED: Send message with optimistic updates
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedFile) {
      toast.error("Please enter a message or select a file");
      return;
    }

    const userId = selectedUser?.id;
    if (!selectedUser || !userId) {
      toast.error("Please select a user to chat with");
      return;
    }

    // Create optimistic message immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      text: text.trim(),
      senderId: user?.id,
      receiverId: userId,
      status: "sending",
      created_at: new Date().toISOString(),
      file: selectedFile ? URL.createObjectURL(selectedFile) : null,
      file_type: fileType,
      file_name: fileName,
    };

    // Optimistically add to messages
    setMessages((prev) => [...prev, optimisticMessage]);
    
    // Clear input immediately
    const originalText = text;
    const originalFile = selectedFile;
    const originalFileType = fileType;
    const originalFileName = fileName;
    
    setText("");
    removeFile();

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("text", originalText.trim());

      if (originalFile) {
        formData.append("file", originalFile);
      }

      // Use Promise.race for timeout handling
      const sendPromise = axios.post(
        `http://localhost:5001/api/messages/send/${userId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const response = await Promise.race([sendPromise, timeoutPromise]);

      const newMessage = {
        ...response.data,
        id: response.data.id || Date.now().toString(),
        senderId: user?.id,
        status: "sent",
        created_at: new Date().toISOString(),
      };

      // Replace optimistic message with real one
      setMessages((prev) => 
        prev.map(msg => msg.id === tempId ? newMessage : msg)
      );

      if (socket.current) {
        socket.current.emit("newMessage", {
          ...newMessage,
          receiverId: userId,
        });
      }

      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Update optimistic message to show error
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: "error", error: true }
            : msg
        )
      );

      // Restore original input if error
      setText(originalText);
      if (originalFile) {
        setSelectedFile(originalFile);
        setFileType(originalFileType);
        setFileName(originalFileName);
        if (originalFileType === "image") {
          const reader = new FileReader();
          reader.onloadend = () => setFilePreview(reader.result);
          reader.readAsDataURL(originalFile);
        }
      }

      if (error.message === 'Request timeout') {
        toast.error("Message sending timed out. Please try again.");
      } else {
        toast.error("Failed to send message");
      }
    }
  };

  // Optimized typing indicator
  const handleTyping = useCallback(() => {
    if (!selectedUser?.id || !socket.current) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.current.emit("typing", {
      userId: user?.id,
      receiverId: selectedUser.id,
      userName: user?.firstName || user?.fullName || "User",
    });

    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit("stopTyping", { userId: user?.id });
    }, 1000);
  }, [user, selectedUser]);

  // Emoji handling
  const addEmoji = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // User selection
  const handleUserSelect = (userItem) => {
    console.log("User selected:", userItem);
    setLocalSelectedUser(userItem);
    setSelectedUser(userItem);
    if (isMobile) setShowSidebar(false);
    setSelectedMessages(new Set());
    setIsSelectMode(false);
  };

  // Context menu
  const handleRightClick = (e, messageId) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMessageId(messageId);
    setShowContextMenu(true);
  };

  // Message selection
  const toggleMessageSelection = (messageId) => {
    setSelectedMessages((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(messageId)) {
        newSelection.delete(messageId);
      } else {
        newSelection.add(messageId);
      }
      return newSelection;
    });
  };

  const clearSelection = () => {
    setSelectedMessages(new Set());
    setIsSelectMode(false);
  };

  const selectAllMessages = useCallback(() => {
    const allMessageIds = new Set(messages.map((msg) => msg.id));
    setSelectedMessages(allMessageIds);
  }, [messages]);

  // Message actions
  const copyMessage = async (messageId, messageText) => {
    if (!messageText) {
      toast.error("No text to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(messageText);
      setCopiedMessageId(messageId);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("Failed to copy");
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5001/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete message");
    }
  };

  // File handling
  const handleOpenFile = (fileUrl, fileType, fileName) => {
    if (fileType === "image") {
      setSelectedFile({ url: fileUrl, type: "image", name: fileName });
      setShowFileModal(true);
      // Reset image editor states
      setImageScale(1);
      setImageRotation(0);
      setAnnotations([]);
      setImageEditMode(false);
    } else {
      downloadFile(fileUrl, fileName);
    }
  };

  const downloadFile = (fileUrl, fileName) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Image Editor Functions
  useEffect(() => {
    if (
      showFileModal &&
      imageEditMode &&
      drawingCanvasRef.current &&
      imageCanvasRef.current
    ) {
      const canvas = drawingCanvasRef.current;
      const img = imageCanvasRef.current;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Redraw existing annotations
      annotations.forEach((annotation) => {
        if (annotation.type === "drawing") {
          ctx.strokeStyle = annotation.color;
          ctx.lineWidth = annotation.width;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
          annotation.points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        } else if (annotation.type === "text") {
          ctx.fillStyle = annotation.color;
          ctx.font = "20px Arial";
          ctx.fillText(annotation.text, annotation.x, annotation.y);
        }
      });
    }
  }, [showFileModal, imageEditMode, annotations]);

  const startDrawing = (e) => {
    if (!imageEditMode || !drawingCanvasRef.current) return;

    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentAnnotation({
      type: "drawing",
      points: [{ x, y }],
      color: drawingColor,
      width: drawingWidth,
    });
  };

  const draw = (e) => {
    if (!isDrawing || !currentAnnotation || !drawingCanvasRef.current) return;

    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentAnnotation((prev) => ({
      ...prev,
      points: [...prev.points, { x, y }],
    }));

    // Draw on canvas immediately
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = currentAnnotation.color;
    ctx.lineWidth = currentAnnotation.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const points = currentAnnotation.points;
    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentAnnotation) {
      setAnnotations((prev) => [...prev, currentAnnotation]);
      setCurrentAnnotation(null);
    }
    setIsDrawing(false);
  };

  const addTextAnnotation = () => {
    setShowTextInput(true);
  };

  const handleTextSubmit = () => {
    if (textInput.trim() && drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const newTextAnnotation = {
        type: "text",
        text: textInput.trim(),
        x: 50,
        y: 50,
        color: drawingColor,
        fontSize: 20,
      };

      setAnnotations((prev) => [...prev, newTextAnnotation]);

      // Draw text immediately on the drawing canvas
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = newTextAnnotation.color;
      ctx.font = `${newTextAnnotation.fontSize}px Arial`;
      ctx.fillText(
        newTextAnnotation.text,
        newTextAnnotation.x,
        newTextAnnotation.y
      );

      setTextInput("");
      setShowTextInput(false);
    }
  };

  const saveEditedImage = async () => {
    if (!selectedFile || !selectedUser) {
      toast.error("No file or user selected");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Create a new canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Use the existing image element instead of creating new Image()
      const originalImg = imageCanvasRef.current;
      if (!originalImg) {
        toast.error("No image found");
        return;
      }

      // Set canvas size to match image
      canvas.width = originalImg.naturalWidth || originalImg.width;
      canvas.height = originalImg.naturalHeight || originalImg.height;

      // Apply transformations
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((imageRotation * Math.PI) / 180);
      ctx.scale(imageScale, imageScale);
      ctx.drawImage(
        originalImg,
        -originalImg.width / 2,
        -originalImg.height / 2,
        originalImg.width,
        originalImg.height
      );
      ctx.restore();

      // Draw annotations on top
      annotations.forEach((annotation) => {
        if (annotation.type === "drawing" && annotation.points.length > 1) {
          ctx.strokeStyle = annotation.color;
          ctx.lineWidth = annotation.width;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
          for (let i = 1; i < annotation.points.length; i++) {
            ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
          }
          ctx.stroke();
        } else if (annotation.type === "text") {
          ctx.fillStyle = annotation.color;
          ctx.font = `${annotation.fontSize || 20}px Arial`;
          ctx.fillText(annotation.text, annotation.x, annotation.y);
        }
      });

      // Convert to blob and send
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            toast.error("Failed to create image");
            return;
          }

          const file = new File([blob], `edited-${selectedFile.name}`, {
            type: "image/png",
            lastModified: new Date().getTime(),
          });

          const formData = new FormData();
          formData.append("file", file);
          formData.append("text", "Edited image");

          console.log("Sending edited image...", file);

          const uploadResponse = await axios.post(
            `http://localhost:5001/api/messages/send/${selectedUser.id}`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
              timeout: 30000,
            }
          );

          console.log("Upload response:", uploadResponse);

          toast.success("Edited image sent successfully!");
          setShowFileModal(false);
          setImageEditMode(false);
          setAnnotations([]);
          setImageScale(1);
          setImageRotation(0);
        },
        "image/png",
        0.95
      );
    } catch (error) {
      console.error("Error saving edited image:", error);
      if (error.response) {
        console.error("Response error:", error.response.data);
        toast.error(
          `Server error: ${error.response.data.message || "Unknown error"}`
        );
      } else if (error.request) {
        toast.error("Network error - please check your connection");
      } else {
        toast.error(`Error: ${error.message}`);
      }
    }
  };
  const clearAnnotations = () => {
    setAnnotations([]);
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext("2d");
      ctx.clearRect(
        0,
        0,
        drawingCanvasRef.current.width,
        drawingCanvasRef.current.height
      );
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    let result = users;

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((userItem) => {
        const userType = userItem.userType?.toLowerCase() || "user";

        const roleMappings = {
          support_agent: "support_agent",
          super_admin: "admin",
          broker: "broker",
          seller: "seller",
          renter: "renter",
          buyer: "buyer",
          admin: "admin",
          user: "user",
        };

        const mappedType = roleMappings[userType] || userType;
        return mappedType === selectedCategory.toLowerCase();
      });
    }

    // Filter by online status
    if (showOnlineOnly) {
      result = result.filter((userItem) => onlineUsers.includes(userItem.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (userItem) =>
          userItem.fullName?.toLowerCase().includes(query) ||
          userItem.email?.toLowerCase().includes(query) ||
          userItem.userType?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [users, selectedCategory, showOnlineOnly, searchQuery, onlineUsers]);

  // User initials and color
  const getInitialsAndColor = (userItem) => {
    const name = userItem?.fullName || "Unknown User";
    const [firstName, lastName] = name.split(" ");
    const initials = `${firstName?.[0] || ""}${
      lastName?.[0] || ""
    }`.toUpperCase();

    const colors = {
      admin: "bg-red-500",
      broker: "bg-purple-500",
      tenant: "bg-blue-500",
      leaser: "bg-cyan-500",
      buyer: "bg-green-500",
      seller: "bg-yellow-500",
      support: "bg-orange-500",
      renter: "bg-pink-500",
      user: "bg-teal-500",
      support_agent: "bg-orange-500",
      super_admin: "bg-red-600",
      default: "bg-gray-500",
    };

    return {
      initials,
      colorClass: colors[userItem?.userType] || colors.default,
    };
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        clearSelection();
        setShowContextMenu(false);
        setShowEmojiPicker(false);
        setShowFileModal(false);
      }
      if (e.ctrlKey && e.key === "a" && selectedUser) {
        e.preventDefault();
        selectAllMessages();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser, selectAllMessages]);

  // Message style based on theme and sender
  const getMessageStyle = (message) => {
    const isOwn = message.senderId === user?.id;
    if (isOwn) {
      return theme === "dark"
        ? "bg-amber-600 text-white"
        : "bg-amber-500 text-white";
    }
    return theme === "dark"
      ? "bg-gray-700 text-white"
      : "bg-white text-gray-900 border border-gray-200";
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Render file message
  const renderFileMessage = (message) => {
    if (!message.file) return null;

    // For image files - show thumbnail
    if (message.file_type === "image") {
      return (
        <div
          className="mb-2 cursor-pointer"
          onClick={() =>
            handleOpenFile(message.file, message.file_type, message.file_name)
          }
        >
          <img
            src={message.file}
            alt={message.file_name || "Image"}
            className="max-w-48 max-h-48 rounded-lg object-cover hover:opacity-90 transition-opacity shadow-md"
          />
          <p className="text-xs opacity-70 mt-1">
            {message.file_name || "Image"}
          </p>
        </div>
      );
    }

    // For non-image files - show file icon and info
    return (
      <div
        className={`flex items-center gap-3 p-3 ${
          theme === "dark" ? "bg-white/10" : "bg-black/10"
        } rounded-lg mb-2 cursor-pointer`}
        onClick={() =>
          handleOpenFile(message.file, message.file_type, message.file_name)
        }
      >
        {getFileIcon(message.file_type || "other")}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">
            {message.file_name || "File"}
          </p>
          <p className="text-xs opacity-70">
            {message.file_type || "File"} • Click to download
          </p>
        </div>
        <Download size={16} />
      </div>
    );
  };

  // Custom Text Input Modal
  const CustomTextModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 backdrop-blur-sm">
      <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-2xl max-w-md w-full mx-4`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          Add Text to Image
        </h3>
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Enter your text here..."
          className={`w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            theme === "dark" 
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          }`}
          autoFocus
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleTextSubmit();
            }
          }}
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => {
              setShowTextInput(false);
              setTextInput("");
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Text
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div
        className={`flex h-[600px] ${
          theme === "dark"
            ? "bg-gray-900 text-white"
            : "bg-gray-50 text-gray-900"
        }`}
      >
        {/* Mobile sidebar toggle */}
        {isMobile && !showSidebar && (
          <button
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-40 p-2 bg-amber-500 text-white rounded-full shadow-lg md:hidden"
          >
            <Users size={20} />
          </button>
        )}

        {/* Sidebar */}
        <aside
          className={`${
            showSidebar ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed md:relative w-80 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg transition-transform duration-300 flex flex-col z-30 h-full`}
        >
          {/* Header */}
          <div
            className={`p-4 border-b flex-shrink-0 ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h1 className={`text-4xl font-bold ${amberGradientText}`}>
                Chatter
              </h1>
              <div className="flex items-center gap-2">
                {isMobile && (
                  <button
                    onClick={toggleSidebar}
                    className={`p-2 ${
                      theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-200"
                    } rounded-full`}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="mt-4 relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search users..."
                className={`w-full pl-10 pr-4 py-2 ${
                  theme === "dark"
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-900"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-1 text-sm ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  } rounded-lg transition-colors`}
                >
                  <Filter size={16} />
                  Filters
                </button>
                <button
                  onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    showOnlineOnly
                      ? "bg-amber-500 text-white"
                      : theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  Online
                </button>
              </div>
              <span className="text-xs opacity-70">
                {onlineUsers.length} online
              </span>
            </div>

            {/* Filter dropdown */}
            {showFilters && userCategories.length > 1 && (
              <div
                className={`mt-2 p-2 ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                } rounded-lg shadow-lg filters-container`}
              >
                <div className="flex flex-wrap gap-1">
                  {userCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-2 py-1 text-xs capitalize rounded transition-colors ${
                        selectedCategory === category
                          ? "bg-amber-500 text-white"
                          : theme === "dark"
                          ? "bg-gray-600 hover:bg-gray-500"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {category === "support_agent" ? "Support" : category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Users list */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 opacity-70 px-4">
                {searchQuery || selectedCategory !== "all" || showOnlineOnly
                  ? "No users match your filters"
                  : "No users found"}
                <br />
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setShowOnlineOnly(false);
                  }}
                  className="text-amber-500 hover:text-amber-600 text-sm mt-2"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="p-2">
                <div className="text-xs opacity-70 px-3 py-2 sticky top-0 bg-inherit z-10">
                  {filteredUsers.length} user
                  {filteredUsers.length !== 1 ? "s" : ""}
                  {selectedCategory !== "all" &&
                    ` in ${
                      selectedCategory === "support_agent"
                        ? "Support"
                        : selectedCategory
                    }`}
                  {showOnlineOnly && " (online)"}
                </div>
                {filteredUsers.map((userItem) => {
                  const isOnline = onlineUsers.includes(userItem.id);
                  const { initials, colorClass } =
                    getInitialsAndColor(userItem);
                  const isSelected = selectedUser?.id === userItem.id;

                  return (
                    <button
                      key={userItem.id}
                      onClick={() => handleUserSelect(userItem)}
                      className={`w-full p-3 flex items-center gap-3 rounded-lg mb-1 ${
                        isSelected
                          ? "bg-amber-500/20 border border-amber-500/30"
                          : theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-100"
                      } transition-colors border ${
                        isSelected
                          ? "border-amber-500/30"
                          : theme === "dark"
                          ? "border-gray-700"
                          : "border-transparent"
                      }`}
                    >
                      <div className="relative">
                        {userItem.profile_pic ? (
                          <img
                            src={userItem.profile_pic}
                            alt={userItem.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${colorClass}`}
                          >
                            {initials}
                          </div>
                        )}
                        {isOnline && (
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 ${
                              theme === "dark"
                                ? "border-gray-800"
                                : "border-white"
                            }`}
                          />
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {userItem.fullName}
                        </div>
                        <div className="text-sm opacity-70 truncate">
                          {userItem.userType} •{" "}
                          {isOnline ? "online" : "offline"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div
                className={`p-4 ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                } border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                } flex items-center justify-between flex-shrink-0`}
              >
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <button
                      onClick={toggleSidebar}
                      className={`p-2 ${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-200"
                      } rounded-full`}
                    >
                      <Users size={20} />
                    </button>
                  )}
                  <div className="relative">
                    {selectedUser.profile_pic ? (
                      <img
                        src={selectedUser.profile_pic}
                        alt={selectedUser.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          getInitialsAndColor(selectedUser).colorClass
                        }`}
                      >
                        {getInitialsAndColor(selectedUser).initials}
                      </div>
                    )}
                    {onlineUsers.includes(selectedUser.id) && (
                      <span
                        className={`absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 ${
                          theme === "dark" ? "border-gray-800" : "border-white"
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedUser.fullName}</h3>
                    <p className="text-sm opacity-70">
                      {onlineUsers.includes(selectedUser.id)
                        ? "online"
                        : "offline"}
                      {isTyping && (
                        <span className="ml-1 italic">is typing...</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSelectMode(!isSelectMode)}
                    className={`p-2 rounded-full transition-colors ${
                      isSelectMode
                        ? "bg-amber-500 text-white"
                        : theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <Check size={20} />
                  </button>
                  <button
                    className={`p-2 ${
                      theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-200"
                    } rounded-full`}
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className={`flex-1 overflow-y-auto p-4 space-y-2 ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-50"
                }`}
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center opacity-70">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                      <p>No messages yet</p>
                      <p className="text-sm">
                        Start a conversation with {selectedUser.fullName}
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === user?.id;
                    const isSelected = selectedMessages.has(message.id);
                    const isCopied = copiedMessageId === message.id;
                    const isSending = message.status === "sending";
                    const hasError = message.error;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                        onContextMenu={(e) => handleRightClick(e, message.id)}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-xl ${getMessageStyle(
                            message
                          )} transition-all ${
                            isSelected ? "ring-2 ring-amber-500" : ""
                          } ${isSending ? "opacity-70" : ""} ${
                            hasError ? "ring-2 ring-red-500" : ""
                          } ${isSelectMode ? "cursor-pointer" : ""}`}
                          onClick={() =>
                            isSelectMode && toggleMessageSelection(message.id)
                          }
                        >
                          {/* File message */}
                          {message.file && message.file_type === "image" && (
                            <div
                              className="mb-2 cursor-pointer"
                              onClick={() =>
                                handleOpenFile(
                                  message.file,
                                  message.file_type,
                                  message.file_name
                                )
                              }
                            >
                              <img
                                src={message.file}
                                alt={message.file_name || "Image"}
                                className="max-w-48 max-h-48 rounded-lg object-cover hover:opacity-90 transition-opacity shadow-md"
                              />
                              <p className="text-xs opacity-70 mt-1">
                                {message.file_name || "Image"}
                              </p>
                            </div>
                          )}
                          {message.file &&
                            message.file_type !== "image" &&
                            renderFileMessage(message)}

                          {/* Text message */}
                          {message.text && (
                            <div className="relative">
                              <p className="leading-relaxed break-words">
                                {message.text}
                                {isSending && (
                                  <span className="ml-2 text-xs opacity-70">
                                    (sending...)
                                  </span>
                                )}
                                {hasError && (
                                  <span className="ml-2 text-xs text-red-500">
                                    (failed)
                                  </span>
                                )}
                              </p>
                              {!isSelectMode && !isSending && !hasError && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyMessage(message.id, message.text);
                                  }}
                                  className={`absolute -right-8 top-0 p-1 rounded opacity-0 hover:opacity-100 transition-opacity ${
                                    isCopied
                                      ? "text-green-500"
                                      : "opacity-50 hover:opacity-100"
                                  }`}
                                >
                                  {isCopied ? (
                                    <Check size={14} />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Message time */}
                          <div className="text-xs opacity-70 mt-1 flex justify-end items-center gap-1">
                            {new Date(message.created_at).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                            {isOwn && !isSending && !hasError && (
                              <span>
                                {message.status === "read" ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Message input */}
              <div
                ref={dropZoneRef}
                className={`p-4 ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                } border-t ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                } flex-shrink-0 ${
                  isDragging
                    ? "ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : ""
                }`}
              >
                {/* File preview */}
                {(filePreview || fileType) && (
                  <div
                    className={`mb-3 flex items-center gap-2 p-3 ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    } rounded-lg`}
                  >
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 flex items-center justify-center ${
                          theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                        } rounded`}
                      >
                        {getFileIcon(fileType)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium break-words">
                        {fileName}
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className={`p-1 ${
                        theme === "dark"
                          ? "hover:bg-gray-600"
                          : "hover:bg-gray-200"
                      } rounded-full`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                  onInput={handleTyping}
                >
                  {/* Emoji picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 ${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-200"
                      } rounded-full`}
                    >
                      <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-50">
                        <EmojiPicker
                          onEmojiClick={addEmoji}
                          theme={theme === "dark" ? "dark" : "light"}
                          width={300}
                          height={400}
                        />
                      </div>
                    )}
                  </div>

                  {/* File inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />

                  {/* Action buttons */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className={`p-2 ${
                      theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-200"
                    } rounded-full`}
                  >
                    <Camera size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 ${
                      theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-200"
                    } rounded-full`}
                  >
                    <Paperclip size={20} />
                  </button>

                  {/* Text input */}
                  <input
                    type="text"
                    placeholder="Message..."
                    className={`flex-1 p-3 ${
                      theme === "dark"
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-900"
                    } rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />

                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={!text.trim() && !fileType}
                    className={`p-3 rounded-full transition-colors ${
                      !text.trim() && !fileType
                        ? "bg-amber-300 text-white cursor-not-allowed"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                    }`}
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Empty state
            <div
              className={`flex-1 flex items-center justify-center ${
                theme === "dark" ? "bg-gray-900" : "bg-gray-50"
              }`}
            >
              <div className="text-center p-8 max-w-md">
                <div
                  className={`w-20 h-20 ${amberGradient} rounded-full flex items-center justify-center mx-auto mb-6`}
                >
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <h2 className={`text-5xl font-bold mb-2 ${amberGradientText}`}>Chatter</h2>
                <p className="opacity-70 mb-6">
                  Select a chat to start messaging
                </p>
                <div
                  className={`p-4 ${
                    theme === "dark" ? "bg-amber-900/20" : "bg-amber-50"
                  } rounded-lg`}
                >
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-amber-200" : "text-amber-800"
                    }`}
                  >
                    <strong>Tip:</strong> Use search to find users quickly
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Context Menu */}
          {showContextMenu && (
            <div
              ref={contextMenuRef}
              className={`fixed z-50 ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              } shadow-lg rounded-lg p-1 min-w-32`}
              style={{
                left: contextMenuPosition.x,
                top: contextMenuPosition.y,
              }}
            >
              <button
                onClick={() =>
                  copyMessage(
                    contextMessageId,
                    messages.find((m) => m.id === contextMessageId)?.text
                  )
                }
                className={`flex items-center gap-2 p-2 ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                } rounded w-full text-sm`}
              >
                <Copy size={14} /> Copy
              </button>
              <button
                onClick={() => deleteMessage(contextMessageId)}
                className={`flex items-center gap-2 p-2 ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                } rounded w-full text-sm ${
                  theme === "dark" ? "text-red-400" : "text-red-600"
                }`}
              >
                <Trash size={14} /> Delete
              </button>
            </div>
          )}

          {/* Enhanced Image Editor Modal */}
          {showFileModal && selectedFile?.type === "image" && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-transparent rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden">
                <div
                  className={`p-4 flex justify-between items-center ${
                    theme === "dark" ? "text-white" : "text-white"
                  }`}
                >
                  <h3 className="font-semibold">{selectedFile.name}</h3>
                  <div className="flex gap-2">
                    {!imageEditMode ? (
                      <>
                        <button
                          onClick={() => setImageEditMode(true)}
                          className="flex items-center gap-2 px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setImageScale(1);
                            setImageRotation(0);
                          }}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          <RotateCw size={16} /> Reset
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-1">
                          <button
                            onClick={() =>
                              setImageScale((prev) => Math.max(0.5, prev - 0.1))
                            }
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                          >
                            <ZoomOut size={16} />
                          </button>
                          <span className="text-sm mx-2">
                            {Math.round(imageScale * 100)}%
                          </span>
                          <button
                            onClick={() =>
                              setImageScale((prev) => Math.min(3, prev + 0.1))
                            }
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                          >
                            <ZoomIn size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            setImageRotation((prev) => (prev + 90) % 360)
                          }
                          className="flex items-center gap-2 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                        >
                          <RotateCw size={16} /> Rotate
                        </button>
                        <button
                          onClick={addTextAnnotation}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                          <Type size={16} /> Text
                        </button>
                        <button
                          onClick={clearAnnotations}
                          className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                          <Trash size={16} /> Clear
                        </button>
                        <button
                          onClick={saveEditedImage}
                          className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          <Save size={16} /> Save & Send
                        </button>
                      </>
                    )}
                    <button
                      onClick={() =>
                        downloadFile(selectedFile.url, selectedFile.name)
                      }
                      className="flex items-center gap-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      <Download size={16} /> Download
                    </button>
                    <button
                      onClick={() => {
                        setShowFileModal(false);
                        setImageEditMode(false);
                        setAnnotations([]);
                        setImageScale(1);
                        setImageRotation(0);
                      }}
                      className="p-2 hover:bg-white/20 rounded transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-4 overflow-auto max-h-[calc(95vh-80px)] flex justify-center items-center">
                  <div className="relative">
                    <img
                      ref={imageCanvasRef}
                      src={selectedFile.url}
                      alt={selectedFile.name}
                      className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
                      style={{
                        transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                      }}
                    />
                    {imageEditMode && (
                      <canvas
                        ref={drawingCanvasRef}
                        className="absolute top-0 left-0 cursor-crosshair"
                        style={{
                          width: imageCanvasRef.current?.width || "100%",
                          height: imageCanvasRef.current?.height || "100%",
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    )}
                  </div>
                </div>

                {/* Drawing tools */}
                {imageEditMode && (
                  <div className="p-4 border-t border-white/20">
                    <div className="flex items-center gap-4 justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">Color:</span>
                        <input
                          type="color"
                          value={drawingColor}
                          onChange={(e) => setDrawingColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">Width:</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={drawingWidth}
                          onChange={(e) =>
                            setDrawingWidth(parseInt(e.target.value))
                          }
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Custom Text Input Modal */}
          {showTextInput && <CustomTextModal />}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ChatApp;