from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.deps import get_current_user, get_current_provider
from app.schemas.listing import ListingCreate, ListingUpdate, ListingResponse
from app.core.database import get_database
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/", response_model=List[ListingResponse])
async def get_listings(
    city: Optional[str] = None,
    vehicle_size: Optional[str] = None
):
    db = get_database()
    query = {}
    
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if vehicle_size:
        query["vehicle_size"] = vehicle_size
    
    listings = await db.listings.find(query).to_list(length=100)
    return [ListingResponse(**{**listing, "id": listing["_id"]}) for listing in listings]

@router.get("/mine", response_model=List[ListingResponse])
async def get_my_listings(current_user: dict = Depends(get_current_provider)):
    db = get_database()
    listings = await db.listings.find({"owner_id": current_user["_id"]}).to_list(length=100)
    return [ListingResponse(**{**listing, "id": listing["_id"]}) for listing in listings]

@router.post("/", response_model=ListingResponse)
async def create_listing(listing_in: ListingCreate, current_user: dict = Depends(get_current_provider)):
    db = get_database()
    
    listing_id = str(uuid.uuid4())
    listing = {
        "_id": listing_id,
        **listing_in.dict(),
        "owner_id": current_user["_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db.listings.insert_one(listing)
    return ListingResponse(**{**listing, "id": listing_id})

@router.get("/{id}", response_model=ListingResponse)
async def get_listing(id: str):
    db = get_database()
    listing = await db.listings.find_one({"_id": id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return ListingResponse(**{**listing, "id": listing["_id"]})

@router.put("/{id}", response_model=ListingResponse)
async def update_listing(id: str, listing_in: ListingUpdate, current_user: dict = Depends(get_current_provider)):
    db = get_database()
    
    listing = await db.listings.find_one({"_id": id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["owner_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")
    
    update_data = listing_in.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    await db.listings.update_one({"_id": id}, {"$set": update_data})
    updated_listing = await db.listings.find_one({"_id": id})
    return ListingResponse(**{**updated_listing, "id": updated_listing["_id"]})

@router.delete("/{id}")
async def delete_listing(id: str, current_user: dict = Depends(get_current_provider)):
    db = get_database()
    
    listing = await db.listings.find_one({"_id": id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["owner_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
    
    await db.listings.delete_one({"_id": id})
    return {"message": "Listing deleted"}
