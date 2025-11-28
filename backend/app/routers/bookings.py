from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.deps import get_current_renter
from app.schemas.booking import BookingCreate, BookingResponse
from app.core.database import get_database
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/mine", response_model=List[BookingResponse])
async def get_my_bookings(current_user: dict = Depends(get_current_renter)):
    db = get_database()
    bookings = await db.bookings.find({"renter_id": current_user["_id"]}).to_list(length=100)
    return [BookingResponse(**{**booking, "id": booking["_id"]}) for booking in bookings]

@router.post("/", response_model=BookingResponse)
async def create_booking(booking_in: BookingCreate, current_user: dict = Depends(get_current_renter)):
    db = get_database()
    
    # Verify listing exists
    listing = await db.listings.find_one({"_id": booking_in.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    booking_id = str(uuid.uuid4())
    booking = {
        "_id": booking_id,
        "listing_id": booking_in.listing_id,
        "renter_id": current_user["_id"],
        "start_time": booking_in.start_time,
        "end_time": booking_in.end_time,
        "status": "active",
        "created_at": datetime.utcnow()
    }
    await db.bookings.insert_one(booking)
    return BookingResponse(**{**booking, "id": booking_id})

@router.delete("/{id}")
async def cancel_booking(id: str, current_user: dict = Depends(get_current_renter)):
    db = get_database()
    
    booking = await db.bookings.find_one({"_id": id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["renter_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")
    
    await db.bookings.update_one({"_id": id}, {"$set": {"status": "cancelled"}})
    return {"message": "Booking cancelled"}
