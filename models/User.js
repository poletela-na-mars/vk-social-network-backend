import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
      lastName: {
        type: String,
        required: true,
      },
      firstName: {
        type: String,
        required: true,
      },
      birthday: {
        type: Date,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      passwordHash: {
        type: String,
        required: true,
      },
      friends: {
        type: Array,
        default: [],
      },
      avatarUrl: {
        type: String,
        default: '',
      },
      city: {
        type: String,
        default: '',
      },
      uniOrJob: {
        type: String,
        default: '',
      },
    },
    {
      timestamps: true,
    },
);

UserSchema.methods.toJSON = function () {
  let obj = this.toObject();
  delete obj.passwordHash;
  delete obj.email;
  return obj;
};

export default mongoose.model('User', UserSchema);
