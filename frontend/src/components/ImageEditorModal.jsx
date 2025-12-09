import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Edit,
  Save,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Download,
  Trash,
  Type,
  Move,
  Undo,
  Redo,
  Palette,
  Check,
  Image as ImageIcon,
  Brush,
  SquareIcon,
  Circle as CircleIcon,
  MinusIcon,
  Eraser,
  Grid,
  Loader2,
  Maximize2,
} from "lucide-react";

const ImageEditorModal = ({
  theme,
  selectedFile,
  onClose,
  onSave,
  onDownload,
}) => {
  // State management
  const [imageEditMode, setImageEditMode] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [drawingColor, setDrawingColor] = useState("#FFA500");
  const [drawingWidth, setDrawingWidth] = useState(3);
  const [drawingMode, setDrawingMode] = useState("brush");
  const [annotations, setAnnotations] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState({ x: 100, y: 100 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showGrid, setShowGrid] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [lineCap, setLineCap] = useState("round");

  // Refs
  const containerRef = useRef(null);
  const textInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Drawing tools configuration
  const drawingTools = [
    { id: "brush", icon: <Brush size={20} />, name: "Brush" },
    { id: "line", icon: <MinusIcon size={20} />, name: "Line" },
    { id: "rectangle", icon: <SquareIcon size={20} />, name: "Rectangle" },
    { id: "circle", icon: <CircleIcon size={20} />, name: "Circle" },
    { id: "text", icon: <Type size={20} />, name: "Text" },
    { id: "move", icon: <Move size={20} />, name: "Move" },
    { id: "eraser", icon: <Eraser size={20} />, name: "Eraser" },
  ];

  // Color palette
  const colorPalette = [
    "#FFA500", "#FFB74D", "#FF9800", "#F57C00", "#FF8F00",
    "#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF",
    "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
  ];

  // Load image
  const loadImage = useCallback(() => {
    if (!selectedFile || !selectedFile.url) {
      setImageError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setImageError(false);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      console.log("✅ Image loaded:", {
        width: img.naturalWidth,
        height: img.naturalHeight,
        url: selectedFile.url
      });
      
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      
      imageRef.current = img;
      setImageLoaded(true);
      setIsLoading(false);
      
      // Update container size
      if (containerRef.current) {
        const container = containerRef.current;
        setContainerSize({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
      
      // Draw initial image
      drawImage();
    };
    
    img.onerror = (error) => {
      console.error("❌ Failed to load image:", error, "URL:", selectedFile.url);
      setImageError(true);
      setIsLoading(false);
      setImageLoaded(false);
    };
    
    img.src = selectedFile.url;
  }, [selectedFile]);

  // Draw image with annotations
  const drawImage = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas size to match container for crisp rendering
    if (containerRef.current) {
      const container = containerRef.current;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    // Calculate scale to fit image in container
    const containerWidth = canvas.width;
    const containerHeight = canvas.height;
    const imageWidth = img.naturalWidth;
    const imageHeight = img.naturalHeight;
    
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY, 1) * imageScale;
    
    // Calculate position to center image
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    const offsetX = (containerWidth - scaledWidth) / 2;
    const offsetY = (containerHeight - scaledHeight) / 2;
    
    // Save context state
    ctx.save();
    
    // Apply transformations
    ctx.translate(containerWidth / 2, containerHeight / 2);
    ctx.rotate((imageRotation * Math.PI) / 180);
    ctx.translate(-containerWidth / 2, -containerHeight / 2);
    
    // Draw image
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Draw annotations
    annotations.forEach((annotation) => {
      if (annotation.type === "eraser") {
        ctx.strokeStyle = "rgba(0,0,0,0)";
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.strokeStyle = annotation.color;
        ctx.fillStyle = annotation.color;
        ctx.globalCompositeOperation = "source-over";
      }
      
      ctx.lineWidth = annotation.width * scale;
      ctx.lineCap = annotation.lineCap || "round";
      
      switch (annotation.type) {
        case "brush":
        case "eraser":
          if (annotation.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(
              offsetX + annotation.points[0].x * scale,
              offsetY + annotation.points[0].y * scale
            );
            for (let i = 1; i < annotation.points.length; i++) {
              ctx.lineTo(
                offsetX + annotation.points[i].x * scale,
                offsetY + annotation.points[i].y * scale
              );
            }
            ctx.stroke();
          }
          break;
        case "line":
          ctx.beginPath();
          ctx.moveTo(
            offsetX + annotation.start.x * scale,
            offsetY + annotation.start.y * scale
          );
          ctx.lineTo(
            offsetX + annotation.end.x * scale,
            offsetY + annotation.end.y * scale
          );
          ctx.stroke();
          break;
        case "rectangle":
          ctx.beginPath();
          const rectWidth = (annotation.end.x - annotation.start.x) * scale;
          const rectHeight = (annotation.end.y - annotation.start.y) * scale;
          ctx.rect(
            offsetX + annotation.start.x * scale,
            offsetY + annotation.start.y * scale,
            rectWidth,
            rectHeight
          );
          ctx.stroke();
          break;
        case "circle":
          ctx.beginPath();
          const radius = Math.sqrt(
            Math.pow(annotation.end.x - annotation.start.x, 2) + 
            Math.pow(annotation.end.y - annotation.start.y, 2)
          ) * scale / 2;
          const centerX = offsetX + (annotation.start.x + annotation.end.x) * scale / 2;
          const centerY = offsetY + (annotation.start.y + annotation.end.y) * scale / 2;
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case "text":
          ctx.font = `${(annotation.fontSize || 24) * scale}px Arial`;
          ctx.fillText(
            annotation.text,
            offsetX + annotation.x * scale,
            offsetY + annotation.y * scale
          );
          break;
      }
      ctx.globalCompositeOperation = "source-over";
    });
    
    // Restore context
    ctx.restore();
  }, [imageLoaded, imageScale, imageRotation, annotations]);

  // Get canvas coordinates from mouse event
  const getCanvasCoordinates = (e) => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Mouse coordinates relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Canvas dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Image dimensions
    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;
    
    // Calculate scale
    const scaleX = canvasWidth / imageWidth;
    const scaleY = canvasHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY, 1) * imageScale;
    
    // Calculate scaled image dimensions
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    
    // Calculate offset to center image
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;
    
    // Adjust for rotation
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const rotation = (imageRotation * Math.PI) / 180;
    
    // Translate mouse coordinates to rotated space
    const relX = mouseX - centerX;
    const relY = mouseY - centerY;
    
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    
    const rotatedX = relX * cos - relY * sin + centerX;
    const rotatedY = relX * sin + relY * cos + centerY;
    
    // Convert to image coordinates
    const imageX = (rotatedX - offsetX) / scale;
    const imageY = (rotatedY - offsetY) / scale;
    
    // Clamp to image bounds
    return {
      x: Math.max(0, Math.min(imageWidth, imageX)),
      y: Math.max(0, Math.min(imageHeight, imageY))
    };
  };

  // Drawing functions
  const startDrawing = (e) => {
    if (!imageEditMode || !imageLoaded) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    if (drawingMode === "text") {
      setTextPosition({ x, y });
      setShowTextInput(true);
      setTimeout(() => textInputRef.current?.focus(), 100);
      return;
    }
    
    setIsDrawing(true);
    
    const newAnnotation = {
      type: drawingMode,
      color: drawingMode === "eraser" ? "#FFFFFF" : drawingColor,
      width: drawingWidth,
      lineCap,
      start: { x, y },
      end: { x, y },
      points: ["brush", "eraser"].includes(drawingMode) ? [{ x, y }] : []
    };
    
    setCurrentAnnotation(newAnnotation);
  };

  const draw = (e) => {
    if (!isDrawing || !currentAnnotation || !imageLoaded) return;
    
    const { x, y } = getCanvasCoordinates(e);
    
    const updatedAnnotation = { ...currentAnnotation };
    
    if (["brush", "eraser"].includes(drawingMode)) {
      updatedAnnotation.points = [...updatedAnnotation.points, { x, y }];
    } else {
      updatedAnnotation.end = { x, y };
    }
    
    setCurrentAnnotation(updatedAnnotation);
    
    // Redraw with updated annotation
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const img = imageRef.current;
      
      if (!ctx || !img) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate scale to fit image in container
      const containerWidth = canvas.width;
      const containerHeight = canvas.height;
      const imageWidth = img.naturalWidth;
      const imageHeight = img.naturalHeight;
      
      const scaleX = containerWidth / imageWidth;
      const scaleY = containerHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY, 1) * imageScale;
      
      // Calculate position to center image
      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;
      const offsetX = (containerWidth - scaledWidth) / 2;
      const offsetY = (containerHeight - scaledHeight) / 2;
      
      // Save context state
      ctx.save();
      
      // Apply transformations
      ctx.translate(containerWidth / 2, containerHeight / 2);
      ctx.rotate((imageRotation * Math.PI) / 180);
      ctx.translate(-containerWidth / 2, -containerHeight / 2);
      
      // Draw image
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Draw all annotations except current one
      annotations.forEach((annotation) => {
        if (annotation.type === "eraser") {
          ctx.strokeStyle = "rgba(0,0,0,0)";
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.strokeStyle = annotation.color;
          ctx.fillStyle = annotation.color;
          ctx.globalCompositeOperation = "source-over";
        }
        
        ctx.lineWidth = annotation.width * scale;
        ctx.lineCap = annotation.lineCap || "round";
        
        drawAnnotation(ctx, annotation, offsetX, offsetY, scale);
        ctx.globalCompositeOperation = "source-over";
      });
      
      // Draw current annotation
      if (updatedAnnotation.type === "eraser") {
        ctx.strokeStyle = "rgba(0,0,0,0)";
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.strokeStyle = updatedAnnotation.color;
        ctx.fillStyle = updatedAnnotation.color;
        ctx.globalCompositeOperation = "source-over";
      }
      
      ctx.lineWidth = updatedAnnotation.width * scale;
      ctx.lineCap = updatedAnnotation.lineCap || "round";
      
      drawAnnotation(ctx, updatedAnnotation, offsetX, offsetY, scale);
      ctx.globalCompositeOperation = "source-over";
      
      // Restore context
      ctx.restore();
    }
  };

  // Helper function to draw a single annotation
  const drawAnnotation = (ctx, annotation, offsetX, offsetY, scale) => {
    switch (annotation.type) {
      case "brush":
      case "eraser":
        if (annotation.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(
            offsetX + annotation.points[0].x * scale,
            offsetY + annotation.points[0].y * scale
          );
          for (let i = 1; i < annotation.points.length; i++) {
            ctx.lineTo(
              offsetX + annotation.points[i].x * scale,
              offsetY + annotation.points[i].y * scale
            );
          }
          ctx.stroke();
        }
        break;
      case "line":
        ctx.beginPath();
        ctx.moveTo(
          offsetX + annotation.start.x * scale,
          offsetY + annotation.start.y * scale
        );
        ctx.lineTo(
          offsetX + annotation.end.x * scale,
          offsetY + annotation.end.y * scale
        );
        ctx.stroke();
        break;
      case "rectangle":
        ctx.beginPath();
        const rectWidth = (annotation.end.x - annotation.start.x) * scale;
        const rectHeight = (annotation.end.y - annotation.start.y) * scale;
        ctx.rect(
          offsetX + annotation.start.x * scale,
          offsetY + annotation.start.y * scale,
          rectWidth,
          rectHeight
        );
        ctx.stroke();
        break;
      case "circle":
        ctx.beginPath();
        const radius = Math.sqrt(
          Math.pow(annotation.end.x - annotation.start.x, 2) + 
          Math.pow(annotation.end.y - annotation.start.y, 2)
        ) * scale / 2;
        const centerX = offsetX + (annotation.start.x + annotation.end.x) * scale / 2;
        const centerY = offsetY + (annotation.start.y + annotation.end.y) * scale / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "text":
        ctx.font = `${(annotation.fontSize || 24) * scale}px Arial`;
        ctx.fillText(
          annotation.text,
          offsetX + annotation.x * scale,
          offsetY + annotation.y * scale
        );
        break;
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentAnnotation) {
      // Save completed annotation
      if (["brush", "eraser"].includes(drawingMode) && currentAnnotation.points.length > 1) {
        setAnnotations(prev => [...prev, currentAnnotation]);
        setRedoStack([]);
      } else if (!["brush", "eraser"].includes(drawingMode) && 
                 currentAnnotation.start.x !== currentAnnotation.end.x && 
                 currentAnnotation.start.y !== currentAnnotation.end.y) {
        setAnnotations(prev => [...prev, currentAnnotation]);
        setRedoStack([]);
      }
      
      setCurrentAnnotation(null);
    }
    setIsDrawing(false);
  };

  // Text handling
  const handleTextSubmit = () => {
    if (textInput.trim() && imageLoaded) {
      const newTextAnnotation = {
        type: "text",
        text: textInput.trim(),
        x: textPosition.x,
        y: textPosition.y,
        color: drawingColor,
        fontSize: 24,
      };
      
      setAnnotations(prev => [...prev, newTextAnnotation]);
      setTextInput("");
      setShowTextInput(false);
      setRedoStack([]);
      drawImage();
    }
  };

  // Undo/Redo
  const undo = () => {
    if (annotations.length > 0) {
      const lastAnnotation = annotations[annotations.length - 1];
      setAnnotations(prev => prev.slice(0, -1));
      setRedoStack(prev => [...prev, lastAnnotation]);
      drawImage();
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const lastRedo = redoStack[redoStack.length - 1];
      setAnnotations(prev => [...prev, lastRedo]);
      setRedoStack(prev => prev.slice(0, -1));
      drawImage();
    }
  };

  // Clear all annotations
  const clearAnnotations = () => {
    if (window.confirm("Are you sure you want to clear all annotations?")) {
      setAnnotations([]);
      setRedoStack([]);
      drawImage();
    }
  };

  // Save edited image
  const saveEditedImage = async () => {
    try {
      if (!imageRef.current || !imageLoaded) {
        throw new Error("Image not loaded");
      }
      
      // Create a new canvas with original image dimensions
      const canvas = document.createElement("canvas");
      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;
      const ctx = canvas.getContext("2d");
      
      // Draw original image
      ctx.drawImage(imageRef.current, 0, 0);
      
      // Draw annotations at original scale
      annotations.forEach((annotation) => {
        if (annotation.type === "eraser") {
          ctx.strokeStyle = "rgba(0,0,0,0)";
          ctx.globalCompositeOperation = "destination-out";
        } else {
          ctx.strokeStyle = annotation.color;
          ctx.fillStyle = annotation.color;
          ctx.globalCompositeOperation = "source-over";
        }
        
        ctx.lineWidth = annotation.width;
        ctx.lineCap = annotation.lineCap || "round";
        
        switch (annotation.type) {
          case "brush":
          case "eraser":
            if (annotation.points.length > 1) {
              ctx.beginPath();
              ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
              for (let i = 1; i < annotation.points.length; i++) {
                ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
              }
              ctx.stroke();
            }
            break;
          case "line":
            ctx.beginPath();
            ctx.moveTo(annotation.start.x, annotation.start.y);
            ctx.lineTo(annotation.end.x, annotation.end.y);
            ctx.stroke();
            break;
          case "rectangle":
            ctx.beginPath();
            const rectWidth = annotation.end.x - annotation.start.x;
            const rectHeight = annotation.end.y - annotation.start.y;
            ctx.rect(annotation.start.x, annotation.start.y, rectWidth, rectHeight);
            ctx.stroke();
            break;
          case "circle":
            ctx.beginPath();
            const radius = Math.sqrt(
              Math.pow(annotation.end.x - annotation.start.x, 2) + 
              Math.pow(annotation.end.y - annotation.start.y, 2)
            ) / 2;
            const centerX = (annotation.start.x + annotation.end.x) / 2;
            const centerY = (annotation.start.y + annotation.end.y) / 2;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case "text":
            ctx.font = `${annotation.fontSize || 24}px Arial`;
            ctx.fillText(annotation.text, annotation.x, annotation.y);
            break;
        }
        ctx.globalCompositeOperation = "source-over";
      });
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob && onSave) {
          onSave(blob);
        }
      }, "image/png", 1.0);
      
    } catch (error) {
      console.error("❌ Error saving image:", error);
      alert("Failed to save image. Please try again.");
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setImageScale(prev => Math.min(5, prev + 0.1));
  };

  const zoomOut = () => {
    setImageScale(prev => Math.max(0.1, prev - 0.1));
  };

  const resetView = () => {
    setImageScale(1);
    setImageRotation(0);
  };

  // Fit image to view
  const fitToView = () => {
    if (!containerRef.current || !imageRef.current) return;
    
    const container = containerRef.current;
    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;
    
    const scaleX = container.clientWidth / imageWidth;
    const scaleY = container.clientHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    setImageScale(scale);
    setImageRotation(0);
  };

  // Effects
  useEffect(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    if (imageLoaded) {
      drawImage();
    }
  }, [imageLoaded, imageScale, imageRotation, annotations, drawImage]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        setContainerSize({
          width: container.clientWidth,
          height: container.clientHeight
        });
        if (imageLoaded) {
          drawImage();
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageLoaded, drawImage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowTextInput(false);
        setShowColorPicker(false);
      }
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
      if (e.key === "0") {
        e.preventDefault();
        resetView();
      }
      if (e.key === "f") {
        e.preventDefault();
        fitToView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  if (!selectedFile) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
      {/* Glass blur background */}
      <div 
        className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-black/70 via-transparent to-black/70"
        onClick={onClose}
      />
      
      {/* Modal container with glass effect */}
      <div className={`flex flex-col w-full max-w-7xl h-[90vh] rounded-2xl overflow-hidden z-10 ${
        theme === "dark" 
          ? "bg-gray-900/80 border border-gray-700/50 shadow-2xl" 
          : "bg-white/90 border border-gray-300/50 shadow-2xl"
      } backdrop-blur-md`}>
        
        {/* Header with glass effect */}
        <div className={`flex items-center justify-between p-4 border-b ${
          theme === "dark" 
            ? "bg-gray-900/50 border-gray-700/30" 
            : "bg-white/50 border-gray-300/30"
        } backdrop-blur-sm`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              theme === "dark" ? "bg-gray-800/50" : "bg-gray-100/50"
            }`}>
              <ImageIcon className={`w-5 h-5 ${
                theme === "dark" ? "text-amber-400" : "text-amber-600"
              }`} />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                {selectedFile.name}
              </h2>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                {imageEditMode ? "Editing mode" : "View mode"} • {imageDimensions.width}×{imageDimensions.height}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fitToView}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark" 
                  ? "hover:bg-gray-800/50 text-gray-300" 
                  : "hover:bg-gray-200/50 text-gray-600"
              }`}
              title="Fit to view"
            >
              <Maximize2 size={18} />
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-lg"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === "dark" 
                  ? "hover:bg-gray-800/50 text-gray-300" 
                  : "hover:bg-gray-200/50 text-gray-600"
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Tools */}
          {imageEditMode && (
            <div className={`w-64 p-4 border-r ${
              theme === "dark" 
                ? "bg-gray-900/30 border-gray-700/30" 
                : "bg-white/30 border-gray-300/30"
            } backdrop-blur-sm overflow-y-auto`}>
              
              <h3 className={`font-medium mb-4 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Drawing Tools
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {drawingTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setDrawingMode(tool.id)}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all backdrop-blur-sm ${
                      drawingMode === tool.id
                        ? "bg-amber-500/90 text-white shadow-lg"
                        : theme === "dark"
                        ? "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border border-gray-700/30"
                        : "bg-white/50 hover:bg-gray-100/50 text-gray-700 border border-gray-300/30"
                    }`}
                    title={tool.name}
                  >
                    <div className="mb-1">{tool.icon}</div>
                    <span className="text-xs mt-1">{tool.name}</span>
                  </button>
                ))}
              </div>

              {/* Color Picker */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-medium ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>Color</h3>
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={`p-2 rounded-lg ${
                      theme === "dark" 
                        ? "hover:bg-gray-800/50 text-gray-300" 
                        : "hover:bg-gray-200/50 text-gray-600"
                    }`}
                  >
                    <Palette size={16} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    theme === "dark" ? "bg-gray-800/50" : "bg-gray-100/50"
                  }`}>
                    <input
                      type="color"
                      value={drawingColor}
                      onChange={(e) => setDrawingColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={drawingColor}
                      onChange={(e) => setDrawingColor(e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                        theme === "dark"
                          ? "bg-gray-800/50 border-gray-700/50 text-white"
                          : "bg-white/50 border-gray-300/50 text-gray-900"
                      }`}
                    />
                  </div>
                </div>

                {showColorPicker && (
                  <div className={`p-3 rounded-lg mb-3 ${
                    theme === "dark" ? "bg-gray-800/50" : "bg-gray-100/50"
                  }`}>
                    <div className="grid grid-cols-6 gap-2">
                      {colorPalette.map((color) => (
                        <button
                          key={color}
                          onClick={() => setDrawingColor(color)}
                          className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                            drawingColor === color
                              ? "border-amber-500 shadow-lg"
                              : theme === "dark"
                              ? "border-gray-700/50"
                              : "border-gray-300/50"
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Brush Settings */}
              <div className="mb-6">
                <h3 className={`font-medium mb-3 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>Brush Settings</h3>
                <div className={`p-3 rounded-lg ${
                  theme === "dark" ? "bg-gray-800/50" : "bg-gray-100/50"
                }`}>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className={`text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Brush Size
                        </span>
                        <span className={`text-sm ${
                          theme === "dark" ? "text-amber-400" : "text-amber-600"
                        }`}>
                          {drawingWidth}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={drawingWidth}
                        onChange={(e) => setDrawingWidth(parseInt(e.target.value))}
                        className={`w-full h-2 rounded-lg ${
                          theme === "dark" 
                            ? "[&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-track]:bg-gray-700/50"
                            : "[&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-track]:bg-gray-300/50"
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`text-sm block mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>Line Style</label>
                      <div className="flex gap-2">
                        {["round", "square", "butt"].map((cap) => (
                          <button
                            key={cap}
                            onClick={() => setLineCap(cap)}
                            className={`px-3 py-2 text-sm rounded-lg capitalize transition-all ${
                              lineCap === cap
                                ? "bg-amber-500/90 text-white shadow-lg"
                                : theme === "dark"
                                ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                                : "bg-white/50 text-gray-700 hover:bg-gray-100/50"
                            }`}
                          >
                            {cap}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all backdrop-blur-sm ${
                    showGrid
                      ? "bg-amber-500/90 text-white shadow-lg"
                      : theme === "dark"
                      ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                      : "bg-white/50 text-gray-700 hover:bg-gray-100/50"
                  }`}
                >
                  <Grid size={16} />
                  {showGrid ? "Hide Grid" : "Show Grid"}
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={undo}
                    disabled={annotations.length === 0}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all backdrop-blur-sm ${
                      annotations.length === 0
                        ? "opacity-50 cursor-not-allowed"
                        : theme === "dark"
                        ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                        : "bg-white/50 text-gray-700 hover:bg-gray-100/50"
                    }`}
                  >
                    <Undo size={16} />
                    Undo
                  </button>
                  
                  <button
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all backdrop-blur-sm ${
                      redoStack.length === 0
                        ? "opacity-50 cursor-not-allowed"
                        : theme === "dark"
                        ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                        : "bg-white/50 text-gray-700 hover:bg-gray-100/50"
                    }`}
                  >
                    <Redo size={16} />
                    Redo
                  </button>
                </div>
                
                <button
                  onClick={clearAnnotations}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/90 text-white rounded-lg hover:bg-red-600/90 transition-all shadow-lg backdrop-blur-sm"
                >
                  <Trash size={16} />
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className={`p-3 border-b ${
              theme === "dark" 
                ? "bg-gray-900/30 border-gray-700/30" 
                : "bg-white/30 border-gray-300/30"
            } backdrop-blur-sm flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setImageEditMode(!imageEditMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all backdrop-blur-sm ${
                    imageEditMode
                      ? "bg-amber-500/90 text-white shadow-lg"
                      : theme === "dark"
                      ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                      : "bg-white/50 text-gray-700 hover:bg-gray-100/50"
                  }`}
                >
                  <Edit size={16} />
                  {imageEditMode ? "Exit Edit" : "Edit Image"}
                </button>

                {imageEditMode && (
                  <>
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 backdrop-blur-sm ${
                      theme === "dark" ? "bg-gray-800/50" : "bg-white/50"
                    }`}>
                      <button
                        onClick={zoomOut}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === "dark" 
                            ? "hover:bg-gray-700/50 text-gray-300" 
                            : "hover:bg-gray-200/50 text-gray-700"
                        }`}
                        title="Zoom Out"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <span className={`text-sm mx-2 min-w-[60px] text-center ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {Math.round(imageScale * 100)}%
                      </span>
                      <button
                        onClick={zoomIn}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === "dark" 
                            ? "hover:bg-gray-700/50 text-gray-300" 
                            : "hover:bg-gray-200/50 text-gray-700"
                        }`}
                        title="Zoom In"
                      >
                        <ZoomIn size={16} />
                      </button>
                    </div>

                    <button
                      onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all backdrop-blur-sm ${
                        theme === "dark"
                          ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                          : "bg-white/50 text-gray-700 hover:bg-gray-100/50"
                      }`}
                      title="Rotate 90°"
                    >
                      <RotateCw size={16} />
                      Rotate
                    </button>

                    <button
                      onClick={resetView}
                      className={`px-3 py-2 rounded-lg transition-all backdrop-blur-sm ${
                        theme === "dark"
                          ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                          : "bg-white/50 text-gray-700 hover:bg-gray-100/50"
                      }`}
                      title="Reset View (0)"
                    >
                      100%
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {imageEditMode && (
                  <button
                    onClick={saveEditedImage}
                    disabled={!imageLoaded || isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/90 text-white rounded-lg hover:bg-green-600/90 transition-all shadow-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={16} />
                    Save & Send
                  </button>
                )}
              </div>
            </div>

            {/* Canvas Area */}
            <div 
              ref={containerRef}
              className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{ cursor: imageEditMode ? (drawingMode === "text" ? "text" : "crosshair") : "default" }}
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className={`p-4 rounded-2xl backdrop-blur-md ${
                    theme === "dark" ? "bg-gray-900/50" : "bg-white/50"
                  }`}>
                    <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
                    <p className={`mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Loading image...
                    </p>
                  </div>
                </div>
              ) : imageError ? (
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className={`p-6 rounded-2xl backdrop-blur-md ${
                    theme === "dark" ? "bg-gray-900/50" : "bg-white/50"
                  }`}>
                    <p className={`text-lg font-medium ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                      Failed to load image
                    </p>
                    <p className={`text-sm mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {selectedFile.url}
                    </p>
                    <button
                      onClick={loadImage}
                      className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Retry Loading
                    </button>
                  </div>
                </div>
              ) : imageLoaded ? (
                <>
                  {/* Main canvas */}
                  <canvas
                    ref={canvasRef}
                    className="rounded-lg shadow-2xl"
                  />
                  
                  {/* Instructions Overlay */}
                  {imageEditMode && !isDrawing && !showTextInput && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                      <div className={`px-4 py-3 rounded-lg backdrop-blur-md shadow-lg ${
                        theme === "dark" 
                          ? "bg-gray-900/80 text-gray-300" 
                          : "bg-white/80 text-gray-700"
                      }`}>
                        <p className="text-sm font-medium">
                          {drawingMode === "brush" && "Click and drag to draw"}
                          {drawingMode === "line" && "Click and drag to draw a line"}
                          {drawingMode === "rectangle" && "Click and drag to draw a rectangle"}
                          {drawingMode === "circle" && "Click and drag to draw a circle"}
                          {drawingMode === "text" && "Click to add text"}
                          {drawingMode === "move" && "Click and drag to move"}
                          {drawingMode === "eraser" && "Click and drag to erase"}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          Press F to fit image • 0 to reset • Esc to cancel
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : null}

              {/* Text Input Modal */}
              {showTextInput && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
                  <div className={`p-4 rounded-xl shadow-2xl backdrop-blur-md ${
                    theme === "dark" ? "bg-gray-900/90" : "bg-white/90"
                  } border ${theme === "dark" ? "border-gray-700/50" : "border-gray-300/50"}`}>
                    <input
                      ref={textInputRef}
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text..."
                      className={`w-64 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                        theme === "dark"
                          ? "bg-gray-800/50 border-gray-700/50 text-white"
                          : "bg-white/50 border-gray-300/50 text-gray-900"
                      }`}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleTextSubmit();
                        }
                      }}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleTextSubmit}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2"
                      >
                        <Check size={16} />
                        Add Text
                      </button>
                      <button
                        onClick={() => {
                          setShowTextInput(false);
                          setTextInput("");
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          theme === "dark"
                            ? "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                            : "bg-white/50 text-gray-700 hover:bg-gray-200/50"
                        }`}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Status */}
        <div className={`p-3 border-t ${
          theme === "dark" 
            ? "bg-gray-900/30 border-gray-700/30" 
            : "bg-white/30 border-gray-300/30"
        } backdrop-blur-sm text-sm`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              <span className="flex items-center gap-1">
                <span className="opacity-70">Scale:</span>
                <span className="font-medium">{Math.round(imageScale * 100)}%</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="opacity-70">Rotation:</span>
                <span className="font-medium">{imageRotation}°</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="opacity-70">Annotations:</span>
                <span className="font-medium">{annotations.length}</span>
              </span>
              {imageDimensions.width > 0 && (
                <span className="flex items-center gap-1">
                  <span className="opacity-70">Size:</span>
                  <span className="font-medium">{imageDimensions.width}×{imageDimensions.height}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                {drawingMode === "brush" && <Brush size={14} />}
                {drawingMode === "line" && <MinusIcon size={14} />}
                {drawingMode === "rectangle" && <SquareIcon size={14} />}
                {drawingMode === "circle" && <CircleIcon size={14} />}
                {drawingMode === "text" && <Type size={14} />}
                {drawingMode === "move" && <Move size={14} />}
                {drawingMode === "eraser" && <Eraser size={14} />}
                <span className="font-medium">
                  {drawingMode.charAt(0).toUpperCase() + drawingMode.slice(1)}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <div 
                  className={`w-4 h-4 rounded border-2 ${
                    theme === "dark" ? "border-gray-600" : "border-gray-400"
                  }`}
                  style={{ backgroundColor: drawingColor }}
                />
                <span className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-600"}`}>
                  {drawingColor}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;