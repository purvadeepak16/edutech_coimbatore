# Mentor-Student Connection - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Start the Backend
```bash
cd backend
npm run dev
```

The backend should start on `http://localhost:5000`

### Step 2: Start the Frontend
```bash
cd frontend
npm run dev
```

The frontend should start on `http://localhost:5173`

---

## 👨‍🎓 Testing as Student

1. **Login as a student** (or create student account)
2. **Navigate to Dashboard**
3. **Look for "Connect Mentor" button** (top-right, purple gradient)
4. **Click the button** → Modal opens
5. **View available mentors** with their specializations
6. **Click "Connect"** on any mentor
7. **See status change** to "Pending" (yellow badge)

---

## 👨‍🏫 Testing as Mentor

1. **Login as a mentor** (or create mentor account with `userRole: 'Mentor'`)
2. **Navigate to Mentor Dashboard** (`/mentor/dashboard`)
3. **Scroll down** to "Student Connection Requests" section
4. **See incoming requests** from students
5. **Click "Accept"** or **"Reject"** buttons
6. **Request disappears** from list after action

---

## 🎯 Test Scenarios

### Scenario 1: Happy Path
1. Student sends request to Mentor A
2. Student sees "Pending" badge
3. Mentor A sees request in dashboard
4. Mentor A clicks "Accept"
5. Student sees "Connected" badge ✅

### Scenario 2: Rejection Flow
1. Student sends request to Mentor B
2. Mentor B clicks "Reject"
3. Student sees "Rejected" badge
4. Student can send new request to same mentor

### Scenario 3: Duplicate Prevention
1. Student sends request to Mentor C
2. Student tries to send another request to Mentor C
3. Backend returns error: "Request already exists"
4. Button remains "Pending" ✅

---

## 🔍 Verify Implementation

### Backend Check
```bash
# Test mentor listing endpoint
curl http://localhost:5000/api/mentors

# Expected: JSON with list of mentors
```

### Frontend Check
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click "Connect Mentor" button
4. See API calls to `/api/mentors` and `/api/mentor-requests/status`

### Database Check
1. Open Firebase Console
2. Go to Firestore Database
3. Look for `mentor_requests` collection
4. Should see documents with format: `{studentId}_{mentorId}`

---

## 📝 Sample Test Data

### Create Test Mentor
```javascript
// In Firebase Console > Firestore > users collection
{
  userId: "mentor123",
  userName: "Dr. Sarah Johnson",
  userRole: "Mentor",
  email: "sarah@mentor.com",
  mentorSpecializations: ["Mathematics", "Physics"]
}
```

### Create Test Student
```javascript
// In Firebase Console > Firestore > users collection
{
  userId: "student456",
  userName: "Alex Smith",
  userRole: "Student",
  email: "alex@student.com"
}
```

---

## ⚙️ Configuration

### Backend (.env)
```env
PORT=5000
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🐛 Troubleshooting

### "No mentors available"
- Check users collection has entries with `userRole: 'Mentor'`
- Verify backend API is running
- Check browser console for errors

### "Not authenticated"
- Ensure you're logged in
- Check Firebase Auth is initialized
- Verify ID token is being sent

### "Failed to send request"
- Check backend logs for errors
- Verify Firestore has write permissions
- Ensure mentor ID is valid

### Button not appearing
- Verify you're logged in as student (not mentor)
- Check if `ConnectMentorButton` is imported in `DashboardPage.jsx`
- Refresh the page

---

## 📦 NPM Dependencies (Already Installed)

### Backend
- `express` - API server
- `cors` - Cross-origin requests
- `firebase-admin` - Firestore access
- `dotenv` - Environment variables

### Frontend
- `react` - UI framework
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `firebase` - Client SDK

---

## 🎨 UI Components Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| `ConnectMentorButton` | `components/` | Trigger button on student dashboard |
| `MentorListModal` | `components/` | Shows all mentors with status |
| `MentorConnectionRequests` | `components/` | Mentor's request inbox |

---

## 📞 Need Help?

1. Check [MENTOR_CONNECTION_SYSTEM.md](./MENTOR_CONNECTION_SYSTEM.md) for detailed docs
2. Review backend logs in terminal
3. Check browser console (F12) for errors
4. Verify Firestore data structure

---

**Ready to test!** 🎉

Start both servers and follow the testing steps above.
