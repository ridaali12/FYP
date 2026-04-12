# Backend Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Backend Dependencies

Navigate to the backend folder and install dependencies:

```bash
cd backend
npm install
```

### 2. MongoDB Setup

#### Option A: MongoDB Atlas (Recommended - Cloud Database)

1. Go to https://www.mongodb.com/cloud/atlas and create a free account
2. Click "Build a Database"
3. Select "Free" tier
4. Choose a cloud provider and region (choose closest to you)
5. Click "Create Cluster"
6. Create Database User:
   - Go to "Database Access" → "Add New Database User"
   - Create username and password (save these!)
   - Set privileges to "Read and write to any database"
7. Whitelist IP Address:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (or add your IP)
8. Get Connection String:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
   - Replace `<password>` with your actual password

#### Option B: Local MongoDB

1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install and run MongoDB
3. Connection string: `mongodb://localhost:27017/wildlife-app`

### 3. Create Environment Variables

Create a `.env` file in the backend folder:

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster.mongodb.net/wildlife-app?retryWrites=true&w=majority
PORT=5000
```

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/wildlife-app
PORT=5000
```

### 4. Start the Backend Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# OR production mode
npm start
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

### 5. Find Your Computer's IP Address

To connect your mobile app to the backend, you need your computer's IP:

**Windows:**
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.100.2)
```

**Mac/Linux:**
```bash
ifconfig
# Look for inet address (e.g., 192.168.100.2)
```

### 6. Update Mobile App Configuration

In both UploadReport.js and ReportsFeed.js, update the API_URL:

```javascript
// Replace 192.168.100.2 with YOUR computer's IP address
const API_URL = 'http://192.168.100.2:5000';
```

### 7. Test the Connection

Open your browser and visit: `http://localhost:5000`

You should see: `{"message":"Wildlife Reporting API is running!"}`

### 8. Troubleshooting

**Issue: Cannot connect to MongoDB**
- Check MongoDB is running (for local)
- Verify connection string in .env file
- Check network access settings (for Atlas)

**Issue: Mobile app can't reach backend**
- Ensure backend is running
- Verify IP address is correct
- Check firewall isn't blocking port 5000
- Ensure phone and computer are on same WiFi network

**Issue: CORS errors**
- Backend already has CORS enabled
- Check backend server is running

## Testing the Full Flow

1. Start backend: `npm run dev`
2. Open mobile app on phone
3. Upload a report from UploadReport screen
4. Navigate to Reports Feed
5. Your report should appear!

## API Endpoints Reference

**Reports:**
- `POST /api/reports` - Upload new report
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get single report
- `DELETE /api/reports/:id` - Delete report

**Wildlife:**
- `GET /api/wildlife` - Get all wildlife facts
- `POST /api/wildlife` - Add wildlife fact
