import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postsAPI, likesAPI, commentsAPI, uploadAPI, authAPI } from "../utils/api";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import CommentIcon from "@mui/icons-material/Comment";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import WarningIcon from "@mui/icons-material/Warning";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export default function Home() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openCommentModal, setOpenCommentModal] = useState(null);
  const [openEditCommentModal, setOpenEditCommentModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [commentMenuAnchor, setCommentMenuAnchor] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [newPost, setNewPost] = useState({ 
    imageFile: null, 
    imagePreview: null, 
    title: "", 
    caption: "", 
    location: "", 
    taggedPeople: [] 
  });
  const [editPost, setEditPost] = useState({ 
    imageFile: null, 
    imagePreview: null, 
    title: "", 
    caption: "", 
    location: "", 
    taggedPeople: [],
    existingImageUuid: null 
  });
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [expandedComments, setExpandedComments] = useState({});
  const [processing, setProcessing] = useState(false);
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const BACKEND_URL = API_BASE_URL.replace("/api", "");

  // Load posts from API
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (searchTerm = null, forceAllPosts = false) => {
    try {
      setLoading(true);
      setError("");
      // Determine search parameter
      let searchParam = "";
      
      // If forceAllPosts is true, always load all posts
      if (forceAllPosts || searchTerm === "") {
        searchParam = "";
      } else if (searchTerm && typeof searchTerm === "string" && searchTerm.trim()) {
        // Use provided search term
        searchParam = `?search=${encodeURIComponent(searchTerm.trim())}`;
      } else if (searchTerm === null && isSearchActive && postSearchQuery.trim()) {
        // Use state search term only if explicitly null and search is active
        searchParam = `?search=${encodeURIComponent(postSearchQuery.trim())}`;
      }
      
      const response = await postsAPI.getAll(searchParam);
      
      if (response.success) {
        // Transform backend data to match frontend structure
        const transformedPosts = response.data.map((post) => {
          // Construct image URL from UUID or use existing imageUrl
          let imageUrl = post.imageUrl;
          if (post.imageUuid && !imageUrl) {
            imageUrl = `${BACKEND_URL}/uploads/${post.imageUuid}`;
          } else if (post.imageUuid && !imageUrl.startsWith("http")) {
            imageUrl = `${BACKEND_URL}${post.imageUrl}`;
          }
          
          // Transform likes array to just IDs for easier comparison
          const likesArray = (post.likes || []).map((like) => {
            if (typeof like === "object" && like._id) {
              return like._id.toString();
            }
            return like.toString();
          });
          
          return {
            id: post._id,
            imageUuid: post.imageUuid,
            imageUrl: imageUrl,
            title: post.title || "",
            caption: post.caption || "",
            location: post.location || "",
            taggedPeople: (post.taggedPeople || []).map(tagged => ({
              id: tagged._id || tagged.id || tagged,
              name: tagged.name || "Unknown",
              email: tagged.email || "",
            })),
            mediaType: post.mediaType || "image",
            creatorId: post.creator._id || post.creator,
            creatorName: post.creator.name || "Unknown",
            createdAt: post.createdAt,
            likes: likesArray,
            comments: (post.comments || []).map((comment) => ({
              id: comment._id || comment,
              userId: comment.user?._id || comment.user || comment,
              userName: comment.user?.name || "Unknown",
              text: comment.text || comment,
              createdAt: comment.createdAt || new Date().toISOString(),
            })),
          };
        });
        setPosts(transformedPosts);
      }
    } catch (err) {
      setError(err.message || "Failed to load posts");
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create Post
  const handleCreatePost = async () => {
    if (!newPost.imageFile) {
      setError("Please select an image or video");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      
      // First, upload the media file
      const uploadResponse = await uploadAPI.uploadImage(newPost.imageFile);
      
      if (!uploadResponse.success) {
        throw new Error("Failed to upload file");
      }

      // Determine media type from file
      const mediaType = newPost.imageFile.type.startsWith("video/") ? "video" : "image";
      
      // Extract user IDs from tagged people
      const taggedPeopleIds = newPost.taggedPeople.map(person => person.id || person._id || person);
      
      // Then create the post with the media UUID and metadata
      const response = await postsAPI.create({
        imageUuid: uploadResponse.data.uuid,
        title: newPost.title.trim(),
        caption: newPost.caption.trim(),
        location: newPost.location.trim(),
        taggedPeople: taggedPeopleIds,
        mediaType: mediaType,
      });

      if (response.success) {
        await loadPosts(); // Reload posts to get updated data
        setNewPost({ imageFile: null, imagePreview: null, title: "", caption: "", location: "", taggedPeople: [] });
        setUserSearchQuery("");
        setSearchResults([]);
        setShowUserSearch(false);
        setOpenCreateModal(false);
      }
    } catch (err) {
      setError(err.message || "Failed to create post");
    } finally {
      setProcessing(false);
    }
  };

  // Edit Post
  const handleEditPost = async () => {
    try {
      setProcessing(true);
      setError("");
      
      let imageUuid = editPost.existingImageUuid;
      
      // If new image is selected, upload it first
      if (editPost.imageFile) {
        const uploadResponse = await uploadAPI.uploadImage(editPost.imageFile);
        if (!uploadResponse.success) {
          throw new Error("Failed to upload image");
        }
        imageUuid = uploadResponse.data.uuid;
        
        // Delete old image if it exists
        if (editPost.existingImageUuid) {
          try {
            await uploadAPI.deleteImage(editPost.existingImageUuid);
          } catch (err) {
            console.error("Error deleting old image:", err);
          }
        }
      }

      // Get media type from upload response or keep existing
      let mediaType = editPost.existingImageUuid ? undefined : "image";
      if (editPost.imageFile) {
        mediaType = editPost.imageFile.type.startsWith("video/") ? "video" : "image";
      }

      // Extract user IDs from tagged people
      const taggedPeopleIds = editPost.taggedPeople.map(person => person.id || person._id || person);

      const response = await postsAPI.update(editingPost.id, {
        ...(imageUuid && { imageUuid }),
        ...(mediaType && { mediaType }),
        title: editPost.title.trim(),
        caption: editPost.caption.trim(),
        location: editPost.location.trim(),
        taggedPeople: taggedPeopleIds,
      });

      if (response.success) {
        await loadPosts(); // Reload posts to get updated data
        setOpenEditModal(false);
        setEditingPost(null);
        setEditPost({ imageFile: null, imagePreview: null, title: "", caption: "", location: "", taggedPeople: [], existingImageUuid: null });
        setUserSearchQuery("");
        setSearchResults([]);
        setShowUserSearch(false);
      }
    } catch (err) {
      setError(err.message || "Failed to update post");
    } finally {
      setProcessing(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    try {
      setProcessing(true);
      setError("");
      const response = await postsAPI.delete(postId);

      if (response.success) {
        setPosts(posts.filter((p) => p.id !== postId));
        setOpenDeleteModal(null);
      }
    } catch (err) {
      setError(err.message || "Failed to delete post");
    } finally {
      setProcessing(false);
    }
  };

  // Like/Unlike Post
  const handleLike = async (postId) => {
    if (!user) {
      setError("Please login to like posts");
      return;
    }

    try {
      setError("");
      const response = await likesAPI.toggle(postId);

      if (response.success) {
        const updatedPost = response.data.post;
        
        // Transform likes array to just IDs for easier comparison
        const likesArray = (updatedPost.likes || []).map((like) => {
          if (typeof like === "object" && like._id) {
            return like._id.toString();
          }
          return like.toString();
        });
        
        // Construct image URL
        let imageUrl = updatedPost.imageUrl;
        if (updatedPost.imageUuid && !imageUrl) {
          imageUrl = `${BACKEND_URL}/uploads/${updatedPost.imageUuid}`;
        } else if (updatedPost.imageUuid && !imageUrl.startsWith("http")) {
          imageUrl = `${BACKEND_URL}${updatedPost.imageUrl}`;
        }
        
        const transformedPost = {
          id: updatedPost._id,
          imageUuid: updatedPost.imageUuid,
          imageUrl: imageUrl,
          caption: updatedPost.caption,
          mediaType: updatedPost.mediaType || "image",
          creatorId: updatedPost.creator._id || updatedPost.creator,
          creatorName: updatedPost.creator.name || "Unknown",
          createdAt: updatedPost.createdAt,
          likes: likesArray,
          comments: (updatedPost.comments || []).map((comment) => ({
            id: comment._id || comment,
            userId: comment.user?._id || comment.user || comment,
            userName: comment.user?.name || "Unknown",
            text: comment.text || comment,
            createdAt: comment.createdAt || new Date().toISOString(),
          })),
        };

        setPosts(posts.map((p) => (p.id === postId ? transformedPost : p)));
      }
    } catch (err) {
      setError(err.message || "Failed to like post");
    }
  };

  // Add Comment
  const handleAddComment = async (postId) => {
    if (!user) {
      setError("Please login to comment");
      return;
    }

    if (!commentText.trim()) {
      setError("Please enter a comment");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      const response = await commentsAPI.create({
        text: commentText,
        postId: postId,
      });

      if (response.success) {
        await loadPosts(); // Reload to get updated comments
        setCommentText("");
        setOpenCommentModal(null);
      }
    } catch (err) {
      setError(err.message || "Failed to add comment");
    } finally {
      setProcessing(false);
    }
  };

  // Edit Comment
  const handleEditComment = async () => {
    if (!editingComment || !commentText.trim()) {
      setError("Please enter a comment");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      const response = await commentsAPI.update(editingComment.id, {
        text: commentText,
      });

      if (response.success) {
        await loadPosts(); // Reload to get updated comments
        setCommentText("");
        setOpenEditCommentModal(false);
        setEditingComment(null);
      }
    } catch (err) {
      setError(err.message || "Failed to update comment");
    } finally {
      setProcessing(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      setProcessing(true);
      setError("");
      const response = await commentsAPI.delete(commentId);

      if (response.success) {
        await loadPosts(); // Reload to get updated comments
        setCommentMenuAnchor(null);
        setSelectedComment(null);
      }
    } catch (err) {
      setError(err.message || "Failed to delete comment");
    } finally {
      setProcessing(false);
    }
  };

  // Open Edit Comment Modal
  const openEditComment = (comment) => {
    setEditingComment(comment);
    setCommentText(comment.text);
    setOpenEditCommentModal(true);
    setCommentMenuAnchor(null);
    setSelectedComment(null);
  };

  // Handle Comment Menu
  const handleCommentMenuOpen = (event, comment) => {
    event.stopPropagation();
    setCommentMenuAnchor(event.currentTarget);
    setSelectedComment(comment);
  };

  const handleCommentMenuClose = () => {
    setCommentMenuAnchor(null);
    setSelectedComment(null);
  };

  // Handle media file selection (image or video)
  const handleImageSelect = (file, isEdit = false) => {
    if (!file) return;
    
    // Validate file type (image or video)
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      setError("Please select an image or video file");
      return;
    }
    
    // Validate file size (50MB for videos, 5MB for images)
    const maxSize = file.type.startsWith("video/") ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = file.type.startsWith("video/") ? 50 : 5;
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditPost({
          ...editPost,
          imageFile: file,
          imagePreview: reader.result,
        });
      } else {
        setNewPost({
          ...newPost,
          imageFile: file,
          imagePreview: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Edit Modal
  const openEdit = (post) => {
    setEditingPost(post);
    setEditPost({
      imageFile: null,
      imagePreview: post.imageUrl,
      title: post.title || "",
      caption: post.caption || "",
      location: post.location || "",
      taggedPeople: post.taggedPeople || [],
      existingImageUuid: post.imageUuid,
    });
    setOpenEditModal(true);
  };

  // Toggle Comments View
  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Search Users for Tagging
  const handleUserSearch = async (query, isEdit = false) => {
    setUserSearchQuery(query);
    
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowUserSearch(false);
      return;
    }

    try {
      const response = await authAPI.searchUsers(query);
      if (response.success) {
        // Filter out already tagged users and current user
        const taggedIds = isEdit 
          ? editPost.taggedPeople.map(p => String(p.id || p._id || p))
          : newPost.taggedPeople.map(p => String(p.id || p._id || p));
        
        const currentUserId = user ? String(user.id) : "";
        
        const filteredResults = response.data.filter(userObj => {
          const userId = String(userObj._id || userObj.id);
          return !taggedIds.includes(userId) && userId !== currentUserId;
        });
        
        setSearchResults(filteredResults);
        setShowUserSearch(filteredResults.length > 0);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchResults([]);
      setShowUserSearch(false);
    }
  };

  // Add Tagged User
  const addTaggedUser = (user, isEdit = false) => {
    const userObj = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
    };

    if (isEdit) {
      setEditPost({
        ...editPost,
        taggedPeople: [...editPost.taggedPeople, userObj],
      });
    } else {
      setNewPost({
        ...newPost,
        taggedPeople: [...newPost.taggedPeople, userObj],
      });
    }
    
    setUserSearchQuery("");
    setSearchResults([]);
    setShowUserSearch(false);
  };

  // Remove Tagged User
  const removeTaggedUser = (userId, isEdit = false) => {
    if (isEdit) {
      setEditPost({
        ...editPost,
        taggedPeople: editPost.taggedPeople.filter(p => (p.id || p._id) !== userId),
      });
    } else {
      setNewPost({
        ...newPost,
        taggedPeople: newPost.taggedPeople.filter(p => (p.id || p._id) !== userId),
      });
    }
  };

  // Search Posts
  const handleSearch = () => {
    if (!postSearchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }
    setIsSearchActive(true);
    loadPosts(postSearchQuery);
  };

  // Reset Search
  const handleResetSearch = () => {
    setIsSearchActive(false);
    setPostSearchQuery("");
    setError("");
    // Force load all posts by passing true to forceAllPosts
    loadPosts("", true);
  };

  // Format Date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Check if user liked the post
  const isLiked = (post) => {
    if (!user || !post.likes || post.likes.length === 0) return false;
    const userId = typeof user.id === "object" ? user.id._id || user.id : user.id;
    const userIdStr = userId.toString();
    
    return post.likes.some((likeId) => {
      const likeIdStr = typeof likeId === "object" ? (likeId._id || likeId).toString() : likeId.toString();
      return likeIdStr === userIdStr;
    });
  };

  // Check if user can edit post
  const canEdit = (post) => {
    if (!user || user.role !== "creator") return false;
    const postCreatorId = typeof post.creatorId === "object" ? post.creatorId._id || post.creatorId : post.creatorId;
    const userId = typeof user.id === "object" ? user.id._id || user.id : user.id;
    return postCreatorId.toString() === userId.toString();
  };

  if (loading) {
    return (
      <div className="homeContainer">
        <div className="topbar">
          <h1 className="brand">HomeRent</h1>
          <div className="topbarRight">
            {user ? (
              <>
                <span className="badge">{user.role}</span>
                <span className="muted">{user.name || user.email}</span>
                <button onClick={logout} className="btnGhost">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btnGhost" to="/login">
                  Login
                </Link>
                <Link className="btn" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="feedContainer" style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <CircularProgress />
        </div>
      </div>
    );
  }

  return (
    <div className="homeContainer">
      {/* Topbar */}
      <div className="topbar">
        <h1 className="brand">HomeRent</h1>
        <div className="topbarCenter" style={{ flex: 1, display: "flex", justifyContent: "center", margin: "0 20px", gap: "8px" }}>
          <input
            type="text"
            className="searchInput"
            placeholder="Search posts by title, description, location, or creator..."
            value={postSearchQuery}
            onChange={(e) => setPostSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            style={{
              flex: 1,
              maxWidth: "400px",
              padding: "8px 16px",
              border: "1px solid #dbdbdb",
              borderRadius: "8px",
              background: "#fafafa",
              fontSize: "14px",
              outline: "none",
              transition: "all 0.2s ease",
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={processing || !postSearchQuery.trim()}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              minWidth: "100px",
            }}
          >
            Search
          </Button>
          {isSearchActive && (
            <Button
              variant="outlined"
              onClick={handleResetSearch}
              disabled={processing}
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                minWidth: "100px",
              }}
            >
              Reset
            </Button>
          )}
        </div>
        <div className="topbarRight">
          {user ? (
            <>
              {user.role === "creator" && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateModal(true)}
                  className="createPostBtn"
                  disabled={processing}
                >
                  Create Post
                </Button>
              )}
              <span className="badge">{user.role}</span>
              <span className="muted">{user.name || user.email}</span>
              <button onClick={logout} className="btnGhost" disabled={processing}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btnGhost" to="/login">
                Login
              </Link>
              <Link className="btn" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="feedContainer" style={{ padding: "20px" }}>
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="feedContainer">
        {posts.length === 0 ? (
          <div className="emptyState">
            <Typography variant="h5" className="emptyText">
              {isSearchActive ? "No posts found matching your search" : "No posts yet"}
            </Typography>
            {user?.role === "creator" && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateModal(true)}
                className="createPostBtn"
                disabled={processing}
              >
                Create Your First Post
              </Button>
            )}
          </div>
        ) : (
          <div className="postsList">
            {posts.map((post) => {
              const postIsLiked = isLiked(post);
              const postCanEdit = canEdit(post);

              return (
                <div key={post.id} className="postCard">
                  {/* Post Header */}
                  <div className="postHeader">
                    <div className="postHeaderLeft">
                      <Avatar className="postAvatar">
                        {post.creatorName.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Typography className="postCreatorName">
                          {post.creatorName}
                        </Typography>
                        <Typography className="postDate">
                          {formatDate(post.createdAt)}
                        </Typography>
                      </div>
                    </div>
                    {postCanEdit && (
                      <div className="postActions">
                        <IconButton
                          size="small"
                          onClick={() => openEdit(post)}
                          className="editBtn"
                          disabled={processing}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setOpenDeleteModal(post.id)}
                          className="deleteBtn"
                          disabled={processing}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    )}
                  </div>

                  {/* Post Metadata */}
                  <div className="postCaption">
                    {post.title && (
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {post.title}
                      </Typography>
                    )}
                    {post.location && (
                      <Typography variant="body2" sx={{ color: "#8e8e8e", mb: 1 }}>
                        📍 {post.location}
                      </Typography>
                    )}
                    {post.taggedPeople && post.taggedPeople.length > 0 && (
                      <Typography variant="body2" sx={{ color: "#8e8e8e", mb: 1 }}>
                        👥 Tagged: {post.taggedPeople.map((person, index) => (
                          <span key={index}>
                            {typeof person === 'object' ? (person.name || person.email) : person}
                            {index < post.taggedPeople.length - 1 && ", "}
                          </span>
                        ))}
                      </Typography>
                    )}
                    {post.caption && (
                      <Typography sx={{ mt: post.title || post.location || (post.taggedPeople && post.taggedPeople.length > 0) ? 1 : 0 }}>
                        {post.caption}
                      </Typography>
                    )}
                  </div>

                  {/* Post Media (Image or Video) */}
                  {(() => {
                    // Construct the media URL properly
                    let mediaUrl = post.imageUrl;
                    if (!mediaUrl && post.imageUuid) {
                      // If no URL, we need to find the file with extension
                      // For now, try common extensions
                      const extensions = post.mediaType === "video" 
                        ? [".mp4", ".webm", ".mov", ".avi"] 
                        : [".jpg", ".jpeg", ".png", ".gif", ".webp"];
                      // We'll use the backend URL which should handle this
                      mediaUrl = `${BACKEND_URL}/uploads/${post.imageUuid}`;
                    } else if (mediaUrl && !mediaUrl.startsWith("http")) {
                      // Ensure proper URL construction
                      if (mediaUrl.startsWith("/uploads/")) {
                        mediaUrl = `${BACKEND_URL}${mediaUrl}`;
                      } else if (mediaUrl.startsWith("/")) {
                        mediaUrl = `${BACKEND_URL}${mediaUrl}`;
                      } else {
                        mediaUrl = `${BACKEND_URL}/${mediaUrl}`;
                      }
                    }
                    
                    if (post.mediaType === "video") {
                      return (
                        <div 
                          key={`video-container-${post.id}`}
                          style={{ 
                            width: "100%", 
                            backgroundColor: "#000", 
                            minHeight: "400px", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            position: "relative" 
                          }}
                        >
                          <video
                            key={`video-${post.id}-${post.imageUuid}`}
                            src={mediaUrl}
                            className="postImage"
                            controls
                            preload="metadata"
                            playsInline
                            style={{ 
                              width: "100%", 
                              maxHeight: "600px", 
                              objectFit: "contain",
                              display: "block"
                            }}
                            onError={(e) => {
                              console.error("Video load error for:", mediaUrl, e);
                              e.target.style.display = "none";
                              const parent = e.target.parentElement;
                              if (parent) {
                                const existingError = parent.querySelector(".videoError");
                                if (!existingError) {
                                  const errorDiv = document.createElement("div");
                                  errorDiv.className = "videoError";
                                  errorDiv.style.cssText = "width: 100%; padding: 40px; text-align: center; color: #999;";
                                  errorDiv.textContent = "Video could not be loaded";
                                  parent.appendChild(errorDiv);
                                }
                              }
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      );
                    } else {
                      return (
                        <img
                          key={`img-${post.id}`}
                          src={mediaUrl}
                          alt={post.caption}
                          className="postImage"
                          onError={(e) => {
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect fill='%23f0f0f0' width='600' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='16'%3EImage Not Found%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      );
                    }
                  })()}

                  {/* Post Actions */}
                  <div className="postActionsBar">
                    <div className="postActionsLeft">
                      <IconButton
                        onClick={() => handleLike(post.id)}
                        className={postIsLiked ? "likedBtn" : ""}
                        disabled={!user || processing}
                      >
                        {postIsLiked ? (
                          <FavoriteIcon className="likedIcon" />
                        ) : (
                          <FavoriteBorderIcon />
                        )}
                      </IconButton>
                      <IconButton
                        onClick={() => setOpenCommentModal(post.id)}
                        disabled={!user || processing}
                      >
                        <CommentIcon />
                      </IconButton>
                    </div>
                    <Typography className="likeCount">
                      {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}
                    </Typography>
                  </div>

                  {/* Comments Section */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="commentsSection">
                      {expandedComments[post.id] ? (
                        <>
                          {post.comments.map((comment) => {
                            const isOwnComment = user && comment.userId && (
                              comment.userId.toString() === user.id?.toString() || 
                              comment.userId === user.id?.toString() ||
                              comment.userId === user.id
                            );
                            return (
                              <div key={comment.id} className="comment" style={{ position: "relative" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div style={{ flex: 1 }}>
                                    <Typography>
                                      <strong>{comment.userName}</strong> {comment.text}
                                    </Typography>
                                    <Typography className="commentDate">
                                      {formatDate(comment.createdAt)}
                                    </Typography>
                                  </div>
                                  {isOwnComment && (
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleCommentMenuOpen(e, comment)}
                                      sx={{ ml: 1, padding: "4px" }}
                                    >
                                      <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <Button
                            size="small"
                            onClick={() => toggleComments(post.id)}
                            className="viewCommentsBtn"
                          >
                            Hide comments
                          </Button>
                        </>
                      ) : (
                        <>
                          {post.comments.length > 2 && (
                            <Button
                              size="small"
                              onClick={() => toggleComments(post.id)}
                              className="viewCommentsBtn"
                            >
                              View all {post.comments.length} comments
                            </Button>
                          )}
                          {post.comments.slice(-2).map((comment) => {
                            const isOwnComment = user && comment.userId && (
                              comment.userId.toString() === user.id?.toString() || 
                              comment.userId === user.id?.toString() ||
                              comment.userId === user.id
                            );
                            return (
                              <div key={comment.id} className="comment" style={{ position: "relative" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                  <div style={{ flex: 1 }}>
                                    <Typography>
                                      <strong>{comment.userName}</strong> {comment.text}
                                    </Typography>
                                    <Typography className="commentDate">
                                      {formatDate(comment.createdAt)}
                                    </Typography>
                                  </div>
                                  {isOwnComment && (
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleCommentMenuOpen(e, comment)}
                                      sx={{ ml: 1, padding: "4px" }}
                                    >
                                      <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}

                  {/* Add Comment Button */}
                  {user && (
                    <Button
                      size="small"
                      onClick={() => setOpenCommentModal(post.id)}
                      className="addCommentBtn"
                      disabled={processing}
                    >
                      Add a comment...
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <Dialog
        open={openCreateModal}
        onClose={() => !processing && setOpenCreateModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Create New Post
          <IconButton
            onClick={() => setOpenCreateModal(false)}
            className="closeBtn"
            disabled={processing}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography className="fieldLabel" style={{ marginTop: "8px", marginBottom: "8px" }}>
            Select Image or Video
          </Typography>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => handleImageSelect(e.target.files[0], false)}
            disabled={processing}
            style={{ marginBottom: "16px", width: "100%" }}
          />
          {newPost.imagePreview && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <img
                src={newPost.imagePreview}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  borderRadius: "8px",
                  objectFit: "contain",
                }}
              />
            </Box>
          )}
          <TextField
            fullWidth
            label="Title"
            placeholder="Enter post title (optional)"
            value={newPost.title}
            onChange={(e) =>
              setNewPost({ ...newPost, title: e.target.value })
            }
            margin="normal"
            disabled={processing}
          />
          <TextField
            fullWidth
            label="Caption"
            placeholder="Write a caption..."
            value={newPost.caption}
            onChange={(e) =>
              setNewPost({ ...newPost, caption: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
            disabled={processing}
          />
          <TextField
            fullWidth
            label="Location"
            placeholder="Add location (optional)"
            value={newPost.location}
            onChange={(e) =>
              setNewPost({ ...newPost, location: e.target.value })
            }
            margin="normal"
            disabled={processing}
          />
          <div style={{ marginTop: "16px", marginBottom: "8px" }}>
            <Typography variant="body2" style={{ marginBottom: "8px", fontWeight: 500 }}>
              Tag People
            </Typography>
            {newPost.taggedPeople.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {newPost.taggedPeople.map((person, index) => (
                  <Chip
                    key={index}
                    label={person.name}
                    onDelete={() => removeTaggedUser(person.id || person._id, false)}
                    size="small"
                    style={{ marginBottom: "4px" }}
                  />
                ))}
              </div>
            )}
            <TextField
              fullWidth
              placeholder="Search people to tag..."
              value={userSearchQuery}
              onChange={(e) => handleUserSearch(e.target.value, false)}
              margin="normal"
              size="small"
              disabled={processing}
              onFocus={() => {
                if (userSearchQuery && searchResults.length > 0) {
                  setShowUserSearch(true);
                }
              }}
            />
            {showUserSearch && searchResults.length > 0 && (
              <Box
                sx={{
                  position: "relative",
                  zIndex: 1300,
                  mt: 1,
                  maxHeight: 200,
                  overflowY: "auto",
                  bgcolor: "background.paper",
                  border: "1px solid #dbdbdb",
                  borderRadius: 1,
                  boxShadow: 2,
                }}
              >
                {searchResults.map((user) => (
                  <MenuItem
                    key={user._id || user.id}
                    onClick={() => addTaggedUser(user, false)}
                    sx={{ py: 1.5 }}
                  >
                    <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: 14 }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </div>
                  </MenuItem>
                ))}
              </Box>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCreateModal(false);
            setNewPost({ imageFile: null, imagePreview: null, title: "", caption: "", location: "", taggedPeople: [] });
            setUserSearchQuery("");
            setSearchResults([]);
            setShowUserSearch(false);
          }} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleCreatePost} variant="contained" disabled={processing || !newPost.imageFile}>
            {processing ? <CircularProgress size={20} /> : "Post"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Post Modal */}
      <Dialog
        open={openEditModal}
        onClose={() => !processing && setOpenEditModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Post
          <IconButton
            onClick={() => setOpenEditModal(false)}
            className="closeBtn"
            disabled={processing}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography className="fieldLabel" style={{ marginTop: "8px", marginBottom: "8px" }}>
            {editPost.imageFile ? "New Media Selected" : "Current Media (select new to change)"}
          </Typography>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => handleImageSelect(e.target.files[0], true)}
            disabled={processing}
            style={{ marginBottom: "16px", width: "100%" }}
          />
          {editPost.imagePreview && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              {editPost.imageFile?.type?.startsWith("video/") ? (
                <video
                  src={editPost.imagePreview}
                  controls
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    borderRadius: "8px",
                    objectFit: "contain",
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={editPost.imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    borderRadius: "8px",
                    objectFit: "contain",
                  }}
                />
              )}
            </Box>
          )}
          <TextField
            fullWidth
            label="Title"
            placeholder="Enter post title (optional)"
            value={editPost.title}
            onChange={(e) =>
              setEditPost({ ...editPost, title: e.target.value })
            }
            margin="normal"
            disabled={processing}
          />
          <TextField
            fullWidth
            label="Caption"
            value={editPost.caption}
            onChange={(e) =>
              setEditPost({ ...editPost, caption: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
            disabled={processing}
          />
          <TextField
            fullWidth
            label="Location"
            placeholder="Add location (optional)"
            value={editPost.location}
            onChange={(e) =>
              setEditPost({ ...editPost, location: e.target.value })
            }
            margin="normal"
            disabled={processing}
          />
          <div style={{ marginTop: "16px", marginBottom: "8px" }}>
            <Typography variant="body2" style={{ marginBottom: "8px", fontWeight: 500 }}>
              Tag People
            </Typography>
            {editPost.taggedPeople.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                {editPost.taggedPeople.map((person, index) => (
                  <Chip
                    key={index}
                    label={person.name || person}
                    onDelete={() => removeTaggedUser(person.id || person._id || person, true)}
                    size="small"
                    style={{ marginBottom: "4px" }}
                  />
                ))}
              </div>
            )}
            <TextField
              fullWidth
              placeholder="Search people to tag..."
              value={userSearchQuery}
              onChange={(e) => handleUserSearch(e.target.value, true)}
              margin="normal"
              size="small"
              disabled={processing}
              onFocus={() => {
                if (userSearchQuery && searchResults.length > 0) {
                  setShowUserSearch(true);
                }
              }}
            />
            {showUserSearch && searchResults.length > 0 && (
              <Box
                sx={{
                  position: "relative",
                  zIndex: 1300,
                  mt: 1,
                  maxHeight: 200,
                  overflowY: "auto",
                  bgcolor: "background.paper",
                  border: "1px solid #dbdbdb",
                  borderRadius: 1,
                  boxShadow: 2,
                }}
              >
                {searchResults.map((user) => (
                  <MenuItem
                    key={user._id || user.id}
                    onClick={() => addTaggedUser(user, true)}
                    sx={{ py: 1.5 }}
                  >
                    <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: 14 }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </div>
                  </MenuItem>
                ))}
              </Box>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenEditModal(false);
            setEditingPost(null);
            setEditPost({ imageFile: null, imagePreview: null, title: "", caption: "", location: "", taggedPeople: [], existingImageUuid: null });
            setUserSearchQuery("");
            setSearchResults([]);
            setShowUserSearch(false);
          }} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleEditPost} variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Modal */}
      <Dialog
        open={openCommentModal !== null}
        onClose={() => {
          if (!processing) {
            setOpenCommentModal(null);
            setCommentText("");
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            autoFocus
            disabled={processing}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenCommentModal(null);
              setCommentText("");
            }}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleAddComment(openCommentModal)}
            variant="contained"
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : "Post Comment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={openDeleteModal !== null}
        onClose={() => !processing && setOpenDeleteModal(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: "#d32f2f" }}>
          <WarningIcon />
          Delete Post
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Are you sure you want to delete this post?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. The post and all its comments will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: "16px 24px", gap: 1 }}>
          <Button
            onClick={() => setOpenDeleteModal(null)}
            disabled={processing}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeletePost(openDeleteModal)}
            variant="contained"
            disabled={processing}
            sx={{
              backgroundColor: "#d32f2f",
              "&:hover": {
                backgroundColor: "#b71c1c",
              },
            }}
          >
            {processing ? <CircularProgress size={20} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Menu */}
      <Menu
        anchorEl={commentMenuAnchor}
        open={Boolean(commentMenuAnchor)}
        onClose={handleCommentMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedComment) {
              openEditComment(selectedComment);
            }
          }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedComment) {
              handleCommentMenuClose();
              if (window.confirm("Are you sure you want to delete this comment?")) {
                handleDeleteComment(selectedComment.id);
              }
            }
          }}
          sx={{ color: "#d32f2f" }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Comment Modal */}
      <Dialog
        open={openEditCommentModal}
        onClose={() => !processing && setOpenEditCommentModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Edit your comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            autoFocus
            disabled={processing}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenEditCommentModal(false);
              setCommentText("");
              setEditingComment(null);
            }}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditComment}
            variant="contained"
            disabled={processing || !commentText.trim()}
          >
            {processing ? <CircularProgress size={20} /> : "Update Comment"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
