import mongoose from 'mongoose';

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
