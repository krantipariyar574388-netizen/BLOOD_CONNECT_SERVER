import express, { Router } from 'express';
import {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    changePassword,
    toggleAvailability,
    forgotPassword,
    resetPassword,
    getEligibleDonors,
    getAllUsers,
    toggleUserBan,
    deleteUser,
    getAdminStats,
    getUserById,
} from '../controllers/user.controller';
import { uploader } from "../middlewares/multer.middleware";
import { authentication } from '../middlewares/auth.middleware';
import { UserRole } from "../@types/enum.types";

const router: Router = express.Router();

const upload = uploader();

router.post("/register", upload.single("profile_image") ,register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get('/donors', getEligibleDonors);

router.post("/logout", authentication(), logout);
router.get("/me", authentication(), getMe);
router.patch("/profile", authentication(), upload.single("profile_image"), updateProfile);
router.patch("/change-password", authentication(), changePassword);
router.patch("/toggle-availability", authentication(), toggleAvailability);

router.get("/admin/stats", authentication([UserRole.ADMIN]), getAdminStats);
router.get("/admin/all", authentication([UserRole.ADMIN]), getAllUsers);
router.get("/admin/:id", authentication([UserRole.ADMIN]), getUserById);
router.patch("/admin/:id/ban", authentication([UserRole.ADMIN]), toggleUserBan);
router.delete("/admin/:id", authentication([UserRole.ADMIN]), deleteUser);

export default router;