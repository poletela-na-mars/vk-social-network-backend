import bcrypt from 'bcrypt';
import UserModel from '../models/User.js';
import jwt from 'jsonwebtoken';

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

    const { passwordHash, email, ...userData } = user._doc;

    const data = { ...userData };

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Нет доступа',
    });
  }
};