import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    profilePhoto: { type: String, default: "" },
    mobileNumber: { type: String, default: "", maxlength: 30 },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ["", "Male", "Female", "Other"], default: "" },
    address: { type: String, default: "", maxlength: 500 },
    administratorId: { type: String, default: "", trim: true },
    designation: { type: String, default: "", maxlength: 100 },
    department: { type: String, default: "", maxlength: 100 },
    lastLogin: { type: Date, default: null },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      required: true,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
