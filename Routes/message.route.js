import express from "express";
import isAuthenticate from "../middleware/isAuthenticated.js";
import upload from "../middleware/multer.js";
import { getMessage, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.route('/send/:id').post(isAuthenticate,sendMessage);
router.route('/all/:id').get(isAuthenticate,getMessage);


export default router;