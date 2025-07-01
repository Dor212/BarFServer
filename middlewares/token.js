import { verifyToken } from "../services/authService.js";

export const auth = (req, res, next) => {
  const tokenFromClient = req.header("x-auth-token");
  if (!tokenFromClient) {
    return res.status(401).json({ error: "No token provided." });
  }

  const user = verifyToken(tokenFromClient);
  if (!user) {
    return res.status(401).json({ error: "Invalid token." });
  }

  req.user = user;
  next();
};
