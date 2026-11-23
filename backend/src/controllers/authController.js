import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { StudentProfile, TeacherProfile } from "../models/Academic.js";
import {
  Attendance,
  Material,
  ProfileAudit,
} from "../models/Academic.js";
import fs from "fs";
import path from "path";
import { uploadsDirectory } from "../middleware/upload.js";
import { isValidPassword, MIN_PASSWORD_LENGTH } from "../utils/password.js";
import { signAccess, signRefresh, hashToken } from "../utils/tokens.js";

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
});
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({
    email: String(email || "").trim().toLowerCase(),
  }).select("+passwordHash");
  if (
    !user ||
    user.status !== "active" ||
    !(await bcrypt.compare(password, user.passwordHash))
  )
    return res.status(401).json({ message: "Invalid email or password" });
  const refresh = signRefresh(user);
  user.lastLogin = new Date();
  user.refreshTokenHash = hashToken(refresh);
  await user.save();
  res.cookie("refreshToken", refresh, {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({
    accessToken: signAccess(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
export async function refresh(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (!token)
      return res.status(401).json({ message: "Refresh session missing" });
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub).select("+refreshTokenHash");
    if (
      !user ||
      user.status !== "active" ||
      user.refreshTokenHash !== hashToken(token)
    )
      return res.status(401).json({ message: "Refresh session invalid" });
    const nextRefresh = signRefresh(user);
    user.refreshTokenHash = hashToken(nextRefresh);
    await user.save();
    res.cookie("refreshToken", nextRefresh, {
      ...cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      accessToken: signAccess(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    res.status(401).json({ message: "Refresh session expired" });
  }
}
export async function logout(req, res) {
  if (req.cookies.refreshToken) {
    try {
      const p = jwt.verify(
        req.cookies.refreshToken,
        process.env.JWT_REFRESH_SECRET,
      );
      await User.findByIdAndUpdate(p.sub, { $unset: { refreshTokenHash: 1 } });
    } catch {}
  }
  res.clearCookie("refreshToken", cookieOptions());
  res.json({ message: "Logged out" });
}
export async function me(req, res) {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
}
export async function profile(req, res) {
  const account = {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    status: req.user.status,
    profilePhoto: req.user.profilePhoto,
    mobileNumber: req.user.mobileNumber,
    dateOfBirth: req.user.dateOfBirth,
    gender: req.user.gender,
    address: req.user.address,
    createdAt: req.user.createdAt,
    lastLogin: req.user.lastLogin,
    administratorId: req.user.administratorId,
    designation: req.user.designation,
    department: req.user.department,
  };
  let academicProfile = null;
  let overview = null;
  if (req.user.role === "student") {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (profile) {
      academicProfile = {
        rollNumber: profile.rollNumber,
        department: profile.department,
        className: profile.className,
        section: profile.section,
        year: profile.year,
        dateOfAdmission: profile.dateOfAdmission,
        guardianName: profile.guardianName,
        guardianRelationship: profile.guardianRelationship,
        guardianContact: profile.guardianContact,
        emergencyContact: profile.emergencyContact,
      };
    }
    const records = await Attendance.find({ student: req.user._id });
    const attended = records.filter((record) => record.status === "present").length;
    overview = {
      totalClasses: records.length,
      attended,
      missed: records.length - attended,
      percentage: records.length ? Math.round((attended / records.length) * 100) : 0,
    };
  } else if (req.user.role === "teacher") {
    const profile = await TeacherProfile.findOne({ user: req.user._id });
    if (profile) {
      academicProfile = {
        employeeId: profile.employeeId,
        department: profile.department,
        dateOfJoining: profile.dateOfJoining,
        designation: profile.designation,
        qualification: profile.qualification,
        specialization: profile.specialization,
        employmentStatus: profile.employmentStatus,
      };
    }
    const department = profile?.department;
    const studentCount = department
      ? await StudentProfile.countDocuments({ department })
      : 0;
    const noteCount = await Material.countDocuments({ teacher: req.user._id });
    const attendanceCount = await Attendance.countDocuments({ teacher: req.user._id });
    overview = { studentCount, noteCount, attendanceCount };
  }
  res.json({ profile: { account, academicProfile, overview } });
}

async function buildProfile(user) {
  const account = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    profilePhoto: user.profilePhoto,
    mobileNumber: user.mobileNumber,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    address: user.address,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    administratorId: user.administratorId,
    designation: user.designation,
    department: user.department,
  };
  let academicProfile = null;
  let overview = null;
  if (user.role === "student") {
    const profileRecord = await StudentProfile.findOne({ user: user._id });
    if (profileRecord)
      academicProfile = {
        rollNumber: profileRecord.rollNumber,
        department: profileRecord.department,
        className: profileRecord.className,
        section: profileRecord.section,
        year: profileRecord.year,
        dateOfAdmission: profileRecord.dateOfAdmission,
        guardianName: profileRecord.guardianName,
        guardianRelationship: profileRecord.guardianRelationship,
        guardianContact: profileRecord.guardianContact,
        emergencyContact: profileRecord.emergencyContact,
      };
    const records = await Attendance.find({ student: user._id });
    const attended = records.filter((record) => record.status === "present").length;
    overview = {
      totalClasses: records.length,
      attended,
      missed: records.length - attended,
      percentage: records.length ? Math.round((attended / records.length) * 100) : 0,
    };
  } else if (user.role === "teacher") {
    const profileRecord = await TeacherProfile.findOne({ user: user._id });
    if (profileRecord)
      academicProfile = {
        employeeId: profileRecord.employeeId,
        department: profileRecord.department,
        dateOfJoining: profileRecord.dateOfJoining,
        designation: profileRecord.designation,
        qualification: profileRecord.qualification,
        specialization: profileRecord.specialization,
        employmentStatus: profileRecord.employmentStatus,
      };
    const department = profileRecord?.department;
    const studentCount = department
      ? await StudentProfile.countDocuments({ department })
      : 0;
    const noteCount = await Material.countDocuments({ teacher: user._id });
    const attendanceCount = await Attendance.countDocuments({ teacher: user._id });
    overview = { studentCount, noteCount, attendanceCount };
  }
  return { account, academicProfile, overview };
}

async function canAccessProfile(actor, target) {
  if (actor.role === "admin") return true;
  if (actor._id.toString() === target._id.toString()) return true;
  if (actor.role === "teacher" && target.role === "student") {
    const teacherProfile = await TeacherProfile.findOne({ user: actor._id });
    const studentProfile = await StudentProfile.findOne({ user: target._id });
    return Boolean(
      teacherProfile?.department &&
        studentProfile?.department &&
        teacherProfile.department === studentProfile.department,
    );
  }
  return false;
}

export async function getUserProfile(req, res) {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: "User not found" });
  if (!(await canAccessProfile(req.user, target)))
    return res.status(403).json({ message: "Forbidden" });
  res.json({ profile: await buildProfile(target) });
}

export async function updateProfile(req, res) {
  const targetId = req.params.id || req.user._id;
  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: "User not found" });
  if (!(await canAccessProfile(req.user, target)))
    return res.status(403).json({ message: "Forbidden" });

  const allowedAccountFields =
    req.user.role === "admin"
      ? ["name", "mobileNumber", "dateOfBirth", "gender", "address", "designation", "department"]
      : ["name", "mobileNumber", "dateOfBirth", "gender", "address"];
  for (const field of allowedAccountFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field))
      target[field] = req.body[field];
  }
  target.name = String(target.name || "").trim();
  if (!target.name) return res.status(400).json({ message: "Full name is required" });
  await target.save();

  if (target.role === "student") {
    const updates = {};
    ["guardianName", "guardianRelationship", "guardianContact", "emergencyContact"]
      .forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field))
          updates[field] = req.body[field];
      });
    if (req.user.role === "admin") {
      ["department", "className", "section", "year", "dateOfAdmission"]
        .forEach((field) => {
          if (Object.prototype.hasOwnProperty.call(req.body, field))
            updates[field] = req.body[field];
        });
    }
    await StudentProfile.findOneAndUpdate(
      { user: target._id },
      updates,
      { new: true, runValidators: true },
    );
  } else if (target.role === "teacher" && req.user.role === "admin") {
    const updates = {};
    ["department", "designation", "qualification", "specialization", "dateOfJoining", "employmentStatus"]
      .forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(req.body, field))
          updates[field] = req.body[field];
      });
    await TeacherProfile.findOneAndUpdate(
      { user: target._id },
      updates,
      { new: true, runValidators: true },
    );
  }

  await ProfileAudit.create({
    actor: req.user._id,
    targetUser: target._id,
    action: "Profile updated",
    details: "Personal or permitted profile fields changed",
  });
  res.json({ profile: await buildProfile(target) });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!(await bcrypt.compare(currentPassword || "", user.passwordHash)))
    return res.status(400).json({ message: "Current password is incorrect" });
  if (!isValidPassword(newPassword))
    return res.status(400).json({
      message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  await ProfileAudit.create({
    actor: req.user._id,
    targetUser: req.user._id,
    action: "Password changed",
  });
  res.json({ message: "Password changed successfully" });
}

export async function updateProfilePhoto(req, res) {
  if (!req.file) return res.status(400).json({ message: "A profile photo is required" });
  const targetId = req.params.id || req.user._id;
  const target = await User.findById(targetId);
  if (!target) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ message: "User not found" });
  }
  if (!(await canAccessProfile(req.user, target))) {
    fs.unlinkSync(req.file.path);
    return res.status(403).json({ message: "Forbidden" });
  }
  if (target.profilePhoto) {
    const oldFile = path.join(uploadsDirectory, path.basename(target.profilePhoto));
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  }
  target.profilePhoto = `/uploads/${req.file.filename}`;
  await target.save();
  await ProfileAudit.create({
    actor: req.user._id,
    targetUser: target._id,
    action: "Profile photograph updated",
  });
  res.json({ profilePhoto: target.profilePhoto });
}
