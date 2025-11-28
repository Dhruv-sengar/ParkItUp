from fastapi import APIRouter, Depends, HTTPException
from app.deps import get_current_user
from app.core.database import get_database
from pydantic import BaseModel

router = APIRouter()

class UserRoleUpdate(BaseModel):
    role: str

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "role": current_user["role"],
        "created_at": current_user["created_at"]
    }

@router.put("/role")
async def update_role(role_data: UserRoleUpdate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if role_data.role not in ["renter", "provider"]:
         raise HTTPException(status_code=400, detail="Invalid role")
    
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": {"role": role_data.role}})
    return {"message": "Role updated", "role": role_data.role}
