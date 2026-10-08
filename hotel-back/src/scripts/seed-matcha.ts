import { query } from "../db.js";

export async function seedMatchaData() {
  console.log("🌱 Seeding Matcha Tea (MA330) organization data...");

  const orgId = "MA330";
  const orgName = "Matcha Tea";

  try {
    await query("UPDATE organizations SET status = 'Active' WHERE org_id = ? OR name = ?", [orgId, orgName]);
    await query("ALTER TABLE rooms MODIFY COLUMN type VARCHAR(100) DEFAULT 'Standard'");
  } catch (e) {
    console.warn("Warning during Matcha Tea status update:", e);
  }

  // Clean existing Matcha Tea rooms
  try {
    await query("DELETE FROM rooms WHERE org_id = ?", [orgId]);
  } catch (e) {
    console.warn("Warning during Matcha room deletion:", e);
  }

  const rooms = [
    {
      name: "Room 101 - Standard Room",
      slug: "room-101-standard-room-ma",
      type: "Standard",
      roomNumber: "101",
      floor: "1st Floor",
      roomView: "Garden View",
      pricePerNight: 2200,
      capacity: 1,
      sizeSqm: 25,
      beds: "1 Single Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["WiFi", "Air conditioning", "Garden View", "Work desk"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Executive Standard on 1st Floor.",
    },
    {
      name: "Room 202 - Deluxe Double Room",
      slug: "room-202-deluxe-double-room-ma",
      type: "Deluxe",
      roomNumber: "202",
      floor: "2nd Floor",
      roomView: "City View",
      pricePerNight: 4500,
      capacity: 2,
      sizeSqm: 38,
      beds: "1 Queen Bed",
      status: "Occupied",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["WiFi", "Air conditioning", "City View", "Minibar", "Balcony"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Executive Deluxe on 2nd Floor.",
    },
    {
      name: "Room 303 - Executive Suite",
      slug: "room-303-executive-suite-ma",
      type: "Suite",
      roomNumber: "303",
      floor: "3rd Floor",
      roomView: "Pool View",
      pricePerNight: 7800,
      capacity: 3,
      sizeSqm: 55,
      beds: "1 King Bed + Sofa",
      status: "Cleaning",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["WiFi", "Air conditioning", "Jacuzzi", "Coffee Machine"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Executive Suite on 3rd Floor.",
    },
    {
      name: "Room 404 - Presidential Luxury Suite",
      slug: "room-404-presidential-luxury-suite-ma",
      type: "Presidential",
      roomNumber: "404",
      floor: "4th Floor",
      roomView: "Panoramic Ocean View",
      pricePerNight: 15000,
      capacity: 4,
      sizeSqm: 90,
      beds: "2 King Beds",
      status: "Maintenance",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["WiFi", "Air conditioning", "Private Lounge", "Butler Service"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Executive Presidential on 4th Floor.",
    },
    {
      name: "Room 505 - Family Heritage Room",
      slug: "room-505-family-heritage-room-ma",
      type: "Family",
      roomNumber: "505",
      floor: "5th Floor",
      roomView: "Mountain View",
      pricePerNight: 6000,
      capacity: 5,
      sizeSqm: 65,
      beds: "2 Queen Beds + 1 Single Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["WiFi", "Air conditioning", "Mountain View", "Family Dining Area"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Executive Family on 5th Floor.",
    },
  ];

  for (const r of rooms) {
    await query(
      `INSERT INTO rooms 
        (name, slug, type, room_number, floor, room_view, price_per_night, capacity, size_sqm, beds, status, available, images, amenities, policies, short_description, org_name, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?)`,
      [r.name, r.slug, r.type, r.roomNumber, r.floor, r.roomView, r.pricePerNight, r.capacity, r.sizeSqm, r.beds, r.status, r.available, r.images, r.amenities, r.policies, r.shortDescription, orgName, orgId]
    );
  }
  console.log("🎉 Seeding complete for Matcha Tea (MA330)!");
}
