import { verifyToken } from "../services/authService.js";

export const auth = (req, res, next) => {
  try {
    const cookieToken = req.cookies?.sid;

   
    const authHeader = req.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = cookieToken || headerToken;
    if (!token) {
      return res.status(401).json({ error: "No token provided." });
    }

    const user = verifyToken(token); 
    if (!user) {
      return res.status(401).json({ error: "Invalid token." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token." });
  }
};
