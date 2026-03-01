# Quick Start Guide

## Prerequisites
- Node.js 16+ installed
- PostgreSQL 13+ installed (or Docker)
- npm or yarn

## Option 1: Using Docker (Recommended)

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Access pgAdmin at http://localhost:5050
# Email: admin@easyrent.local
# Password: admin
```

## Option 2: Local PostgreSQL
Create a database:
```sql
CREATE DATABASE easyrent_db;
CREATE USER easyrent WITH PASSWORD 'easyrent_password';
GRANT ALL PRIVILEGES ON DATABASE easyrent_db TO easyrent;
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env

# Update .env with your settings if needed
npm run dev
```

The API will be available at `http://localhost:5000`

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The application will be available at `http://localhost:5173`

## Verify Setup

1. Open http://localhost:5173 in your browser
2. You should see the Easy Rent welcome page
3. The "API Status" should show "Connected" if the backend is running correctly

## Next Steps

1. Create database tables using the models in `backend/src/models/`
2. Implement authentication routes
3. Build out the rental property features
4. Add more API endpoints as needed

## Common Commands

### Backend
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Check code style

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

See [README.md](README.md) for detailed project structure documentation.

## Need Help?

Check [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards and contribution guidelines.
