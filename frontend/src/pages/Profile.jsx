import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const fileBaseUrl =
  (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
    /\/api\/?$/,
    "",
  );

export default function Profile({ embedded = false }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get("id");
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const loadProfile = () => {
    const url = targetId ? `/profiles/${targetId}` : "/auth/profile";
    api
      .get(url)
      .then((response) => {
        const loaded = response.data.profile;
        setProfile(loaded);
        setForm({
          name: loaded.account.name || "",
          mobileNumber: loaded.account.mobileNumber || "",
          dateOfBirth: loaded.account.dateOfBirth
            ? String(loaded.account.dateOfBirth).slice(0, 10)
            : "",
          gender: loaded.account.gender || "",
          address: loaded.account.address || "",
          designation: loaded.account.designation || "",
          department: loaded.account.department || "",
          guardianName: loaded.academicProfile?.guardianName || "",
          guardianRelationship:
            loaded.academicProfile?.guardianRelationship || "",
          guardianContact: loaded.academicProfile?.guardianContact || "",
          emergencyContact: loaded.academicProfile?.emergencyContact || "",
        });
      })
      .catch((error) =>
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Unable to load profile.",
        }),
      );
  };

  useEffect(() => {
    loadProfile();
  }, [targetId]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      const url = targetId ? `/profiles/${targetId}` : "/auth/profile";
      const response = await api.patch(url, form);
      setProfile(response.data.profile);
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to update profile.",
      });
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      const response = await api.post("/auth/profile/password", password);
      setPassword({ currentPassword: "", newPassword: "" });
      setMessage({ type: "success", text: response.data.message });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to change password.",
      });
    } finally {
      setBusy(false);
    }
  };

  const uploadPhoto = async (event) => {
    event.preventDefault();
    if (!photo) return;
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("photo", photo);
      const url = targetId
        ? `/profiles/${targetId}/photo`
        : "/auth/profile/photo";
      const response = await api.post(url, formData);
      setProfile((current) => ({
        ...current,
        account: {
          ...current.account,
          profilePhoto: response.data.profilePhoto,
        },
      }));
      setPhoto(null);
      setMessage({ type: "success", text: "Profile photograph updated." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to upload photograph.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!profile) {
    return (
      <div className={embedded ? "profile-page profile-page-embedded" : "profile-page"}>
        <p className="muted">Loading profile…</p>
        {message.text && <p className="form-error">{message.text}</p>}
      </div>
    );
  }

  const account = profile.account;
  const academic = profile.academicProfile;
  const isOwnProfile = !targetId;

  return (
    <div className="profile-page">
      <div className="profile-header-card card">
        {account.profilePhoto ? (
          <img
            className="profile-photo"
            src={`${fileBaseUrl}${account.profilePhoto}`}
            alt={`${account.name} profile`}
          />
        ) : (
          <div className="profile-avatar profile-avatar-large">
            {account.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ margin: 0 }}>{account.name}</h1>
          <p className="muted" style={{ margin: "5px 0" }}>
            {account.role.charAt(0).toUpperCase() + account.role.slice(1)}
          </p>
          <span className="pill">{account.status}</span>
        </div>
        {isOwnProfile || user.role === "admin" ? (
          <button
            type="button"
            className="btn"
            onClick={() => setEditing((current) => !current)}
          >
            {editing ? "Cancel Editing" : "Edit Profile"}
          </button>
        ) : null}
      </div>

      {editing ? (
        <form className="card profile-section" onSubmit={saveProfile}>
          <h3>Personal Information</h3>
          <div className="profile-form-grid">
            <label>
              Full name
              <input
                className="field"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Mobile number
              <input
                className="field"
                value={form.mobileNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mobileNumber: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Date of birth
              <input
                className="field"
                type="date"
                value={form.dateOfBirth}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Gender
              <select
                className="field"
                value={form.gender}
                onChange={(event) =>
                  setForm((current) => ({ ...current, gender: event.target.value }))
                }
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Residential address
              <textarea
                className="field"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </label>
            {account.role === "student" && (
              <>
                <label>
                  Parent or guardian name
                  <input
                    className="field"
                    value={form.guardianName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        guardianName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Relationship
                  <input
                    className="field"
                    value={form.guardianRelationship}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        guardianRelationship: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Guardian contact
                  <input
                    className="field"
                    value={form.guardianContact}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        guardianContact: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Emergency contact
                  <input
                    className="field"
                    value={form.emergencyContact}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        emergencyContact: event.target.value,
                      }))
                    }
                  />
                </label>
              </>
            )}
            {account.role === "admin" && (
              <>
                <label>
                  Designation
                  <input
                    className="field"
                    value={form.designation}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        designation: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Department
                  <input
                    className="field"
                    value={form.department}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        department: event.target.value,
                      }))
                    }
                  />
                </label>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" disabled={busy}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: "#738096" }}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="profile-sections">
        <section className="card profile-section">
          <h3>Personal Information</h3>
          <div className="profile-grid">
            <span><strong>Full name:</strong> {account.name}</span>
            <span><strong>Email:</strong> {account.email}</span>
            <span><strong>Mobile:</strong> {account.mobileNumber || "Not provided"}</span>
            <span><strong>Date of birth:</strong> {account.dateOfBirth ? new Date(account.dateOfBirth).toLocaleDateString() : "Not provided"}</span>
            <span><strong>Gender:</strong> {account.gender || "Not provided"}</span>
            <span><strong>Address:</strong> {account.address || "Not provided"}</span>
            <span><strong>Account created:</strong> {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : "—"}</span>
            <span><strong>Status:</strong> {account.status}</span>
            {account.lastLogin && (
              <span><strong>Last login:</strong> {new Date(account.lastLogin).toLocaleString()}</span>
            )}
          </div>
        </section>

        {account.role === "student" && academic && (
          <section className="card profile-section">
            <h3>Academic Information</h3>
            <div className="profile-grid">
              <span><strong>Student ID:</strong> {academic.rollNumber}</span>
              <span><strong>Department:</strong> {academic.department || "—"}</span>
              <span><strong>Class:</strong> {academic.className || "—"}</span>
              <span><strong>Section:</strong> {academic.section || "—"}</span>
              <span><strong>Academic year:</strong> {academic.year || "—"}</span>
              <span><strong>Date of admission:</strong> {academic.dateOfAdmission ? new Date(academic.dateOfAdmission).toLocaleDateString() : "—"}</span>
            </div>
            <h4>Six Common Subjects</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Telugu", "Hindi", "English", "Mathematics", "Science", "Social Studies"].map((subject) => (
                <span className="pill" key={subject}>{subject}</span>
              ))}
            </div>
            {profile.overview && (
              <>
                <h4>Academic Overview</h4>
                <p className="muted">
                  Overall attendance: {profile.overview.percentage}% ({profile.overview.attended} attended, {profile.overview.missed} missed)
                </p>
              </>
            )}
          </section>
        )}

        {account.role === "student" && academic && (
          <section className="card profile-section">
            <h3>Parent or Guardian</h3>
            <div className="profile-grid">
              <span><strong>Name:</strong> {academic.guardianName || "Not provided"}</span>
              <span><strong>Relationship:</strong> {academic.guardianRelationship || "Not provided"}</span>
              <span><strong>Contact:</strong> {academic.guardianContact || "Not provided"}</span>
              <span><strong>Emergency contact:</strong> {academic.emergencyContact || "Not provided"}</span>
            </div>
          </section>
        )}

        {account.role === "teacher" && academic && (
          <section className="card profile-section">
            <h3>Professional Information</h3>
            <div className="profile-grid">
              <span><strong>Teacher ID:</strong> {academic.employeeId}</span>
              <span><strong>Department:</strong> {academic.department || "—"}</span>
              <span><strong>Designation:</strong> {academic.designation || "—"}</span>
              <span><strong>Qualification:</strong> {academic.qualification || "—"}</span>
              <span><strong>Specialization:</strong> {academic.specialization || "—"}</span>
              <span><strong>Date of joining:</strong> {academic.dateOfJoining ? new Date(academic.dateOfJoining).toLocaleDateString() : "—"}</span>
              <span><strong>Employment status:</strong> {academic.employmentStatus || "—"}</span>
            </div>
            {profile.overview && (
              <p className="muted">
                {profile.overview.studentCount} students · {profile.overview.noteCount} uploaded notes · {profile.overview.attendanceCount} attendance records
              </p>
            )}
          </section>
        )}

        {account.role === "admin" && (
          <section className="card profile-section">
            <h3>Administrator Information</h3>
            <div className="profile-grid">
              <span><strong>Administrator ID:</strong> {account.administratorId || "Not assigned"}</span>
              <span><strong>Designation:</strong> {account.designation || "—"}</span>
              <span><strong>Department:</strong> {account.department || "—"}</span>
            </div>
          </section>
        )}

        <section className="card profile-section">
          <h3>Profile Photograph</h3>
          <form onSubmit={uploadPhoto}>
            <input
              className="field"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(event) => setPhoto(event.target.files?.[0] || null)}
            />
            <button className="btn" disabled={busy || !photo}>
              Upload Photograph
            </button>
          </form>
        </section>

        {isOwnProfile && (
          <section className="card profile-section">
            <h3>Change Password</h3>
            <form onSubmit={changePassword} className="profile-form-grid">
              <label>
                Current password
                <input
                  className="field"
                  type="password"
                  value={password.currentPassword}
                  onChange={(event) =>
                    setPassword((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                New password
                <input
                  className="field"
                  type="password"
                  minLength={4}
                  value={password.newPassword}
                  onChange={(event) =>
                    setPassword((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <button className="btn" disabled={busy}>
                Change Password
              </button>
            </form>
          </section>
        )}
      </div>

      {message.text && (
        <p className={message.type === "success" ? "form-success" : "form-error"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
