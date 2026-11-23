import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import User from "../models/User.js";
import {
  StudentProfile,
  TeacherProfile,
  Subject,
  StudentSubjectEnrollment,
  Attendance,
  Material,
  Announcement,
} from "../models/Academic.js";
import { uploadsDirectory } from "../middleware/upload.js";
import { isValidPassword, MIN_PASSWORD_LENGTH } from "../utils/password.js";
import {
  COMMON_SUBJECT_NAMES,
  enrollStudentInCommonSubjects,
} from "../utils/commonSubjects.js";

export async function listUsers(req, res) {
  const filter = req.query.role ? { role: req.query.role } : {};
  const users = await User.find(filter)
    .select("name email role status createdAt")
    .sort({ createdAt: -1 });
  res.json({ users });
}
export async function createUser(req, res) {
  const { name, email, password, role, profile = {} } = req.body;
  if (
    !name ||
    !email ||
    !password ||
    !["student", "teacher", "admin"].includes(role)
  )
    return res
      .status(400)
      .json({ message: "name, email, password and valid role are required" });
  if (!isValidPassword(password))
    return res
      .status(400)
      .json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role,
  });
  try {
    if (role === "student") {
      await StudentProfile.create({
        user: user._id,
        rollNumber: profile.rollNumber,
        department: profile.department,
        className: profile.className,
        section: profile.section,
        year: profile.year,
      });
      await enrollStudentInCommonSubjects(user._id);
    }
    if (role === "teacher")
      await TeacherProfile.create({
        user: user._id,
        employeeId: profile.employeeId,
        department: profile.department,
      });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
  res
    .status(201)
    .json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
}
export async function updateUser(req, res) {
  const allowed = ["name", "status"];
  const update = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k)),
  );
  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).select("name email role status");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
}
export async function deleteUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role === "admin")
    return res.status(403).json({ message: "Administrator accounts cannot be deleted" });
  if (!["student", "teacher"].includes(user.role))
    return res.status(400).json({ message: "Only student and teacher accounts can be deleted" });

  if (user.role === "student") {
    await Promise.all([
      StudentProfile.deleteOne({ user: user._id }),
      StudentSubjectEnrollment.deleteMany({ student: user._id }),
      Attendance.deleteMany({ student: user._id }),
    ]);
  } else {
    const materials = await Material.find({ teacher: user._id });
    for (const material of materials) {
      const file = path.join(uploadsDirectory, path.basename(material.fileUrl));
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    await Promise.all([
      TeacherProfile.deleteOne({ user: user._id }),
      Attendance.deleteMany({ teacher: user._id }),
      Material.deleteMany({ teacher: user._id }),
      Announcement.deleteMany({ author: user._id }),
    ]);
  }

  await User.findByIdAndDelete(user._id);
  res.json({ message: `${user.role === "student" ? "Student" : "Teacher"} deleted successfully` });
}
export async function listCommonSubjects(_req, res) {
  const subjects = await Subject.find({
    name: { $in: COMMON_SUBJECT_NAMES },
  }).sort({ name: 1 });
  const ordered = COMMON_SUBJECT_NAMES.map((name) =>
    subjects.find((subject) => subject.name === name),
  ).filter(Boolean);
  res.json({
    subjects: ordered,
    names: COMMON_SUBJECT_NAMES,
  });
}
