// frontend/src/components/BrokerDocuments.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { apiCall } from "../utils/api.endpoints";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Filter,
  Search,
  Folder,
  File,
  FileCheck,
  FileX,
  Shield,
  Lock,
  Globe,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  Printer,
  Send,
  Share2,
  Copy,
} from "lucide-react";
import { toast } from "react-hot-toast";

const BrokerDocuments = ({ brokerId, theme, user }) => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Document categories for Ethiopian context
  const documentCategories = [
    { value: "all", label: "All Documents", icon: Folder },
    { value: "deed", label: "Title Deeds", icon: FileCheck },
    { value: "id_card", label: "ID Cards", icon: User },
    { value: "sales_contract", label: "Sales Contracts", icon: FileText },
    { value: "lease_agreement", label: "Lease Agreements", icon: FileText },
    { value: "tax_clearance", label: "Tax Clearances", icon: Shield },
    { value: "survey", label: "Survey/Cadastral", icon: Globe },
    { value: "certificate", label: "Certificates", icon: FileCheck },
    { value: "permit", label: "Permits", icon: Shield },
    { value: "other", label: "Other Documents", icon: File },
  ];

  const documentStatuses = [
    { value: "all", label: "All Status", icon: Folder },
    { value: "draft", label: "Draft", icon: Clock, color: "text-yellow-500" },
    { value: "signed", label: "Signed", icon: CheckCircle, color: "text-green-500" },
    { value: "pending", label: "Pending Review", icon: AlertCircle, color: "text-orange-500" },
    { value: "rejected", label: "Rejected", icon: XCircle, color: "text-red-500" },
    { value: "archived", label: "Archived", icon: Archive, color: "text-gray-500" },
  ];

  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, [brokerId]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, filterType, filterStatus]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiCall('GET_BROKER_DOCUMENTS', { brokerId });
      
      if (response.success && response.data) {
        setDocuments(response.data);
        setFilteredDocuments(response.data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by document type
    if (filterType !== "all") {
      filtered = filtered.filter(doc => doc.document_type === filterType);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(doc => doc.status === filterStatus);
    }

    setFilteredDocuments(filtered);
  };

  const handleUploadDocument = async (formData) => {
    try {
      setUploading(true);
      const response = await apiCall('UPLOAD_DOCUMENT', {}, { data: formData });
      
      if (response.success) {
        toast.success("Document uploaded successfully!");
        setShowUploadModal(false);
        fetchDocuments();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await apiCall('DELETE_DOCUMENT', { id: documentId });
      
      if (response.success) {
        toast.success("Document deleted successfully!");
        setDocuments(documents.filter(doc => doc.id !== documentId));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleDownload = (document) => {
    if (document.document_url) {
      window.open(document.document_url, '_blank');
    } else {
      toast.error("Document URL not available");
    }
  };

  const handleShareDocument = async (document) => {
    try {
      // Generate shareable link
      const response = await apiCall('GENERATE_SHARE_LINK', { id: document.id });
      
      if (response.success && response.data.share_link) {
        // Copy to clipboard
        navigator.clipboard.writeText(response.data.share_link);
        toast.success("Share link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to generate share link");
    }
  };

  const getDocumentIcon = (type) => {
    const category = documentCategories.find(cat => cat.value === type);
    return category ? category.icon : File;
  };

  const getStatusIcon = (status) => {
    const statusObj = documentStatuses.find(s => s.value === status);
    return statusObj ? statusObj.icon : Clock;
  };

  const getStatusColor = (status) => {
    const statusObj = documentStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : "text-gray-500";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const UploadDocumentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`p-6 rounded-xl max-w-md w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Upload Document</h3>
          <button
            onClick={() => setShowUploadModal(false)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Document Type *</label>
            <select
              className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              defaultValue=""
            >
              <option value="">Select document type</option>
              {documentCategories
                .filter(cat => cat.value !== "all")
                .map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              placeholder="Enter document title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              rows="3"
              className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              placeholder="Enter document description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">File *</label>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-4">
                Drag & drop or click to select file
                <br />
                Max size: 10MB • PDF, JPG, PNG, DOCX
              </p>
              <button className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg">
                Select File
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPublic" className="rounded" />
            <label htmlFor="isPublic" className="text-sm">Make this document public</label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => setShowUploadModal(false)}
              className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              disabled={uploading}
              className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Document Vault</h2>
          <p className="text-gray-500">
            Manage all Ethiopian property documents, contracts, and legal files
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg font-semibold"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          
          <button
            onClick={fetchDocuments}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Documents</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
            <Folder className="w-8 h-8 text-amber-400" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Signed Contracts</p>
              <p className="text-2xl font-bold">
                {documents.filter(d => d.status === 'signed').length}
              </p>
            </div>
            <FileCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold">
                {documents.filter(d => d.status === 'pending').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Public Documents</p>
              <p className="text-2xl font-bold">
                {documents.filter(d => d.is_public).length}
              </p>
            </div>
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents by title, description, or type..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            >
              {documentCategories.map(cat => {
                const Icon = cat.icon;
                return (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                );
              })}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            >
              {documentStatuses.map(status => {
                const Icon = status.icon;
                return (
                  <option key={status.value} value={status.value} className={status.color}>
                    {status.label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No documents found</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg"
          >
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => {
            const DocIcon = getDocumentIcon(document.document_type);
            const StatusIcon = getStatusIcon(document.status);
            const statusColor = getStatusColor(document.status);
            
            return (
              <div key={document.id} className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <DocIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold line-clamp-1">{document.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                        <span className={`text-xs ${statusColor}`}>
                          {document.status?.charAt(0).toUpperCase() + document.status?.slice(1)}
                        </span>
                        {document.is_public && (
                          <Globe className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setSelectedDocument(selectedDocument?.id === document.id ? null : document)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {selectedDocument?.id === document.id && (
                      <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg border min-w-32 z-10 ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <button
                          onClick={() => handleDownload(document)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => setShowPreview(true)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                        <button
                          onClick={() => handleShareDocument(document)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {document.description || "No description provided"}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(document.created_at).toLocaleDateString()}
                    </span>
                    {document.file_size && (
                      <span>{formatFileSize(document.file_size)}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {document.property_id && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                        Property #{document.property_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && <UploadDocumentModal />}
      
      {/* Preview Modal */}
      {showPreview && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`p-6 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{selectedDocument.title}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className="font-semibold mb-2">Document Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p className="font-medium capitalize">{selectedDocument.document_type?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className={`font-medium ${getStatusColor(selectedDocument.status)}`}>
                      {selectedDocument.status?.charAt(0).toUpperCase() + selectedDocument.status?.slice(1)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Uploaded:</span>
                    <p>{new Date(selectedDocument.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Visibility:</span>
                    <p>{selectedDocument.is_public ? "Public" : "Private"}</p>
                  </div>
                </div>
              </div>
              
              {selectedDocument.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-300">{selectedDocument.description}</p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Document
                  </button>
                  <button
                    onClick={() => window.open(selectedDocument.document_url, '_blank')}
                    className="flex-1 py-2 bg-amber-400 hover:bg-amber-500 text-black rounded-lg flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Open in New Tab
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add missing icon components
const RefreshCw = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const MoreVertical = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

export default BrokerDocuments;