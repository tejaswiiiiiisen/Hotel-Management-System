import { query, db } from "../db.js";

export async function seedCheeryData() {
  console.log("🌱 Seeding Cheery Clothing (CH560) organization data...");

  const orgId = "CH560";
  const orgName = "Cheery Clothing";

  // 1. Activate Cheery Clothing organization in organizations table
  try {
    await query("UPDATE organizations SET status = 'Active' WHERE org_id = ? OR name = ?", [orgId, orgName]);
    await query("ALTER TABLE rooms MODIFY COLUMN type VARCHAR(100) DEFAULT 'Standard'");
    await query("ALTER TABLE bookings MODIFY COLUMN type VARCHAR(100) DEFAULT 'Standard'");
  } catch (e) {
    console.warn("Could not update Cheery Clothing status:", e);
  }

  // 2. Clean up existing Cheery Clothing data
  try {
    await query("DELETE FROM rooms WHERE org_id = ?", [orgId]);
    await query("DELETE FROM inventory_items WHERE org_id = ?", [orgId]);
    await query("DELETE FROM bookings WHERE org_id = ?", [orgId]);
    await query("DELETE FROM guests WHERE org_id = ?", [orgId]);
    await query("DELETE FROM purchase_orders WHERE org_id = ?", [orgId]);
    await query("DELETE FROM maintenance_tickets WHERE org_id = ?", [orgId]);
  } catch (e) {
    console.warn("Clean up step warning:", e);
  }

  // 3. Seed 16 Rooms for Cheery Clothing across 4 Floors
  const rooms = [
    // 1st Floor
    {
      name: "Room 101 - Boutique Standard Room",
      slug: "room-101-boutique-standard-ch",
      type: "Standard",
      roomNumber: "101",
      floor: "1st Floor",
      roomView: "Courtyard View",
      pricePerNight: 2800,
      capacity: 2,
      sizeSqm: 28,
      beds: "1 Queen Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "TV", "Designer Robes"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Boutique standard room with courtyard view on 1st Floor.",
      description: "Fashion-forward boutique room with custom textile finishes, plush queen bed, and designer robes.",
    },
    {
      name: "Room 102 - Fashion Deluxe Room",
      slug: "room-102-fashion-deluxe-ch",
      type: "Deluxe",
      roomNumber: "102",
      floor: "1st Floor",
      roomView: "City View",
      pricePerNight: 4200,
      capacity: 2,
      sizeSqm: 36,
      beds: "1 King Bed",
      status: "Occupied",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "Smart TV", "Full Dressing Vanity", "Espresso Machine"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Chic deluxe room with illuminated vanity on 1st Floor.",
      description: "Spacious deluxe layout with full dressing vanity, garment steamer, and premium espresso lounge.",
    },
    {
      name: "Room 103 - Velvet Single Nook",
      slug: "room-103-velvet-single-ch",
      type: "Single",
      roomNumber: "103",
      floor: "1st Floor",
      roomView: "Garden View",
      pricePerNight: 2000,
      capacity: 1,
      sizeSqm: 20,
      beds: "1 Single Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "Work Desk", "Velvet Armchair"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Quiet solo traveler room on 1st Floor.",
      description: "Compact single room tailored for solo guests with ergonomic desk setup and velvet lounge chair.",
    },
    {
      name: "Room 104 - Courtyard Twin Room",
      slug: "room-104-courtyard-twin-ch",
      type: "Double",
      roomNumber: "104",
      floor: "1st Floor",
      roomView: "Courtyard View",
      pricePerNight: 3400,
      capacity: 2,
      sizeSqm: 32,
      beds: "2 Twin Beds",
      status: "Cleaning",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "TV", "Coffee Maker", "Twin Beds"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Comfortable twin room on 1st Floor.",
      description: "Ideal twin bed layout featuring courtyard garden views and high-speed Wi-Fi.",
    },

    // 2nd Floor
    {
      name: "Room 201 - Executive Couture Room",
      slug: "room-201-executive-couture-ch",
      type: "Deluxe",
      roomNumber: "201",
      floor: "2nd Floor",
      roomView: "City View",
      pricePerNight: 4800,
      capacity: 2,
      sizeSqm: 38,
      beds: "1 King Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Balcony", "Air Conditioning", "Smart TV", "Minibar"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Executive 2nd floor deluxe room with balcony.",
      description: "Balcony room offering city horizon views, king bedding, and custom wardrobe amenities.",
    },
    {
      name: "Room 202 - Premium Runway Suite",
      slug: "room-202-premium-runway-suite-ch",
      type: "Suite",
      roomNumber: "202",
      floor: "2nd Floor",
      roomView: "Skyline View",
      pricePerNight: 7500,
      capacity: 3,
      sizeSqm: 52,
      beds: "1 King Bed + 1 Sofa Bed",
      status: "Occupied",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Living Lounge", "Walk-in Closet", "Smart TV", "Mini Fridge"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Luxury suite with private runway dressing lounge.",
      description: "Spacious master suite with separate lounge, walk-in closet, and designer lighting.",
    },
    {
      name: "Room 203 - Designer Double Room",
      slug: "room-203-designer-double-ch",
      type: "Double",
      roomNumber: "203",
      floor: "2nd Floor",
      roomView: "Garden View",
      pricePerNight: 3800,
      capacity: 2,
      sizeSqm: 34,
      beds: "1 Queen Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "Queen Bed", "Workstation"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Refined double room on 2nd Floor.",
      description: "Modern room decorated in neutral silk palettes, equipped with workstation and queen bed.",
    },
    {
      name: "Room 204 - Family Glamour Suite",
      slug: "room-204-family-glamour-suite-ch",
      type: "Family",
      roomNumber: "204",
      floor: "2nd Floor",
      roomView: "Pool View",
      pricePerNight: 8200,
      capacity: 4,
      sizeSqm: 60,
      beds: "1 King Bed + 2 Single Beds",
      status: "Cleaning",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Two Bedrooms", "Air Conditioning", "2x Smart TV", "Dining Area"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Generous family suite for 4 guests.",
      description: "Two bedroom suite designed for maximum family comfort with poolside terrace views.",
    },

    // 3rd Floor
    {
      name: "Room 301 - Panorama Skyline Suite",
      slug: "room-301-panorama-skyline-suite-ch",
      type: "Suite",
      roomNumber: "301",
      floor: "3rd Floor",
      roomView: "Skyline View",
      pricePerNight: 9500,
      capacity: 4,
      sizeSqm: 65,
      beds: "1 Super King Bed + Sofa Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Skyline View", "Freestanding Tub", "Nespresso Bar", "Balcony"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "3rd floor panorama suite with skyline view.",
      description: "High-floor suite featuring panoramic glass walls, freestanding bath tub, and Nespresso espresso bar.",
    },
    {
      name: "Room 302 - Superior Velvet Suite",
      slug: "room-302-superior-velvet-suite-ch",
      type: "Deluxe",
      roomNumber: "302",
      floor: "3rd Floor",
      roomView: "City View",
      pricePerNight: 5800,
      capacity: 2,
      sizeSqm: 40,
      beds: "1 King Bed",
      status: "Occupied",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Balcony", "Marble Bathroom", "Smart TV", "Minibar"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Superior deluxe room with marble bathroom.",
      description: "Plush velvet upholstery, Italian marble bath, and private balcony overlooking the boulevard.",
    },
    {
      name: "Room 303 - High-Floor Atelier Room",
      slug: "room-303-high-floor-atelier-ch",
      type: "Double",
      roomNumber: "303",
      floor: "3rd Floor",
      roomView: "City View",
      pricePerNight: 4500,
      capacity: 2,
      sizeSqm: 35,
      beds: "1 King Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "King Bed", "Workstation"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Quiet high-floor double room.",
      description: "Minimalist atelier aesthetic featuring solid oak furniture and city view windows.",
    },
    {
      name: "Room 304 - Solo Stylist Studio",
      slug: "room-304-solo-stylist-studio-ch",
      type: "Single",
      roomNumber: "304",
      floor: "3rd Floor",
      roomView: "Courtyard View",
      pricePerNight: 2400,
      capacity: 1,
      sizeSqm: 24,
      beds: "1 Single Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Executive Desk", "Air Conditioning", "Single Bed"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Single room tailored for stylists & solo guests.",
      description: "Private single sanctuary equipped with garment rack and high-speed fiber internet.",
    },

    // 4th Floor
    {
      name: "Room 401 - Royal Penthouse Runway Suite",
      slug: "room-401-royal-penthouse-runway-ch",
      type: "Suite",
      roomNumber: "401",
      floor: "4th Floor",
      roomView: "Panoramic Terrace View",
      pricePerNight: 14500,
      capacity: 6,
      sizeSqm: 95,
      beds: "2 Super King Beds",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Private Jacuzzi", "Terrace Lounge", "Private Bar", "24/7 Concierge"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Top floor royal penthouse suite for 6 guests.",
      description: "Grand penthouse with rooftop terrace jacuzzi, dining area for 6, and private butler service.",
    },
    {
      name: "Room 402 - Luxury Couture Suite",
      slug: "room-402-luxury-couture-suite-ch",
      type: "Suite",
      roomNumber: "402",
      floor: "4th Floor",
      roomView: "Skyline View",
      pricePerNight: 16500,
      capacity: 5,
      sizeSqm: 110,
      beds: "2 King Beds + 1 Daybed",
      status: "Occupied",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Infrared Sauna", "Private Bar", "Walk-in Closet"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Ultra luxury penthouse suite with sauna.",
      description: "Flagship suite featuring personal infrared sauna, walk-in wardrobe, and sound system.",
    },
    {
      name: "Room 403 - Royal Silk Suite",
      slug: "room-403-royal-silk-suite-ch",
      type: "Deluxe",
      roomNumber: "403",
      floor: "4th Floor",
      roomView: "Mountain View",
      pricePerNight: 10500,
      capacity: 4,
      sizeSqm: 60,
      beds: "1 King Bed + 1 Queen Bed",
      status: "Cleaning",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Mountain View", "Spa Bath", "King Bed", "Minibar"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Spacious 4th floor deluxe suite with mountain vistas.",
      description: "Top-floor deluxe suite with mountain views, marble spa bath, and silk draping.",
    },
    {
      name: "Room 404 - Top-Floor Studio Twin",
      slug: "room-404-top-floor-studio-twin-ch",
      type: "Standard",
      roomNumber: "404",
      floor: "4th Floor",
      roomView: "City View",
      pricePerNight: 3500,
      capacity: 2,
      sizeSqm: 32,
      beds: "2 Twin Beds",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "City View", "Twin Beds"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Top-floor standard twin room.",
      description: "Quiet top-floor room with vaulted ceilings, twin beds, and panoramic city views.",
    },
  ];

  for (const r of rooms) {
    await query(
      `INSERT INTO rooms 
        (name, slug, type, room_number, floor, room_view, price_per_night, capacity, size_sqm, beds, status, available, images, amenities, policies, short_description, description, org_name, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?, ?)`,
      [
        r.name,
        r.slug,
        r.type,
        r.roomNumber,
        r.floor,
        r.roomView,
        r.pricePerNight,
        r.capacity,
        r.sizeSqm,
        r.beds,
        r.status,
        r.available,
        r.images,
        r.amenities,
        r.policies,
        r.shortDescription,
        r.description,
        orgName,
        orgId,
      ]
    );
  }
  console.log(`✅ ${rooms.length} Rooms seeded for Cheery Clothing (${orgId}).`);

  // 4. Seed 5 Guests for Cheery Clothing
  const guests = [
    { name: "Ananya Roy", relationship: "VIP Guest", age: 28 },
    { name: "Karan Johar", relationship: "Fashion Designer", age: 42 },
    { name: "Shalini Kapoor", relationship: "Corporate Guest", age: 36 },
    { name: "Manish Malhotra", relationship: "VIP Guest", age: 48 },
    { name: "Rhea Kapoor", relationship: "Stylist", age: 31 },
  ];

  for (const g of guests) {
    await query(
      "INSERT INTO guests (user_id, name, relationship, age, org_id) VALUES (1, ?, ?, ?, ?)",
      [g.name, g.relationship, g.age, orgId]
    );
  }
  console.log("✅ 5 Guests seeded for Cheery Clothing.");

  // 5. Seed 5 Bookings for Cheery Clothing
  const bookings = [
    { code: "#B-CH01", name: "Room 102 - Fashion Deluxe Room", roomNum: "102", floor: "1st Floor", view: "City View", type: "Deluxe", status: "Occupied", in: "2026-08-29", out: "2026-09-03", amountPaid: 26000, payStatus: "Paid", payMethod: "Credit Card" },
    { code: "#B-CH02", name: "Room 402 - Luxury Couture Suite", roomNum: "402", floor: "4th Floor", view: "Skyline View", type: "Suite", status: "Active Stay", in: "2026-09-01", out: "2026-09-06", amountPaid: 36000, payStatus: "Partially Paid", payMethod: "Wire Transfer" },
    { code: "#B-CH03", name: "Room 101 - Boutique Standard Room", roomNum: "101", floor: "1st Floor", view: "Courtyard View", type: "Standard", status: "Completed", in: "2026-08-18", out: "2026-08-22", amountPaid: 11200, payStatus: "Paid", payMethod: "UPI / GPay" },
    { code: "#B-CH04", name: "Room 202 - Premium Runway Suite", roomNum: "202", floor: "2nd Floor", view: "Skyline View", type: "Suite", status: "Active Stay", in: "2026-08-25", out: "2026-08-30", amountPaid: 42000, payStatus: "Paid", payMethod: "Corporate Billing" },
    { code: "#B-CH05", name: "Room 302 - Superior Velvet Suite", roomNum: "302", floor: "3rd Floor", view: "City View", type: "Deluxe", status: "Active Stay", in: "2026-08-10", out: "2026-08-14", amountPaid: 23200, payStatus: "Paid", payMethod: "Net Banking" },
  ];

  for (const b of bookings) {
    await query(
      `INSERT INTO bookings 
        (user_id, room_id, booking_code, room_name, room_number, floor, room_view, location, type, status, check_in_date, check_out_date, nightly_rate, amount_paid, payment_status, payment_method, image, org_id)
       VALUES (1, 1, ?, ?, ?, ?, ?, 'Boutique Wing', ?, ?, ?, ?, 5200, ?, ?, ?, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', ?)`,
      [b.code, b.name, b.roomNum, b.floor, b.view, b.type, b.status, b.in, b.out, b.amountPaid, b.payStatus, b.payMethod, orgId]
    );
  }
  console.log("✅ 5 Bookings seeded for Cheery Clothing.");

  // 6. Seed 5 Inventory Items for Cheery Clothing
  const items = [
    { name: "Silk Bathrobes & Slippers Set", category: "Apparel", inStock: 65, reorderAt: 15, price: 2400, sku: "APP-CH-01", supplier: "Boutique Threads", icon: "👘" },
    { name: "Monogrammed Linen Towels", category: "Linen", inStock: 140, reorderAt: 30, price: 950, sku: "LIN-CH-02", supplier: "Luxury Weaves", icon: "🧖" },
    { name: "Custom Garment Steamers 1800W", category: "Electronics", inStock: 18, reorderAt: 5, price: 3800, sku: "ELE-CH-03", supplier: "Vogue Appliances", icon: "👔" },
    { name: "Aromatherapy Fabric Refresh Spray 500ml", category: "Cleaning", inStock: 45, reorderAt: 12, price: 420, sku: "CLN-CH-04", supplier: "PureScent Labs", icon: "🧴" },
    { name: "Minibar Organic Sparkling Wine 750ml", category: "Minibar", inStock: 30, reorderAt: 10, price: 1500, sku: "MIN-CH-05", supplier: "Vintage Cellars", icon: "🍾" },
  ];

  for (const item of items) {
    await query(
      `INSERT INTO inventory_items 
        (name, category, in_stock, reorder_at, unit_price, icon, supplier, sku, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.name, item.category, item.inStock, item.reorderAt, item.price, item.icon, item.supplier, item.sku, orgId]
    );
  }
  console.log("✅ 5 Inventory Items seeded for Cheery Clothing.");

  // 7. Seed 5 Purchase Orders for Cheery Clothing
  const pos = [
    { id: "PO-CH-201", supplier: "Boutique Threads", category: "Apparel", summary: "50 Monogrammed Silk Robes", amount: 120000, delivery: "3 Days", status: "Delivered" },
    { id: "PO-CH-202", supplier: "Luxury Weaves", category: "Linen", summary: "100 Sets Luxury Bath Towels", amount: 95000, delivery: "4 Days", status: "Ordered" },
    { id: "PO-CH-203", supplier: "Vogue Appliances", category: "Electronics", summary: "10 Garment Steamers", amount: 38000, delivery: "2 Days", status: "Shipped" },
    { id: "PO-CH-204", supplier: "PureScent Labs", category: "Cleaning", summary: "50 Spray Bottles Aromatherapy", amount: 21000, delivery: "5 Days", status: "Pending Approval" },
    { id: "PO-CH-205", supplier: "Vintage Cellars", category: "Minibar", summary: "24 Bottles Organic Wine", amount: 36000, delivery: "1 Day", status: "Delivered" },
  ];

  for (const po of pos) {
    await query(
      `INSERT INTO purchase_orders 
        (id, supplier, category, items_summary, total_amount, order_date, expected_delivery, status, created_by, org_id)
       VALUES (?, ?, ?, ?, ?, '27 Aug 2026', ?, ?, 'Procurement Desk', ?)`,
      [po.id, po.supplier, po.category, po.summary, po.amount, po.delivery, po.status, orgId]
    );
  }
  console.log("✅ 5 Purchase Orders seeded for Cheery Clothing.");

  // 8. Seed 5 Maintenance Tickets for Cheery Clothing
  const tickets = [
    { code: "#M-CH01", roomNum: "402", asset: "Room 402 Garment Steamer", type: "Electronics", issue: "Descaling & heating element repair", priority: "High", status: "In Progress", tech: "Eng. Sameer Verma" },
    { code: "#M-CH02", roomNum: "204", asset: "Room 204 Vanity Lighting", type: "Electrical", issue: "Vanity mirror LED light strip replacement", priority: "Medium", status: "Open", tech: "Electrician Deepak" },
    { code: "#M-CH03", roomNum: "102", asset: "Room 102 Closet Hanger Rack", type: "Carpentry", issue: "Loose mounting bracket on wardrobe bar", priority: "Low", status: "Resolved", tech: "Carpenter Mahendra" },
    { code: "#M-CH04", roomNum: "306", asset: "Room 306 Air Purifier", type: "HVAC", issue: "HEPA filter change & sensor reset", priority: "Low", status: "Resolved", tech: "Tech Support Anil" },
    { code: "#M-CH05", roomNum: "501", asset: "Penthouse 501 Terrace Awning", type: "Facility", issue: "Motorized terrace canopy retracting mechanism stuck", priority: "Emergency", status: "In Progress", tech: "Chief Engineer Ramesh" },
  ];

  for (const t of tickets) {
    await query(
      `INSERT INTO maintenance_tickets 
        (ticket_code, room_number, asset, asset_type, category, issue, priority, status, assigned_to, reported_by, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Front Desk', ?)`,
      [t.code, t.roomNum, t.asset, t.type, t.type, t.issue, t.priority, t.status, t.tech, orgId]
    );
  }
  console.log("✅ 5 Maintenance Tickets seeded for Cheery Clothing.");

  console.log("🎉 Seeding complete for Cheery Clothing (CH560)!");
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith("seed-cheery.ts") || process.argv[1]?.endsWith("seed-cheery.js")) {
  seedCheeryData().then(() => {
    db.end();
  });
}

