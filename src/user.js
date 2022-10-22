import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      lowercase: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('User', UserSchema);