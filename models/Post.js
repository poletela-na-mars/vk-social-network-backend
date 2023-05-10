import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
      text: {
        type: String,
        required: true,
      },
      likesCount: {
        type: Number,
        default: 0,
      },
      user: {
        type: Object,
        ref: 'User',
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
