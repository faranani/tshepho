# Asset Registry System

A comprehensive asset management system with barcode scanning, verification, depreciation tracking, and audit capabilities.

## Architecture

- **Backend**: FastAPI with MongoDB Atlas
- **Frontend**: React with TypeScript
- **Authentication**: JWT-based with role-based access control
- **Database**: MongoDB Atlas

## Features

### Core Modules
- **Asset Registry**: Create, view, update, and delete assets
- **Barcode Scanning & Photo Upload**: Mobile-responsive scanning and photo upload
- **Asset Verification**: Track physical verification events and exceptions
- **Depreciation Engine**: Automated straight-line depreciation calculation
- **WIP Tracker**: Work-in-Progress tracking with project status
- **Audit Trail**: Comprehensive logging of all user actions
- **Reporting Dashboard**: Asset register, exception reports, depreciation summary

### Security & Compliance
- Role-based authentication (Admin, Asset Manager, Auditor)
- ISO 27001 compliant password policies
- Comprehensive audit logging

## Project Structure

```
asset-registry/
├── backend/          # FastAPI backend
│   ├── app/
│   ├── requirements.txt
│   └── main.py
├── frontend/         # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Update `.env` with your MongoDB Atlas connection string and other settings

6. Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the React development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

### MongoDB Atlas Setup
1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string and update the `MONGODB_URL` in backend/.env
5. Whitelist your IP address in Atlas Network Access

### Default Login
After setting up the database, you'll need to create an initial admin user through the API or directly in the database.
