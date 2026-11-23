import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  FilePlus2,
  GraduationCap,
  LogOut,
  Megaphone,
  UserPlus,
  UserMinus,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import TeacherWorkspace from "../components/TeacherWorkspace";
import StudentWorkspace from "../components/StudentWorkspace";
import Profile from "./Profile";

const tabsByRole = {
  student: [
    ["attendance", "Attendance", ClipboardCheck],
    ["notes", "Notes", FilePlus2],
    ["profile", "Profile", UserRound],
  ],
  teacher: [
    ["attendance", "Mark Attendance", ClipboardCheck],
    ["notes", "Upload Notes", FilePlus2],
    ["profile", "Profile", UserRound],
  ],
  admin: [
    ["add", "Add User", UserPlus],
    ["remove", "Remove User", UserMinus],
    ["announcement", "Announcement", Megaphone],
    ["profile", "Profile", UserRound],
  ],
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const tabs = tabsByRole[user.role] || [];
  const [activeTab, setActiveTab] = useState(tabs[0]?.[0] || "");
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [formStatus, setFormStatus] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
  });
  const [form, setForm] = useState({
    role: "student",
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    department: "",
    year: "",
    className: "",
    section: "",
    employeeId: "",
  });

  useEffect(() => {
    setActiveTab(tabsByRole[user.role]?.[0]?.[0] || "");
  }, [user.role]);

  useEffect(() => {
    if (user.role === "admin") {
      loadUsers();
      loadAnnouncements();
    }
  }, [user.role]);

  const loadUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.users);
    } catch {
      setUsers([]);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const response = await api.get("/announcements");
      setAnnouncements(response.data.announcements);
    } catch {
      setAnnouncements([]);
    }
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitAddUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormStatus({ type: "", text: "" });
    const profile =
      form.role === "student"
        ? {
            rollNumber: form.rollNumber,
            department: form.department,
            year: form.year ? Number(form.year) : undefined,
            className: form.className,
            section: form.section,
          }
        : { employeeId: form.employeeId, department: form.department };
    try {
      await api.post("/admin/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        profile,
      });
      setFormStatus({
        type: "success",
        text: `${form.role === "student" ? "Student" : "Teacher"} added successfully.`,
      });
      setForm({
        role: form.role,
        name: "",
        email: "",
        password: "",
        rollNumber: "",
        department: "",
        year: "",
        className: "",
        section: "",
        employeeId: "",
      });
      await loadUsers();
    } catch (error) {
      setFormStatus({
        type: "error",
        text: error.response?.data?.message || "Unable to add the user.",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (account) => {
    if (
      !window.confirm(
        `Delete ${account.role} "${account.name}"? This removes related academic records.`,
      )
    )
      return;
    try {
      await api.delete(`/admin/users/${account._id}`);
      setFormStatus({ type: "success", text: "User deleted successfully." });
      await loadUsers();
    } catch (error) {
      setFormStatus({
        type: "error",
        text: error.response?.data?.message || "Unable to delete the user.",
      });
    }
  };

  const createAnnouncement = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormStatus({ type: "", text: "" });
    try {
      await api.post("/announcements", announcementForm);
      setAnnouncementForm({ title: "", content: "" });
      setFormStatus({
        type: "success",
        text: "Announcement published for 7 days.",
      });
      await loadAnnouncements();
    } catch (error) {
      setFormStatus({
        type: "error",
        text: error.response?.data?.message || "Unable to publish announcement.",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
  };

  const renderRightPanel = () => {
    if (activeTab === "profile")
      return <Profile embedded />;
    if (user.role === "student") {
      if (activeTab === "attendance")
        return <StudentWorkspace activeView="attendance" />;
      if (activeTab === "notes")
        return <StudentWorkspace activeView="notes" />;
    }
    if (user.role === "teacher") {
      if (activeTab === "attendance")
        return <TeacherWorkspace activeView="attendance" />;
      if (activeTab === "notes")
        return <TeacherWorkspace activeView="notes" />;
    }
    if (user.role === "admin" && activeTab === "add") {
      return (
        <div className="card workspace-view">
          <h2>Add User</h2>
          <form className="user-form" onSubmit={submitAddUser}>
            <label>
              Account type
              <select className="field" name="role" value={form.role} onChange={updateForm}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </label>
            <label>
              Full name
              <input className="field" name="name" value={form.name} onChange={updateForm} required />
            </label>
            <label>
              Email address
              <input className="field" type="email" name="email" value={form.email} onChange={updateForm} required />
            </label>
            <label>
              Password
              <input className="field" type="password" name="password" value={form.password} onChange={updateForm} minLength={4} required />
            </label>
            {form.role === "student" ? (
              <>
                <label>Roll number<input className="field" name="rollNumber" value={form.rollNumber} onChange={updateForm} required /></label>
                <label>Department<input className="field" name="department" value={form.department} onChange={updateForm} /></label>
                <label>Class<input className="field" name="className" value={form.className} onChange={updateForm} /></label>
                <label>Section<input className="field" name="section" value={form.section} onChange={updateForm} /></label>
                <label>Year<input className="field" type="number" min="1" name="year" value={form.year} onChange={updateForm} /></label>
              </>
            ) : (
              <>
                <label>Employee ID<input className="field" name="employeeId" value={form.employeeId} onChange={updateForm} required /></label>
                <label>Department<input className="field" name="department" value={form.department} onChange={updateForm} /></label>
              </>
            )}
            {formStatus.text && (
              <p className={formStatus.type === "success" ? "form-success" : "form-error"}>{formStatus.text}</p>
            )}
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Adding…" : `Add ${form.role}`}
            </button>
          </form>
        </div>
      );
    }
    if (user.role === "admin" && activeTab === "remove") {
      return (
        <div className="card workspace-view">
          <h2>Remove User</h2>
          {formStatus.text && (
            <p className={formStatus.type === "success" ? "form-success" : "form-error"}>{formStatus.text}</p>
          )}
          {users.length ? (
            <div className="user-table-wrap">
              <table className="table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {users.filter((account) => account.role !== "admin").map((account) => (
                    <tr key={account._id}>
                      <td>{account.name}</td>
                      <td>{account.email}</td>
                      <td><span className="pill">{account.role}</span></td>
                      <td>{account.status}</td>
                      <td>
                        <button type="button" className="btn" style={{ background: "#9b4938" }} onClick={() => deleteUser(account)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No students or teachers found.</p>
          )}
        </div>
      );
    }
    if (user.role === "admin" && activeTab === "announcement") {
      return (
        <div className="card workspace-view">
          <h2>Announcement</h2>
          <form onSubmit={createAnnouncement}>
            <label>Title<input className="field" value={announcementForm.title} onChange={(event) => setAnnouncementForm((current) => ({ ...current, title: event.target.value }))} required /></label>
            <label>Content<textarea className="field" value={announcementForm.content} onChange={(event) => setAnnouncementForm((current) => ({ ...current, content: event.target.value }))} required /></label>
            {formStatus.text && <p className={formStatus.type === "success" ? "form-success" : "form-error"}>{formStatus.text}</p>}
            <button className="btn" disabled={saving}>{saving ? "Publishing…" : "Publish Announcement"}</button>
          </form>
          <div style={{ marginTop: 22 }}>
            <h3>Active announcements</h3>
            {announcements.length ? announcements.map((announcement) => (
              <div className="announcement-item" key={announcement._id}>
                <strong>{announcement.title}</strong>
                <p className="muted">{announcement.content}</p>
                <small className="muted">Published {new Date(announcement.createdAt).toLocaleString()}</small>
              </div>
            )) : <p className="muted">No active announcements.</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="shell workspace-shell">
      <aside className="sidebar">
        <div className="brand">Campus LMS</div>
        <nav className="nav" aria-label="Workspace navigation">
          {tabs.map(([id, label, Icon]) => (
            <button
              type="button"
              key={id}
              className={activeTab === id ? "active" : ""}
              onClick={() => selectTab(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <button type="button" className="logout-button" onClick={logout}>
          <LogOut size={17} /> Sign out
        </button>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <strong>{tabsByRole[user.role]?.find(([id]) => id === activeTab)?.[1] || "Workspace"}</strong>
            <div className="muted" style={{ fontSize: 12 }}>
              {user.role} workspace
            </div>
          </div>
          <button type="button" className="topbar-profile" onClick={() => setActiveTab("profile")}>
            <UserRound size={17} />
            <strong>{user.name}</strong>
          </button>
        </header>
        <section className="content workspace-content">
          {renderRightPanel()}
        </section>
      </main>
    </div>
  );
}
