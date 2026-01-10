import Post from "../models/Post.model.js";

// @desc    Like/Unlike a post
// @route   POST /api/likes/:postId
// @access  Private
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = req.user.id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike: remove user from likes array
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like: add user to likes array
      post.likes.push(userId);
    }

    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("creator", "name email")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "name",
        },
      });

    res.status(200).json({
      success: true,
      data: {
        post: updatedPost,
        liked: !isLiked,
        likeCount: updatedPost.likes.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// @desc    Get likes for a post
// @route   GET /api/likes/:postId
// @access  Public
export const getLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("likes", "name email");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      count: post.likes.length,
      data: post.likes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
