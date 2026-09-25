import express from "express";
import { getLandingStats } from "../controllers/stats.controller";

const router = express.Router();

router.get("/landing", getLandingStats);

export default router;