"""
Script to populate MongoDB with sample parking listings and images
Run this after setting up MongoDB to see the site with data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime
import os

# MongoDB connection
from dotenv import load_dotenv
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

async def populate_sample_data():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client.smartpark
    
    print("🗑️  Clearing existing data...")
    await db.users.delete_many({})
    await db.listings.delete_many({})
    await db.bookings.delete_many({})
    
    print("👤 Creating sample users...")
    
    # Sample provider
    provider_id = str(uuid.uuid4())
    provider = {
        "_id": provider_id,
        "email": "provider@test.com",
        "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$1234567890abcdef$abcdefghijklmnopqrstuvwxyz",  # password: "password123"
        "role": "provider",
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(provider)
    
    # Sample renter
    renter_id = str(uuid.uuid4())
    renter = {
        "_id": renter_id,
        "email": "renter@test.com",
        "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$1234567890abcdef$abcdefghijklmnopqrstuvwxyz",  # password: "password123"
        "role": "renter",
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(renter)
    
    print("🅿️  Creating sample listings...")
    
    sample_listings = [
        {
            "_id": str(uuid.uuid4()),
            "owner_id": provider_id,
            "title": "Downtown Parking - City Center",
            "description": "Secure covered parking in the heart of downtown. Perfect for daily commuters.",
            "address": "123 Main Street",
            "city": "Mumbai",
            "price_per_hour": 50.0,
            "vehicle_size": "Compact",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "images": [
                "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800",
                "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800"
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": str(uuid.uuid4()),
            "owner_id": provider_id,
            "title": "Airport Parking - Long Term",
            "description": "Convenient parking near the airport with shuttle service.",
            "address": "Airport Road, Andheri",
            "city": "Mumbai",
            "price_per_hour": 30.0,
            "vehicle_size": "SUV",
            "latitude": 19.0896,
            "longitude": 72.8656,
            "images": [
                "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800"
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": str(uuid.uuid4()),
            "owner_id": provider_id,
            "title": "Bandra West - Residential Parking",
            "description": "Safe residential parking spot available 24/7.",
            "address": "Hill Road, Bandra West",
            "city": "Mumbai",
            "price_per_hour": 40.0,
            "vehicle_size": "Compact",
            "latitude": 19.0596,
            "longitude": 72.8295,
            "images": [
                "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800"
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": str(uuid.uuid4()),
            "owner_id": provider_id,
            "title": "EV Charging Spot - Powai",
            "description": "Parking with EV charging facility available.",
            "address": "Hiranandani Gardens, Powai",
            "city": "Mumbai",
            "price_per_hour": 60.0,
            "vehicle_size": "EV",
            "latitude": 19.1197,
            "longitude": 72.9078,
            "images": [
                "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800"
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.listings.insert_many(sample_listings)
    
    print("✅ Sample data populated successfully!")
    print(f"   - Provider: provider@test.com (password: password123)")
    print(f"   - Renter: renter@test.com (password: password123)")
    print(f"   - {len(sample_listings)} listings created")
    
    # Create indexes
    print("📊 Creating database indexes...")
    await db.users.create_index("email", unique=True)
    await db.listings.create_index("owner_id")
    await db.listings.create_index("city")
    await db.bookings.create_index("renter_id")
    await db.bookings.create_index("listing_id")
    
    print("✅ Indexes created!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_sample_data())
