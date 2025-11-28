from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .common import MongoBaseModel

class BookingCreate(BaseModel):
    listing_id: str
    start_time: datetime
    end_time: datetime

class BookingResponse(MongoBaseModel):
    listing_id: str
    renter_id: str
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime
