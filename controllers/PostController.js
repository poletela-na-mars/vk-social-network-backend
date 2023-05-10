import PostModel from '../models/Post.js';
import UserModel from '../models/User.js';
import { sanitizeData } from '../utils/sanitizeData.js';

export const createPost = async (req, res) => {
  try {
    const doc = new PostModel({
      text: req.body.text,
      imageUrl: req.body.imageUrl,
      user: req.userId,
    });

    const post = await doc.save();

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Ошибка при создании поста.\nПерезагрузите страницу и попробуйте снова.',
    });
  }
};

export const getPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await UserModel.findById(userId);
    const clearUser = sanitizeData(user);
    const friends = clearUser.friends;

    let mode;
    const qMode = req.query.mode;

    switch (qMode) {
      case 'my':
        mode = { user: userId };
        break;
      case 'friends':
        mode = { user: { _id: { $in: friends } } };
        break;
    }

    const posts = await PostModel.find(mode).sort({ createdAt: -1 })
        .populate('user').exec();

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Не удалось получить посты',
    });
  }
};

export const getPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await PostModel.findOne({ _id: postId});

    if (!post) {
      return res.status(400).json({
        message: 'Пост не найден',
      });
    }

    res.json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Не удалось получить пост',
    });
  }
};

// TODO - [WORK] - set/unset like + prohibit putting many likes
export const likePost = async (req, res) => {
  try {
    const postId = req.params.id;

    await PostModel.updateOne({
          _id: postId,
        },
        { $inc: { likesCount: 1 }}
    );

    return res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Ошибка при обновлении статьи.\nПерезагрузите страницу и попробуйте снова.',
    });
  }
};
