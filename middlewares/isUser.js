export const isUser = (req, res, next) => {
  const userIdFromToken = req.user._id?.toString(); 
  const userIdFromParams = req.params.id;

  if (userIdFromToken !== userIdFromParams && !req.user.isAdmin) {
    return res.status(403).json({ message: "You are not an authorized user." });
  }

  return next();
};
