import { Router } from "express";
import {
  getMessages,
  getMessageById,
  createMessage,
} from "../controllers/messages.controller.js";

const router = Router();

router.get("/", getMessages);
router.get("/:mid", getMessageById);
router.post("/", createMessage);

export default router;
