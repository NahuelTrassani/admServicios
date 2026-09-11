import { Router } from "express";
import {
  getMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
} from "../controllers/messages.controller.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import {
  createMessageSchema,
  updateMessageSchema,
  messageIdParamSchema,
} from "../validations/message.validation.js";

const router = Router();

router.get("/", getMessages);
router.get("/:mid", validateParams(messageIdParamSchema), getMessageById);
router.post("/", validateBody(createMessageSchema), createMessage);
router.put(
  "/:mid",
  validateParams(messageIdParamSchema),
  validateBody(updateMessageSchema),
  updateMessage,
);
router.delete("/:mid", validateParams(messageIdParamSchema), deleteMessage);

export default router;
