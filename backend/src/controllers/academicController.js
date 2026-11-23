import {
  Attendance,
  Material,
  Announcement,
  StudentSubjectEnrollment,
  Subject,
  StudentProfile,
  TeacherProfile,
} from "../models/Academic.js";
import fs from "fs";
import path from "path";
import { uploadsDirectory } from "../middleware/upload.js";
import { COMMON_SUBJECT_NAMES } from "../utils/commonSubjects.js";

export async function markAttendance(req, res) {
  const { student, date, period, status } = req.body;
  const teacherProfile = await TeacherProfile.findOne({ user: req.user._id });
  if (!teacherProfile?.department)
    return res.status(400).json({ message: "Your department is not configured" });
  const studentProfile = await StudentProfile.findOne({ user: student });
  if (!studentProfile)
    return res.status(400).json({ message: "Student profile not found" });
  if (studentProfile.department !== teacherProfile.department)
    return res.status(403).json({ message: "Student belongs to another department" });
  if (!Number.isInteger(Number(period)) || Number(period) < 1 || Number(period) > 6)
    return res.status(400).json({ message: "Period must be from 1 to 6" });
  if (!["present", "absent"].includes(status))
    return res.status(400).json({ message: "Status must be Present or Absent" });
  const record = await Attendance.findOneAndUpdate(
    { student, date: new Date(date), period: Number(period) },
    {
      student,
      teacher: req.user._id,
      department: teacherProfile.department,
      date: new Date(date),
      period: Number(period),
      status,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.json({ attendance: record });
}
export async function listTeacherSubjects(req, res) {
  const subjects = await Subject.find({
    name: { $in: COMMON_SUBJECT_NAMES },
  });
  const ordered = COMMON_SUBJECT_NAMES.map((name) =>
    subjects.find((subject) => subject.name === name),
  ).filter(Boolean);
  res.json({ subjects: ordered });
}
export async function listTeacherStudents(req, res) {
  const teacherProfile = await TeacherProfile.findOne({ user: req.user._id });
  if (!teacherProfile?.department)
    return res.status(400).json({ message: "Your department is not configured" });
  const profiles = await StudentProfile.find({
    department: teacherProfile.department,
  })
    .populate("user", "name email role status")
    .sort({ "user.name": 1 });
  res.json({
    department: teacherProfile.department,
    students: profiles
      .filter((profile) => profile.user)
      .map((profile) => ({
        id: profile.user._id,
        name: profile.user.name,
        email: profile.user.email,
        status: profile.user.status,
        rollNumber: profile.rollNumber,
        department: profile.department,
        className: profile.className,
        section: profile.section,
        year: profile.year,
      })),
  });
}
export async function studentAttendance(req, res) {
  const records = await Attendance.find({ student: req.user._id })
    .populate("teacher", "name")
    .sort({ date: -1 });
  res.json({ records });
}
export async function studentAttendanceSummary(req, res) {
  const records = await Attendance.find({ student: req.user._id })
    .sort({ date: -1 });
  const periodSummaries = Array.from({ length: 6 }, (_, index) => index + 1).map((period) => {
    const history = records.filter((record) => record.period === period);
    const total = history.length;
    const attended = history.filter((record) => record.status === "present").length;
    return {
      period,
      total,
      attended,
      absent: history.filter((record) => record.status === "absent").length,
      percentage: total ? Math.round((attended / total) * 100) : 0,
      history: history.map((record) => ({
        id: record._id,
        date: record.date,
        status: record.status,
        teacher: record.teacher,
      })),
    };
  });
  const total = records.length;
  const attended = records.filter((record) => record.status === "present").length;
  res.json({
    periods: periodSummaries,
    overall: {
      total,
      attended,
      absent: records.filter((record) => record.status === "absent").length,
      percentage: total ? Math.round((attended / total) * 100) : 0,
    },
  });
}
export async function listTeacherAttendance(req, res) {
  const { date, period } = req.query;
  const teacherProfile = await TeacherProfile.findOne({ user: req.user._id });
  if (!teacherProfile?.department)
    return res.status(400).json({ message: "Your department is not configured" });
  const filter = { department: teacherProfile.department, teacher: req.user._id };
  if (date) filter.date = new Date(date);
  if (period) filter.period = Number(period);
  const records = await Attendance.find(filter)
    .populate("student", "name email")
    .sort({ date: -1, "student.name": 1 });
  res.json({ records });
}
export async function updateAttendance(req, res) {
  const record = await Attendance.findById(req.params.id);
  if (!record) return res.status(404).json({ message: "Attendance record not found" });
  if (record.teacher.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "You can only edit your attendance records" });
  if (!["present", "absent"].includes(req.body.status))
    return res.status(400).json({ message: "Status must be Present or Absent" });
  record.status = req.body.status;
  await record.save();
  res.json({ attendance: record });
}
export async function listStudentSubjects(req, res) {
  const enrollments = await StudentSubjectEnrollment.find({
    student: req.user._id,
  })
    .populate("subject", "name code mandatory")
    .sort({ "subject.name": 1 });
  const subjects = enrollments
    .filter((enrollment) => enrollment.subject)
    .map((enrollment) => ({
      id: enrollment.subject._id,
      name: enrollment.subject.name,
      code: enrollment.subject.code,
      mandatory: enrollment.mandatory,
    }));
  res.json({ subjects });
}
export async function createAnnouncement(req, res) {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Only administrators can create announcements" });
  if (!req.body.title?.trim() || !req.body.content?.trim())
    return res.status(400).json({ message: "Title and content are required" });
  const announcement = await Announcement.create({
    ...req.body,
    author: req.user._id,
  });
  res.status(201).json({ announcement });
}
export async function listAnnouncements(req, res) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const filter = { createdAt: { $gte: cutoff } };
  const announcements = await Announcement.find(filter)
    .populate("author", "name role")
    .sort({ createdAt: -1 });
  res.json({ announcements });
}
export async function listMaterials(req, res) {
  let filter = {};
  if (req.user.role === "student") {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (profile?.department) filter.department = profile.department;
  } else if (req.user.role === "teacher") {
    const profile = await TeacherProfile.findOne({ user: req.user._id });
    if (profile?.department) filter.department = profile.department;
  }
  const materials = await Material.find(filter)
    .populate("subject", "name code")
    .populate("teacher", "name")
    .sort({ createdAt: -1 });
  res.json({ materials });
}
export async function createMaterial(req, res) {
  const { subject, title, description } = req.body;
  if (!req.file) {
    return res.status(400).json({ message: "A PDF, DOC, or DOCX file is required" });
  }
  const profile = await TeacherProfile.findOne({ user: req.user._id });
  if (!profile?.department) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: "Your department is not configured" });
  }
  const subjectRecord = await Subject.findById(subject);
  if (!subjectRecord || !subjectRecord.mandatory) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: "Select one of the six common subjects" });
  }
  const material = await Material.create({
    subject: subjectRecord._id,
    title,
    fileUrl: `/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    description,
    teacher: req.user._id,
    department: profile.department,
  });
  await material.populate([
    { path: "subject", select: "name code" },
    { path: "teacher", select: "name" },
  ]);
  res.status(201).json({ material });
}
export async function updateMaterial(req, res) {
  const material = await Material.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Note not found" });
  if (material.teacher.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "You can only edit your own notes" });
  if (req.body.title) material.title = req.body.title;
  if (typeof req.body.description === "string")
    material.description = req.body.description;
  if (req.file) {
    const oldFile = path.join(uploadsDirectory, path.basename(material.fileUrl));
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    material.fileUrl = `/uploads/${req.file.filename}`;
    material.fileName = req.file.originalname;
    material.mimeType = req.file.mimetype;
    material.size = req.file.size;
  }
  await material.save();
  await material.populate([
    { path: "subject", select: "name code" },
    { path: "teacher", select: "name" },
  ]);
  res.json({ material });
}
export async function deleteMaterial(req, res) {
  const material = await Material.findById(req.params.id);
  if (!material) return res.status(404).json({ message: "Note not found" });
  if (material.teacher.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "You can only delete your own notes" });
  const file = path.join(uploadsDirectory, path.basename(material.fileUrl));
  if (fs.existsSync(file)) fs.unlinkSync(file);
  await material.deleteOne();
  res.json({ message: "Note deleted successfully" });
}
