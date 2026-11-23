import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const COMMON_SUBJECTS = [
  "Telugu",
  "Hindi",
  "English",
  "Mathematics",
  "Science",
  "Social Studies",
];
const periods = Array.from({ length: 6 }, (_, index) => index + 1);
const fileBaseUrl =
  (import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? "" : "http://localhost:5000/api")).replace(
    /\/api\/?$/,
    "",
  );

export default function StudentWorkspace({ activeView = "attendance" }) {
  const [attendance, setAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    periods: [],
    overall: { total: 0, attended: 0, absent: 0, percentage: 0 },
  });
  const [materials, setMaterials] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("Telugu");
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/student/attendance"),
      api.get("/student/attendance/summary"),
      api.get("/materials"),
    ])
      .then(
        ([attendanceResponse, summaryResponse, materialResponse]) => {
          setAttendance(attendanceResponse.data.records);
          setAttendanceSummary(summaryResponse.data);
          setMaterials(materialResponse.data.materials);
        },
      )
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ||
            "Unable to load attendance and study notes.",
        ),
      );
  }, []);

  const monthlyRecords = useMemo(
    () =>
      attendance.filter((record) =>
        new Date(record.date).toISOString().slice(0, 7) === month,
      ),
    [attendance, month],
  );
  const monthlyAttended = monthlyRecords.filter(
    (record) => record.status === "present",
  ).length;
  const monthlyTotal = monthlyRecords.length;

  const subjectNotes = materials
    .filter((material) => material.subject?.name === selectedSubject)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="student-workspace">
      {activeView === "attendance" && <div className="card">
        <h3 style={{ marginTop: 0 }}>My Attendance</h3>
        <div className="attendance-overall">
          <span>Overall attendance</span>
          <strong>{attendanceSummary.overall.percentage}%</strong>
          <small>
            {attendanceSummary.overall.attended} attended ·{" "}
            {attendanceSummary.overall.absent} absent ·{" "}
            {attendanceSummary.overall.total} total classes
          </small>
        </div>

        <div className="subject-grid">
          {periods.map((period) => {
            const summary = attendanceSummary.periods?.find(
              (item) => item.period === period,
            ) || { total: 0, attended: 0, absent: 0, percentage: 0 };
            return (
              <div className="subject-card" key={period}>
                <strong>Class {period}</strong>
                <span>{summary.percentage}% attendance</span>
                <small>
                  {summary.attended} attended · {summary.absent} absent
                </small>
              </div>
            );
          })}
        </div>

        <h4 style={{ marginBottom: 8 }}>Date-wise Attendance</h4>
        {attendance.length ? (
          <div className="user-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Teacher</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>Class {record.period}</td>
                    <td>
                      <span className={`status-${record.status}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.teacher?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No attendance records yet.</p>
        )}

        <div className="attendance-detail" style={{ marginTop: 18 }}>
          <h4>Monthly Attendance Summary</h4>
          <label>
            Month
            <input
              className="field"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </label>
          <p>
            <strong>{monthlyAttended}</strong> attended out of{" "}
            <strong>{monthlyTotal}</strong> scheduled period entries
            {monthlyTotal
              ? ` (${Math.round((monthlyAttended / monthlyTotal) * 100)}%)`
              : " (0%)"}
          </p>
        </div>
      </div>}

      {activeView === "notes" && <div className="card">
        <h3 style={{ marginTop: 0 }}>Study Notes</h3>
        <div className="subject-grid">
          {COMMON_SUBJECTS.map((name) => (
            <button
              type="button"
              className={`subject-card ${selectedSubject === name ? "active" : ""}`}
              key={name}
              onClick={() => setSelectedSubject(name)}
            >
              <strong>{name}</strong>
              <small>View study notes</small>
            </button>
          ))}
        </div>
        <h4>{selectedSubject}</h4>
        {subjectNotes.length ? (
          subjectNotes.map((material) => (
            <div className="note-item" key={material._id}>
              <div>
                <strong>{material.title}</strong>
                <p className="muted" style={{ margin: "5px 0" }}>
                  {material.description || "No description"}
                </p>
                <small className="muted">
                  {material.teacher?.name
                    ? `By ${material.teacher.name} · `
                    : ""}
                  Uploaded {new Date(material.createdAt).toLocaleDateString()}
                  {material.fileName ? ` · ${material.fileName}` : ""}
                </small>
              </div>
              <a
                className="btn"
                href={`${fileBaseUrl}${material.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                download
              >
                Download
              </a>
            </div>
          ))
        ) : (
          <p className="muted">No notes uploaded yet.</p>
        )}
      </div>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
