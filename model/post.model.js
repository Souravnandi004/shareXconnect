import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  caption: {
    type: String,
    default: '',
  },
  media: {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
});

const Post = mongoose.model('post', postSchema);
export default Post;
