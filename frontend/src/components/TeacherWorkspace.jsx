import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const today = new Date().toISOString().slice(0, 10);
const periods = Array.from({ length: 6 }, (_, index) => index + 1);
const fileBaseUrl =
  (import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? "" : "http://localhost:5000/api")).replace(
    /\/api\/?$/,
    "",
  );

export default function TeacherWorkspace({ activeView = "attendance" }) {
  const [department, setDepartment] = useState("");
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [period, setPeriod] = useState("1");
  const [date, setDate] = useState(today);
  const [statuses, setStatuses] = useState({});
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [note, setNote] = useState({
    subject: "",
    title: "",
    description: "",
    file: null,
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/teacher/students"),
      api.get("/teacher/subjects"),
      api.get("/materials"),
    ])
      .then(([studentResponse, subjectResponse, materialResponse]) => {
        const departmentStudents = studentResponse.data.students;
        setDepartment(studentResponse.data.department);
        setStudents(departmentStudents);
        setStatuses(
          Object.fromEntries(
            departmentStudents.map((student) => [student.id, "present"]),
          ),
        );
        setSubjects(subjectResponse.data.subjects);
        if (subjectResponse.data.subjects[0])
          setNote((current) => ({
            ...current,
            subject: subjectResponse.data.subjects[0]._id,
          }));
        setMaterials(materialResponse.data.materials);
      })
      .catch((error) =>
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Unable to load teacher data.",
        }),
      );
  }, []);

  useEffect(() => {
    api
      .get("/teacher/attendance", { params: { date, period } })
      .then((response) => setAttendanceHistory(response.data.records))
      .catch(() => setAttendanceHistory([]));
  }, [date, period]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      [student.name, student.email, student.rollNumber, student.className, student.section]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [students, studentSearch]);

  const markAllPresent = () =>
    setStatuses(
      Object.fromEntries(students.map((student) => [student.id, "present"])),
    );

  return (
    <div>
      {activeView === "attendance" && (
      <>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Mark Attendance</h3>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!students.length) return;
            setBusy(true);
            setMessage({ type: "", text: "" });
            try {
              await Promise.all(
                students.map((student) =>
                  api.post("/attendance", {
                    student: student.id,
                    date,
                    period: Number(period),
                    status: statuses[student.id] || "present",
                  }),
                ),
              );
              setMessage({ type: "success", text: "Attendance saved successfully." });
              const history = await api.get("/teacher/attendance", {
                params: { date, period },
              });
              setAttendanceHistory(history.data.records);
            } catch (error) {
              setMessage({
                type: "error",
                text: error.response?.data?.message || "Unable to save attendance.",
              });
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="attendance-controls">
            <label>
              Date
              <input
                className="field"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </label>
            <label>
              Class Period
              <select
                className="field"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                required
              >
                {periods.map((item) => (
                  <option key={item} value={item}>
                    Class {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="btn" onClick={markAllPresent}>
            Mark All Present
          </button>
          {filteredStudents.length ? (
            <div className="user-table-wrap" style={{ marginTop: 12 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.className || "—"}</td>
                      <td>{student.section || "—"}</td>
                      <td>
                        <select
                          className="field"
                          value={statuses[student.id] || "present"}
                          onChange={(event) =>
                            setStatuses((current) => ({
                              ...current,
                              [student.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No students available for attendance.</p>
          )}
          <button className="btn" disabled={busy || !students.length}>
            {busy ? "Saving…" : "Save Attendance"}
          </button>
        </form>
      </div>

      {attendanceHistory.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>Previous Attendance</h3>
          <div className="user-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record) => (
                  <tr key={record._id}>
                    <td>{record.student?.name || "Student"}</td>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>Class {record.period}</td>
                    <td>
                      <span className={`status-${record.status}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn"
                        onClick={async () => {
                          try {
                            const next =
                              record.status === "present" ? "absent" : "present";
                            await api.patch(`/attendance/${record._id}`, {
                              status: next,
                            });
                            setAttendanceHistory((current) =>
                              current.map((item) =>
                                item._id === record._id
                                  ? { ...item, status: next }
                                  : item,
                              ),
                            );
                          } catch (error) {
                            setMessage({
                              type: "error",
                              text:
                                error.response?.data?.message ||
                                "Unable to update attendance.",
                            });
                          }
                        }}
                      >
                        Mark {record.status === "present" ? "Absent" : "Present"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {activeView === "notes" && (
      <>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Upload Study Notes</h3>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!note.subject || !note.file) {
              setMessage({ type: "error", text: "Select a subject and file." });
              return;
            }
            setBusy(true);
            try {
              const formData = new FormData();
              formData.append("subject", note.subject);
              formData.append("title", note.title);
              formData.append("description", note.description);
              formData.append("file", note.file);
              const response = await api.post("/materials", formData);
              setMaterials((current) => [response.data.material, ...current]);
              setNote((current) => ({
                ...current,
                title: "",
                description: "",
                file: null,
              }));
              setMessage({ type: "success", text: "Study note uploaded." });
            } catch (error) {
              setMessage({
                type: "error",
                text: error.response?.data?.message || "Unable to upload note.",
              });
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Subject
            <select
              className="field"
              value={note.subject}
              onChange={(event) =>
                setNote((current) => ({ ...current, subject: event.target.value }))
              }
              required
            >
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              className="field"
              value={note.title}
              onChange={(event) =>
                setNote((current) => ({ ...current, title: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Description
            <textarea
              className="field"
              value={note.description}
              onChange={(event) =>
                setNote((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Study material
            <input
              className="field"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(event) =>
                setNote((current) => ({
                  ...current,
                  file: event.target.files?.[0] || null,
                }))
              }
              required
            />
          </label>
          <button className="btn" disabled={busy}>
            {busy ? "Uploading…" : "Upload Note"}
          </button>
        </form>
      </div>

      {materials.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ marginTop: 0 }}>Uploaded Notes</h3>
          {materials.map((material) => (
            <div className="note-item" key={material._id}>
              <div>
                <a
                  href={`${fileBaseUrl}${material.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {material.title}
                </a>
                <div className="muted" style={{ fontSize: 13 }}>
                  {material.subject?.name} ·{" "}
                  {new Date(material.createdAt).toLocaleDateString()}
                  {material.fileName ? ` · ${material.fileName}` : ""}
                </div>
              </div>
              <button
                type="button"
                className="btn"
                style={{ background: "#b43c3c" }}
                onClick={async () => {
                  if (!window.confirm(`Delete "${material.title}"?`)) return;
                  try {
                    await api.delete(`/materials/${material._id}`);
                    setMaterials((current) =>
                      current.filter((item) => item._id !== material._id),
                    );
                    setMessage({ type: "success", text: "Note deleted." });
                  } catch (error) {
                    setMessage({
                      type: "error",
                      text:
                        error.response?.data?.message ||
                        "Unable to delete note.",
                    });
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      {message.text && (
        <p className={message.type === "success" ? "form-success" : "form-error"}>
          {message.text}
        </p>
      )}
      </>
      )}
    </div>
  );
}
