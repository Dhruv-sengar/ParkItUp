# SmartPark - MongoDB Setup Guide

## Quick Start with MongoDB Atlas (Recommended - No Installation Required!)

### Step 1: Create MongoDB Atlas Account (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Create a new **FREE** cluster (M0 Sandbox - 512MB storage)

### Step 2: Configure Database Access

1. In Atlas, go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Username: `smartpark`
5. Password: Create a strong password (save it!)
6. Database User Privileges: **Read and write to any database**
7. Click **Add User**

### Step 3: Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (for development)
4. Click **Confirm**

### Step 4: Get Connection String

1. Go to **Database** (left sidebar)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://smartpark:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password

### Step 5: Update .env File

Edit `d:\smartpark\.env`:

```env
VITE_API_BASE=http://localhost:8000/api

MONGODB_URI=mongodb+srv://smartpark:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smartpark?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-change-in-production-2024
```

### Step 6: Populate Sample Data

```bash
cd backend
python populate_sample_data.py
```

### Step 7: Restart Backend

The backend should auto-reload, but if not:
```bash
# Stop the current backend (Ctrl+C)
cd backend
uvicorn app.main:app --reload
```

### Step 8: View the Site!

Open http://localhost:5173 - you should now see listings with images!

---

## Alternative: Local MongoDB Installation

If you prefer to run MongoDB locally:

### Windows

1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run the installer (use default settings)
3. MongoDB will run as a Windows service automatically
4. Your connection string: `mongodb://localhost:27017`

### Verify MongoDB is Running

```bash
# Check if MongoDB service is running
Get-Service -Name MongoDB
```

### Use Local MongoDB

In `.env`:
```env
MONGODB_URI=mongodb://localhost:27017
```

Then run the populate script:
```bash
cd backend
python populate_sample_data.py
```

---

## Test Accounts

After running `populate_sample_data.py`:

**Provider Account:**
- Email: `provider@test.com`
- Password: `password123`

**Renter Account:**
- Email: `renter@test.com`
- Password: `password123`

---

## Troubleshooting

### "Could not connect to MongoDB"
- Check your MONGODB_URI in `.env`
- For Atlas: Verify IP whitelist and credentials
- For local: Ensure MongoDB service is running

### "No images showing"
- Run `populate_sample_data.py` to add sample listings with images
- Check browser console for errors

### "Authentication failed"
- Verify password in connection string matches MongoDB Atlas user password
- Ensure no special characters need URL encoding in password

---

## Next Steps

1. ✅ Set up MongoDB Atlas (or local MongoDB)
2. ✅ Update `.env` with connection string
3. ✅ Run `populate_sample_data.py`
4. ✅ Restart backend
5. ✅ View site with images!
