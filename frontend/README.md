# KinéVerse Frontend 🌀

Frontend application for KinéVerse physiotherapy platform built with React, Vite, and Tailwind CSS.

## Features

- 🏠 3D animated home page (R3F ready)
- 🔐 Authentication (Login/Register)
- 📅 Appointment booking (guest & authenticated)
- 👤 Patient dashboard (view/manage appointments)
- 👨‍⚕️ Kine dashboard (confirm/manage appointments)
- 💅 Beautiful UI with Tailwind CSS
- 📱 Fully responsive design
- 🎨 Smooth animations with Framer Motion

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State**: Zustand
- **3D**: React Three Fiber (R3F) + Drei
- **Animation**: Framer Motion
- **HTTP**: Axios
- **Date**: date-fns
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## Installation

1. **Navigate to frontend folder**

```bash
cd frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and update the API URL if needed:

```
VITE_API_URL=http://localhost:5000/api
```

4. **Start development server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── LoadingSpinner.jsx
│   ├── pages/          # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── AppointmentForm.jsx
│   │   ├── DashboardPatient.jsx
│   │   ├── DashboardKine.jsx
│   │   ├── Services.jsx
│   │   └── NotFound.jsx
│   ├── store/          # Zustand stores
│   │   ├── authStore.js
│   │   └── appointmentStore.js
│   ├── lib/            # Utilities
│   │   └── axios.js
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Key Features

### Authentication
- Login/Register with JWT
- Auto token refresh
- Role-based access (Patient, Kine, Admin)
- Protected routes

### Appointment Booking
- Guest booking (no account needed)
- Select service, kine, date/time
- Email + SMS notifications
- Real-time availability

### Patient Dashboard
- View all appointments
- Filter by status (upcoming, past)
- Cancel appointments (48h rule)
- Track payment status

### Kine Dashboard
- View pending appointments
- Confirm/reject bookings
- Mark payments as received
- View patient details

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `VITE_API_URL`: Your backend API URL
4. Deploy

### Other Platforms

Build the project and deploy the `dist` folder to any static hosting:

```bash
npm run build
```

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.jsx`
3. Update navigation in `src/components/Navbar.jsx`

### State Management

Use Zustand stores for global state:

```javascript
import { create } from 'zustand';

const useStore = create((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));
```

### API Calls

Use the configured axios instance:

```javascript
import api from '@/lib/axios';

const getData = async () => {
  const { data } = await api.get('/endpoint');
  return data;
};
```

## 3D Integration (Coming Soon)

The home page is ready for React Three Fiber integration:
- Replace placeholder with `<Canvas>` component
- Add 3D kine model with animations
- Implement lipsync with audio
- Add interactive buttons with timeline

## License

MIT
