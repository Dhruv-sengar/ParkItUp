from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import UserRegister, UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.database import get_database
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_in: UserRegister):
    db = get_database()
    
    # Check if user exists
    existing = await db.users.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user = {
        "_id": user_id,
        "email": user_in.email,
        "password_hash": get_password_hash(user_in.password),
        "role": user_in.role,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user)
    
    access_token = create_access_token(data={"sub": user_id, "role": user_in.role})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    db = get_database()
    
    user = await db.users.find_one({"email": user_in.email})
    if not user or not verify_password(user_in.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["_id"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "user_id": user["_id"]}

# Alias for compatibility
@router.post("/signup", response_model=Token, include_in_schema=False)
async def signup_alias(user_in: UserRegister):
    return await register(user_in)
