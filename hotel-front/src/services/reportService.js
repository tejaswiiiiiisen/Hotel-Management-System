/**
 * Reports & Analytics Service
 * Connects directly to real backend MySQL APIs:
 * - /api/bookings
 * - /api/rooms
 * - /api/customers
 * - /api/payments
 * - /api/organizations
 *
 * Provides real-time data aggregation, branch isolation,
 * and date-range metrics without any mock or fake data.
 */

import { getCurrentOrgId, getUserRole } from "../auth.js";

const BACKEND_URL = "http://localhost:4000/api";

/**
 * Robust date parser supporting formats:
 * - "YYYY-MM-DD", "YYYY/MM/DD"
 * - "DD Mon YYYY" (e.g. "15 Sep 2026")
 * - "Mon DD YYYY" (e.g. "Sep 15 2026")
 * - "DD/MM/YYYY", "DD-MM-YYYY"
 * - Standard ISO strings
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  if (typeof dateStr !== "string") return null;

  const clean = dateStr.trim();
  if (!clean) return null;

  // 1. ISO or standard format
  if (/^\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}/.test(clean)) {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Standard JS Date parser
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) return parsed;

  // 3. DD/MM/YYYY or DD Mon YYYY
  const parts = clean.split(/[\s\/\-\.]+/);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    } else {
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(year)) {
        const numericMonth = parseInt(monthStr, 10);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          return new Date(year, numericMonth - 1, day);
        }
        const monthMap = {
          jan: 0, january: 0,
          feb: 1, february: 1,
          mar: 2, march: 2,
          apr: 3, april: 3,
          may: 4,
          jun: 5, june: 5,
          jul: 6, july: 6,
          aug: 7, august: 7,
          sep: 8, september: 8,
          oct: 9, october: 9,
          nov: 10, november: 10,
          dec: 11, december: 11,
        };
        const m = monthMap[monthStr];
        if (m !== undefined) {
          return new Date(year, m, day);
        }
      }
    }
  }

  return null;
}

/**
 * Returns [startDate, endDate] bounding Date objects for a date preset
 */
export function getDateRangeBounds(rangeKey, customStart = null, customEnd = null) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (rangeKey) {
    case "today":
      return [todayStart, todayEnd];

    case "yesterday": {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return [yStart, yEnd];
    }

    case "last7days": {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 6);
      return [start, todayEnd];
    }

    case "thisweek": {
      const day = todayStart.getDay(); // 0 is Sunday
      const diff = todayStart.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const start = new Date(todayStart.setDate(diff));
      return [start, todayEnd];
    }

    case "thismonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return [start, end];
    }

    case "lastmonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return [start, end];
    }

    case "custom": {
      const s = customStart ? new Date(customStart) : new Date(todayStart);
      s.setHours(0, 0, 0, 0);
      const e = customEnd ? new Date(customEnd) : new Date(todayEnd);
      e.setHours(23, 59, 59, 999);
      return [s, e];
    }

    default: // Default to This Month
      return [
        new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      ];
  }
}

/**
 * Fetch raw data from backend APIs with branch isolation
 */
