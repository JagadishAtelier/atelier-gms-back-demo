import express from "express";
import remainderMailRouter from "./remaindermail.routes.js";

const router = express.Router();

router.use("/mail", remainderMailRouter);

export default router;