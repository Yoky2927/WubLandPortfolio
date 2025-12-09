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
  RotateCw,
  ZoomIn,
  ZoomOut,
  UserPlus,
  Users as GroupIcon,
  Settings,
  Crown,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ImageEditorModal from "./ImageEditorModal";

// Error Boundary Component
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

// Message Input Component
const MessageInput = ({
  theme,
  userRole,
  messageCount,
  limits,
  text,
  fileType,
  canSend,
  getUpgradeMessage,
  handleSendMessage,
  handleTyping,
  setText,
  addEmoji,
  setShowEmojiPicker,
  showEmojiPicker,
  fileInputRef,
  imageInputRef,
  handleFileSelect,
  removeFile,
  filePreview,
  fileName,
  getFileIcon,
}) => {
  const upgradeMessage = getUpgradeMessage();

  const handleFileInputChange = (e, inputType = "file") => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = "";
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    handleTyping();
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(e);
  };

  return (
    <div className="space-y-2">
      {/* Upgrade Warning/Banner */}
      {upgradeMessage && (
        <div
          className={`p-3 rounded-lg flex items-center gap-3 ${
            upgradeMessage.type === "blocked"
              ? "bg-red-100 border border-red-300 dark:bg-red-900/20 dark:border-red-800"
              : "bg-amber-100 border border-amber-300 dark:bg-amber-900/20 dark:border-amber-800"
          }`}
        >
          {upgradeMessage.type === "blocked" ? (
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          ) : (
            <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                upgradeMessage.type === "blocked"
                  ? "text-red-800 dark:text-red-200"
                  : "text-amber-800 dark:text-amber-200"
              }`}
            >
              {upgradeMessage.message}
            </p>
            {upgradeMessage.type === "warning" && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {upgradeMessage.remaining} messages remaining today
              </p>
            )}
          </div>
          <button
            onClick={() => window.open("/premium-upgrade", "_blank")}
            className="px-3 py-1 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Message Count Indicator */}
      {limits.free_messages !== null && (
        <div className="flex items-center justify-between text-xs px-2">
          <span className="text-gray-500 dark:text-gray-400">
            Messages today: {messageCount}/{limits.free_messages}
          </span>
          {limits.requires_upgrade && (
            <button
              onClick={() => window.open("/premium-upgrade", "_blank")}
              className="text-amber-500 hover:text-amber-600 flex items-center gap-1"
            >
              <Crown size={12} />
              Upgrade for unlimited
            </button>
          )}
        </div>
      )}

      {/* File Preview */}
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
            <p className="text-sm font-medium break-words">{fileName}</p>
          </div>
          <button
            onClick={removeFile}
            className={`p-1 ${
              theme === "dark" ? "hover:bg-gray-600" : "hover:bg-gray-200"
            } rounded-full`}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileInputChange(e, "file")}
        accept="*/*"
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileInputChange(e, "image")}
        accept="image/*"
        className="hidden"
      />

      {/* Message Input Form */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
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

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className={`p-2 ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          } rounded-full`}
        >
          <Camera size={20} />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          } rounded-full`}
        >
          <Paperclip size={20} />
        </button>

        <input
          type="text"
          placeholder={
            !canSend ? "Upgrade to send more messages..." : "Message..."
          }
          className={`flex-1 p-3 ${
            theme === "dark"
              ? "bg-gray-700 text-white"
              : "bg-gray-100 text-gray-900"
          } rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            !canSend ? "opacity-50 cursor-not-allowed" : ""
          }`}
          value={text}
          onChange={handleTextChange}
          disabled={!canSend}
        />

        <button
          type="submit"
          disabled={(!text.trim() && !fileType) || !canSend}
          className={`p-3 rounded-full transition-colors ${
            (!text.trim() && !fileType) || !canSend
              ? "bg-amber-300 text-white cursor-not-allowed"
              : "bg-amber-500 text-white hover:bg-amber-600"
          }`}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

// Group Management Modal Component
const GroupManagementModal = ({
  theme,
  selectedGroupForManagement,
  groupParticipants,
  availableUsersForGroup,
  newParticipants,
  isLoadingGroupDetails,
  onlineUsers,
  getInitialsAndColor,
  removeUserFromGroup,
  setNewParticipants,
  addUsersToGroup,
  setShowGroupManagement,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div
        className={`p-6 rounded-xl ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        } shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Manage Group: {selectedGroupForManagement?.name}
          </h3>
          <button
            onClick={() => setShowGroupManagement(false)}
            className={`p-1 rounded-full ${
              theme === "dark"
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-200 text-gray-500"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {isLoadingGroupDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="ml-2">Loading group details...</span>
          </div>
        ) : (
          <>
            {/* Current Participants */}
            <div className="mb-6">
              <h4
                className={`text-sm font-medium mb-3 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Current Participants ({groupParticipants.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {groupParticipants.length === 0 ? (
                  <div className="text-center py-4 opacity-70">
                    <p>No participants found</p>
                  </div>
                ) : (
                  groupParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {participant.profile_pic ? (
                          <img
                            src={participant.profile_pic}
                            alt={participant.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              getInitialsAndColor(participant).colorClass
                            }`}
                          >
                            {getInitialsAndColor(participant).initials}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium">
                            {participant.full_name}
                            {participant.participant_role === "admin" && (
                              <span className="ml-2 text-xs bg-amber-500 text-white px-2 py-1 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs opacity-70">
                            {participant.role || participant.userType}
                          </div>
                        </div>
                      </div>

                      {participant.participant_role !== "admin" && (
                        <button
                          onClick={() => removeUserFromGroup(participant.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove from group"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add New Participants */}
            <div className="flex-1 overflow-y-auto">
              <h4
                className={`text-sm font-medium mb-3 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Add New Participants ({newParticipants.size} selected)
              </h4>

              {availableUsersForGroup.length > 0 ? (
                <div className="space-y-2">
                  {availableUsersForGroup.map((userItem) => (
                    <div
                      key={userItem.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                        newParticipants.has(userItem.id)
                          ? "bg-amber-500/20 border border-amber-500/30"
                          : theme === "dark"
                          ? "hover:bg-gray-700 border border-gray-600"
                          : "hover:bg-gray-100 border border-gray-200"
                      }`}
                      onClick={() => {
                        setNewParticipants((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(userItem.id)) {
                            newSet.delete(userItem.id);
                          } else {
                            newSet.add(userItem.id);
                          }
                          return newSet;
                        });
                      }}
                    >
                      <div className="relative">
                        {userItem.profile_pic ? (
                          <img
                            src={userItem.profile_pic}
                            alt={userItem.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                              getInitialsAndColor(userItem).colorClass
                            }`}
                          >
                            {getInitialsAndColor(userItem).initials}
                          </div>
                        )}
                        {onlineUsers.includes(userItem.id) && (
                          <span
                            className={`absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 ${
                              theme === "dark"
                                ? "border-gray-800"
                                : "border-white"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {userItem.fullName}
                        </div>
                        <div className="text-xs opacity-70">
                          {userItem.userType} •{" "}
                          {onlineUsers.includes(userItem.id)
                            ? "online"
                            : "offline"}
                        </div>
                      </div>
                      {newParticipants.has(userItem.id) && (
                        <Check size={16} className="text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 opacity-70">
                  <p>No users available to add</p>
                  <p className="text-sm">All users are already in this group</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <button
                onClick={() => setShowGroupManagement(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Close
              </button>
              <button
                onClick={addUsersToGroup}
                disabled={newParticipants.size === 0}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Selected Users
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Create Group Modal Component
const CreateGroupModal = ({
  theme,
  users,
  groupName,
  setGroupName,
  selectedGroupUsers,
  toggleGroupUserSelection,
  createGroup,
  setShowCreateGroup,
  getInitialsAndColor,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div
        className={`p-6 rounded-xl ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        } shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            Create New Group
          </h3>
          <button
            onClick={() => setShowCreateGroup(false)}
            className={`p-1 rounded-full ${
              theme === "dark"
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-200 text-gray-500"
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name..."
          className={`w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          }`}
        />

        <div className="flex-1 overflow-y-auto mb-4">
          <h4
            className={`text-sm font-medium mb-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Select Users ({selectedGroupUsers.size} selected)
          </h4>
          <div className="space-y-2">
            {users.map((userItem) => (
              <div
                key={userItem.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                  selectedGroupUsers.has(userItem.id)
                    ? "bg-amber-500/20 border border-amber-500/30"
                    : theme === "dark"
                    ? "hover:bg-gray-700 border border-gray-600"
                    : "hover:bg-gray-100 border border-gray-200"
                }`}
                onClick={() => toggleGroupUserSelection(userItem.id)}
              >
                <div className="relative">
                  {userItem.profile_pic ? (
                    <img
                      src={userItem.profile_pic}
                      alt={userItem.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        getInitialsAndColor(userItem).colorClass
                      }`}
                    >
                      {getInitialsAndColor(userItem).initials}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{userItem.fullName}</div>
                  <div className="text-xs opacity-70">{userItem.userType}</div>
                </div>
                {selectedGroupUsers.has(userItem.id) && (
                  <Check size={16} className="text-amber-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowCreateGroup(false)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={createGroup}
            disabled={!groupName.trim() || selectedGroupUsers.size === 0}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
};

// Chat Menu Component
const ChatMenu = ({
  theme,
  setShowCreateGroup,
  setIsSelectMode,
  clearSelection,
  setShowChatMenu,
}) => {
  return (
    <div
      className={`absolute top-12 right-4 z-50 ${
        theme === "dark" ? "bg-gray-800" : "bg-white"
      } shadow-lg rounded-lg p-2 min-w-48 border ${
        theme === "dark" ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <button
        onClick={() => {
          setShowCreateGroup(true);
          setShowChatMenu(false);
        }}
        className={`flex items-center gap-3 p-2 rounded-lg w-full text-left ${
          theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
        }`}
      >
        <GroupIcon size={18} />
        <span>Create Group Chat</span>
      </button>
      <button
        onClick={() => {
          setIsSelectMode(true);
          setShowChatMenu(false);
        }}
        className={`flex items-center gap-3 p-2 rounded-lg w-full text-left ${
          theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
        }`}
      >
        <Check size={18} />
        <span>Select Messages</span>
      </button>
      <button
        onClick={() => {
          clearSelection();
          setShowChatMenu(false);
        }}
        className={`flex items-center gap-3 p-2 rounded-lg w-full text-left ${
          theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
        }`}
      >
        <X size={18} />
        <span>Clear Selection</span>
      </button>
    </div>
  );
};

// Main ChatApp Component
const ChatApp = ({
  user,
  isChatMaximized = false,
  setIsChatMaximized = () => {},
  setSelectedUser = () => {},
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // State Management
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

  const [isDragging, setIsDragging] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState(new Set());
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [selectedGroupForManagement, setSelectedGroupForManagement] =
    useState(null);
  const [groupParticipants, setGroupParticipants] = useState([]);
  const [availableUsersForGroup, setAvailableUsersForGroup] = useState([]);
  const [newParticipants, setNewParticipants] = useState(new Set());
  const [isLoadingGroupDetails, setIsLoadingGroupDetails] = useState(false);
  const [userPrivileges, setUserPrivileges] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // Refs
  const messageEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const contextMenuRef = useRef(null);
  const dropZoneRef = useRef(null);

  const chatMenuRef = useRef(null);
  const socket = useRef(null);

  // Constants
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const amberGradient =
    "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600";
  const amberGradientText =
    "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent";

  // Chat limit configuration
  const chatLimitConfig = {
    premium: {
      free_messages: null,
      max_active_chats: null,
      requires_upgrade: false,
    },
    enterprise: {
      free_messages: null,
      max_active_chats: null,
      requires_upgrade: false,
    },
    admin: {
      free_messages: null,
      max_active_chats: null,
      requires_upgrade: false,
    },
    super_admin: {
      free_messages: null,
      max_active_chats: null,
      requires_upgrade: false,
    },
    internal_broker: {
      free_messages: null,
      max_active_chats: 100,
      requires_upgrade: false,
    },
    external_broker: {
      free_messages: null,
      max_active_chats: 50,
      requires_upgrade: false,
    },
    support_admin: {
      free_messages: null,
      max_active_chats: null,
      requires_upgrade: false,
    },
    support_lead: {
      free_messages: null,
      max_active_chats: null,
      requires_upgrade: false,
    },
    support_agent: {
      free_messages: null,
      max_active_chats: null,
      requires_upgrade: false,
    },
    seller: { free_messages: 10, max_active_chats: 3, requires_upgrade: true },
    buyer: { free_messages: 10, max_active_chats: 3, requires_upgrade: true },
    renter: { free_messages: 10, max_active_chats: 3, requires_upgrade: true },
    landlord: {
      free_messages: 10,
      max_active_chats: 5,
      requires_upgrade: true,
    },
    user: { free_messages: 5, max_active_chats: 2, requires_upgrade: true },
  };

  // Utility Functions
  const validateFileUrl = (url) => {
    if (!url) return null;

    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:")
    ) {
      return url;
    }

    if (url.startsWith("/")) {
      return `http://localhost:5001${url}`;
    }

    return `http://localhost:5001/uploads/${url}`;
  };

  const getInitialsAndColor = (userItem) => {
    const name = userItem?.fullName || userItem?.full_name || "Unknown User";
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
      colorClass:
        colors[userItem?.userType || userItem?.role] || colors.default,
    };
  };

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

  const canSendMessage = useCallback(() => {
    if (!userPrivileges) return true;

    const role = userRole;
    const privilegeTier = userPrivileges.privilege_tier;

    if (["premium", "enterprise"].includes(privilegeTier)) {
      return true;
    }

    const limits = chatLimitConfig[role] || chatLimitConfig.user;

    if (limits.free_messages === null) {
      return true;
    }

    return messageCount < limits.free_messages;
  }, [userPrivileges, userRole, messageCount]);

  const getUpgradeMessage = useCallback(() => {
    if (!userPrivileges) return null;

    const role = userRole;
    const privilegeTier = userPrivileges.privilege_tier;
    const limits = chatLimitConfig[role] || chatLimitConfig.user;

    if (!limits.requires_upgrade || limits.free_messages === null) {
      return null;
    }

    const remaining = limits.free_messages - messageCount;

    if (remaining <= 0) {
      return {
        type: "blocked",
        message: `You've used all your ${limits.free_messages} free messages. Upgrade to premium for unlimited chatting.`,
        remaining: 0,
      };
    }

    if (remaining <= 3) {
      return {
        type: "warning",
        message: `You have ${remaining} free messages left. Upgrade to premium for unlimited chatting.`,
        remaining,
      };
    }

    return null;
  }, [userPrivileges, userRole, messageCount]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    let result = users;

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

    if (showOnlineOnly) {
      result = result.filter((userItem) => onlineUsers.includes(userItem.id));
    }

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

  // API Functions
  const fetchUserPrivileges = async () => {
    try {
      const token = localStorage.getItem("token");

      const authResponse = await axios.get(
        "http://localhost:5000/api/auth/check",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const currentUser = authResponse.data;
      setUserRole(currentUser.role || "user");
      setUserPrivileges({
        role: currentUser.role,
        privilege_tier: currentUser.privilege_tier || "basic",
      });

      try {
        const messageCountResponse = await axios.get(
          "http://localhost:5001/api/messages/today-count",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessageCount(messageCountResponse.data.count || 0);
      } catch (error) {
        console.log("Message count endpoint not available, using default");
        setMessageCount(0);
      }
    } catch (error) {
      console.error("Error fetching user privileges:", error);
      setUserRole("user");
      setUserPrivileges({ role: "user", privilege_tier: "basic" });
      setMessageCount(0);
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔄 Fetching groups...");

      const response = await axios.get(
        "http://localhost:5001/api/messages/groups/list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Groups fetched successfully:", response.data);
      setGroups(response.data);
    } catch (error) {
      console.error("❌ Error fetching groups:", error);
      if (error.response?.status === 404) {
        console.log("Groups endpoint not available yet");
        setGroups([]);
      } else {
        toast.error("Failed to load groups");
      }
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      console.log(`📨 Fetching messages for group: ${groupId}`);

      const response = await axios.get(
        `http://localhost:5001/api/messages/groups/${groupId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formattedMessages = response.data.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        text: msg.text,
        file: msg.file_url,
        file_url: msg.file_url,
        file_type: msg.file_type,
        file_name: msg.file_name,
        status: msg.status || "sent",
        created_at: msg.created_at,
        sender_name:
          `${msg.first_name || ""} ${msg.last_name || ""}`.trim() ||
          "Unknown User",
        sender_profile_pic: msg.profile_pic,
        isGroup: true,
        groupId: groupId,
        message_type: msg.message_type,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("❌ Error fetching group messages:", error);
      toast.error("Failed to load group messages");
    }
  };

  const openGroupManagement = async (group) => {
    console.log("🔄 Opening group management for:", group);

    try {
      setIsLoadingGroupDetails(true);
      setSelectedGroupForManagement(group);

      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5001/api/messages/groups/${group.id}/details`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const participants = Array.isArray(response.data.participants)
        ? response.data.participants
        : [];

      setGroupParticipants(participants);

      const availableUsers = users.filter(
        (user) =>
          !participants.some((participant) => participant.id === user.id)
      );
      setAvailableUsersForGroup(availableUsers);

      setShowGroupManagement(true);
    } catch (error) {
      console.error("❌ Error in openGroupManagement:", error);
      console.error("❌ Error details:", error.response?.data);
      toast.error("Failed to load group details");
    } finally {
      setIsLoadingGroupDetails(false);
    }
  };

  const addUsersToGroup = async () => {
    if (newParticipants.size === 0) {
      toast.error("Please select at least one user to add");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5001/api/messages/groups/${selectedGroupForManagement.id}/add-users`,
        {
          userIds: Array.from(newParticipants),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Users added to group successfully!");
      await openGroupManagement(selectedGroupForManagement);
      setNewParticipants(new Set());
      await fetchGroups();
    } catch (error) {
      console.error("❌ Error adding users to group:", error);
      toast.error("Failed to add users to group");
    }
  };

  const removeUserFromGroup = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this user from the group?"
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5001/api/messages/groups/${selectedGroupForManagement.id}/remove-user`,
        {
          userId: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("User removed from group");
      await openGroupManagement(selectedGroupForManagement);
      await fetchGroups();
    } catch (error) {
      console.error("❌ Error removing user from group:", error);
      toast.error("Failed to remove user from group");
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedGroupUsers.size === 0) {
      toast.error("Please enter a group name and select at least one user");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      console.log("🔄 Creating group with:", {
        name: groupName,
        userIds: Array.from(selectedGroupUsers),
      });

      const response = await axios.post(
        "http://localhost:5001/api/messages/groups/create",
        {
          name: groupName,
          userIds: Array.from(selectedGroupUsers),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Group created successfully:", response.data);
      toast.success("Group created successfully!");
      await fetchGroups();
      setShowCreateGroup(false);
      setGroupName("");
      setSelectedGroupUsers(new Set());
      setActiveTab("groups");
    } catch (error) {
      console.error("❌ Error creating group:", error);
      if (error.response?.data?.error) {
        toast.error(`Failed to create group: ${error.response.data.error}`);
      } else {
        toast.error("Failed to create group");
      }
    }
  };

  const toggleGroupUserSelection = (userId) => {
    setSelectedGroupUsers((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(userId)) {
        newSelection.delete(userId);
      } else {
        newSelection.add(userId);
      }
      return newSelection;
    });
  };

  // Event Handlers
  const handleNewMessage = useCallback(
    (newMessage) => {
      console.log("📨 New message received:", newMessage);

      if (selectedUser && newMessage.conversation_id) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === newMessage.id);
          if (!exists) {
            const formattedMessage = {
              ...newMessage,
              id: newMessage.id,
              senderId: newMessage.sender_id,
              status: "delivered",
              created_at: newMessage.created_at,
              file: newMessage.file_url,
              file_url: newMessage.file_url,
              file_type: newMessage.file_type,
              file_name: newMessage.file_name,
              sender_name: newMessage.sender_name || "Unknown User",
              sender_profile_pic: newMessage.sender_profile_pic,
            };
            return [...prev, formattedMessage];
          }
          return prev;
        });

        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, lastMessageTime: new Date() } : u
          )
        );
      }
    },
    [selectedUser]
  );

  const handleMessageRead = useCallback((data) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === data.messageId ? { ...msg, status: "read" } : msg
      )
    );
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    // Check privilege limits
    if (!canSendMessage()) {
      const upgradeMessage = getUpgradeMessage();
      if (upgradeMessage) {
        toast.error(upgradeMessage.message);
        return;
      }
    }

    if (!text.trim() && !fileType) {
      toast.error("Please enter a message or select a file");
      return;
    }

    let receiverId = null;
    let isGroupMessage = false;

    if (selectedUser) {
      receiverId = selectedUser.id;
    } else if (selectedGroup) {
      receiverId = selectedGroup.id;
      isGroupMessage = true;
    } else {
      toast.error("Please select a user or group to chat with");
      return;
    }

    console.log("📤 Preparing to send message:", {
      receiverId,
      text: text.trim(),
      hasFile: !!fileType,
      fileName,
      filePreviewExists: !!filePreview,
      isGroupMessage,
    });

    // Create optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      text: text.trim(),
      senderId: user?.id,
      status: "sending",
      created_at: new Date().toISOString(),
      file: filePreview || null,
      file_url: filePreview || null,
      file_type: fileType,
      file_name: fileName,
      sender_name: user?.firstName || user?.fullName || "You",
      sender_profile_pic: user?.profilePic || null,
      isGroup: isGroupMessage,
      isOptimistic: true, // Mark as optimistic
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Store original values
    const originalText = text;
    const originalFileType = fileType;
    const originalFileName = fileName;
    const originalFilePreview = filePreview;

    // Clear UI state immediately for better UX
    setText("");
    setFilePreview(null);
    setFileType(null);
    setFileName("");

    try {
      const token = localStorage.getItem("token");

      // Create FormData
      const formData = new FormData();
      formData.append("text", originalText.trim());

      console.log("📦 Creating FormData:", {
        text: originalText.trim(),
        hasFileType: !!originalFileType,
        fileName: originalFileName,
      });

      // Get file from inputs - CRITICAL FIX
      let fileToSend = null;

      // Check ALL possible sources
      const checkFileInputs = () => {
        if (fileInputRef.current?.files?.[0]) {
          return fileInputRef.current.files[0];
        }
        if (imageInputRef.current?.files?.[0]) {
          return imageInputRef.current.files[0];
        }
        return null;
      };

      fileToSend = checkFileInputs();

      if (!fileToSend && originalFileType) {
        console.log(
          "⚠️ No file found in inputs, checking if we can create from base64"
        );

        // If we have base64 preview for image, try to create blob
        if (
          originalFilePreview &&
          originalFilePreview.startsWith("data:image")
        ) {
          try {
            console.log("🔄 Creating blob from base64 preview");

            // Convert base64 to blob (SIMPLIFIED - no File constructor)
            const base64Data = originalFilePreview.split(",")[1];
            const mimeType = originalFilePreview.split(";")[0].split(":")[1];

            const byteCharacters = atob(base64Data);
            const byteArrays = [];

            for (
              let offset = 0;
              offset < byteCharacters.length;
              offset += 512
            ) {
              const slice = byteCharacters.slice(offset, offset + 512);
              const byteNumbers = new Array(slice.length);

              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }

              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }

            const blob = new Blob(byteArrays, { type: mimeType });

            // Append blob directly (not as File object)
            formData.append(
              "file",
              blob,
              originalFileName || `image_${Date.now()}.png`
            );
            console.log("✅ Created blob from base64 preview");
          } catch (blobError) {
            console.error("❌ Failed to create blob:", blobError);
            toast.error("Failed to process image. Please try again.");

            // Restore state and show error
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
            setText(originalText);
            return;
          }
        } else {
          console.warn("❌ No file available to send");
          toast.error("File not found. Please select the file again.");

          // Restore state
          setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
          setText(originalText);
          return;
        }
      } else if (fileToSend) {
        // We have a file from inputs
        formData.append("file", fileToSend);
        console.log("✅ Using file from input:", fileToSend.name);
      }

      // Debug FormData
      console.log("🔍 FormData entries:");
      for (let pair of formData.entries()) {
        const [key, value] = pair;
        console.log(
          `${key}:`,
          value instanceof Blob
            ? `[Blob: ${value.type}, ${value.size} bytes]`
            : `"${value}"`
        );
      }

      // Determine endpoint
      let endpoint = "";
      if (isGroupMessage) {
        endpoint = `http://localhost:5001/api/messages/groups/${receiverId}/send`;
      } else {
        endpoint = `http://localhost:5001/api/messages/send/${receiverId}`;
      }

      console.log("📡 Sending to:", endpoint);

      // Send request
      const response = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(`📤 Upload progress: ${progress}%`);

            // Update optimistic message with progress
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tempId
                  ? { ...msg, progress, status: "uploading" }
                  : msg
              )
            );
          }
        },
      });

      console.log("✅ Server response:", response.data);

      // Replace optimistic message with real one
      const newMessage = {
        ...response.data,
        id: response.data.id,
        senderId: user?.id,
        status: "sent",
        created_at: new Date().toISOString(),
        sender_name: user?.firstName || user?.fullName || "You",
        sender_profile_pic: user?.profilePic || null,
        isGroup: isGroupMessage,
      };

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? newMessage : msg))
      );

      // Update message count
      setMessageCount((prev) => prev + 1);

      // Emit via socket
      if (socket.current) {
        socket.current.emit("newMessage", newMessage);
      }

      // Update user list for direct messages
      if (!isGroupMessage) {
        setUsers((prev) =>
          prev
            .map((u) =>
              u.id === receiverId ? { ...u, lastMessageTime: new Date() } : u
            )
            .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
        );
      }

      toast.success("Message sent!");

      // Scroll to bottom
      setTimeout(() => {
        if (messageEndRef.current) {
          messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("❌ Error sending message:", error);

      // Update optimistic message to error state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId ? { ...msg, status: "error", error: true } : msg
        )
      );

      // Restore input state for retry
      setText(originalText);
      if (originalFileType) {
        setFileType(originalFileType);
        setFileName(originalFileName);
        setFilePreview(originalFilePreview);
      }

      // Show appropriate error
      if (error.response?.status === 431) {
        toast.error("Request too large. Try sending a smaller file.");
      } else if (error.code === "ECONNABORTED") {
        toast.error("Upload timed out. Please try again.");
      } else if (error.response?.data?.error) {
        toast.error(`Failed: ${error.response.data.error}`);
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    }
  };

  const handleTyping = useCallback(() => {
    if ((!selectedUser?.id && !selectedGroup?.id) || !socket.current) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.current.emit("typing", {
      userId: user?.id,
      receiverId: selectedUser?.id || selectedGroup?.id,
      userName: user?.firstName || user?.fullName || "User",
      isGroup: !!selectedGroup,
    });

    typingTimeoutRef.current = setTimeout(() => {
      if (socket.current) {
        socket.current.emit("stopTyping", {
          userId: user?.id,
          receiverId: selectedUser?.id || selectedGroup?.id,
          isGroup: !!selectedGroup,
        });
      }
    }, 1000);
  }, [user, selectedUser, selectedGroup]);

  const addEmoji = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleUserOrGroupSelect = (item, type) => {
    if (type === "user") {
      setLocalSelectedUser(item);
      setSelectedUser(item);
      setSelectedGroup(null);
      setMessages([]);
    } else {
      setSelectedGroup(item);
      setLocalSelectedUser(null);
      setSelectedUser(null);
      setMessages([]);
      fetchGroupMessages(item.id);
    }

    if (isMobile) setShowSidebar(false);
    setSelectedMessages(new Set());
    setIsSelectMode(false);
    setShowChatMenu(false);
  };

  const handleRightClick = (e, messageId) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMessageId(messageId);
    setShowContextMenu(true);
  };

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

  const handleOpenFile = (fileUrl, fileType, fileName) => {
    console.log("🔗 Opening file:", {
      originalUrl: fileUrl,
      validatedUrl: validateFileUrl(fileUrl),
      fileType,
      fileName,
    });

    const validatedUrl = validateFileUrl(fileUrl);

    if (fileType === "image") {
      console.log("🖼️ Opening image modal with URL:", validatedUrl);

      // Open modal immediately
      setSelectedFile({
        url: validatedUrl,
        type: "image",
        name: fileName,
      });
      setShowFileModal(true);

      // Test the image in background to see if it loads
      const testImg = new Image();
      testImg.onerror = () => {
        console.log("⚠️ Image may not load properly, trying alternative URL");
        // Try alternative URL if the original fails
        const altUrl = validatedUrl.replace(/.jfif$/i, ".jpg");
        setSelectedFile((prev) => ({
          ...prev,
          url: altUrl,
        }));
      };
      testImg.src = validatedUrl;
    } else {
      console.log("📥 Downloading non-image file");
      downloadFile(validatedUrl, fileName);
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

  const handleFileSelect = useCallback(
    (file) => {
      if (!file) {
        console.log("❌ No file provided to handleFileSelect");
        return;
      }

      console.log("📁 File selected:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
        return;
      }

      // Determine file type based on extension AND mime type
      const extension = file.name.split(".").pop().toLowerCase();
      const fileTypeLower = file.type.toLowerCase();

      // Extended image extensions list including JFIF
      const imageExtensions = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "svg",
        "bmp",
        "ico",
        "tiff",
        "tif",
        "jfif",
        "jpe",
        "jif",
        "jfi", // JFIF formats
        "pjpeg",
        "pjp",
        "heic",
        "heif",
        "avif",
        "apng",
        "raw",
        "arw",
        "cr2",
        "nef",
        "orf",
        "sr2",
      ];

      // Image MIME types including JFIF
      const imageMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/pjpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "image/bmp",
        "image/x-icon",
        "image/tiff",
        "image/x-tiff",
        "image/jfif", // JFIF MIME type
        "image/pipeg", // JFIF alternative
        "image/heic",
        "image/heif",
        "image/avif",
        "image/apng",
      ];

      const documentExtensions = [
        "pdf",
        "doc",
        "docx",
        "txt",
        "rtf",
        "odt",
        "pages",
      ];
      const archiveExtensions = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"];

      // Check if it's an image by extension OR mime type
      let detectedFileType = "other";

      // First check by extension
      if (imageExtensions.includes(extension)) {
        detectedFileType = "image";
        console.log("✅ Detected as image by extension:", extension);
      }
      // Then check by MIME type
      else if (imageMimeTypes.includes(fileTypeLower)) {
        detectedFileType = "image";
        console.log("✅ Detected as image by MIME type:", fileTypeLower);
      }
      // Special handling for JFIF files without proper MIME type
      else if (
        fileTypeLower === "" &&
        (extension === "jfif" || extension === "jfi")
      ) {
        detectedFileType = "image";
        console.log("✅ Detected as JFIF image by extension");
      } else if (documentExtensions.includes(extension)) {
        detectedFileType = "document";
      } else if (archiveExtensions.includes(extension)) {
        detectedFileType = "archive";
      }

      console.log("📁 File type detected:", {
        extension,
        mimeType: file.type,
        detectedFileType,
      });

      setFileType(detectedFileType);
      setFileName(file.name);

      if (detectedFileType === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          console.log("✅ Image preview generated");
          setFilePreview(e.target.result);
        };
        reader.onerror = (error) => {
          console.error("❌ Error reading image file:", error);
          toast.error("Failed to preview image");
          setFilePreview(null);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    },
    [MAX_FILE_SIZE]
  );

  const removeFile = () => {
    console.log("🗑️ Removing file from UI");
    setFilePreview(null);
    setFileType(null);
    setFileName("");

    // Clear file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Render Functions
  const renderFileMessage = (message) => {
    const rawFileUrl = message.file || message.file_url;
    const fileUrl = validateFileUrl(rawFileUrl);
    const fileType = message.file_type;
    const fileName = message.file_name || "File";
    const isOptimistic = message.isOptimistic;

    if (!fileUrl && !isOptimistic) {
      return (
        <div
          className={`flex items-center gap-3 p-3 ${
            theme === "dark" ? "bg-red-900/20" : "bg-red-100"
          } rounded-lg mb-2`}
        >
          <File size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">{fileName}</p>
            <p className="text-xs opacity-70">File unavailable</p>
          </div>
        </div>
      );
    }

    // For optimistic messages or when we have a preview
    const displayUrl = isOptimistic ? message.file : fileUrl;

    if (fileType === "image") {
      return (
        <div className="mb-2">
          {/* Thumbnail image - shows as small preview */}
          <div className="relative inline-block group">
            <img
              src={displayUrl}
              alt={fileName}
              className="max-w-32 max-h-32 rounded-lg object-cover hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
              onClick={(e) => {
                e.stopPropagation(); // CRITICAL: Stop event from bubbling up
                if (!isOptimistic) {
                  console.log("🖼️ Image clicked:", {
                    fileUrl,
                    fileType,
                    fileName,
                  });
                  handleOpenFile(fileUrl, fileType, fileName);
                }
              }}
              onError={(e) => {
                console.error("❌ Image failed to load:", displayUrl);
                e.target.style.display = "none";
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />

            {/* Fallback when image fails */}
            <div
              className="hidden items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer"
              onClick={(e) => {
                e.stopPropagation(); // CRITICAL: Stop event from bubbling up
                if (!isOptimistic) {
                  handleOpenFile(fileUrl, fileType, fileName);
                }
              }}
            >
              <Image size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">{fileName}</p>
                <p className="text-xs opacity-70">Click to view</p>
              </div>
            </div>

            {/* Image overlay on hover */}
            {!isOptimistic && (
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation(); // CRITICAL: Stop event from bubbling up
                  if (!isOptimistic) {
                    console.log("🖼️ Overlay clicked");
                    handleOpenFile(fileUrl, fileType, fileName);
                  }
                }}
              >
                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded cursor-pointer">
                  Click to view
                </div>
              </div>
            )}
          </div>

          {/* File name below image */}
          {!message.text && (
            <p className="text-xs opacity-70 mt-1 truncate max-w-32">
              {fileName}
            </p>
          )}

          {/* Upload progress for optimistic messages */}
          {isOptimistic && message.progress && (
            <div className="mt-1">
              <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${message.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Uploading {message.progress}%
              </p>
            </div>
          )}
        </div>
      );
    }

    // Non-image files
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer ${
          theme === "dark"
            ? "bg-white/10 hover:bg-white/15"
            : "bg-black/5 hover:bg-black/10"
        } transition-colors`}
        onClick={(e) => {
          e.stopPropagation(); // CRITICAL: Stop event from bubbling up
          if (!isOptimistic) {
            handleOpenFile(fileUrl, fileType, fileName);
          }
        }}
      >
        {getFileIcon(fileType || "other")}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{fileName}</p>
          <p className="text-xs opacity-70">
            {fileType || "File"} •{" "}
            {!isOptimistic ? "Click to download" : "Uploading..."}
          </p>
        </div>
        {!isOptimistic && <Download size={16} />}
      </div>
    );
  };
  const renderMessageContent = (message) => {
    const isOwn = message.senderId === user?.id;
    const isSystem = message.message_type === "system";

    if (isSystem) {
      return (
        <div className="flex justify-center my-2">
          <div
            className={`inline-block px-4 py-2 rounded-full text-sm ${
              theme === "dark"
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {message.text}
          </div>
        </div>
      );
    }

    const hasFile = message.file || message.file_url;
    const hasRealText = message.text && message.text !== message.file_name;

    return (
      <div
        className={`max-w-[70%] p-3 rounded-xl ${getMessageStyle(
          message
        )} transition-all ${
          selectedMessages.has(message.id) ? "ring-2 ring-amber-500" : ""
        } ${message.status === "sending" ? "opacity-70" : ""} ${
          message.error ? "ring-2 ring-red-500" : ""
        }`}
        onClick={(e) => {
          // Only trigger selection mode if clicking on the message background
          // Not if clicking on the image or other interactive elements
          if (isSelectMode && !e.target.closest(".file-interactive")) {
            toggleMessageSelection(message.id);
          }
        }}
        onContextMenu={(e) => handleRightClick(e, message.id)}
      >
        {!isOwn && message.sender_name && (
          <div className="text-xs font-medium mb-1 opacity-80">
            {message.sender_name}
          </div>
        )}

        <div className="file-interactive">
          {hasFile && renderFileMessage(message)}
        </div>

        {hasRealText && (
          <div className="relative">
            <p className="leading-relaxed break-words">
              {message.text}
              {message.status === "sending" && (
                <span className="ml-2 text-xs opacity-70">(sending...)</span>
              )}
              {message.error && (
                <span className="ml-2 text-xs text-red-500">(failed)</span>
              )}
            </p>
            {!isSelectMode &&
              message.status !== "sending" &&
              !message.error && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyMessage(message.id, message.text);
                  }}
                  className={`absolute -right-8 top-0 p-1 rounded opacity-0 hover:opacity-100 transition-opacity ${
                    copiedMessageId === message.id
                      ? "text-green-500"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  {copiedMessageId === message.id ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              )}
          </div>
        )}

        <div className="text-xs opacity-70 mt-1 flex justify-end items-center gap-1">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {isOwn && message.status !== "sending" && !message.error && (
            <span>{message.status === "read" ? "✓✓" : "✓"}</span>
          )}
        </div>
      </div>
    );
  };

  // Effects
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && showSidebar && (selectedUser || selectedGroup)) {
        setShowSidebar(false);
      } else if (!mobile) {
        setShowSidebar(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showSidebar, selectedUser, selectedGroup]);

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
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters, showChatMenu]);

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

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        await fetchUserPrivileges();

        const usersResponse = await axios.get(
          "http://localhost:5001/api/messages/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 5000,
          }
        );

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

          const sortedUsers = processedUsers.sort((a, b) => {
            if (a.lastMessageTime && b.lastMessageTime) {
              return b.lastMessageTime - a.lastMessageTime;
            }
            if (a.lastMessageTime) return -1;
            if (b.lastMessageTime) return 1;
            return a.fullName.localeCompare(b.fullName);
          });

          setUsers(sortedUsers);
          setHasFetchedUsers(true);
        }

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

        await fetchGroups();
      } catch (error) {
        console.error("💥 INITIALIZATION ERROR:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          toast.error(`Failed to initialize: ${error.message}`);
        }
      }
    };

    initialize();

    return () => {
      if (socket.current) {
        socket.current.off("newMessage", handleNewMessage);
        socket.current.off("messageRead", handleMessageRead);
        socket.current.disconnect();
      }
    };
  }, [navigate, handleNewMessage, handleMessageRead, selectedUser?.id]);

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
          id: msg.id,
          senderId: msg.sender_id,
          status: msg.status || "sent",
          created_at: msg.created_at,
          file: msg.file_url,
          file_url: msg.file_url,
          file_type: msg.file_type,
          file_name: msg.file_name,
          sender_name: msg.sender_name || "Unknown User",
          sender_profile_pic: msg.sender_profile_pic,
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error("❌ Error fetching messages:", error);
        toast.error("Failed to load messages");
      }
    };

    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        clearSelection();
        setShowContextMenu(false);
        setShowEmojiPicker(false);
        setShowFileModal(false);
        setShowChatMenu(false);
        setShowCreateGroup(false);
        setShowGroupManagement(false);
      }
      if (e.ctrlKey && e.key === "a" && (selectedUser || selectedGroup)) {
        e.preventDefault();
        selectAllMessages();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser, selectedGroup, selectAllMessages]);

  return (
    <ErrorBoundary>
      <div
        className={`flex h-[875px] relative ${
          theme === "dark"
            ? "bg-gray-900 text-white"
            : "bg-gray-50 text-gray-900"
        }`}
      >
        {/* Modals */}
        {showCreateGroup && (
          <CreateGroupModal
            theme={theme}
            users={users}
            groupName={groupName}
            setGroupName={setGroupName}
            selectedGroupUsers={selectedGroupUsers}
            toggleGroupUserSelection={toggleGroupUserSelection}
            createGroup={createGroup}
            setShowCreateGroup={setShowCreateGroup}
            getInitialsAndColor={getInitialsAndColor}
          />
        )}
        {showGroupManagement && (
          <GroupManagementModal
            theme={theme}
            selectedGroupForManagement={selectedGroupForManagement}
            groupParticipants={groupParticipants}
            availableUsersForGroup={availableUsersForGroup}
            newParticipants={newParticipants}
            isLoadingGroupDetails={isLoadingGroupDetails}
            onlineUsers={onlineUsers}
            getInitialsAndColor={getInitialsAndColor}
            removeUserFromGroup={removeUserFromGroup}
            setNewParticipants={setNewParticipants}
            addUsersToGroup={addUsersToGroup}
            setShowGroupManagement={setShowGroupManagement}
          />
        )}

        {showFileModal && selectedFile?.type === "image" && (
          <ImageEditorModal
            theme={theme}
            selectedFile={selectedFile}
            onClose={() => {
              setShowFileModal(false);
              setSelectedFile(null);
            }}
            onSave={async (blob) => {
              try {
                const token = localStorage.getItem("token");
                const file = new File([blob], `edited-${selectedFile.name}`, {
                  type: "image/png",
                });

                const formData = new FormData();
                formData.append("file", file);
                formData.append("text", "Edited image");

                let endpoint = "";
                if (selectedGroup) {
                  endpoint = `http://localhost:5001/api/messages/groups/${selectedGroup.id}/send`;
                } else {
                  endpoint = `http://localhost:5001/api/messages/send/${selectedUser.id}`;
                }

                await axios.post(endpoint, formData, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                  },
                });

                toast.success("Edited image sent successfully!");
                setShowFileModal(false);
                setSelectedFile(null);
              } catch (error) {
                console.error("❌ Error sending edited image:", error);
                toast.error("Failed to send edited image");
              }
            }}
            onDownload={() => {
              downloadFile(selectedFile.url, selectedFile.name);
            }}
          />
        )}

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
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className={`p-2 ${
                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  } rounded-full`}
                  title="Create Group"
                >
                  <UserPlus size={20} />
                </button>
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

            {/* Tabs for Users/Groups */}
            <div className="mt-3 flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === "users"
                    ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("groups")}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === "groups"
                    ? "border-b-2 border-amber-500 text-amber-600 dark:text-amber-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Groups
              </button>
            </div>

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

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "users" ? (
              /* Users Tab */
              filteredUsers.length === 0 ? (
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
                        onClick={() =>
                          handleUserOrGroupSelect(userItem, "user")
                        }
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
              )
            ) : /* Groups Tab */
            groups.length === 0 ? (
              <div className="text-center py-8 opacity-70 px-4">
                <GroupIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No groups yet</p>
                <p className="text-sm mt-2">
                  Create a group to start group messaging
                </p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Create Group
                </button>
              </div>
            ) : (
              <div className="p-2">
                <div className="text-xs opacity-70 px-3 py-2 sticky top-0 bg-inherit z-10">
                  {groups.length} group{groups.length !== 1 ? "s" : ""}
                </div>
                {groups.map((group) => {
                  const isSelected = selectedGroup?.id === group.id;

                  return (
                    <div key={group.id} className="relative">
                      <button
                        onClick={() => handleUserOrGroupSelect(group, "group")}
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
                        <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                          <GroupIcon size={20} className="text-white" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {group.name}
                          </div>
                          <div className="text-sm opacity-70 truncate">
                            {group.participant_count ||
                              group.participants_count ||
                              groupParticipants.length ||
                              0}{" "}
                            members
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGroupManagement(group);
                        }}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
                          theme === "dark"
                            ? "text-gray-400 hover:text-white hover:bg-gray-600"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        } transition-colors`}
                        title="Manage Group"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          {selectedUser || selectedGroup ? (
            <>
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

                  {selectedUser ? (
                    // User chat header
                    <>
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
                              theme === "dark"
                                ? "border-gray-800"
                                : "border-white"
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
                    </>
                  ) : (
                    // Group chat header
                    <>
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                        <GroupIcon size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedGroup.name}</h3>
                        <p className="text-sm opacity-70">
                          Group •{" "}
                          {selectedGroup.participant_count ||
                            selectedGroup.participants_count ||
                            groupParticipants.length ||
                            0}{" "}
                          members
                          {isTyping && (
                            <span className="ml-1 italic">
                              someone is typing...
                            </span>
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 relative">
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
                    onClick={() => setShowChatMenu(!showChatMenu)}
                    className={`p-2 ${
                      theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-200"
                    } rounded-full`}
                  >
                    <MoreVertical size={20} />
                  </button>
                  {showChatMenu && (
                    <ChatMenu
                      theme={theme}
                      setShowCreateGroup={setShowCreateGroup}
                      setIsSelectMode={setIsSelectMode}
                      clearSelection={clearSelection}
                      setShowChatMenu={setShowChatMenu}
                    />
                  )}
                </div>
              </div>

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
                        {selectedUser
                          ? `Start a conversation with ${selectedUser.fullName}`
                          : `Start a conversation in ${selectedGroup?.name}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        {renderMessageContent(message)}
                      </div>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

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
                <MessageInput
                  theme={theme}
                  userRole={userRole}
                  messageCount={messageCount}
                  limits={chatLimitConfig[userRole] || chatLimitConfig.user}
                  text={text}
                  fileType={fileType}
                  canSend={canSendMessage()}
                  getUpgradeMessage={getUpgradeMessage}
                  handleSendMessage={handleSendMessage}
                  handleTyping={handleTyping}
                  setText={setText}
                  addEmoji={addEmoji}
                  setShowEmojiPicker={setShowEmojiPicker}
                  showEmojiPicker={showEmojiPicker}
                  fileInputRef={fileInputRef}
                  imageInputRef={imageInputRef}
                  handleFileSelect={handleFileSelect}
                  removeFile={removeFile}
                  filePreview={filePreview}
                  fileName={fileName}
                  getFileIcon={getFileIcon}
                />
              </div>
            </>
          ) : (
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
                <h2 className={`text-5xl font-bold mb-2 ${amberGradientText}`}>
                  Chatter
                </h2>
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
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ChatApp;