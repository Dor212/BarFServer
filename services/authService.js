import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const { SECRET_KEY } = process.env;

const generateToken = (user) => {
  const payloadData = { _id: user._id.toString(), isAdmin: user.isAdmin };
  console.log("Payload TO token:", payloadData);
  const token = jwt.sign(payloadData, SECRET_KEY, { expiresIn: "1d" });
  return token;
};

const verifyToken = (tokenFromClient) => {
  try {
    const userData = jwt.verify(tokenFromClient, SECRET_KEY);
    console.log("🔐 SECRET_KEY Loaded:", SECRET_KEY);
    return userData;
  } catch (err) {
    return null;
  }
};

export { generateToken, verifyToken };
