# Student Management System

A full-stack role-based student management application built with React, Vite, Express, and MongoDB.

## Features

### Authentication and profiles
- Separate Student, Teacher, and Administrator accounts
- JWT access tokens with refresh cookies
- Account status handling
- Role-based profile access
- Editable personal, guardian, teacher, and administrator profile fields
- Profile photograph upload
- Secure password change
- Profile update audit records

### Student workspace
- View period-wise attendance for Class 1 through Class 6
- View overall and monthly attendance summaries
- View date-wise attendance history
- Browse the six common subjects:
  - Telugu
  - Hindi
  - English
  - Mathematics
  - Science
  - Social Studies
- View and download teacher-uploaded PDF, DOC, and DOCX notes
- View active announcements

### Teacher workspace
- Automatically access students in the teacher's department
- Search department students
- Mark Present or Absent for each of six daily periods
- Mark all department students Present
- Correct previously submitted attendance
- Upload study notes for the six common subjects
- Edit note details and delete owned notes

### Administrator workspace
- Add and remove Student or Teacher accounts
- Publish announcements
- Announcements remain visible for 7 days
- Manage account status and relevant profile information
- Access student and teacher profiles

### Workspace navigation
All navigation is role-specific and displayed in the right-side workspace panel:

- Student: Attendance, Notes, Profile
- Teacher: Mark Attendance, Upload Notes, Profile
- Administrator: Add User, Remove User, Announcement, Profile

Profile does not open a separate page inside the workspace. It renders as the active right-side tab. The direct `/profile` route remains available for standalone profile access.

## Technology

- Frontend: React 18, Vite, React Router, Axios, Tailwind CSS utilities, Lucide icons
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas or compatible MongoDB database
- Authentication: JWT access and refresh tokens
- File storage: Local `backend/uploads` directory

## Project Structure

```text
StudentManagementSystem/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── seedAdmin.js
│   │   └── server.js
│   ├── uploads/
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Requirements

- Node.js 20 or newer
- MongoDB Atlas or local MongoDB
- A modern desktop, tablet, or mobile browser

## Backend Setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Configure `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=your-mongodb-uri
JWT_ACCESS_SECRET=at-least-32-random-characters
JWT_REFRESH_SECRET=another-32-character-random-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisPassword
```

Start the backend:

```powershell
npm run dev
```

The API runs at `http://localhost:5000`.

Create the initial administrator:

```powershell
npm run seed:admin
```

Password requirements are intentionally lightweight and currently require at least 4 characters.

## Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend uses `http://localhost:5000/api` by default. It can be changed with `VITE_API_URL`.

Build for production:

```powershell
npm run build
npm run preview
```

## Main API Areas

- `/api/auth/*` - Login, refresh, logout, and profile operations
- `/api/admin/*` - User and account administration
- `/api/teacher/*` - Department students, subjects, and attendance
- `/api/student/*` - Attendance and subject enrollment
- `/api/materials` - Study note upload, update, download metadata, and deletion
- `/api/attendance` - Period-based attendance records
- `/api/announcements` - Active, non-expired announcements
- `/api/profiles/:id` - Administrator or department-authorized profile access
- `/uploads/*` - Uploaded study materials and profile photographs

## Attendance Rules

- One attendance record represents one student, date, and class period.
- Each student can have six entries per date.
- Duplicate entries are prevented by the unique student/date/period index.
- Teachers may only mark students in their configured department.
- Attendance status is either `present` or `absent`.

## Announcement Expiry

Only administrators can publish announcements. The API returns announcements whose `createdAt` timestamp is within the previous 7 days.

## Security Notes

- Do not commit real database credentials or JWT secrets.
- Use strong production secrets and HTTPS.
- In production, configure MongoDB Atlas network access to the deployed server.
- Uploaded files are stored in `backend/uploads`; production deployments should use persistent storage or object storage.
- Sensitive profile and academic fields are protected by backend role checks.
