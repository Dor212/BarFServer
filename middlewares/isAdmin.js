export const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "You are not a Admin." });
  }
  return next();
};
