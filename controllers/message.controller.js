import mongoose from "mongoose";
import Conversation from "../model/conversation.model.js";
import Message from "../model/message.model.js";
import { getReceiverSocketId, io } from '../socket/socket.js';

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;  // Changed from recId to receiverId
    const { textMessage: message } = req.body;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ success: false, message: "Invalid sender or receiver ID" });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: {
        $all: [senderId, receiverId].map(id => new mongoose.Types.ObjectId(id))
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId].map(id => new mongoose.Types.ObjectId(id))
      });
    }

    // Create message (using receiverId instead of recId)
    const newMessage = await Message.create({
      senderId,
      receiverId,  // Fixed to match model
      message,
    });

    // Add message to conversation
    conversation.messages.push(newMessage._id);
    await conversation.save();

    // Emit to both sender and receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json({
      success: true,
      newMessage,
    });

  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const getMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;  // Changed from recId to receiverId

    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ success: false, message: "Invalid sender or receiver ID" });
    }

    const conversation = await Conversation.findOne({
      participants: {
        $all: [senderId, receiverId].map(id => new mongoose.Types.ObjectId(id))
      },
    }).populate("messages");

    return res.status(200).json({
      success: true,
      messages: conversation?.messages || [],
    });

  } catch (error) {
    console.error("getMessage error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};