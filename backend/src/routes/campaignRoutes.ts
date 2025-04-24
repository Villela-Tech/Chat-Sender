import express from "express";
import isAuth from "../middleware/isAuth";
import isAdmin from "../middleware/isAdmin";

import * as CampaignController from "../controllers/CampaignController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const routes = express.Router();

// View routes - accessible to all authenticated users
routes.get("/campaigns/list", isAuth, CampaignController.findList);
routes.get("/campaigns", isAuth, CampaignController.index);
routes.get("/campaigns/:id", isAuth, CampaignController.show);

// Modification routes - only for admins
routes.post("/campaigns", isAuth, isAdmin, CampaignController.store);
routes.put("/campaigns/:id", isAuth, isAdmin, CampaignController.update);
routes.delete("/campaigns/:id", isAuth, isAdmin, CampaignController.remove);
routes.post("/campaigns/:id/cancel", isAuth, isAdmin, CampaignController.cancel);
routes.post("/campaigns/:id/restart", isAuth, isAdmin, CampaignController.restart);
routes.post(
  "/campaigns/:id/media-upload",
  isAuth,
  isAdmin,
  upload.array("file"),
  CampaignController.mediaUpload
);
routes.delete(
  "/campaigns/:id/media-upload",
  isAuth,
  isAdmin,
  CampaignController.deleteMedia
);

export default routes;
