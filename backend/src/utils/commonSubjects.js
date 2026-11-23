import {
  StudentProfile,
  Subject,
  StudentSubjectEnrollment,
} from "../models/Academic.js";
import User from "../models/User.js";

export const COMMON_SUBJECT_NAMES = [
  "Telugu",
  "Hindi",
  "English",
  "Mathematics",
  "Science",
  "Social Studies",
];

export async function ensureCommonSubjects() {
  const subjects = [];

  for (const name of COMMON_SUBJECT_NAMES) {
    const subject = await Subject.findOneAndUpdate(
      { name },
      {
        name,
        code: name.toLowerCase().replace(/\s+/g, "-"),
        mandatory: true,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    subjects.push(subject);
  }

  const students = await User.find({ role: "student" }).select("_id");
  for (const student of students) {
    await enrollStudentInCommonSubjects(student._id, subjects);
  }

  return subjects;
}

export async function enrollStudentInCommonSubjects(studentId, subjects) {
  const commonSubjects =
    subjects ||
    (await Subject.find({
      name: { $in: COMMON_SUBJECT_NAMES },
      mandatory: true,
    }).sort({ name: 1 }));

  await Promise.all(
    commonSubjects.map((subject) =>
      StudentSubjectEnrollment.findOneAndUpdate(
        { student: studentId, subject: subject._id },
        { student: studentId, subject: subject._id, mandatory: true },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    ),
  );

  await StudentProfile.findOneAndUpdate(
    { user: studentId },
    { $addToSet: { commonSubjects: { $each: commonSubjects.map((subject) => subject._id) } } },
  );

  return commonSubjects;
}
