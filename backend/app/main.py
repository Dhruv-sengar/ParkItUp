from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, listings, bookings, upload, users, profiles
from app.core.database import connect_to_mongo, close_mongo_connection
import os

app = FastAPI(title="SmartPark API")

# Startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(listings.router, prefix="/api/listings", tags=["Listings"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])

@app.get("/")
async def root():
    return {"message": "Welcome to SmartPark API - MongoDB Edition"}
