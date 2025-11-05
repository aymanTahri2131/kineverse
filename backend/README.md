# KinéVerse Backend API 🌀

Backend API for the KinéVerse physiotherapy clinic platform.

## Features

- 🔐 JWT Authentication (Access + Refresh Tokens)
- 👥 Multi-role system (Patient, Kine, Admin)
- 📅 Appointment management with 48h modification rule
- 📧 Email notifications (Nodemailer)
- 📱 SMS & WhatsApp notifications (Twilio)
- 🎯 Service management
- 💳 Payment tracking (cash payments)
- 📊 MongoDB with Mongoose ODM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Email**: Nodemailer
- **SMS/WhatsApp**: Twilio API

## Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Twilio account (for SMS/WhatsApp)
- Email account (Gmail, etc.)

## Installation

1. **Clone and navigate to backend folder**

```bash
cd backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_ACCESS_SECRET`: Secret for access tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `EMAIL_USER`: Email username
- `EMAIL_PASSWORD`: Email password or app password
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

4. **Seed the database (optional)**

```bash
npm run seed
```

This creates:
- 1 Admin user
- 3 Kine users
- 1 Patient user
- 6 Services

5. **Start the server**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Appointments
- `POST /api/appointments` - Create appointment (guest or auth)
- `GET /api/appointments` - Get all appointments (admin/kine)
- `GET /api/appointments/:id` - Get single appointment
- `GET /api/appointments/user/:userId` - Get user appointments
- `PUT /api/appointments/:id` - Update appointment (48h rule)
- `POST /api/appointments/:id/confirm` - Confirm appointment (kine)
- `POST /api/appointments/:id/reject` - Reject appointment (kine)
- `POST /api/appointments/:id/cancel` - Cancel appointment
- `POST /api/appointments/:id/payment` - Mark as paid (kine)
- `DELETE /api/appointments/:id` - Delete appointment (admin)

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create service (admin/kine)
- `PUT /api/services/:id` - Update service (admin/kine)
- `DELETE /api/services/:id` - Deactivate service (admin)

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/kines` - Get all kines (public)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Update password
- `DELETE /api/users/:id` - Deactivate user (admin)

### Notifications
- `POST /api/notifications/email` - Send email
- `POST /api/notifications/sms` - Send SMS
- `POST /api/notifications/whatsapp` - Send WhatsApp

## Business Rules

### 48-Hour Rule
- Patients can modify/cancel appointments up to 48h before
- Kines and admins can modify appointments anytime
- Modifications by patients set status to `awaiting_reconfirmation`

### Appointment Statuses
- `pending` - Awaiting kine confirmation
- `confirmed` - Confirmed by kine
- `awaiting_reconfirmation` - Modified by patient, needs reconfirmation
- `done` - Completed
- `cancelled` - Cancelled
- `rejected` - Rejected by kine

### Payment Statuses
- `unpaid` - Not paid yet
- `paid` - Payment received (cash)

### Notifications
Automatic notifications sent on:
- Appointment created (patient + kine)
- Appointment confirmed (patient)
- Appointment reminder 24h before (patient)
- Appointment cancelled (kine if patient cancels)

## Deployment

### Railway / Render

1. Create new project
2. Connect GitHub repository
3. Add environment variables
4. Deploy

### MongoDB Atlas

1. Create cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Add to `MONGODB_URI` environment variable

### Twilio Setup

1. Create account at [twilio.com](https://www.twilio.com)
2. Get Account SID and Auth Token
3. Get phone number for SMS
4. Set up WhatsApp sandbox or business account

## Testing

Test credentials after seeding:

**Admin:**
- Email: `admin@kineverse.com`
- Password: `Admin123!`

**Kine:**
- Email: `sarah@kineverse.com`
- Password: `Kine123!`

**Patient:**
- Email: `patient@test.com`
- Password: `Patient123!`

## License

MIT
