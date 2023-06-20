import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import { PostController, UserController } from './controllers/index.js';
import { checkAuth } from './utils/checkAuth.js';
import { fileFilter } from './validations.js';
import * as fs from 'fs';

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('DB OK'))
    .catch((err) => console.error('DB error', err));

const app = express();

app.use(express.json());
app.use(cors());

// https
//     .createServer(
//         // Provide the private and public key to the server by reading each
//         // file's content with the readFileSync() method.
//         {
//           key: fs.readFileSync("key.pem"),
//           cert: fs.readFileSync("cert.pem"),
//         },
//         app
//     )
//     .listen(port, () => {
//       console.log(`server is running at port ${port}`);
//     });

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    let extArray = file.mimetype.split("/");
    let extension = extArray[extArray.length - 1];
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
  },
});

const upload = multer({storage, fileFilter: fileFilter});

app.use('/uploads', express.static('uploads'));

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  if (req.fileValidationError) {
    return res.status(400).json({
      message: req.fileValidationError,
    });
  }

  res.json({
    avatarUrl: `/uploads/${req.file.filename}`,
  });
});
app.delete('/upload/removeAvatar', checkAuth, UserController.removeAvatar);

// TODO - [SECURITY] - add back-end validation (now only front-end exists for speed)
// TODO - [WORK] - add connection of back and front error messaging

app.post('/auth/login', UserController.login);
app.post('/auth/register', UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);

app.get('/:id/users', checkAuth, UserController.getUsers);
app.get('/user/:id', checkAuth, UserController.getUser);
app.patch('/user/:id', checkAuth, UserController.updateUserInfo);

app.put('/user/:id/friend/:friendId', checkAuth, UserController.addFriend);
app.delete('/user/:id/friend/:friendId', checkAuth, UserController.deleteFriend);

app.post('/posts', checkAuth, PostController.createPost);
app.get('/posts', checkAuth, PostController.getPosts);
app.get('/posts/:id', checkAuth, PostController.getPost);
app.patch('/posts/:id', checkAuth, PostController.likePost);

const port = process.env.PORT || 4444;
app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }

  console.log('Server OK');
  console.log(`Server is running on ${port}`);
});
