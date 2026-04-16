import { Router } from "express";
import {
  chagnePassword,
  login,
  session,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/session", session, protect);
authRouter.post("/change-password", chagnePassword, protect);

export default authRouter;
