import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

uri = "mongodb://localhost:27017"
print(f"Testing local connection to: {uri}")

async def ping():
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        print("✅ Local Connection successful!")
    except Exception as e:
        print(f"❌ Local Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(ping())
