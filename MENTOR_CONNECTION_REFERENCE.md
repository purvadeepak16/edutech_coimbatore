# 🚀 Mentor Connection System - Quick Reference Card

## 📁 File Locations

### Backend
```
backend/src/
├── services/mentorRequestService.js       # Database operations
├── controllers/mentorRequests.controller.js  # Business logic
├── routes/mentorRequests.routes.js        # API endpoints
└── server.js                              # Routes registered ✓
```

### Frontend
```
frontend/src/
├── components/
│   ├── ConnectMentorButton.jsx           # Student button
│   ├── MentorListModal.jsx               # Mentor discovery
│   └── MentorConnectionRequests.jsx      # Mentor inbox
├── services/mentorApi.js                 # API client
└── pages/
    ├── DashboardPage.jsx                 # Student dashboard ✓
    └── MentorDashboard.jsx               # Mentor dashboard ✓
```

---

## 🔌 API Quick Reference

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/mentors` | Any | List all mentors |
| `POST` | `/api/mentor-requests` | Student | Send request |
| `GET` | `/api/mentor-requests/status` | Student | Get statuses |
| `GET` | `/api/mentor-requests` | Mentor | List incoming |
| `POST` | `/api/mentor-requests/:id/accept` | Mentor | Accept request |
| `POST` | `/api/mentor-requests/:id/reject` | Mentor | Reject request |

---

## 🎯 Test Scenarios

### ✅ Scenario 1: Happy Path
1. Login as student
2. Click "Connect Mentor" → Modal opens
3. Click "Connect" on mentor
4. Status shows "Pending" (yellow)
5. Login as mentor
6. See request in dashboard
7. Click "Accept"
8. Student sees "Connected" (green)

### ✅ Scenario 2: Rejection
1. Student sends request
2. Mentor clicks "Reject"
3. Student can send again

### ✅ Scenario 3: Duplicate Prevention
1. Student sends request
2. Try sending again
3. Error: "Request already exists"

---

## 🎨 Status Colors

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| **none** | - | - | No request sent |
| **pending** | 🟡 Yellow | ⏱️ Clock | Awaiting response |
| **accepted** | 🟢 Green | ✅ Check | Connected |
| **rejected** | 🔴 Red | ⚠️ Alert | Can retry |

---

## 🐛 Quick Debugging

### No mentors showing?
```bash
# Check users collection in Firestore
# Verify: userRole = "Mentor"
```

### Button not appearing?
```javascript
// Check: User logged in as Student (not Mentor)
// Verify: ConnectMentorButton imported in DashboardPage
```

### API errors?
```bash
# Backend: Check terminal logs
# Frontend: Check browser console (F12)
# Network: Check Network tab for failed requests
```

### Auth errors?
```javascript
// Verify: Firebase ID token being sent
// Check: Authorization header format: "Bearer <token>"
```

---

## 🔧 Quick Commands

### Start Backend
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

### Start Frontend
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

### Test API Endpoint
```bash
curl http://localhost:5000/api/mentors
```

---

## 📦 Key Components

### ConnectMentorButton
```javascript
// Usage in DashboardPage
<ConnectMentorButton onClick={() => setShowModal(true)} />
```

### MentorListModal
```javascript
// Props
<MentorListModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
/>
```

### MentorConnectionRequests
```javascript
// Standalone component
<MentorConnectionRequests />
// Auto-loads and manages requests
```

---

## 🗄️ Database Quick Check

```javascript
// Firestore Console → mentor_requests collection
// Document ID format: {studentId}_{mentorId}
// Fields:
{
  status: "pending" | "accepted" | "rejected",
  studentId: "...",
  mentorId: "...",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

---

## 🎭 User Roles

### Student
- ✅ Can: View mentors, send requests
- ❌ Cannot: Accept/reject requests

### Mentor
- ✅ Can: View requests, accept/reject
- ❌ Cannot: Create requests

---

## 📚 Documentation Links

- **Full Docs**: [MENTOR_CONNECTION_SYSTEM.md](./MENTOR_CONNECTION_SYSTEM.md)
- **Quick Start**: [MENTOR_CONNECTION_QUICKSTART.md](./MENTOR_CONNECTION_QUICKSTART.md)
- **Diagrams**: [MENTOR_CONNECTION_DIAGRAMS.md](./MENTOR_CONNECTION_DIAGRAMS.md)
- **Summary**: [MENTOR_CONNECTION_SUMMARY.md](./MENTOR_CONNECTION_SUMMARY.md)

---

## ⚡ Quick Fixes

### Clear state after error
```javascript
// Reload page or:
localStorage.clear(); // Clear cached data
window.location.reload();
```

### Reset Firestore data
```javascript
// Firebase Console → Firestore
// Delete mentor_requests collection
// Documents will be recreated on new requests
```

### Restart services
```bash
# Stop: Ctrl+C (both terminals)
# Start: npm run dev (backend, then frontend)
```

---

## ✨ Pro Tips

1. **Keep browser DevTools open** - F12 to see logs
2. **Check Network tab** - View API requests/responses
3. **Monitor backend terminal** - See API calls in real-time
4. **Use Firestore Console** - Inspect database directly
5. **Test both roles** - Student AND mentor perspectives

---

## 🎊 Status

✅ **FULLY IMPLEMENTED & TESTED**

All systems operational and ready for use!

---

*Last Updated: January 22, 2026*
*Version: 1.0.0*
