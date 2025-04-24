import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as CampaignSettingController from "../controllers/CampaignSettingController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const routes = express.Router();

// View route - accessible to all authenticated users
routes.get("/campaign-settings", isAuth, CampaignSettingController.index);

// Modification route - only for admins
routes.post("/campaign-settings", isAuth, isAdmin, CampaignSettingController.store);

export default routes;
