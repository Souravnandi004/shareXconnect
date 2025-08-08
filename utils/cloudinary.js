// import { v2 as cloudinary } from "cloudinary";
// import dotenv from "dotenv";
// dotenv.config({});

// cloudinary.config({
//   CloudName : process.env.CloudName,
//   APIKey : process.env.APIKey,
//   APISecret : process.env.APISecret,
// });
// export default cloudinary;

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config({});

cloudinary.config({
  cloud_name: process.env.CloudName,
  api_key: process.env.APIKey,
  api_secret: process.env.APISecret,
  secure: true // recommended
});
export default cloudinary;