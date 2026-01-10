import Post from "../models/Post.model.js";
import Comment from "../models/Comment.model.js";
import storageService from "../services/storage.service.js";

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    // If search query provided, filter posts
    if (search && search.trim()) {
      const searchRegex = { $regex: search, $options: "i" };
      query = {
        $or: [
          { title: searchRegex },
          { caption: searchRegex },
          { location: searchRegex },
        ],
      };
    }

    const posts = await Post.find(query)
      .populate("creator", "name email")
      .populate("taggedPeople", "name email")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "name",
        },
        options: { sort: { createdAt: -1 } },
      })
      .sort({ createdAt: -1 });

    // If search query, also filter by creator name
    let filteredPosts = posts;
    if (search && search.trim()) {
      filteredPosts = posts.filter(post => {
        const creatorName = post.creator?.name || "";
        const searchLower = search.toLowerCase();
        return (
          post.title?.toLowerCase().includes(searchLower) ||
          post.caption?.toLowerCase().includes(searchLower) ||
          post.location?.toLowerCase().includes(searchLower) ||
          creatorName.toLowerCase().includes(searchLower)
        );
      });
    }

    res.status(200).json({
      success: true,
      count: filteredPosts.length,
      data: filteredPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("creator", "name email")
      .populate("taggedPeople", "name email")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "name",
        },
        options: { sort: { createdAt: -1 } },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Search posts (returns titles only for dropdown)
// @route   GET /api/posts/search?q=query
// @access  Public
export const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const searchRegex = { $regex: q.trim(), $options: "i" };
    const query = {
      $or: [
        { title: searchRegex },
        { caption: searchRegex },
        { location: searchRegex },
      ],
    };

    const posts = await Post.find(query)
      .populate("creator", "name email")
      .select("title caption location creator createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    // Filter by creator name
    const searchLower = q.trim().toLowerCase();
    const filteredPosts = posts.filter(post => {
      const creatorName = post.creator?.name || "";
      return (
        post.title?.toLowerCase().includes(searchLower) ||
        post.caption?.toLowerCase().includes(searchLower) ||
        post.location?.toLowerCase().includes(searchLower) ||
        creatorName.toLowerCase().includes(searchLower)
      );
    });

    // Return only title, id, and creator info for dropdown
    const results = filteredPosts.map(post => ({
      id: post._id,
      title: post.title || post.caption || "Untitled",
      creatorName: post.creator?.name || "Unknown",
    }));

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private (Creator only)
export const createPost = async (req, res) => {
  try {
    const { imageUuid, imageUrl: providedImageUrl, title, caption, location, taggedPeople, mediaType } = req.body;

    // Validation - at least imageUuid is required
    if (!imageUuid) {
      return res.status(400).json({
        success: false,
        message: "Please provide imageUuid",
      });
    }

    // Use provided imageUrl (from upload response) or look it up from UUID
    let imageUrl = providedImageUrl;
    if (!imageUrl || imageUrl === "") {
      // Fallback: look up URL from UUID (for backward compatibility)
      imageUrl = await storageService.getFileUrl(imageUuid);
      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "File not found. Please ensure the file was uploaded successfully.",
        });
      }
    }

    // Validate taggedPeople is an array
    let taggedPeopleArray = [];
    if (taggedPeople) {
      taggedPeopleArray = Array.isArray(taggedPeople) ? taggedPeople : [taggedPeople];
      // Remove duplicates
      taggedPeopleArray = [...new Set(taggedPeopleArray)];
    }

    const post = await Post.create({
      imageUuid,
      imageUrl,
      title: title || "",
      caption: caption || "",
      location: location || "",
      taggedPeople: taggedPeopleArray,
      mediaType: mediaType || "image",
      creator: req.user.id,
      likes: [],
      comments: [],
    });

    const populatedPost = await Post.findById(post._id)
      .populate("creator", "name email")
      .populate("taggedPeople", "name email");

    res.status(201).json({
      success: true,
      data: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (Creator only, own posts)
export const updatePost = async (req, res) => {
  try {
    const { imageUuid, title, caption, location, taggedPeople, mediaType } = req.body;

    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the creator of the post
    if (post.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this post",
      });
    }

    // Update post
    if (imageUuid) {
      // Use provided imageUrl (from upload response) or look it up from UUID
      let imageUrl = req.body.imageUrl;
      if (!imageUrl || imageUrl === "") {
        // Fallback: look up URL from UUID (for backward compatibility)
        imageUrl = await storageService.getFileUrl(imageUuid);
        if (!imageUrl) {
          return res.status(400).json({
            success: false,
            message: "File not found. Please ensure the file was uploaded successfully.",
          });
        }
      }
      // Delete old file if changing
      if (post.imageUuid && post.imageUuid !== imageUuid) {
        await storageService.deleteFile(post.imageUuid);
      }
      post.imageUuid = imageUuid;
      post.imageUrl = imageUrl;
    }
    if (mediaType !== undefined) post.mediaType = mediaType;
    if (title !== undefined) post.title = title;
    if (caption !== undefined) post.caption = caption;
    if (location !== undefined) post.location = location;
    if (taggedPeople !== undefined) {
      let taggedPeopleArray = Array.isArray(taggedPeople) ? taggedPeople : [taggedPeople];
      taggedPeopleArray = [...new Set(taggedPeopleArray)];
      post.taggedPeople = taggedPeopleArray;
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("creator", "name email")
      .populate("taggedPeople", "name email")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "name",
        },
      });

    res.status(200).json({
      success: true,
      data: updatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Creator only, own posts)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user is the creator of the post
    if (post.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post",
      });
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: post._id });

    // Delete the image file
    if (post.imageUuid) {
      await storageService.deleteFile(post.imageUuid);
    }

    // Delete the post
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
