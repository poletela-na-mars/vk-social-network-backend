import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const PostSchema = new mongoose.Schema({
      text: {
        type: String,
        required: true,
      },
      likes: {
        type: Array,
        default: [],
      },
      user: {
        type: ObjectId,
        required: true,
      },
      imageUrl: {
        type: String,
        default: '',
      },
    },
    {
      timestamps: true,
    },
);

export default mongoose.model('Post', PostSchema);
