import mongoose from "mongoose";

const connectDB = async () => {
    try{
         await mongoose.connect(process.env.URI);
         console.log('database connected successfully');
    }
    catch(error){
        console.error("database connection error: ",error.message);
        process.exit(1);
    }

};

export default connectDB;