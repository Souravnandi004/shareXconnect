import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import Post from "../model/post.model.js";
import User from "../model/user.model.js";
import Comment from "../model/comment.js";
import { io, getReceiverSocketId } from "../socket/socket.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const file = req.file;
    const authorId = req.id;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Media (image or video) is required',
      });
    }

    const isVideo = file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      {
        folder: 'instagram-posts',
        resource_type: 'auto',
      }
    );

    const post = await Post.create({
      caption,
      media: {
        url: result.secure_url,
        publicId: result.public_id,
        type: resourceType,
      },
      author: authorId,
    });

    const populatedPost = await post.populate("author", "username profilePicture");

    await User.findByIdAndUpdate(authorId, {
      $push: { posts: post._id },
    });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost,
    });
  } catch (error) {
    console.error('Post creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message,
    });
  }
};

export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profilePicture")
      .populate({
        path: "comments",
        populate: { path: "author", select: "username profilePicture" },
        options: { sort: { createdAt: -1 } }
      });

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

export const getMyPost = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.id })
      .sort({ createdAt: -1 })
      .populate("author", "username profilePicture")
      .populate({
        path: "comments",
        populate: { path: "author", select: "username profilePicture" },
        options: { sort: { createdAt: -1 } }
      });

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

export const likePost = async (req, res) => {
  try {
    const jelikekorbe = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
        success: false
      });
    }

    const alreadyLiked = post.likes.includes(jelikekorbe);
    if (alreadyLiked) {
      return res.status(400).json({
        message: 'Post already liked',
        success: false
      });
    }

    await post.updateOne({ $addToSet: { likes: jelikekorbe } });

    // Real-time notification
    const user = await User.findById(jelikekorbe).select('username profilePicture');
    const postOwnerId = post.author.toString();

    if (postOwnerId !== jelikekorbe) {
      const notification = {
        type: 'like',
        userId: jelikekorbe,
        userDetails: {
          username: user.username,
          profilePicture: user.profilePicture
        },
        postId,
        createdAt: new Date(),
        message: `${user.username} liked your post`
      };

      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      if (postOwnerSocketId) {
        io.to(postOwnerSocketId).emit('notification', notification);
      }
    }

    return res.status(200).json({
      message: 'Post liked',
      success: true
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false
    });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const jedislikekorbe = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: 'Post not found',
        success: false
      });
    }

    await post.updateOne({ $pull: { likes: jedislikekorbe } });

    const user = await User.findById(jedislikekorbe).select('username profilePicture');
    const postOwnerId = post.author.toString();

    if (postOwnerId !== jedislikekorbe) {
      const notification = {
        type: 'dislike',
        userId: jedislikekorbe,
        userDetails: {
          username: user.username,
          profilePicture: user.profilePicture
        },
        postId,
        createdAt: new Date(),
        message: `${user.username} disliked your post`
      };

      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      if (postOwnerSocketId) {
        io.to(postOwnerSocketId).emit('notification', notification);
      }
    }

    return res.status(200).json({
      message: 'Post disliked',
      success: true
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false
    });
  }
};


export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.id;

    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

    const comment = await Comment.create({
      text,
      author: userId,
      post: postId,
    });

    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    const populatedComment = await comment.populate("author", "username profilePicture");

    return res.status(201).json({
      success: true,
      message: 'Comment added',
      comment: populatedComment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error adding comment' });
  }
};

export const getCommentOfPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId })
      .populate("author", "username profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching comments' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.author.toString() !== userId)
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ post: postId });

    await User.findByIdAndUpdate(userId, {
      $pull: { posts: postId },
    });

    return res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error deleting post' });
  }
};

export const bookMarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id; // Assuming this comes from authentication middleware
        
        // Validate post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Find and update user
        const user = await User.findById(authorId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isBookmarked = user.bookmarks.includes(post._id);
        
        if (isBookmarked) {
            // Remove bookmark
            await User.findByIdAndUpdate(authorId, {
                $pull: { bookmarks: post._id }
            });
        } else {
            // Add bookmark
            await User.findByIdAndUpdate(authorId, {
                $addToSet: { bookmarks: post._id }
            });
        }

        // Get updated user
        const updatedUser = await User.findById(authorId).select('-password'); // Exclude sensitive data

        return res.status(200).json({
            success: true,
            message: isBookmarked ? 'Post removed from bookmarks' : 'Post bookmarked',
            user: updatedUser,
            isBookmarked: !isBookmarked // Return the new state
        });

    } catch (error) {
        console.error('Bookmark error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}