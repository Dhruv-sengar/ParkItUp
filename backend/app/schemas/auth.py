from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from .common import MongoBaseModel, PyObjectId

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str = "renter"  # "provider" or "renter"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str

class UserProfile(MongoBaseModel):
    email: EmailStr
    role: str
    created_at: Optional[datetime] = None
