# 🚀 Quick Reference Card

## 📍 Location
```
/Users/zairighazali/Desktop/kedaikuih
```

## ⚡ Start Everything
```bash
npm run dev:all
```
- Frontend: http://localhost:5173
- Backend: http://localhost:4000/api

## 📚 Documentation Priority
1. **INDEX.md** ← START HERE for overview
2. **SETUP.md** ← Detailed instructions
3. **MERGE_SUMMARY.md** ← What changed

## 🗂️ Directory Map
```
kedaikuih/
├── src/              ← Frontend React code
├── server/           ← Backend Express code
├── .env              ← Frontend config
├── .env.server       ← Backend config
├── package.json      ← Dependencies & scripts
└── INDEX.md          ← Full reference
```

## 🔧 npm Commands
| Command | Purpose |
|---------|---------|
| `npm run dev:all` | Start both services (RECOMMENDED) |
| `npm run dev:server` | Backend only (port 4000) |
| `npm run dev` | Frontend only (port 5173) |
| `npm run build` | Build for production |
| `npm run lint` | Check code quality |

## 🔌 API Endpoints
```
Base: http://localhost:4000/api

Auth:       /auth/sync, /auth/me, /auth/updateMe
Products:   /products, /products/categories
Orders:     /orders, /orders/my
Payment:    /payment/create, /payment/status
Affiliates: /affiliates/register, /affiliates/me
Settings:   /settings/shipping, /settings/site
```

## 🗄️ Database
```
DATABASE_URL in .env.server
Platform: Neon PostgreSQL
```

## ✅ Verification
```bash
# Backend running?
curl http://localhost:4000/health

# Frontend running?
curl http://localhost:5173

# Database connected?
npm run dev:server
# Look for: ✅ DB: ✅ Neon connected
```

## 📞 Quick Troubleshooting
```bash
# Port conflicts?
lsof -i :4000 | grep node | awk '{print $2}' | xargs kill -9
lsof -i :5173 | grep node | awk '{print $2}' | xargs kill -9

# Database connection?
psql $DATABASE_URL

# Missing dependencies?
npm install
```

## 🎯 Development Workflow
1. `npm run dev:all` → Start everything
2. Edit code → Hot reload (frontend)
3. Restart backend → Restart for backend changes
4. `npm run build` → Before committing
5. `npm run lint` → Check code

## 📝 Key Files
- **Frontend**: `src/App.jsx`, `src/lib/api.js`
- **Backend**: `server/server.js`, `server/routes/`
- **Config**: `.env`, `.env.server`, `package.json`
- **Docs**: `INDEX.md`, `SETUP.md`

## 🔐 Environment Variables

### .env (Frontend)
- `VITE_API_URL` - Backend URL
- `VITE_FIREBASE_*` - Firebase config

### .env.server (Backend)
- `PORT` - Backend port (default 4000)
- `DATABASE_URL` - Neon connection string
- `FIREBASE_*` - Firebase Admin SDK credentials
- `NODE_ENV` - Environment (development/production)

## 💡 Remember
- Frontend on **5173**
- Backend on **4000**
- Database in **Neon**
- Auth via **Firebase**
- Start with **`npm run dev:all`**

---

**Status**: ✅ Ready to use!  
**Last Updated**: March 9, 2026
