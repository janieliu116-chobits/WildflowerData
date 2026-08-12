import { Router, type IRouter } from "express";
import healthRouter from "./health";
import interpretRouter from "./interpret";
import audioRouter from "./audio";
import imagesRouter from "./images";
import geocodeRouter from "./geocode";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/interpret", interpretRouter);
router.use("/audio", audioRouter);
router.use("/images", imagesRouter);
router.use("/geocode", geocodeRouter);

export default router;
