import express from "express";
import isAuthenticate from "../middleware/isAuthenticated.js";
import upload from "../middleware/multer.js";
import { addComment, addNewPost, bookMarkPost, deletePost, dislikePost, getAllPost, getCommentOfPost, getMyPost, likePost } from "../controllers/post.controller.js";

const router = express.Router();


router.route('/addpost').post(isAuthenticate,upload.single('file'),addNewPost);
router.route('/all').get(isAuthenticate,getAllPost);
router.route('/userpos/all').get(isAuthenticate,getMyPost);
router.route('/:id/like').get(isAuthenticate,likePost);
router.route('/:id/dislike').get(isAuthenticate,dislikePost);
router.route('/:id/comment').post(isAuthenticate,addComment);
router.route('/:id/comment/all').post(isAuthenticate,getCommentOfPost);
router.route('/delete/:id').delete(isAuthenticate,deletePost);
router.route('/:id/bookmark').get(isAuthenticate,bookMarkPost);

export default router;
