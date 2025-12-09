import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['PHOTO_UPLOAD', 'COMMENT', 'USER_REGISTER', 'USER_LOGIN', 'USER_LOGOUT'], 
    required: true 
  },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  photo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' },
  created_at: { type: Date, default: Date.now },
});

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;