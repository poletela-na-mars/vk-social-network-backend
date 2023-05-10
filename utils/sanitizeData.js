export const sanitizeData = (user) => {
  const { passwordHash, email, ...userData } = user._doc;
  return { ...userData };
};
