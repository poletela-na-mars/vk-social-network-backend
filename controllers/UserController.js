import bcrypt from 'bcrypt';
import UserModel from '../models/User.js';
import jwt from 'jsonwebtoken';
import * as path from 'path';
import * as fs from 'fs';
import { sanitizeData } from '../utils/sanitizeData.js';

function NotFoundError(message = '') {
  this.name = 'NotFoundError';
  this.message = message;
}

NotFoundError.prototype = Error.prototype;

const sendTokenAndUserDataResp = (user, res) => {
  const token = jwt.sign({
        _id: user._id,
      },
      process.env.SECRET_HASH_KEY,
      {
        expiresIn: '1d',
      },
  );

  const { passwordHash, email, ...userData } = user._doc;

  return res.json({
    userData,
    token,
  });
};

const removeImage = (oldImageUrl, res) => {
  const imageUrl = oldImageUrl;

  if (imageUrl) {
    const re = /uploads\/.*/;
    const relPath = imageUrl.match(re);
    const oldPath = path.join(relPath[0]);
    fs.unlink(oldPath, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: 'Не удалось удалить изображение',
        });
      }
    });
    return res.status(200);
  }
};

export const removeAvatar = async (req, res) => {
  return removeImage(req.body.avatarUrl, res);
};

export const register = async (req, res) => {
  try {
    const password = req.body.password;
    const SALT_ROUNDS = 10;
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);

    const doc = new UserModel({
      lastName: req.body.lastName,
      firstName: req.body.firstName,
      birthday: req.body.birthday,
      email: req.body.email,
      passwordHash: hash,
      city: req.body.city,
      uniOrJob: req.body.uniOrJob,
    });

    const user = await doc.save();

    sendTokenAndUserDataResp(user, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Проблемы на стороне сервера. Попробуйте позже',
    });
  }
};

export const login = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({
        message: 'Неверный e-mail или пароль',
      });
    }

    const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);
    if (!isValidPass) {
      return res.status(400).json({
        message: 'Неверный e-mail или пароль',
      });
    }

    sendTokenAndUserDataResp(user, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Проблемы на стороне сервера. Попробуйте позже',
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    const data = sanitizeData(user);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Нет доступа',
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    const data = sanitizeData(user);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Пользователь не найден',
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    let users;

    const qAct = req.query.act;
    const qSection = req.query.section;

    // all people
    switch (qAct) {
      case 'find':
        users = await UserModel.find({ _id: { $ne: userId }}).sort({firstName: 1}).exec();
        break;
      default:
        break;
    }

    // friend requests
    switch (qSection) {
      case 'all_requests':
        users = await UserModel.find({ _id: { $in: user._doc.inFriendsReq } }).exec();
        break;
      case 'out_requests':
        users = await UserModel.find({ _id: { $in: user._doc.outFriendsReq } }).exec();
        break;
      default:
        break;
    }

    // friends
    if (qAct === undefined && qSection === undefined) {
      users = await UserModel.find({ _id: { $in: user._doc.friends } }).sort({firstName: 1}).exec();
    }

    if (users) {
      res.json(users);
    } else {
      throw new NotFoundError('Пользователи не найдены, возможно неверные query');
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Не удалось найти пользователей',
    });
  }
};

export const updateUserInfo = async (req, res) => {
  try {
    const userId = req.params.id;

    const updatedUserData = await UserModel.findOneAndUpdate({
          _id: userId,
        },
        {
          lastName: req.body.lastName,
          firstName: req.body.firstName,
          city: req.body.city,
          uniOrJob: req.body.uniOrJob,
          avatarUrl: req.body.avatarUrl,
        },
        {
          returnDocument: 'after'
        }
    );

    res.json(updatedUserData);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Ошибка при редактировании профиля.\nПерезагрузите страницу и попробуйте снова.',
    });
  }
};

export const addFriend = async (req, res) => {
  try {
    const userId = req.params.id;
    const friendId = req.params.friendId;

    if (!userId || !friendId) {
      throw new NotFoundError('Пользователи не найдены, возможно неверные params');
    }

    const userData = await UserModel.findOneAndUpdate({
          _id: userId,
        },
        {
          $push: {
            outFriendsReq: friendId,
          },
        },
        {
          returnDocument: 'after',
        },
    );

    const friendData = await UserModel.findOneAndUpdate({
          _id: friendId,
        },
        {
          $push: {
            inFriendsReq: userId,
          },
        },
        {
          returnDocument: 'after',
        },
    );

    const isBecomingFriendForMe = userData?.inFriendsReq?.find(req => req === friendId) &&
        userData?.outFriendsReq?.find(req => req === friendId);
    const isMeBecomingFriendForFriend = friendData?.inFriendsReq?.find(req => req === userId) &&
        friendData?.outFriendsReq?.find(req => req === userId);

    if (isMeBecomingFriendForFriend && isBecomingFriendForMe) {
      await UserModel.updateOne({
            _id: userId,
          },
          {
            $pull: {
              inFriendsReq: friendId,
              outFriendsReq: friendId,
            },
            $push: {
              friends: friendId,
            },
          }
      );
      await UserModel.updateOne({
            _id: friendId,
          },
          {
            $pull: {
              inFriendsReq: userId,
              outFriendsReq: userId,
            },
            $push: {
              friends: userId,
            },
          }
      );
    }

    return res.json({
      success: true,
    });


  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Ошибка при добавлении в друзья.\nПерезагрузите страницу и попробуйте снова.',
    });
  }
};

export const deleteFriend = async (req, res) => {
  try {
    const userId = req.params.id;
    const friendId = req.params.friendId;

    if (!userId || !friendId) {
      throw new NotFoundError('Пользователи не найдены, возможно неверные params');
    }

    await UserModel.updateOne({
          _id: userId,
        },
        {
          $pull: {
            inFriendsReq: friendId,
            outFriendsReq: friendId,
            friends: friendId,
          },
        }
    );

    await UserModel.updateOne({
          _id: friendId,
        },
        {
          $pull: {
            inFriendsReq: userId,
            outFriendsReq: userId,
            friends: userId,
          },
        }
    );

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Ошибка при удалении из друзей.\nПерезагрузите страницу и попробуйте снова.',
    });
  }
};
