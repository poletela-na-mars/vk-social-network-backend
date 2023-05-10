export const fileFilter = (req, file, cb) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const minSize = 5 * 1024;
  let errorMsg;

  if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
    errorMsg = 'Неверный формат изображения';
    req.fileValidationError = errorMsg;
    return cb(null, false, new Error(errorMsg));
  }

  const reFileName = /^[А-яёЁ a-zA-Z0-9_-]{1,80}\.[a-zA-Z]{1,8}$/;
  if (!reFileName.test(file.originalname)) {
    errorMsg = 'Недопустимое имя или расширение файла';
    return cb(null, false, new Error(errorMsg));
  }

  if (file.size >= maxSize || file.size <= minSize) {
    errorMsg = 'Изображение слишком большое или слишком маленькое';
    return cb(null, false, new Error(errorMsg));
  }

  cb(null, true);
};
