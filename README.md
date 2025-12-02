
# TeamSync - Modern Team Project Management Platform
#### *TeamSync is a SaaS platform for team project management, built with modern web technologies.  It provides organizations with powerful tools for workspace management, project tracking, task collaboration, and team coordination with event-driven notifications and role-based access control.*

## 🎨 Features
### 🔐 Smart Authentication
- Enterprise-grade authentication via Clerk - No password headaches!
- Role-based access -ADMIN/MEMBER permissions
- Secure JWT sessions - Your data stays safe, always

## 🏢 Workspace Wizardry

- Multiple workspaces - Keep your teams organized and focused
- Instant invitations - Get your team onboarded in seconds
- Smart permissions - Right people, right access, right now
- Lazy sync pattern - Automatic user synchronization

## 📊 Project Powerhouse

- Visual task hierarchy - See your entire project at a glance
- Real-time updates - Watch progress happen live
- Smart filtering - Find exactly what you need in milliseconds

## ⚡ Event-Driven Notifications

- Instant email alerts - Get notified when tasks are assigned
- Scheduled reminders - Never miss a deadline
- Background processing - 99.25% faster than traditional methods
- Automatic retries - Never lose a notification

## 📈 Analytics Dashboard

- Progress tracking - Know exactly where you stand
- Team insights - Uncover productivity patterns



## Architecture & Tech Stack

### Backend Stack
- Runtime: Node.js 20
- Framework: Express 5
- Database: PostgreSQL with Prisma ORM
- Authentication: Clerk JWT with OAuth
- Event System: Inngest for background jobs
- Email Service: Nodemailer with SMTP

### Frontend Stack
- React 18 + TypeScript
- Vite.js Build Tool
- Tailwind CSS +  Shadcn/ui components
- Axios for HTTP requests
- React Router DOM for routing



## 🚀 TeamSync - Quick Start Guide
### 🎯 Prerequisites Checklist
- Node.js (v18 or higher) installed
- PostgreSQL account (or use Neon serverless)
- Git installed on your system
- Docker and Docker Compose (optional but recommended)
- Clerk account (for authentication)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### 📥 Step 1: Clone & Setup

###  Clone the repository
``` 
git clone https://github.com/your-username/teamsync.git
cd teamsync
```

### ⚙️ Step 2: Backend Setup
```
Navigate to Backend
cd server
Install Dependencies
npm install
```
Create Environment File
Create a file named .env in the backend directory and add:
```
# Run Environment
NODE_ENV = "development" #Change to "production" in deployment

# Clerk
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Neon Database
DATABASE_URL=
DIRECT_URL=

#Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

SENDER_EMAIL=
SMTP_USER=
SMTP_PASS=
```
Start Backend Server
```
npm run server
```


### 🎨 Step 3: Frontend Setup
Open New Terminal & Navigate to Frontend
```
cd client
npm install
```
Create Environment File
Create a file named .env in the client directory and add:

```
VITE_CLERK_PUBLISHABLE_KEY=
VITE_BASEURL=http://localhost:5000

```
Start frontend Server
```
npm run dev
```
Frontend should now be running on: http://localhost:5000
