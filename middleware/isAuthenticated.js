import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config();

const isAuthenticate = async (req, res, next) => {
  try {
    // Check both cookie and authorization header
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({
        message: "User not authenticated",
        success: false
      });
    }

    const decoded = jwt.verify(token, process.env.secretKey);
    req.id = decoded.userId; // This sets req.id for all controllers
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({
      message: "Invalid or expired token",
      success: false
    });
  }
};

export default isAuthenticate;