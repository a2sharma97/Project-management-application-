# Nexus — Project Management Application

A full-stack project management application for teams to collaborate, manage tasks, and track project progress.

## Live Demo

- **Frontend:** https://nexus-project-management-applicatio.vercel.app
- **Backend API:** https://project-management-application-production-cc80.up.railway.app/api

---

## Features

- **User Authentication** — Register, login, and logout with JWT access and refresh tokens
- **Project Management** — Create and manage projects with planning, active, and completed status
- **Role-Based Access Control** — Owner, admin, editor, and viewer roles with different permissions
- **Invitation System** — Invite team members by email, accept or reject invitations
- **Task Management** — Create tasks with priority, deadline, and assignee; update status as work progresses
- **Activity Logging** — Every important action is recorded in a project activity feed
- **Member Management** — Add, remove, and update member roles within projects

---

## Tech Stack

**Frontend**

- React 18 + TypeScript
- Tailwind CSS
- Axios
- React Router DOM
- Vite

**Backend**

- Node.js + TypeScript
- Express.js
- MongoDB + Mongoose
- JWT (access + refresh tokens)
- bcrypt

**Deployment**

- Frontend: Vercel
- Backend: Railway
- Database: MongoDB Atlas

---

## API Endpoints

### Auth

| Method | Endpoint             | Description                |
| ------ | -------------------- | -------------------------- |
| POST   | `/api/auth/register` | Register a new user        |
| POST   | `/api/auth/login`    | Login and receive token    |
| POST   | `/api/auth/logout`   | Logout and clear token     |
| GET    | `/api/auth/me`       | Get current logged-in user |

### Projects

| Method | Endpoint                          | Description                       |
| ------ | --------------------------------- | --------------------------------- |
| POST   | `/api/projects`                   | Create a new project              |
| GET    | `/api/projects`                   | Get all projects for current user |
| GET    | `/api/projects/:projectId`        | Get a single project by ID        |
| PATCH  | `/api/projects/:projectId/status` | Update project status             |

### Members

| Method | Endpoint                                         | Description                  |
| ------ | ------------------------------------------------ | ---------------------------- |
| GET    | `/api/members/:projectId/members`                | Get all members of a project |
| PATCH  | `/api/members/:projectId/members/:memberId/role` | Update a member's role       |
| DELETE | `/api/members/:projectId/members/:memberId`      | Remove a member from project |
| PATCH  | `/api/members/:projectId/leave`                  | Leave a project              |

### Tasks

| Method | Endpoint                         | Description                 |
| ------ | -------------------------------- | --------------------------- |
| POST   | `/api/tasks/projects/:projectId` | Create a task in a project  |
| GET    | `/api/tasks/projects/:projectId` | Get all tasks for a project |
| GET    | `/api/tasks/:taskId`             | Get a single task by ID     |
| PATCH  | `/api/tasks/:taskId`             | Update a task               |
| DELETE | `/api/tasks/:taskId`             | Delete a task               |

### Invitations

| Method | Endpoint                                      | Description                       |
| ------ | --------------------------------------------- | --------------------------------- |
| POST   | `/api/invitations/projects/:projectId/invite` | Send an invitation                |
| GET    | `/api/invitations/my`                         | Get current user's invitations    |
| GET    | `/api/invitations/projects/:projectId`        | Get all invitations for a project |
| PATCH  | `/api/invitations/:invitationId/respond`      | Accept or reject an invitation    |
| DELETE | `/api/invitations/:invitationId/cancel`       | Cancel a pending invitation       |

### Activity

| Method | Endpoint                   | Description                    |
| ------ | -------------------------- | ------------------------------ |
| GET    | `/api/activity/:projectId` | Get activity log for a project |

---

## Running Locally

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/nexus.git
cd nexus/server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Fill in your environment variables

# Start development server
npm run dev
```

### Backend Environment Variables

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend Setup

```bash
cd nexus/client

# Install dependencies
npm install

# Create .env file
VITE_API_URL=http://localhost:3000/api

# Start development server
npm run dev
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Project Structure

```
nexus/
├── server/                 ← Backend
│   ├── src/
│   │   ├── controllers/    ← Route handlers
│   │   ├── models/         ← Mongoose schemas
│   │   ├── routes/         ← Express routers
│   │   ├── middlewares/    ← Auth and error middleware
│   │   ├── utils/          ← Utility functions
│   │   └── app.ts          ← Express app entry point
│   ├── package.json
│   └── tsconfig.json
│
└── client/                 ← Frontend
    ├── src/
    │   ├── components/     ← Reusable components
    │   ├── pages/          ← Page components
    │   ├── lib/            ← Axios configuration
    │   ├── types/          ← TypeScript interfaces
    │   └── utils/          ← Utility functions
    ├── package.json
    └── vite.config.ts
```

---

## Key Design Decisions

- **JWT with refresh tokens** — Short-lived access tokens with long-lived refresh tokens for secure, persistent sessions
- **Role-based permissions** — Owner, admin, editor, viewer roles enforced on both frontend and backend
- **Activity logging** — Every state-changing action creates an immutable activity log entry
- **Compound indexes** — MongoDB indexes on frequently queried field combinations for performance
- **TTL indexes** — Invitations automatically expire after 7 days using MongoDB TTL indexes

---

## Author

**Abhishek Sharma**

- GitHub: [a2sharma97]
- LinkedIn: [www.linkedin.com/in/abhishek-sharma-09a97024a]
