import { Router } from "express";
import {
  login,
  refresh,
  logout,
  me,
  profile,
  getUserProfile,
  updateProfile,
  changePassword,
  updateProfilePhoto,
} from "../controllers/authController.js";
import * as admin from "../controllers/adminController.js";
import * as academic from "../controllers/academicController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadStudyNote, uploadProfilePhoto } from "../middleware/upload.js";
const router = Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post("/auth/login", asyncHandler(login));
router.post("/auth/refresh", asyncHandler(refresh));
router.post("/auth/logout", asyncHandler(logout));
router.get("/auth/me", authenticate, asyncHandler(me));
router.get("/auth/profile", authenticate, asyncHandler(profile));
router.patch("/auth/profile", authenticate, asyncHandler(updateProfile));
router.post("/auth/profile/password", authenticate, asyncHandler(changePassword));
router.post(
  "/auth/profile/photo",
  authenticate,
  uploadProfilePhoto.single("photo"),
  asyncHandler(updateProfilePhoto),
);
router.get(
  "/profiles/:id",
  authenticate,
  asyncHandler(getUserProfile),
);
router.patch(
  "/profiles/:id",
  authenticate,
  uploadProfilePhoto.none(),
  asyncHandler(updateProfile),
);
router.post(
  "/profiles/:id/photo",
  authenticate,
  uploadProfilePhoto.single("photo"),
  asyncHandler(updateProfilePhoto),
);

router.get(
  "/admin/users",
  authenticate,
  authorize("admin"),
  asyncHandler(admin.listUsers),
);
router.post(
  "/admin/users",
  authenticate,
  authorize("admin"),
  asyncHandler(admin.createUser),
);
router.patch(
  "/admin/users/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(admin.updateUser),
);
router.delete(
  "/admin/users/:id",
  authenticate,
  authorize("admin"),
  asyncHandler(admin.deleteUser),
);
router.get(
  "/admin/common-subjects",
  authenticate,
  authorize("admin"),
  asyncHandler(admin.listCommonSubjects),
);
router.post(
  "/attendance",
  authenticate,
  authorize("teacher", "admin"),
  asyncHandler(academic.markAttendance),
);
router.get(
  "/teacher/subjects",
  authenticate,
  authorize("teacher"),
  asyncHandler(academic.listTeacherSubjects),
);
router.get(
  "/teacher/students",
  authenticate,
  authorize("teacher"),
  asyncHandler(academic.listTeacherStudents),
);
router.get(
  "/student/attendance",
  authenticate,
  authorize("student"),
  asyncHandler(academic.studentAttendance),
);
router.get(
  "/student/attendance/summary",
  authenticate,
  authorize("student"),
  asyncHandler(academic.studentAttendanceSummary),
);
router.get(
  "/student/subjects",
  authenticate,
  authorize("student"),
  asyncHandler(academic.listStudentSubjects),
);
router.post(
  "/materials",
  authenticate,
  authorize("teacher"),
  uploadStudyNote.single("file"),
  asyncHandler(academic.createMaterial),
);
router.get("/materials", authenticate, asyncHandler(academic.listMaterials));
router.patch(
  "/materials/:id",
  authenticate,
  authorize("teacher"),
  uploadStudyNote.single("file"),
  asyncHandler(academic.updateMaterial),
);
router.delete(
  "/materials/:id",
  authenticate,
  authorize("teacher"),
  asyncHandler(academic.deleteMaterial),
);
router.get(
  "/teacher/attendance",
  authenticate,
  authorize("teacher"),
  asyncHandler(academic.listTeacherAttendance),
);
router.patch(
  "/attendance/:id",
  authenticate,
  authorize("teacher"),
  asyncHandler(academic.updateAttendance),
);
router.post(
  "/announcements",
  authenticate,
  authorize("admin"),
  asyncHandler(academic.createAnnouncement),
);
router.get(
  "/announcements",
  authenticate,
  asyncHandler(academic.listAnnouncements),
);

export default router;
