# 🏛️ PMC Portal — Local Municipal Grievance & Announcements System

A full-stack MERN web application that enables citizens to file grievances with the Pune Municipal Corporation and receive real-time updates. Admins can manage complaints and broadcast area-specific announcements.

---

## 📸 Overview

| Role | Features |
|---|---|
| 👤 **Citizen** | Register, file complaints, track status, view area announcements |
| 🛠️ **Admin** | Dashboard overview, manage & update all complaints, publish announcements |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Vanilla CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose 9) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Real-time | Socket.IO |

---

## 📂 Project Structure

```
PMC_Portal/
├── backend/
│   ├── config/         # MongoDB connection
│   ├── controllers/    # Route logic (auth, complaints, announcements)
│   ├── middleware/     # JWT auth + role guards
│   ├── models/         # Mongoose models (User, Complaint, Announcement)
│   ├── routes/         # Express routers
│   ├── sockets/        # Socket.IO handler (in-memory user/area maps)
│   ├── utils/          # JWT generator, area enum, admin seed
│   ├── .env            # ⚠️ NOT committed — see setup below
│   └── server.js       # App entry point
│
└── frontend/
    └── src/
        ├── components/ # Sidebar, Notification toast, ProtectedRoute
        ├── context/    # AuthContext (JWT + user state)
        ├── data/       # Areas enum (mirrors backend)
        ├── pages/      # Login, Register, Dashboard, Complaints,
        │               # Announcements, AdminDashboard,
        │               # ManageComplaints, CreateAnnouncement
        ├── services/   # Axios instance (api.js)
        ├── socket/     # Socket.IO client singleton
        └── App.jsx     # Router + protected routes
```

---

## ⚙️ Setup & Running Locally

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally on `mongodb://127.0.0.1:27017`

---

### 1. Clone the repo

```bash
git clone git@github.com:trishitpict/PMC_Portal.git
cd PMC_Portal
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pmc_portal
JWT_SECRET=your_secret_key_here
```

Start the backend:

```bash
npm run dev
```

On first boot, a default admin account is seeded automatically:

| Field | Value |
|---|---|
| Email | `admin@gmail.com` |
| Password | `123456` |

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**  
Backend API runs at: **http://localhost:5000**

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a citizen |
| POST | `/api/auth/login` | Public | Login (citizen or admin) |
| GET | `/api/auth/me` | Protected | Get current user info |

### Complaints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/complaints` | Citizen | File a new complaint |
| GET | `/api/complaints/user` | Citizen | Get own complaints |
| GET | `/api/complaints/all` | Admin | Get all complaints |
| PUT | `/api/complaints/:id` | Admin | Update status + remarks |

### Announcements
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/announcements` | Admin | Publish an announcement |
| GET | `/api/announcements` | Citizen | Get area-filtered announcements |

---

## 🔔 Real-Time Notifications (Socket.IO)

After login, the frontend connects to the Socket.IO server and joins a room:

```js
socket.emit('join', { userId, area });
```

Events received by the client:

| Event | Trigger |
|---|---|
| `notification` → `complaint_update` | Admin updates a citizen's complaint status |
| `notification` → `new_announcement` | Admin publishes an announcement to the user's area |

Notifications appear as **glassmorphic toast popups** (bottom-right on desktop, top-center on mobile).

---

## 🗺️ Supported Areas (Pune)

Katraj · Bibwewadi · Kondhwa · Hadapsar · Magarpatta · Wagholi · Viman Nagar · Kharadi · Baner · Balewadi · Aundh · Shivajinagar · Deccan · Karve Nagar · Warje · Sinhagad Road · Dhankawadi · Swargate · Camp · Pimpri · Chinchwad · Bhosari · Nigdi · Dapodi · Kasarwadi · Pimple Saudagar · Pimple Gurav · Lohegaon · Yerwada · Koregaon Park

---

## 🔐 Security Notes

- `.env` is listed in `.gitignore` and must **never** be committed
- All registration endpoints force `role: "citizen"` — admin accounts can only be created via the seed script
- JWT tokens expire after **7 days**
- Passwords are hashed with **bcryptjs** (salt rounds: 10)

---

## 📄 License

MIT — feel free to use for educational purposes.
