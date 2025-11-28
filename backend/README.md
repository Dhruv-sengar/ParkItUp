# SmartPark - Parking Marketplace Backend

A FastAPI-based backend for a parking marketplace application with MongoDB.

## Features

- **JWT Authentication**: Secure login/register with role-based access control
- **User Roles**: Provider (create/manage listings) and Renter (browse/book spots)
- **Listings Management**: CRUD operations for parking spots
- **Bookings System**: Create and manage parking reservations
- **Image Upload**: File upload support for listing photos
- **Async MongoDB**: Using Motor for high-performance async operations

## Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: MongoDB (async with Motor)
- **Auth**: JWT tokens, Argon2 password hashing
- **File Upload**: Local storage (easily adaptable to S3/cloud storage)

## Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py          # Configuration settings
│   │   ├── database.py        # MongoDB connection
│   │   └── security.py        # Password hashing & JWT
│   ├── routers/
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── users.py           # User profile management
│   │   ├── listings.py        # Parking listings CRUD
│   │   ├── bookings.py        # Booking management
│   │   └── upload.py          # Image upload
│   ├── schemas/
│   │   ├── common.py          # Shared schemas
│   │   ├── auth.py            # Auth schemas
│   │   ├── listing.py         # Listing schemas
│   │   └── booking.py         # Booking schemas
│   ├── deps.py                # Dependency injection
│   └── main.py                # Application entry point
├── static/uploads/            # Uploaded images
├── requirements.txt
├── populate_sample_data.py    # Sample data script
└── MONGODB_SETUP.md          # MongoDB setup guide
```

## Quick Setup

**📖 See [MONGODB_SETUP.md](MONGODB_SETUP.md) for detailed MongoDB setup instructions!**

**TL;DR:**
1. Create free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Get your connection string
3. Update `.env` with `MONGODB_URI=your_connection_string`
4. Install dependencies: `pip install -r requirements.txt`
5. Run `python populate_sample_data.py` to add sample data with images
6. Start backend: `uvicorn app.main:app --reload`
7. Start frontend: `npm run dev` (from project root)

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up MongoDB

Choose one option:
- **MongoDB Atlas (Recommended)**: Free cloud database, no installation needed
- **Local MongoDB**: Install MongoDB Community Server

See [MONGODB_SETUP.md](MONGODB_SETUP.md) for step-by-step instructions.

### 3. Configure Environment Variables

Edit `.env` file in project root:

```env
VITE_API_BASE=http://localhost:8000/api
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartpark
# OR for local: mongodb://localhost:27017
JWT_SECRET=your-secret-key-change-in-production
```

### 4. Populate Sample Data

```bash
cd backend
python populate_sample_data.py
```

This creates:
- 2 test users (provider & renter)
- 4 sample parking listings with images
- Database indexes

### 5. Start the Backend Server

```bash
cd backend
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

### 6. Start the Frontend

```bash
# In the project root
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Test Accounts

After running `populate_sample_data.py`:

**Provider Account:**
- Email: `provider@test.com`
- Password: `password123`

**Renter Account:**
- Email: `renter@test.com`
- Password: `password123`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users/me` - Get current user profile

### Listings (Provider)
- `POST /api/listings/` - Create listing (Provider only)
- `GET /api/listings/mine` - Get my listings (Provider only)
- `PUT /api/listings/{id}` - Update listing (Owner only)
- `DELETE /api/listings/{id}` - Delete listing (Owner only)

### Listings (Public/Renter)
- `GET /api/listings/` - Browse all listings (with filters)
- `GET /api/listings/{id}` - Get listing details

### Bookings (Renter)
- `POST /api/bookings/` - Create booking (Renter only)
- `GET /api/bookings/mine` - Get my bookings (Renter only)
- `DELETE /api/bookings/{id}` - Cancel booking (Owner only)

### Upload
- `POST /api/upload/` - Upload image

## Database Collections

### users
```json
{
  "_id": "uuid",
  "email": "user@example.com",
  "password_hash": "hashed_password",
  "role": "provider|renter",
  "created_at": "datetime"
}
```

### listings
```json
{
  "_id": "uuid",
  "owner_id": "user_id",
  "title": "Parking Spot Title",
  "description": "Description",
  "address": "123 Main St",
  "city": "City Name",
  "price_per_hour": 10.0,
  "vehicle_size": "Compact|SUV|EV",
  "latitude": 0.0,
  "longitude": 0.0,
  "images": ["url1", "url2"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### bookings
```json
{
  "_id": "uuid",
  "listing_id": "listing_id",
  "renter_id": "user_id",
  "start_time": "datetime",
  "end_time": "datetime",
  "status": "active|cancelled",
  "created_at": "datetime"
}
```

## Security Features

- **Password Hashing**: Argon2 (secure, modern algorithm)
- **JWT Tokens**: 24-hour expiration
- **Role-Based Access**: Providers and Renters have different permissions
- **Ownership Validation**: Users can only modify their own resources
- **CORS**: Configured for frontend origin

## Troubleshooting

**MongoDB Connection Error**
- Check your `MONGODB_URI` in `.env`
- For Atlas: Verify IP whitelist and credentials
- For local: Ensure MongoDB service is running

**No images showing**
- Run `populate_sample_data.py` to add sample listings with images
- Check browser console for errors

**Import Errors**
- Run `pip install -r requirements.txt`
- Ensure you're in the correct virtual environment

**CORS Errors**
- Check frontend URL in `app/main.py` CORS configuration
- Ensure frontend is running on `http://localhost:5173`

## Production Deployment

1. Set strong `JWT_SECRET` in environment variables
2. Use MongoDB Atlas or managed MongoDB service
3. Configure proper CORS origins
4. Use HTTPS
5. Set up proper logging and monitoring
6. Consider rate limiting and API throttling

## License

MIT
