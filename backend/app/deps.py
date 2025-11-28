from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings
from app.core.database import get_database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_provider(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "provider":
        raise HTTPException(status_code=403, detail="Not authorized as provider")
    return current_user

async def get_current_renter(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "renter":
        raise HTTPException(status_code=403, detail="Not authorized as renter")
    return current_user