export async function fetchRawReportData(branchOrgId = "all") {
  const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken") || "";
  const headers = {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };

  if (branchOrgId && branchOrgId !== "all") {
    headers["x-org-id"] = branchOrgId;
  }

  const orgQueryParam = branchOrgId && branchOrgId !== "all" ? `?orgId=${encodeURIComponent(branchOrgId)}` : "";
  const paymentOrgParam = branchOrgId && branchOrgId !== "all" ? `?org_id=${encodeURIComponent(branchOrgId)}` : "";

  // Execute parallel fetches
  const [bookingsRes, roomsRes, customersRes, paymentsRes, orgsRes] = await Promise.allSettled([
    fetch(`${BACKEND_URL}/bookings${orgQueryParam}`, { headers, credentials: "include" }).then((r) => (r.ok ? r.json() : { bookings: [] })),
    fetch(`${BACKEND_URL}/rooms${orgQueryParam}`, { headers, credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
    fetch(`${BACKEND_URL}/customers${paymentOrgParam}`, { headers, credentials: "include" }).then((r) => (r.ok ? r.json() : { customers: [] })),
    fetch(`${BACKEND_URL}/payments${paymentOrgParam}`, { headers, credentials: "include" }).then((r) => (r.ok ? r.json() : { payments: [] })),
    fetch(`${BACKEND_URL}/organizations`, { headers, credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
  ]);

  const rawBookings = bookingsRes.status === "fulfilled" ? (bookingsRes.value.bookings || bookingsRes.value || []) : [];
  const rawRoomsData = roomsRes.status === "fulfilled" ? roomsRes.value : [];
  const rawRooms = Array.isArray(rawRoomsData) ? rawRoomsData : (rawRoomsData.allRooms || rawRoomsData.rooms || []);
  const rawCustomers = customersRes.status === "fulfilled" ? (customersRes.value.customers || customersRes.value || []) : [];
  const rawPayments = paymentsRes.status === "fulfilled" ? (paymentsRes.value.payments || paymentsRes.value || []) : [];
  const rawOrgs = orgsRes.status === "fulfilled" ? (Array.isArray(orgsRes.value) ? orgsRes.value : orgsRes.value.organizations || []) : [];

  return {
    bookings: Array.isArray(rawBookings) ? rawBookings : [],
    rooms: Array.isArray(rawRooms) ? rawRooms : [],
    customers: Array.isArray(rawCustomers) ? rawCustomers : [],
    payments: Array.isArray(rawPayments) ? rawPayments : [],
    organizations: Array.isArray(rawOrgs) ? rawOrgs : [],
  };
}

/**
 * Filter bookings and calculate full report analytics
 */
export function calculateReportAnalytics({
  bookings = [],
  rooms = [],
  customers = [],
  payments = [],
  startDate,
  endDate,
  branchOrgId = "all",
}) {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  // 1. Filter bookings by branch if branchOrgId is specific
  const branchBookings = branchOrgId === "all"
    ? bookings
    : bookings.filter((b) => String(b.orgId || b.org_id) === String(branchOrgId));

  const branchRooms = branchOrgId === "all"
    ? rooms
    : rooms.filter((r) => String(r.orgId || r.org_id) === String(branchOrgId));

  const branchCustomers = branchOrgId === "all"
    ? customers
    : customers.filter((c) => String(c.orgId || c.org_id) === String(branchOrgId));

  const branchPayments = branchOrgId === "all"
    ? payments
    : payments.filter((p) => String(p.orgId || p.org_id) === String(branchOrgId));

  // 2. Filter bookings that overlap or fall into the selected date range
  // Check-in or created_at in range
  const periodBookings = branchBookings.filter((b) => {
    const checkIn = parseDate(b.checkInDate || b.check_in_date);
    const checkOut = parseDate(b.checkOutDate || b.check_out_date);
    const createdAt = parseDate(b.createdAt || b.created_at);

    // If checkIn exists and falls within range
    if (checkIn) {
      const cTime = checkIn.getTime();
      if (cTime >= startTime && cTime <= endTime) return true;
    }
    // Or if checkOut falls within range
    if (checkOut) {
      const oTime = checkOut.getTime();
      if (oTime >= startTime && oTime <= endTime) return true;
    }
    // Or if created within range
    if (createdAt) {
      const crTime = createdAt.getTime();
      if (crTime >= startTime && crTime <= endTime) return true;
    }
    return false;
  });

  // Filter payments within the date range
  const periodPayments = branchPayments.filter((p) => {
    const pDate = parseDate(p.created_at || p.createdAt || p.date);
    if (!pDate) return true;
    const pt = pDate.getTime();
    return pt >= startTime && pt <= endTime;
  });

  // -------------------------------------------------------------
  // KPI CALCULATIONS
  // -------------------------------------------------------------

  // Total Revenue: sum of real amountPaid from period bookings or period payments
  let totalRevenue = 0;
  let totalBilled = 0;
  let totalPending = 0;

  periodBookings.forEach((b) => {
    const paid = Number(b.amountPaid || b.amount_paid || 0);
    const finalAmount = Number(b.finalAmount || b.final_amount || b.totalAmount || b.total_amount || 0);
    const rate = Number(b.nightlyRate || b.nightly_rate || 0);
    const nights = Number(b.nights || 1);
    const computedTotal = finalAmount > 0 ? finalAmount : (rate > 0 ? rate * nights : paid);

    if (String(b.status).toLowerCase() !== "cancelled") {
      totalRevenue += paid;
      totalBilled += computedTotal;
      if (computedTotal > paid) {
        totalPending += (computedTotal - paid);
      }
    }
  });

  // Total Bookings count
  const totalBookingsCount = periodBookings.length;

  // Cancelled Bookings count
  const cancelledBookingsCount = periodBookings.filter(
    (b) => String(b.status).toLowerCase() === "cancelled"
  ).length;

  // Total Guests
  let totalGuestsCount = 0;
  periodBookings.forEach((b) => {
    if (String(b.status).toLowerCase() !== "cancelled") {
      let g = 1;
      if (typeof b.guests === "number") {
        g = b.guests;
      } else if (typeof b.guests === "string") {
        const match = b.guests.match(/\d+/);
        if (match) g = parseInt(match[0], 10);
      }
      totalGuestsCount += Math.max(1, g);
    }
  });

  // Occupancy Rate: (booked room nights / (total rooms * days in range)) * 100
  const daysInRange = Math.max(1, Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)));
  const totalAvailableRoomNights = branchRooms.length * daysInRange;

  let totalOccupiedNights = 0;
  periodBookings.forEach((b) => {
    if (String(b.status).toLowerCase() !== "cancelled") {
      totalOccupiedNights += Number(b.nights || 1);
    }
  });

  let occupancyRate = 0;
  if (totalAvailableRoomNights > 0) {
    occupancyRate = Math.min(100, Number(((totalOccupiedNights / totalAvailableRoomNights) * 100).toFixed(1)));
  }

  // -------------------------------------------------------------
  // REVENUE & PAYMENTS
  // -------------------------------------------------------------

  // A. Revenue Trend (Daily / Weekly / Monthly depending on daysInRange)
  const revenueTrendMap = {};

  // Initialize all days in range for smooth chart
  const cur = new Date(startDate);
  while (cur.getTime() <= endTime) {
    const key = cur.toISOString().split("T")[0]; // YYYY-MM-DD
    const label = cur.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: daysInRange > 31 ? "short" : "short",
      weekday: daysInRange <= 7 ? "short" : undefined,
    });
    revenueTrendMap[key] = { key, label, revenue: 0, checkIns: 0, checkOuts: 0, bookingsCount: 0 };
    cur.setDate(cur.getDate() + 1);
  }

  periodBookings.forEach((b) => {
    if (String(b.status).toLowerCase() !== "cancelled") {
      const cDate = parseDate(b.checkInDate || b.check_in_date);
      const paid = Number(b.amountPaid || b.amount_paid || 0);

      if (cDate) {
        const key = cDate.toISOString().split("T")[0];
        if (revenueTrendMap[key]) {
          revenueTrendMap[key].revenue += paid;
          revenueTrendMap[key].bookingsCount += 1;
          revenueTrendMap[key].checkIns += 1;
        }
      }

      const oDate = parseDate(b.checkOutDate || b.check_out_date);
      if (oDate) {
        const oKey = oDate.toISOString().split("T")[0];
        if (revenueTrendMap[oKey]) {
          revenueTrendMap[oKey].checkOuts += 1;
        }
      }
    }
  });

  const revenueTrend = Object.values(revenueTrendMap);

  // B. Payment Method Breakdown (using real methods from DB)
  const paymentMethodMap = {};
  periodBookings.forEach((b) => {
    if (String(b.status).toLowerCase() !== "cancelled") {
      let method = (b.paymentMethod || b.payment_method || "Pay at Hotel").trim();
      // Normalize common names
      if (method.toLowerCase() === "cash") method = "Cash";
      else if (method.toLowerCase().includes("upi")) method = "UPI";
      else if (method.toLowerCase().includes("card")) method = "Credit/Debit Card";
      else if (method.toLowerCase().includes("wallet")) method = "Wallet";
      else if (method.toLowerCase().includes("pay_at_hotel") || method.toLowerCase().includes("hotel")) method = "Pay at Hotel";
      else method = method.charAt(0).toUpperCase() + method.slice(1);

      const paid = Number(b.amountPaid || b.amount_paid || 0);

      if (!paymentMethodMap[method]) {
        paymentMethodMap[method] = { method, count: 0, amount: 0 };
      }
      paymentMethodMap[method].count += 1;
      paymentMethodMap[method].amount += paid;
    }
  });

  const paymentMethods = Object.values(paymentMethodMap);

  // C. Payment Status Breakdown
  let paidCount = 0;
  let paidTotal = 0;
  let partialCount = 0;
  let partialTotal = 0;
  let pendingCount = 0;
  let pendingTotal = 0;

  periodBookings.forEach((b) => {
    if (String(b.status).toLowerCase() !== "cancelled") {
      const paid = Number(b.amountPaid || b.amount_paid || 0);
      const finalAmount = Number(b.finalAmount || b.final_amount || b.totalAmount || b.total_amount || 0);
      const rate = Number(b.nightlyRate || b.nightly_rate || 0);
      const nights = Number(b.nights || 1);
      const computedTotal = finalAmount > 0 ? finalAmount : (rate > 0 ? rate * nights : paid);

      const pStatus = (b.paymentStatus || b.payment_status || "Pending").toLowerCase();

      if (pStatus.includes("paid in full") || pStatus === "paid" || (paid >= computedTotal && computedTotal > 0)) {
        paidCount++;
        paidTotal += paid;
      } else if (paid > 0 && paid < computedTotal) {
        partialCount++;
        partialTotal += paid;
        pendingTotal += (computedTotal - paid);
      } else {
        pendingCount++;
        pendingTotal += computedTotal;
      }
    }
  });

  const paymentStatusSummary = {
    paid: { count: paidCount, amount: paidTotal },
    partial: { count: partialCount, amount: partialTotal },
    pending: { count: pendingCount, amount: pendingTotal },
  };

  // -------------------------------------------------------------
  // ROOMS & OCCUPANCY
  // -------------------------------------------------------------

  // A. Current Room Status
  const roomStatusMap = { Available: 0, Occupied: 0, Cleaning: 0, Maintenance: 0 };
  branchRooms.forEach((r) => {
    const s = (r.status || "Available").toLowerCase();
    if (s === "available") roomStatusMap.Available++;
    else if (s === "occupied") roomStatusMap.Occupied++;
    else if (s === "cleaning") roomStatusMap.Cleaning++;
    else if (s === "maintenance") roomStatusMap.Maintenance++;
    else roomStatusMap.Available++;
  });

  // B. Room Type Performance
  const roomTypeMap = {};
  branchRooms.forEach((r) => {
    const t = r.type || "Standard";
    if (!roomTypeMap[t]) {
      roomTypeMap[t] = { type: t, totalRooms: 0, bookings: 0, revenue: 0, bookedNights: 0 };
    }
    roomTypeMap[t].totalRooms++;
  });

  periodBookings.forEach((b) => {
    if (String(b.status).toLowerCase() !== "cancelled") {
      const t = b.type || "Standard";
      if (!roomTypeMap[t]) {
        roomTypeMap[t] = { type: t, totalRooms: 1, bookings: 0, revenue: 0, bookedNights: 0 };
      }
      roomTypeMap[t].bookings++;
      roomTypeMap[t].revenue += Number(b.amountPaid || b.amount_paid || 0);
      roomTypeMap[t].bookedNights += Number(b.nights || 1);
    }
  });

  const roomTypePerformance = Object.values(roomTypeMap).map((rt) => {
    const availableNights = rt.totalRooms * daysInRange;
    const occ = availableNights > 0 ? Math.min(100, Math.round((rt.bookedNights / availableNights) * 100)) : 0;
    return {
      ...rt,
      occupancy: `${occ}%`,
      occupancyRate: occ,
    };
  });

  // C. Floor Performance
  const floorMap = {};
  branchRooms.forEach((r) => {
    const f = r.floor || "1st Floor";
    if (!floorMap[f]) {
      floorMap[f] = { floor: f, roomsCount: 0, bookings: 0, revenue: 0, bookedNights: 0 };
    }
    floorMap[f].roomsCount++;
  });

  periodBookings.forEach((b) => {
    if (String(b.status).toLowerCase() !== "cancelled") {
      const f = b.floor || "1st Floor";
      if (!floorMap[f]) {
        floorMap[f] = { floor: f, roomsCount: 1, bookings: 0, revenue: 0, bookedNights: 0 };
      }
      floorMap[f].bookings++;
      floorMap[f].revenue += Number(b.amountPaid || b.amount_paid || 0);
      floorMap[f].bookedNights += Number(b.nights || 1);
    }
  });

  const floorPerformance = Object.values(floorMap).map((fl) => {
    const availableNights = fl.roomsCount * daysInRange;
    const occ = availableNights > 0 ? Math.min(100, Math.round((fl.bookedNights / availableNights) * 100)) : 0;
    return {
      ...fl,
      occupancy: `${occ}%`,
      occupancyRate: occ,
    };
  });

  // -------------------------------------------------------------
  // BOOKINGS ANALYTICS
  // -------------------------------------------------------------

  // A. Booking Status Distribution
  const bookingStatusMap = {};
  periodBookings.forEach((b) => {
    let s = (b.status || "Confirmed").trim();
    if (s.toLowerCase() === "active stay" || s.toLowerCase() === "active") s = "Active Stay";
    else if (s.toLowerCase() === "completed") s = "Checked Out";
    else if (s.toLowerCase() === "confirmed") s = "Confirmed";
    else if (s.toLowerCase() === "cancelled") s = "Cancelled";
    else if (s.toLowerCase() === "upcoming") s = "Upcoming";

    bookingStatusMap[s] = (bookingStatusMap[s] || 0) + 1;
  });

  const bookingStatusDistribution = Object.entries(bookingStatusMap).map(([status, count]) => ({
    status,
    count,
    percentage: totalBookingsCount > 0 ? Math.round((count / totalBookingsCount) * 100) : 0,
  }));

  // B. Booking Source (strictly real sources, NO OTAs!)
  const bookingSourceMap = {};
  periodBookings.forEach((b) => {
    let src = (b.source || "Website").trim();
    if (src.toLowerCase() === "dashboard" || src.toLowerCase() === "admin") {
      src = "Front Desk / Admin";
    } else if (src.toLowerCase() === "website") {
      src = "Direct Website";
    } else if (src.toLowerCase() === "walk-in" || src.toLowerCase() === "walkin") {
      src = "Walk-in";
    } else {
      src = src.charAt(0).toUpperCase() + src.slice(1);
    }

    bookingSourceMap[src] = (bookingSourceMap[src] || 0) + 1;
  });

  const bookingSources = Object.entries(bookingSourceMap).map(([source, count]) => ({
    source,
    count,
    percentage: totalBookingsCount > 0 ? Math.round((count / totalBookingsCount) * 100) : 0,
  }));

  // -------------------------------------------------------------
  // GUEST ANALYTICS
  // -------------------------------------------------------------

  // Group unique guest occurrences
  const guestHistoryMap = {};
  branchBookings.forEach((b) => {
    const key = (b.guestPhone || b.guestEmail || b.guestName || "").trim().toLowerCase();
    if (key) {
      if (!guestHistoryMap[key]) {
        guestHistoryMap[key] = {
          name: b.guestName || "Guest",
          phone: b.guestPhone || "-",
          email: b.guestEmail || "-",
          bookingsCount: 0,
          totalSpend: 0,
        };
      }
      guestHistoryMap[key].bookingsCount++;
      guestHistoryMap[key].totalSpend += Number(b.amountPaid || b.amount_paid || 0);
    }
  });

  // Calculate new vs returning for period
  let newGuestsCount = 0;
  let returningGuestsCount = 0;
  const periodGuestsSeen = new Set();

  periodBookings.forEach((b) => {
    const key = (b.guestPhone || b.guestEmail || b.guestName || "").trim().toLowerCase();
    if (key && !periodGuestsSeen.has(key)) {
      periodGuestsSeen.add(key);
      const hist = guestHistoryMap[key];
      if (hist && hist.bookingsCount > 1) {
        returningGuestsCount++;
      } else {
        newGuestsCount++;
      }
    }
  });

  // Average stay duration
  let totalNightsSum = 0;
  periodBookings.forEach((b) => {
    totalNightsSum += Number(b.nights || 1);
  });
  const avgStayDuration = totalBookingsCount > 0
    ? (totalNightsSum / totalBookingsCount).toFixed(1)
    : "1.0";

  // Top guests by revenue
  const topGuests = Object.values(guestHistoryMap)
    .filter((g) => g.totalSpend > 0)
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5);

  // -------------------------------------------------------------
  // DETAILED TRANSACTIONS LIST
  // -------------------------------------------------------------
  const transactions = periodBookings.map((b) => {
    const paid = Number(b.amountPaid || b.amount_paid || 0);
    const finalAmount = Number(b.finalAmount || b.final_amount || b.totalAmount || b.total_amount || 0);
    const rate = Number(b.nightlyRate || b.nightly_rate || 0);
    const nights = Number(b.nights || 1);
    const total = finalAmount > 0 ? finalAmount : (rate > 0 ? rate * nights : paid);
    const due = Math.max(0, total - paid);

    return {
      bookingId: b.id || b.bookingCode || b.booking_code || `BK-${b.pkId}`,
      guestName: b.guestName || b.guest_name || "Guest",
      roomNumber: b.roomNumber || b.room_number || "Room 101",
      floor: b.floor || "1st Floor",
      roomType: b.type || "Standard",
      checkIn: b.checkInDate || b.check_in_date || "-",
      checkOut: b.checkOutDate || b.check_out_date || "-",
      nights: nights,
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      paymentMethod: b.paymentMethod || b.payment_method || "Cash",
      paymentStatus: b.paymentStatus || b.payment_status || (due === 0 ? "Paid" : "Pending"),
      bookingStatus: b.status || "Confirmed",
      orgId: b.orgId || b.org_id || "-",
    };
  });

  return {
    kpis: {
      totalRevenue,
      occupancyRate: `${occupancyRate}%`,
      occupancyRateRaw: occupancyRate,
      totalBookings: totalBookingsCount,
      totalGuests: totalGuestsCount,
      pendingPayments: totalPending,
      cancelledBookings: cancelledBookingsCount,
    },
    revenue: {
      totalBilled,
      totalPaid: totalRevenue,
      totalPending,
      trend: revenueTrend,
      paymentMethods,
      paymentStatusSummary,
    },
    rooms: {
      currentStatus: roomStatusMap,
      occupancyRate: `${occupancyRate}%`,
      roomTypePerformance,
      floorPerformance,
    },
    bookingsAnalytics: {
      statusDistribution: bookingStatusDistribution,
      checkInOutTrend: revenueTrend,
      sources: bookingSources,
    },
    guestAnalytics: {
      totalGuests: totalGuestsCount,
      newGuests: newGuestsCount,
      returningGuests: returningGuestsCount,
      avgStayDuration: `${avgStayDuration} Nights`,
      topGuests,
    },
    transactions,
  };
}

/**
 * Generates and triggers CSV file download for transactions
 */
export function exportReportToCSV(transactions, branchName = "Hotel", dateRangeLabel = "") {
  if (!transactions || transactions.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = [
    "Booking ID",
    "Guest Name",
    "Room Number",
    "Floor",
    "Room Type",
    "Check-in",
    "Check-out",
    "Nights",
    "Total (INR)",
    "Paid (INR)",
    "Due (INR)",
    "Payment Method",
    "Payment Status",
    "Booking Status",
  ];

  const rows = transactions.map((t) => [
    `"${t.bookingId}"`,
    `"${t.guestName.replace(/"/g, '""')}"`,
    `"${t.roomNumber}"`,
    `"${t.floor}"`,
    `"${t.roomType}"`,
    `"${t.checkIn}"`,
    `"${t.checkOut}"`,
    t.nights,
    t.totalAmount,
    t.paidAmount,
    t.dueAmount,
    `"${t.paymentMethod}"`,
    `"${t.paymentStatus}"`,
    `"${t.bookingStatus}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Report_${branchName.replace(/\s+/g, "_")}_${dateRangeLabel.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
