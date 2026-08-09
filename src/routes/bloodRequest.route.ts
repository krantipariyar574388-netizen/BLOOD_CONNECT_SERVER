import express, { Router } from 'express';
import {
  createBloodRequest,
  getAllBloodRequests,
  getBloodRequestById,
  updateBloodRequestStatus,
  deleteBloodRequest,
  fulfillBloodRequest,
  getMyRequests,
  cancelBloodRequest,
} from '../controllers/bloodRequest.controller';
import { uploader } from "../middlewares/multer.middleware";
import { authentication } from "../middlewares/auth.middleware";
import { UserRole } from "../@types/enum.types";

const router : Router = express.Router();

// multer uploader
const upload = uploader();

router.post(
  "/",
  authentication([UserRole.REQUESTER, UserRole.DONOR, UserRole.ADMIN]),
  upload.single("medicalDocument"),
  createBloodRequest
);
router.get('/', getAllBloodRequests);
router.get('/my', authentication(), getMyRequests);
router.get('/:id', getBloodRequestById);
router.patch(
  '/:id/status',
  authentication([UserRole.ADMIN]),
  upload.single("medicalDocument"),
  updateBloodRequestStatus
);

router.patch(
  '/:id/fulfill',
  authentication([UserRole.DONOR, UserRole.ADMIN]),
  fulfillBloodRequest
);

router.patch(
  '/:id/cancel',
  authentication([UserRole.REQUESTER, UserRole.DONOR, UserRole.ADMIN]),
  cancelBloodRequest
);
router.delete('/:id/', authentication([UserRole.ADMIN]), deleteBloodRequest);

export default router;