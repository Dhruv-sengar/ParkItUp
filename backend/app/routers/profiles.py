from fastapi import APIRouter, Depends, HTTPException, Query
from app.deps import get_current_user
from app.core.database import get_database
from pydantic import BaseModel

router = APIRouter()

class ProfileUpsert(BaseModel):
    user_id: str
    email: str
    role: str

@router.post("/upsert")
async def upsert_profile(profile: ProfileUpsert, current_user: dict = Depends(get_current_user)):
    if profile.user_id != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Cannot update another user's profile")
        
    db = get_database()
    await db.users.update_one(
        {"_id": profile.user_id},
        {"$set": {"email": profile.email, "role": profile.role}}
    )
    
    updated_user = await db.users.find_one({"_id": profile.user_id})
    return {
        "user_id": updated_user["_id"],
        "email": updated_user["email"],
        "role": updated_user["role"]
    }

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["_id"],
        "email": current_user["email"],
        "role": current_user["role"]
    }

@router.get("/")
async def get_profile(user_id: str = Query(...), current_user: dict = Depends(get_current_user)):
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    return {
        "user_id": user["_id"],
        "email": user["email"],
        "role": user["role"]
    }
