# MedicAtDoor

Welcome to **MedicAtDoor**! A comprehensive telemedicine platform connecting patients, healthcare professionals, and administrators. Our solution provides an end-to-end healthcare ecosystem with real-time video consultations, prescription management, pharmacy services, and a robust admin dashboard.

## 🌟 Key Features

### For Patients
- **Patient Portal**: Easy navigation across Home, Appointments, Prescriptions, Pharmacy, History, and Settings.
- **Book Appointments**: Seamlessly find and schedule consultations with healthcare experts.
- **Real-time Video Calls**: Integrated live video consultation functionality with secure signaling.
- **Smart Notifications**: Instant confirmation popups and alerts during actions like appointment booking and status updates.
- **Pharmacy Integration**: Order prescriptions directly from the portal.

### For Doctors
- **Doctor Dashboard**: Manage daily schedules and keep track of consultations.
- **Consultation Interface**: Initiate and handle live video calls with patients in your queue.
- **Marketplace**: Explore health trends, reviews, and manage your public medical profile.

### For Administrators
- **Admin Dashboard**: Manage user access securely ("Admin" vs "User" roles).
- **Analytics & Metrics**: Real-time tracking of total appointments, unique patient records, and doctor activity.
- **Grievance Report & System Settings**: Handle merchant/doctor approvals and address support tickets efficiently.

## 🛠 Tech Stack

- **Frontend**: React.js / Vite (or similar bundler)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB & Mongoose
- **Real-time Communication**: WebRTC / Socket.io for video calls and live patient count updates
- **Deployment**: Vercel ready (with `vercel.json` and customized backend routing)

## 📁 Project Structure

This repository uses a monorepo setup containing both frontend and backend systems.

```
MedicAtDoor/
│
├── client/         # React frontend application
├── server/         # Express/Node.js backend API and socket server
├── package.json    # Root configuration for concurrently running both services
└── vercel.json     # Configuration for production deployment
```

## 🚀 Getting Started

### Prerequisites
- Node.js installed on your machine.
- MongoDB database (local or cloud e.g., MongoDB Atlas).

### Installation

1. Clone the repository and navigate to the root directory.
2. Install dependencies for both client and server:
   ```bash
   npm run install-all
   ```

### Running Locally

To start the development server for both the frontend and backend simultaneously, run:

```bash
npm run dev
```

- The client will typically start on `http://localhost:5173` or `http://localhost:3000`.
- The server will run on `http://localhost:5000` (ensure `.env` files are configured).

## 🌍 Deployment

MedicAtDoor is configured to be deployed on Vercel. 
- Ensure environment variables are properly mapped in your production environment instead of relying on `localhost:5000`.
- Socket connections dynamically adapt to the production URL.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
