# 🚀 Quick Start Guide - KinéVerse

## ⚡ Fast Setup (5 minutes)

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ MongoDB installed (or MongoDB Atlas account)

### Step 1: Install Dependencies

**Windows (PowerShell):**
```powershell
cd backend; npm install; cd ..; cd frontend; npm install; cd ..
```

**Mac/Linux:**
```bash
cd backend && npm install && cd .. && cd frontend && npm install && cd ..
```

Or simply run:
```bash
# Windows
setup.bat

# Mac/Linux
chmod +x setup.sh
./setup.sh
```

### Step 2: Configure Environment

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Minimum required (for local testing):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kineverse
JWT_ACCESS_SECRET=mysecretkey123
JWT_REFRESH_SECRET=myrefreshkey456
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
```

Default config works for local dev.

### Step 3: Seed Database

```bash
cd backend
npm run seed
```

This creates test users and services.

### Step 4: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Open App

Navigate to: **http://localhost:5173**

## 🔐 Test Accounts

**Patient:**
- Email: `patient@test.com`
- Password: `Patient123!`

**Kinésithérapeute:**
- Email: `sarah@kineverse.com`
- Password: `Kine123!`

**Admin:**
- Email: `admin@kineverse.com`
- Password: `Admin123!`

## 📱 Test the Flow

### As a Guest (No Login):
1. Go to "Prendre RDV"
2. Fill in your details
3. Select service, kine, date/time
4. Submit booking
5. ✅ You'll see success message

### As a Patient:
1. Login with patient account
2. Go to "Prendre RDV" or click "Mes RDV"
3. View your appointments
4. Cancel/modify (if >48h before)

### As a Kine:
1. Login with kine account
2. Go to dashboard
3. See pending appointments
4. Confirm appointments
5. Mark payments as paid

## 🐛 Troubleshooting

### Backend won't start
- ✅ Check MongoDB is running: `mongosh` or check MongoDB Compass
- ✅ Check `.env` file exists in backend folder
- ✅ Run `npm install` again

### Frontend won't start
- ✅ Check backend is running on port 5000
- ✅ Run `npm install` again in frontend folder
- ✅ Clear browser cache

### Can't login
- ✅ Make sure you ran `npm run seed` in backend
- ✅ Check backend console for errors
- ✅ Try registering a new account

### No notifications sent
- ℹ️ Email/SMS require proper configuration
- ℹ️ App works without them - just no notifications
- ℹ️ See backend README for Twilio/email setup

## 📞 Need Help?

Check the detailed READMEs:
- `/README.md` - Main documentation
- `/backend/README.md` - Backend API docs
- `/frontend/README.md` - Frontend docs

## 🎯 Next Steps

1. ✅ Test guest booking
2. ✅ Test patient flow
3. ✅ Test kine flow
4. 📧 Configure email (optional)
5. 📱 Configure Twilio (optional)
6. 🚀 Deploy to production

## 🌟 Features to Try

- [x] Book appointment as guest
- [x] Register and login
- [x] View appointment dashboard
- [x] Cancel appointments
- [x] Confirm appointments (as kine)
- [x] Mark payments
- [x] Browse services
- [ ] 3D animation (coming soon)

---

**Happy coding! 🌀**
