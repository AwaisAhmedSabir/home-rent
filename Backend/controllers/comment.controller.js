import Comment from "../models/Comment.model.js";
import Post from "../models/Post.model.js";

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text, postId } = req.body;

    // Validation
    if (!text || !postId) {
      return res.status(400).json({
        success: false,
        message: "Please provide text and postId",
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Create comment
    const comment = await Comment.create({
      text,
      user: req.user.id,
      post: postId,
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // Populate comment with user data
    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "name");

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private (own comments only)
export const updateComment = async (req, res) => {
  try {
    const { text } = req.body;

    // Validation
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide comment text",
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this comment",
      });
    }

    // Update comment
    comment.text = text.trim();
    await comment.save();

    // Populate and return updated comment
    const updatedComment = await Comment.findById(comment._id)
      .populate("user", "name");

    res.status(200).json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (own comments only)
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate("post");

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post._id, {
      $pull: { comments: comment._id },
    });

    // Delete comment
    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
