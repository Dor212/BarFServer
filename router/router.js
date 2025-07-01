import { Router } from "express";
import usersRouter from "../users/routes/user.routes.js";
import express from "express";
import { auth } from "../middlewares/token.js";
import { isAdmin } from "../middlewares/isAdmin.js";

import path from "path";

const router = Router();

// בדיקת תקינות
router.get("/", (req, res) => {
  return res.json({ message: "Router is working" });
});

// ניהול קבצים - צפייה בלוגים והעלאה
router.get("/logs/:date", auth, isAdmin, (req, res) => {
  try {
    const { date } = req.params;
    return res.sendFile(path.join(process.cwd(), "logs", `${date}.txt`));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});


//  ראוטים עיקריים
router.use("/users", usersRouter);


export default router;
