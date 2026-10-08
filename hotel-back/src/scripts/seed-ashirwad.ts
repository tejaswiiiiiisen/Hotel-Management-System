import { query, db } from "../db.js";

export async function seedAshirwadData() {
  console.log("🌱 Seeding Ashirwad (AS435) organization data...");

  const orgId = "AS435";
  const orgName = "Ashirwad";

  // 1. Activate Ashirwad organization in organizations table
  try {
    await query("UPDATE organizations SET status = 'Active' WHERE org_id = ? OR name = ?", [orgId, orgName]);
    await query("ALTER TABLE rooms MODIFY COLUMN type VARCHAR(100) DEFAULT 'Standard'");
    await query("ALTER TABLE bookings MODIFY COLUMN type VARCHAR(100) DEFAULT 'Standard'");
  } catch (e) {
    console.warn("Could not update Ashirwad status in organizations table:", e);
  }

  // 2. Clean up existing Ashirwad data to avoid duplicates
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

  // 3. Seed 16 Rooms for Ashirwad across 4 Floors
  const rooms = [
    // 1st Floor
    {
      name: "Room 101 - Standard Single Room",
      slug: "room-101-standard-single-ash",
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
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "TV", "Work Desk"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Quiet standard single room on 1st Floor.",
      description: "Cozy single room with serene garden window view, high-speed Wi-Fi, and modern shower bathroom.",
    },
    {
      name: "Room 102 - Deluxe Double Room",
      slug: "room-102-deluxe-double-ash",
      type: "Deluxe",
      roomNumber: "102",
      floor: "1st Floor",
      roomView: "City View",
      pricePerNight: 4500,
      capacity: 2,
      sizeSqm: 38,
      beds: "1 Queen Bed",
      status: "Occupied",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "TV", "Minibar", "Balcony"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Executive deluxe double room on 1st Floor.",
      description: "Spacious deluxe room with private balcony, mini bar, rainfall shower, and plush queen bedding.",
    },
    {
      name: "Room 103 - Cozy Single Room",
      slug: "room-103-cozy-single-ash",
      type: "Single",
      roomNumber: "103",
      floor: "1st Floor",
      roomView: "Garden View",
      pricePerNight: 1900,
      capacity: 1,
      sizeSqm: 20,
      beds: "1 Single Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "Work Desk", "Shower"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Compact single room on 1st Floor.",
      description: "Functional room designed for business solo guests with quiet garden outlook.",
    },
    {
      name: "Room 104 - Garden Twin Room",
      slug: "room-104-garden-twin-ash",
      type: "Double",
      roomNumber: "104",
      floor: "1st Floor",
      roomView: "Courtyard View",
      pricePerNight: 3300,
      capacity: 2,
      sizeSqm: 30,
      beds: "2 Twin Beds",
      status: "Cleaning",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "TV", "Coffee Maker", "Twin Beds"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Garden view twin bed room on 1st Floor.",
      description: "Comfortable twin room overlooking the inner garden courtyard.",
    },

    // 2nd Floor
    {
      name: "Room 201 - Executive Deluxe Room",
      slug: "room-201-executive-deluxe-ash",
      type: "Deluxe",
      roomNumber: "201",
      floor: "2nd Floor",
      roomView: "City View",
      pricePerNight: 4600,
      capacity: 2,
      sizeSqm: 36,
      beds: "1 King Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Balcony", "Air Conditioning", "Smart TV", "Minibar"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Deluxe balcony room on 2nd Floor.",
      description: "Chic deluxe room with balcony city views, blackout curtains, and marble bathroom.",
    },
    {
      name: "Room 202 - Executive Suite",
      slug: "room-202-executive-suite-ash",
      type: "Suite",
      roomNumber: "202",
      floor: "2nd Floor",
      roomView: "Pool View",
      pricePerNight: 7800,
      capacity: 3,
      sizeSqm: 55,
      beds: "1 King Bed + Sofa",
      status: "Occupied",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "TV", "Jacuzzi", "Coffee Machine"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Executive suite with living lounge & jacuzzi.",
      description: "Grand suite featuring private jacuzzi tub, living room lounge, and poolside balcony.",
    },
    {
      name: "Room 203 - Classic Double Room",
      slug: "room-203-classic-double-ash",
      type: "Double",
      roomNumber: "203",
      floor: "2nd Floor",
      roomView: "Garden View",
      pricePerNight: 3600,
      capacity: 2,
      sizeSqm: 32,
      beds: "1 Queen Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "Queen Bed", "Workstation"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Classic double room on 2nd Floor.",
      description: "Warm wooden tones, comfortable queen bed, and quiet garden facing windows.",
    },
    {
      name: "Room 204 - Family Heritage Room",
      slug: "room-204-family-heritage-ash",
      type: "Family",
      roomNumber: "204",
      floor: "2nd Floor",
      roomView: "Mountain View",
      pricePerNight: 6000,
      capacity: 5,
      sizeSqm: 65,
      beds: "2 Double Beds + 1 Single Bed",
      status: "Cleaning",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "TV", "Dining Area", "Kitchenette"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Spacious family room for 5 guests.",
      description: "Two sleeping zones with dining space, ideal for larger family stays.",
    },

    // 3rd Floor
    {
      name: "Room 301 - Panorama Lakeview Suite",
      slug: "room-301-panorama-lakeview-ash",
      type: "Suite",
      roomNumber: "301",
      floor: "3rd Floor",
      roomView: "Lake View",
      pricePerNight: 8800,
      capacity: 4,
      sizeSqm: 62,
      beds: "1 Super King Bed + Sofa Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Lake View", "Freestanding Tub", "Nespresso Machine", "Balcony"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Corner suite with 180 degree lake panorama view.",
      description: "Wraparound glass corner suite overlooking the lake, complete with soaking tub.",
    },
    {
      name: "Room 302 - Superior Deluxe Room",
      slug: "room-302-superior-deluxe-ash",
      type: "Deluxe",
      roomNumber: "302",
      floor: "3rd Floor",
      roomView: "Lake View",
      pricePerNight: 5400,
      capacity: 2,
      sizeSqm: 38,
      beds: "1 King Bed",
      status: "Occupied",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Balcony", "Lake View", "Marble Bathroom", "Smart TV"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Superior deluxe room on 3rd Floor.",
      description: "Elevated lakeview room with plush king bedding and private balcony.",
    },
    {
      name: "Room 303 - High-Floor Double Room",
      slug: "room-303-high-floor-double-ash",
      type: "Double",
      roomNumber: "303",
      floor: "3rd Floor",
      roomView: "City View",
      pricePerNight: 4100,
      capacity: 2,
      sizeSqm: 34,
      beds: "1 King Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "King Bed", "City View"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "High-floor quiet double room.",
      description: "Serene room featuring city skyline views, tea maker, and high speed internet.",
    },
    {
      name: "Room 304 - Executive Single Room",
      slug: "room-304-executive-single-ash",
      type: "Single",
      roomNumber: "304",
      floor: "3rd Floor",
      roomView: "City View",
      pricePerNight: 2300,
      capacity: 1,
      sizeSqm: 22,
      beds: "1 Single Bed",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Executive Desk", "Air Conditioning", "Single Bed"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Executive single room on 3rd Floor.",
      description: "Tailor-made for business travelers with dedicated workstation.",
    },

    // 4th Floor
    {
      name: "Room 401 - Royal Presidential Suite",
      slug: "room-401-royal-presidential-ash",
      type: "Suite",
      roomNumber: "401",
      floor: "4th Floor",
      roomView: "Panoramical View",
      pricePerNight: 13000,
      capacity: 6,
      sizeSqm: 92,
      beds: "2 Super King Beds",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Private Jacuzzi", "Terrace Lounge", "Full Bar", "24/7 Butler"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Grand penthouse presidential suite.",
      description: "Our finest penthouse residence with outdoor terrace, jacuzzi, and dedicated butler.",
    },
    {
      name: "Room 402 - Luxury Penthouse Suite",
      slug: "room-402-luxury-penthouse-ash",
      type: "Suite",
      roomNumber: "402",
      floor: "4th Floor",
      roomView: "Skyline View",
      pricePerNight: 15500,
      capacity: 5,
      sizeSqm: 110,
      beds: "2 King Beds + 1 Daybed",
      status: "Occupied",
      available: false,
      images: JSON.stringify(["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Infrared Sauna", "Private Bar", "Walk-in Closet"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Top floor luxury penthouse with personal sauna.",
      description: "Exclusive penthouse suite featuring personal sauna, walk-in closet, and premium bar.",
    },
    {
      name: "Room 403 - Royal Deluxe Suite",
      slug: "room-403-royal-deluxe-ash",
      type: "Deluxe",
      roomNumber: "403",
      floor: "4th Floor",
      roomView: "Mountain View",
      pricePerNight: 9900,
      capacity: 4,
      sizeSqm: 58,
      beds: "1 King Bed + 1 Queen Bed",
      status: "Cleaning",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Mountain View", "Spa Bath", "King Bed"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Mountain view deluxe suite on 4th Floor.",
      description: "Spacious suite featuring panoramic mountain views and marble bath.",
    },
    {
      name: "Room 404 - Penthouse Standard Twin",
      slug: "room-404-penthouse-twin-ash",
      type: "Standard",
      roomNumber: "404",
      floor: "4th Floor",
      roomView: "City View",
      pricePerNight: 3100,
      capacity: 2,
      sizeSqm: 30,
      beds: "2 Twin Beds",
      status: "Available",
      available: true,
      images: JSON.stringify(["https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"]),
      amenities: JSON.stringify(["Free Wi-Fi", "Air Conditioning", "City View", "Twin Beds"]),
      policies: JSON.stringify(["Check-in 2 PM", "Check-out 11 AM"]),
      shortDescription: "Top floor standard twin room.",
      description: "Quiet top-floor room with vaulted ceilings and twin bedding.",
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
  console.log(`✅ ${rooms.length} Rooms seeded for Ashirwad (${orgId}).`);

  // 4. Seed 5 Guests / Customers
  const guests = [
    { name: "Rajesh Sharma", relationship: "Self", age: 35 },
    { name: "Priya Patel", relationship: "Spouse", age: 32 },
    { name: "Amitabh Verma", relationship: "Corporate Guest", age: 45 },
    { name: "Sunita Gupta", relationship: "Family", age: 29 },
    { name: "Vikramaditya Singh", relationship: "VIP Guest", age: 50 },
  ];

  for (const g of guests) {
    await query(
      "INSERT INTO guests (user_id, name, relationship, age, org_id) VALUES (1, ?, ?, ?, ?)",
      [g.name, g.relationship, g.age, orgId]
    );
  }
  console.log("✅ 5 Guests seeded for Ashirwad.");

  // 5. Seed 5 Bookings
  const bookings = [
    { code: "#B-ASH01", name: "Room 202 - Executive Suite", roomNum: "202", floor: "2nd Floor", view: "Pool View", type: "Suite", status: "Active Stay", in: "2026-08-20", out: "2026-08-25", amountPaid: 39000, payStatus: "Paid", payMethod: "UPI / GPay" },
    { code: "#B-ASH02", name: "Room 402 - Luxury Penthouse Suite", roomNum: "402", floor: "4th Floor", view: "Skyline View", type: "Suite", status: "Active Stay", in: "2026-08-22", out: "2026-08-28", amountPaid: 77500, payStatus: "Partially Paid", payMethod: "Credit Card" },
    { code: "#B-ASH03", name: "Room 101 - Standard Single Room", roomNum: "101", floor: "1st Floor", view: "Garden View", type: "Standard", status: "Completed", in: "2026-08-10", out: "2026-08-12", amountPaid: 4400, payStatus: "Paid", payMethod: "Cash" },
    { code: "#B-ASH04", name: "Room 302 - Superior Deluxe Room", roomNum: "302", floor: "3rd Floor", view: "Lake View", type: "Deluxe", status: "Active Stay", in: "2026-08-15", out: "2026-08-18", amountPaid: 16200, payStatus: "Paid", payMethod: "Net Banking" },
    { code: "#B-ASH05", name: "Room 401 - Royal Presidential Suite", roomNum: "401", floor: "4th Floor", view: "Panoramical View", type: "Suite", status: "Active Stay", in: "2026-08-14", out: "2026-08-20", amountPaid: 78000, payStatus: "Partially Paid", payMethod: "Corporate Billing" },
  ];

  for (const b of bookings) {
    await query(
      `INSERT INTO bookings 
        (user_id, room_id, booking_code, room_name, room_number, floor, room_view, location, type, status, check_in_date, check_out_date, nightly_rate, amount_paid, payment_status, payment_method, image, org_id)
       VALUES (1, 1, ?, ?, ?, ?, ?, 'Ashirwad Wing', ?, ?, ?, ?, 4500, ?, ?, ?, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', ?)`,
      [b.code, b.name, b.roomNum, b.floor, b.view, b.type, b.status, b.in, b.out, b.amountPaid, b.payStatus, b.payMethod, orgId]
    );
  }
  console.log("✅ 5 Bookings seeded for Ashirwad.");

  // 6. Seed 5 Inventory Items
  const items = [
    { name: "Organic Herbal Tea Boxes", category: "F&B", inStock: 120, reorderAt: 25, price: 450, sku: "FB-ASH-01", supplier: "Himalayan Herbs", icon: "🍵" },
    { name: "Aromatherapy Essential Oil Diffuser", category: "Electronics", inStock: 30, reorderAt: 8, price: 2100, sku: "ELE-ASH-02", supplier: "Aroma Wellness", icon: "🕯️" },
    { name: "Organic Cotton Bath Towels", category: "Linen", inStock: 150, reorderAt: 40, price: 800, sku: "LIN-ASH-03", supplier: "Eco Fab", icon: "🧖" },
    { name: "Eco-Friendly Bamboo Toothbrushes", category: "Amenities", inStock: 300, reorderAt: 50, price: 60, sku: "AMN-ASH-04", supplier: "Green Living", icon: "🪥" },
    { name: "Spiced Chai & Coffee Pods", category: "Minibar", inStock: 200, reorderAt: 40, price: 120, sku: "MIN-ASH-05", supplier: "Brew Masters", icon: "☕" },
  ];

  for (const item of items) {
    await query(
      `INSERT INTO inventory_items 
        (name, category, in_stock, reorder_at, unit_price, icon, supplier, sku, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.name, item.category, item.inStock, item.reorderAt, item.price, item.icon, item.supplier, item.sku, orgId]
    );
  }
  console.log("✅ 5 Inventory Items seeded for Ashirwad.");

  // 7. Seed 5 Purchase Orders (5 distinct PO statuses & categories)
  const pos = [
    { id: "PO-ASH-101", supplier: "Heritage Weaves", category: "Linen", summary: "100 Units Egyptian Cotton Linen", amount: 85000, delivery: "2 Days", status: "Delivered" },
    { id: "PO-ASH-102", supplier: "NatureCare Labs", category: "Toiletries", summary: "200 Bottles Herbal Shampoo", amount: 24000, delivery: "3 Days", status: "Ordered" },
    { id: "PO-ASH-103", supplier: "CleanPro Supplies", category: "Cleaning", summary: "20 Canisters Disinfectant Cleaner", amount: 13000, delivery: "5 Days", status: "Pending Approval" },
    { id: "PO-ASH-104", supplier: "Royal Snacks Co.", category: "Minibar", summary: "150 Boxes Minibar Snacks", amount: 27000, delivery: "1 Day", status: "Shipped" },
    { id: "PO-ASH-105", supplier: "TechAccess Solutions", category: "Electronics", summary: "50 RFID Keycard Door Locks", amount: 95000, delivery: "7 Days", status: "Cancelled" },
  ];

  for (const po of pos) {
    await query(
      `INSERT INTO purchase_orders 
        (id, supplier, category, items_summary, total_amount, order_date, expected_delivery, status, created_by, org_id)
       VALUES (?, ?, ?, ?, ?, '28 Aug 2026', ?, ?, 'Admin User', ?)`,
      [po.id, po.supplier, po.category, po.summary, po.amount, po.delivery, po.status, orgId]
    );
  }
  console.log("✅ 5 Purchase Orders seeded for Ashirwad.");

  // 8. Seed 5 Maintenance Tickets (5 distinct priority & issue types)
  const tickets = [
    { code: "#M-ASH01", roomNum: "404", asset: "Room 404 Air Conditioner", type: "HVAC", issue: "AC compressor cooling failure in Presidential Suite", priority: "High", status: "In Progress", tech: "Eng. Ramesh Kumar" },
    { code: "#M-ASH02", roomNum: "303", asset: "Room 303 Jacuzzi Drain", type: "Plumbing", issue: "Slow water drainage in Jacuzzi tub", priority: "Medium", status: "Open", tech: "Plumber Suresh Yadav" },
    { code: "#M-ASH03", roomNum: "101", asset: "Room 101 Smart TV Remote", type: "Electronics", issue: "TV remote control battery & pairing issue", priority: "Low", status: "Resolved", tech: "Tech Support Anil" },
    { code: "#M-ASH04", roomNum: "202", asset: "Room 202 Balcony Door Lock", type: "Carpentry", issue: "Balcony sliding latch stuck", priority: "Medium", status: "Pending Spare Part", tech: "Carpenter Mahendra" },
    { code: "#M-ASH05", roomNum: "Lobby", asset: "Lobby Chandelier Light Panel", type: "Electrical", issue: "Main entrance chandelier dimmer flickering", priority: "Emergency", status: "In Progress", tech: "Chief Electrician Deepak" },
  ];

  for (const t of tickets) {
    await query(
      `INSERT INTO maintenance_tickets 
        (ticket_code, room_number, asset, asset_type, category, issue, priority, status, assigned_to, reported_by, org_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Admin Desk', ?)`,
      [t.code, t.roomNum, t.asset, t.type, t.type, t.issue, t.priority, t.status, t.tech, orgId]
    );
  }
  console.log("✅ 5 Maintenance Tickets seeded for Ashirwad.");

  console.log("🎉 Seeding complete for Ashirwad (AS435)!");
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith("seed-ashirwad.ts") || process.argv[1]?.endsWith("seed-ashirwad.js")) {
  seedAshirwadData().then(() => {
    db.end();
  });
}

