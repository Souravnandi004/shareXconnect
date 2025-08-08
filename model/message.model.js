import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
    senderId:{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'
    },
    receiverId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'  
    },
    message :{
        type : String,
        required : true
    },
});
const Message = mongoose.model('Message', messageSchema);
export default Message;
