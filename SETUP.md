# Biskut Raya - Merged Project Structure

This is now a **full-stack monorepo** with both frontend (React/Vite) and backend (Express/Node.js) in one workspace.

## 📁 Project Structure

```
kedaikuih/
├── src/                          # React Frontend (Vite)
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Global styles
│   ├── pages/                    # Page components
│   │   ├── ShopPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── AdminPage.jsx
│   │   └── AffiliateDashPage.jsx
│   ├── context/                  # React Context (Auth, Cart)
│   │   ├── AuthContext.jsx
│   │   └── CartContext.jsx
│   ├── lib/                      # Shared libraries
│   │   ├── api.js                # Axios API client
│   │   ├── firebase.js           # Firebase auth
│   │   └── db.js                 # Database utilities
│   ├── hooks/                    # Custom React hooks
│   └── assets/                   # Images, fonts, etc.
│
├── server/                       # Express Backend
│   ├── server.js                 # Main Express app
│   ├── middleware/               # Custom middleware
│   │   ├── auth.js               # Firebase token verification
│   │   └── errorHandler.js
│   ├── routes/                   # API routes
│   │   ├── auth.js               # Auth & user sync
│   │   ├── products.js           # Product endpoints
│   │   ├── orders.js             # Order management
│   │   ├── payment.js            # Payment processing
│   │   └── affiliates.js         # Affiliate program
│   └── queries/                  # Database queries
│
├── public/                       # Static assets
├── dist/                         # Build output (frontend)
│
├── .env                          # Frontend environment variables
├── .env.server                   # Backend environment variables
├── .env.backend                  # Backend config (backup)
├── .gitignore
├── package.json                  # Monorepo package.json
├── vite.config.js                # Vite config (frontend only)
├── eslint.config.js
├── index.html                    # HTML template
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL (Neon Database)
- Firebase project credentials

### Installation

1. **Install dependencies** (frontend + backend):
```bash
npm install
```

2. **Configure environment variables:**
   - `.env` - Frontend configuration (already set up for backend at http://localhost:4000/api)
   - `.env.server` - Backend configuration with Neon database connection

### Running the Project

#### Option 1: Run Both Simultaneously (Recommended)
```bash
npm run dev:all
```
This starts:
- Backend Express server on `http://localhost:4000`
- Frontend Vite dev server on `http://localhost:5173`

#### Option 2: Run Separately
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev
```

#### Option 3: Production Build
```bash
npm run build
```

## 🔗 API Connection Flow

```
Browser (http://localhost:5173)
    ↓
React App (src/App.jsx)
    ↓
Axios API Client (src/lib/api.js)
    ↓ HTTP requests to VITE_API_URL
    ↓
Express Backend (server/server.js) @ http://localhost:4000/api
    ↓
Neon PostgreSQL Database
```

## 🗄️ Database Connection

The backend connects to **Neon PostgreSQL** using the connection string in `.env.server`:

```
DATABASE_URL=postgresql://neondb_owner:npg_SogAubcfL3l1@ep-summer-shape-ad8m7d9n-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Troubleshooting Neon Connection:**
1. Verify `DATABASE_URL` in `.env.server` is correct
2. Check that your Neon project is active (not paused)
3. Ensure firewall allows connections from your IP
4. Test connection manually:
   ```bash
   psql $DATABASE_URL
   ```

## 🔐 Authentication

- **Frontend Auth**: Firebase (Google/Email login)
- **Backend Verification**: Firebase Admin SDK validates ID tokens
- **User Sync**: Frontend login triggers `/api/auth/sync` to create/update user in Neon

### Firebase Setup
- Project ID: `kedaikuih-27543`
- Config in `.env` (frontend only)
- Admin credentials in `.env.server` (backend only)

## 📡 API Endpoints

All endpoints are prefixed with `/api`:

- **Products**: `/api/products/*`
- **Auth**: `/api/auth/*`
- **Orders**: `/api/orders/*`
- **Payments**: `/api/payment/*`
- **Affiliates**: `/api/affiliates/*`
- **Settings**: `/api/settings/*`
- **Health**: `/api/health` (GET - no auth required)

## 🛠️ Development Tools

- **Frontend Build Tool**: Vite
- **Frontend Framework**: React 19
- **Backend Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Auth**: Firebase Admin SDK
- **Payment Gateway**: ToyyibPay (FPX)
- **Linting**: ESLint

## 📝 Migration Notes

This project was merged from two separate directories:
- `kedaikuih` (original frontend)
- `kedaikuihserver` (original backend)

The backend code has been moved to `server/` for easy management alongside the frontend in `src/`.

## 🔄 Next Steps

1. **Verify Neon Connection**:
   - Update `.env.server` with your actual Neon credentials
   - Test: `npm run dev:server`

2. **Set Up Firebase Admin**:
   - Get service account JSON from Firebase Console
   - Extract credentials to `.env.server`

3. **Configure ToyyibPay** (Optional):
   - Add your credentials to `.env.server`
   - Payment features will be disabled without it

4. **Start Development**:
   - Run `npm run dev:all`
   - Open http://localhost:5173 in your browser

## 📧 Support

For issues with:
- **Frontend**: Check `src/` and browser console
- **Backend**: Check `server/` and terminal output
- **Database**: Check `.env.server` and Neon dashboard

---

**Project Name**: Biskut Raya Premium Collection  
**Created**: March 2025  
**Full-Stack Merged**: March 9, 2026
