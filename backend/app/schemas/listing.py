from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from .common import MongoBaseModel, PyObjectId

class ListingBase(BaseModel):
    title: str
    description: Optional[str] = None
    address: str
    city: Optional[str] = None
    price_per_hour: float
    vehicle_size: str = "Compact" # Compact, SUV, EV
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: List[str] = []

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    price_per_hour: Optional[float] = None
    vehicle_size: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: Optional[List[str]] = None

class ListingResponse(ListingBase, MongoBaseModel):
    owner_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
