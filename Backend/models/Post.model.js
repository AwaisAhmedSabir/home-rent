import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    imageUuid: {
      type: String,
      required: [true, "Media UUID is required"],
    },
    imageUrl: {
      type: String,
      // Keep for backward compatibility, will be generated from imageUuid
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    title: {
      type: String,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    taggedPeople: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
postSchema.index({ creator: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
