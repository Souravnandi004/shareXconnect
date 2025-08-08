import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }],
  isFirstLogin: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const user = mongoose.model('user', userSchema);
export default user;
