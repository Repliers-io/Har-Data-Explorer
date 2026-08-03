import { Router, type IRouter } from "express";
import healthRouter from "./health";
import harRouter from "./har";

const router: IRouter = Router();

router.use(healthRouter);
router.use(harRouter);

export default router;
