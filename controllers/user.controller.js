import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/dataURI.js";
import cloudinary from "../utils/cloudinary.js";
import Post from "../model/post.model.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Something is missing, please check.",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already in use. Try a different one.",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      isFirstLogin: true, // ✅ added for first login detection
    });

    return res.status(201).json({
      message: "Account successfully created",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
        success: false,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect Email or Password",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect Email or Password",
        success: false,
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.secretKey, {
      expiresIn: "1d",
    });

    const populatedPost = [];
    for (let i = 0; i < (user.posts || []).length; i++) {
      const postId = user.posts[i];
      const singlePost = await Post.findById(postId);
      if (singlePost && singlePost.author.equals(user._id)) {
        populatedPost.push(singlePost);
      }
    }

    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: populatedPost,
      isFirstLogin: user.isFirstLogin, // ✅ included in response
    };

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: `Welcome Back, ${user.username}`,
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

export const logOut = async (req, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logged Out Successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in logOut:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid or missing user ID",
        success: false,
      });
    }

    const user = await User.findById(userId)
      .populate({ path: 'posts', options: { sort: { createdAt: -1 } } })
      .populate('bookmarks');

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Fix for getSuggestedUsers
export const getSuggestedUsers = async (req, res) => {
  try {
    // Use req.id instead of req._id (set by isAuthenticate middleware)
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");

    if (!suggestedUsers.length) {
      return res.status(404).json({
        message: "No users available",
        success: false,
      });
    }
    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.error("Suggested Users Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// Fix for editProfile
export const editProfile = async (req, res) => {
  try {
    // Use req.id instead of req.user._id
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;

    let cloudResponse;
    if (profilePicture) {
      try {
        const fileUri = getDataUri(profilePicture);
        cloudResponse = await cloudinary.uploader.upload(fileUri.content);
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        return res.status(500).json({
          message: "Failed to upload profile picture",
          success: false
        });
      }
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
        success: false,
      });
    }

    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse?.secure_url;
    if (user.isFirstLogin) user.isFirstLogin = false;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.error("Edit Profile Error:", error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
      success: false,
    });
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    const followKori = req.id.trim();
    const jakeFollowKorbo = req.params.id.trim();

    if (!mongoose.Types.ObjectId.isValid(followKori) || !mongoose.Types.ObjectId.isValid(jakeFollowKorbo)) {
      return res.status(400).json({
        message: "Invalid user ID",
        success: false,
      });
    }

    if (followKori === jakeFollowKorbo) {
      return res.status(400).json({
        message: "You can't follow or unfollow yourself",
        success: false,
      });
    }

    const user = await User.findById(followKori);
    const targetUser = await User.findById(jakeFollowKorbo);

    if (!user || !targetUser) {
      return res.status(400).json({
        message: "User Not Found",
        success: false,
      });
    }

    const followKoriId = new mongoose.Types.ObjectId(followKori);
    const jakeFollowKorboId = new mongoose.Types.ObjectId(jakeFollowKorbo);

    const isFollowing = user.following.includes(jakeFollowKorbo);

    if (isFollowing) {
      await User.findByIdAndUpdate(
        followKoriId,
        { $pull: { following: jakeFollowKorboId } },
        { new: true }
      );
      await User.findByIdAndUpdate(
        jakeFollowKorboId,
        { $pull: { followers: followKoriId } },
        { new: true }
      );
      return res.status(200).json({
        message: "Unfollowed Successfully",
        success: true,
      });
    } else {
      await User.findByIdAndUpdate(
        followKoriId,
        { $addToSet: { following: jakeFollowKorboId } },
        { new: true }
      );
      await User.findByIdAndUpdate(
        jakeFollowKorboId,
        { $addToSet: { followers: followKoriId } },
        { new: true }
      );
      return res.status(200).json({
        message: "Followed Successfully",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error in followOrUnfollow:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// ✅ New: Set isFirstLogin to false

export const setFirstLoginFalse = async (req, res) => {
  try {
    const userId = req.id; // ✅ taken from middleware (not req.user)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isFirstLogin: false },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
        success: false
      });
    }

    return res.status(200).json({
      message: "First login flag updated",
      success: true,
      user: updatedUser, // ✅ match frontend expectation
    });
  } catch (error) {
    console.error("Error updating first login:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};
