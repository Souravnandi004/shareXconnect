import express from 'express';
import {
  editProfile,
  followOrUnfollow,
  getProfile,
  getSuggestedUsers,
  login,
  logOut,
  register,
  setFirstLoginFalse,
} from '../controllers/user.controller.js';
import isAuthenticate from '../middleware/isAuthenticated.js';
import upload from '../middleware/multer.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logOut', logOut);

router.get('/:id/profile', isAuthenticate, getProfile);
router.post('/edit-profile', isAuthenticate, upload.single('profilePicture'), editProfile);
router.get('/suggested', isAuthenticate, getSuggestedUsers);
router.post('/followUnfollow/:id', isAuthenticate, followOrUnfollow);
router.put('/disable-first-login', isAuthenticate, setFirstLoginFalse);

export default router;
