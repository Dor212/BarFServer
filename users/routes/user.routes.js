import { Router } from "express";
import User from "../models/User.schema.js"
import {
  addUser,
  deleteUser,
  login,
  getUserById
} from "../services/userDataAccess.service.js";
import { validation } from "../../middlewares/validation.js";
import LoginSchema from "../validations/LoginSchema.js";
import RegisterSchema from "../validations/RegisterSchema.js";
import { generateToken } from "../../services/authService.js";
import { auth } from "../../middlewares/token.js";
import { isAdmin } from "../../middlewares/isAdmin.js";
import nodemailer from "nodemailer";
import {
  createMulterForClientDocuments,
} from "../../middlewares/upload.js";
import fs from "fs";
import path from "path";
 



const router = Router();
const uploadClientDocs = createMulterForClientDocuments();


router.post("/register", validation(RegisterSchema), async (req, res) => {
  try {
    const data = req.body;
    const newUser = await addUser(data);

    return res.json({ message: "User Created", newUser });
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

router.post("/login", validation(LoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await login(email, password);

    const token = generateToken(user);
    res.json({ token });
  } catch (err) {
    console.error("Login error:", err.message); 

    if (
      err.message === "User not found" ||
      err.message === "Password is incorrect."
    ) {
      return res.status(401).json({ error: "Invalid email or password" });
    } else if (err.message.includes("Your account is temporarily locked")) {
      return res.status(403).json({ error: err.message }); 
    }
    return res
      .status(500)
      .json({ error: "An unexpected error occurred during login." });
  }
});

router.get("/", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    return res.json(users);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});


router.delete("/:id", auth, isAdmin, async (req, res) => {
  try {
    const user = await deleteUser(req.params.id);
    return res.send("User Delete");
  } catch (err) {
    return res.status(500).send(err.message);
  }
});


router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Website Contact" <${process.env.SMTP_USER}>`,
      to: "your-email@domain.com",
      subject: `New message from ${name}`,
      html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`,
    });

    res.json({ message: "Email sent" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ error: "Email failed" });
  }
});

router.post(
  "/documents/upload",
  uploadClientDocs.array("files"),
  (req, res) => {
    try {
      const uploadedFiles = req.files.map((file) => ({
        filename: file.filename,
        path: file.path,
      }));
      res.json({
        message: "Files uploaded successfully",
        files: uploadedFiles,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);




router.get("/list", (req, res) => {
  try {
    const baseDir = path.join(process.cwd(), "public", "uploads", "documents");
    if (!fs.existsSync(baseDir)) {
      console.log("📁 אין בכלל תיקיה:", baseDir);
      return res.json([]);
    }

    const folders = fs
      .readdirSync(baseDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    console.log("📂 רשימת תיקיות ב-documents:", folders);

    res.json({ message: "הרשימה הודפסה בשרת", count: folders.length });
  } catch (err) {
    console.error("🚨 שגיאה בקריאת documents:", err);
    res.status(500).json({ error: "Could not list folders" });
  }
});




export default router;