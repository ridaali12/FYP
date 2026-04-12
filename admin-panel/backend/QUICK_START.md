# Quick Start Guide

## 1. Install Dependencies
```bash
cd backend
npm install
```

## 2. Create .env File
Create a `.env` file in the backend folder:

```env
MONGODB_URI=mongodb://localhost:27017/wildlife-app
PORT=5000
```

**OR if using MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wildlife-app
PORT=5000
```

## 3. Start the Server
```bash
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

## 4. Find Your IP Address

**Windows:**
```bash
ipconfig
# Copy the IPv4 Address (e.g., 192.168.100.2)
```

**Mac/Linux:**
```bash
ifconfig
# Copy the inet address (e.g., 192.168.100.2)
```

## 5. Update Mobile App

In **Wildyn-North/app/(tabs)/UploadReport.js** and **Wildyn-North/app/(tabs)/ReportsFeed.js**, find this line:

```javascript
const API_URL = 'http://192.168.100.2:5000';
```

Replace `192.168.100.2` with your computer's IP address from step 4.

## 6. Test It!

1. Make sure backend is running (`npm run dev`)
2. Open your mobile app
3. Upload a report
4. View it in Reports Feed!

---

**Having Issues?** Check the detailed SETUP_GUIDE.md file.
