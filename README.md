# Easy Rental

A full-stack web application for managing rental properties and bookings.

## Tech Stack

- **Frontend**: React with Vite
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Language**: JavaScript/TypeScript

## Project Structure

```
Easy-Rental/
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── controllers/  # Business logic
│   │   ├── models/    # Database models
│   │   ├── middleware/   # Express middleware
│   │   ├── config/    # Configuration files
│   │   └── utils/     # Utility functions
│   ├── tests/         # Test files
│   └── package.json
│
├── frontend/          # React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/     # Page components
│   │   ├── services/  # API services
│   │   ├── hooks/     # Custom React hooks
│   │   ├── styles/    # CSS/SCSS files
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/        # Static assets
│   └── package.json
│
└── docker-compose.yml  # Docker setup for local development
```

## Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL 13+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your database credentials
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and API at `http://localhost:5000` (backend).

## Development

- Backend runs on port 5000
- Frontend runs on port 5173
- PostgreSQL on port 5432

## Environment Variables

See `.env.example` files in both backend and frontend directories for required configuration.
