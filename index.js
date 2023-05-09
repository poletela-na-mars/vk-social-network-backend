import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { UserController } from './controllers/index.js';
import { checkAuth } from './utils/checkAuth.js';

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('DB OK'))
    .catch((err) => console.error('DB error', err));

const app = express();

app.use(express.json());
app.use(cors());

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

const port = process.env.PORT || 4444;
app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }

  console.log('Server OK');
  console.log(`Server is running on ${port}`);
});
