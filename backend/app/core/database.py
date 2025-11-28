from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# MongoDB client
client = None
database = None

async def connect_to_mongo():
    global client, database
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    database = client.smartpark
    print("✅ Connected to MongoDB")

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("❌ Closed MongoDB connection")

def get_database():
    return database
