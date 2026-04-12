# Wildlife Reporting Backend API

Backend API for the Wildlife Reporting mobile application.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/wildlife-app
PORT=5000

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@wildlifeapp.com
FRONTEND_URL=http://192.168.100.2:3000
```

> Researchers must now supply a **valid 16‑digit ORCID identifier** during signup. It will be checked against the ORCID checksum algorithm and later reviewed by an admin. 

**Email Setup Instructions:**
- For Gmail: Go to Google Account > Security > 2-Step Verification > App Passwords
- Create an app password and use it as `SMTP_PASS`
- If email is not configured, reset links will be logged to console instead

### 3. MongoDB Setup

#### Option A: Local MongoDB
1. Download and install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/wildlife-app`

#### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get connection string and add to `.env`

### 4. Run the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 5. API Endpoints

#### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get single report
- `POST /api/reports` - Create new report
- `DELETE /api/reports/:id` - Delete report

#### Wildlife
- `GET /api/wildlife` - Get all wildlife facts
- `GET /api/wildlife/:id` - Get single wildlife fact
- `POST /api/wildlife` - Create new wildlife fact
- `DELETE /api/wildlife/:id` - Delete wildlife fact

#### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset (sends email)
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/profile/:userId` - Get user profile
- `PUT /api/auth/profile/:userId` - Update user profile

#### Admin Panel
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/researchers/pending` - Get pending (unverified) researchers
- `GET /api/admin/researchers/all` - Get all researchers
- `POST /api/admin/researchers/:id/verify` - Verify researcher qualifications
- `POST /api/admin/researchers/:id/reject` - Reject researcher (with reason)
- `GET /api/admin/reports/all` - Get all reports
- `GET /api/admin/reports/flagged` - Get flagged reports (spam/inappropriate)
- `POST /api/admin/reports/:id/flag-spam` - Mark report as spam
- `POST /api/admin/reports/:id/flag-inappropriate` - Mark report as inappropriate
- `DELETE /api/admin/reports/:id` - Delete inappropriate report
- `POST /api/admin/reports/:id/unflag` - Remove flags from report

### 6. Create Admin Account

To create an admin account for the admin panel:

```bash
npm run create-admin
```

This will create a default admin account:
- Username: `admin`
- Email: `admin@wildlifeapp.com`
- Password: `admin123`

**⚠️ IMPORTANT**: Change the password after first login!

## Connecting to Your Frontend

Update your frontend code to use the backend API URL (e.g., `http://192.168.100.2:5000/api/reports`).
