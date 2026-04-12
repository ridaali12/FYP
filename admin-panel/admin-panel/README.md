# Admin Panel - Wildlife Reporting System

Admin dashboard for managing researchers and reports in the Wildlife Reporting mobile app.

## Features

- **Researcher Verification**: Verify or reject researcher qualifications when they sign up
- **Report Management**: Handle spam content and delete inappropriate reports submitted by community users
- **Dashboard**: View statistics and overview of the system

## Setup Instructions

### 1. Install Dependencies

```bash
cd admin-panel
npm install
```

### 2. Configure API URL

Update the API URL in `src/config/api.js` to match your backend server:

```javascript
const API_BASE_URL = 'http://192.168.100.2:5000'; // Change to your backend URL
```

Or set it as an environment variable:

```bash
# Create .env file
REACT_APP_API_URL=http://192.168.100.2:5000
```

### 3. Create Admin Account

First, create an admin account in your MongoDB database. You can do this by:

**Option A: Using MongoDB Compass or MongoDB Shell**

```javascript
use wildlife-app
db.admins.insertOne({
  username: "admin",
  email: "admin@wildlifeapp.com",
  password: "your-secure-password",
  role: "admin",
  createdAt: new Date()
})
```

**Option B: Using a script**

Create a file `create-admin.js` in the backend folder:

```javascript
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://192.168.100.2:27017/wildlife-app')
  .then(async () => {
    const admin = new Admin({
      username: 'admin',
      email: 'admin@wildlifeapp.com',
      password: 'admin123', // Change this!
      role: 'admin'
    });
    await admin.save();
    console.log('Admin created successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
```

Run it:
```bash
cd backend
node create-admin.js
```

### 3. ORCID Verification (new)

The system now requires researchers to provide a 16‑digit ORCID identifier during sign up. The admin panel displays each applicant's ORCID along with a validity indicator based on the official checksum algorithm. Please review ORCID values when verifying researchers to ensure they're not fake.

### 4. Run the Admin Panel

```bash
npm start
```

The admin panel will open at `http://192.168.100.2:3000`

## API Endpoints Used

The admin panel connects to these backend endpoints:

- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/researchers/pending` - Get pending researchers
- `POST /api/admin/researchers/:id/verify` - Verify researcher
- `POST /api/admin/researchers/:id/reject` - Reject researcher
- `GET /api/admin/reports/all` - Get all reports
- `GET /api/admin/reports/flagged` - Get flagged reports
- `POST /api/admin/reports/:id/flag-spam` - Mark report as spam
- `POST /api/admin/reports/:id/flag-inappropriate` - Mark report as inappropriate
- `DELETE /api/admin/reports/:id` - Delete report
- `POST /api/admin/reports/:id/unflag` - Remove flags from report

## Connecting Your Existing Admin Panel

If you already have an admin panel built in React/JavaScript:

1. Update your API calls to use the endpoints listed above
2. Ensure your admin panel can authenticate using `/api/admin/login`
3. Use the same data structures as shown in the components

## Default Admin Credentials

**⚠️ IMPORTANT**: Change these after first login!

- Username: `admin`
- Password: (set when creating admin account)

## Troubleshooting

- **CORS Error**: Make sure your backend has CORS enabled and allows requests from `http://192.168.100.2:3000`
- **API Connection Failed**: Check that your backend server is running and the API URL in `src/config/api.js` is correct
- **Login Fails**: Ensure you've created an admin account in the database
