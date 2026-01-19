# EduTech Monorepo

This is a monorepo containing both frontend and backend for the EduTech application.

## 📁 Repository Structure

```
/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── assets/          # Images, videos, 3D models
│   │   ├── components/      # React components
│   │   ├── layout/          # Layout components (MainLayout, Sidebar)
│   │   ├── pages/           # Page components (Dashboard, Landing, etc.)
│   │   ├── sections/        # Section components (DashboardSection, etc.)
│   │   ├── styles/          # Global CSS (animations.css)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/              # Static files
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── package.json
│   └── package-lock.json
│
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── controllers/     # Business logic
│   │   ├── services/        # Service layer
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Express app entry point
│   ├── package.json
│   └── package-lock.json
│
├── package.json            # Root monorepo config
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Install all dependencies for both frontend and backend
npm install
```

This will install dependencies in both `frontend/` and `backend/` directories using npm workspaces.

### Development

**Start Frontend (React + Vite)**
```bash
npm run dev:frontend
```
Frontend runs on `http://localhost:5173` (default Vite port)

**Start Backend (Express.js)**
```bash
npm run dev:backend
```
Backend runs on `http://localhost:5000`

**Check Backend Health**
```bash
curl http://localhost:5000/api/health
```

### Build

**Build Frontend**
```bash
npm run build:frontend
```

**Lint Frontend**
```bash
npm run lint
```

## 📦 Frontend

- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Key Dependencies**:
  - react-router-dom (routing)
  - @react-three/fiber & drei (3D graphics)
  - lucide-react (icons)
  - three (3D library)

## 🔧 Backend

- **Framework**: Express.js 4.18.2
- **CORS**: Enabled for frontend communication
- **Entry Point**: `backend/src/server.js`
- **Available Routes**:
  - `GET /api/health` - Health check endpoint

## 📝 What Was Changed

### Refactoring Summary
1. **Frontend Consolidation**: All React code (pages, sections, components, layout, styles, assets) moved to `/frontend/src/`
2. **Backend Scaffolding**: Created `/backend/` structure with Express.js server
3. **Vite Config**: Moved to `/frontend/` to work from the new location
4. **Package Management**: Split dependencies into separate `package.json` files (frontend and backend)
5. **Root Config**: Updated root `package.json` to reference workspaces and provide convenient scripts

### What Remains Unchanged
- All React component code and UI logic
- All CSS files and styling
- All assets (images, 3D models)
- All pages and sections - **nothing was deleted**
- ESLint configuration

## 🔄 Frontend Import Paths

All frontend imports should remain unchanged as they are relative to `/frontend/src/`. Example:
```jsx
// These paths still work (no changes needed)
import { MainLayout } from '../layout/MainLayout';
import { Dashboard } from '../pages/DashboardPage';
```

## 📚 Next Steps (Optional Enhancements)

- Add API integration routes in `/backend/src/routes/`
- Create services in `/backend/src/services/`
- Add database connectivity
- Implement authentication middleware
- Add environment configuration (`.env` files)

## 📄 License

Same as original project
