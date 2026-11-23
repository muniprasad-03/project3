import mongoose from "mongoose";
const { Schema, model } = mongoose;

export const StudentProfile = model(
  "StudentProfile",
  new Schema(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },
      rollNumber: { type: String, required: true, unique: true },
      department: String,
      className: String,
      section: String,
      year: Number,
      dateOfAdmission: { type: Date, default: null },
      guardianName: { type: String, default: "", maxlength: 100 },
      guardianRelationship: { type: String, default: "", maxlength: 50 },
      guardianContact: { type: String, default: "", maxlength: 30 },
      emergencyContact: { type: String, default: "", maxlength: 30 },
      commonSubjects: [
        {
          type: Schema.Types.ObjectId,
          ref: "Subject",
        },
      ],
    },
    { timestamps: true },
  ),
);

export const TeacherProfile = model(
  "TeacherProfile",
  new Schema(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },
      employeeId: { type: String, required: true, unique: true },
      department: String,
      dateOfJoining: { type: Date, default: null },
      designation: { type: String, default: "", maxlength: 100 },
      qualification: { type: String, default: "", maxlength: 200 },
      specialization: { type: String, default: "", maxlength: 200 },
      employmentStatus: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
      },
    },
    { timestamps: true },
  ),
);

export const Subject = model(
  "Subject",
  new Schema(
    {
      name: { type: String, required: true },
      code: { type: String, required: true },
      mandatory: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);

export const StudentSubjectEnrollment = model(
  "StudentSubjectEnrollment",
  new Schema(
    {
      student: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      subject: {
        type: Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
      },
      mandatory: { type: Boolean, default: false },
    },
    { timestamps: true },
  ).index({ student: 1, subject: 1 }, { unique: true }),
);

export const Attendance = model(
  "Attendance",
  new Schema(
    {
      student: { type: Schema.Types.ObjectId, ref: "User", required: true },
      teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
      department: { type: String, required: true },
      period: { type: Number, required: true, min: 1, max: 6 },
      subject: { type: Schema.Types.ObjectId, ref: "Subject", required: false },
      date: { type: Date, required: true },
      status: {
        type: String,
        enum: ["present", "absent"],
        required: true,
      },
    },
    { timestamps: true },
  ).index({ student: 1, date: 1, period: 1 }, { unique: true }),
);

export const Material = model(
  "Material",
  new Schema(
    {
      title: { type: String, required: true },
      description: String,
      fileUrl: { type: String, required: true },
      fileName: String,
      mimeType: String,
      size: Number,
      teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
      department: { type: String, required: true },
      subject: { type: Schema.Types.ObjectId, ref: "Subject", required: false },
    },
    { timestamps: true },
  ),
);

export const Announcement = model(
  "Announcement",
  new Schema(
    {
      title: { type: String, required: true },
      content: { type: String, required: true },
      author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true },
  ),
);

export const ProfileAudit = model(
  "ProfileAudit",
  new Schema(
    {
      actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
      targetUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
      action: { type: String, required: true, maxlength: 100 },
      details: { type: String, default: "", maxlength: 1000 },
    },
    { timestamps: true },
  ),
);
