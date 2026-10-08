import { getScopedStorageKey, getCurrentOrgId, getCurrentOrg, getUserName } from "../auth.js";
import { logAction } from "../audit.js";

const VISITORS_KEY = "hotel_visitors_register_v1";

function getKey() {
  return getScopedStorageKey(VISITORS_KEY);
}

// Initial seed visitors with rich, realistic data across branches
const DEFAULT_SEED_VISITORS = [
  {
    id: "VIS-2026-0924-001",
    name: "Vikramaditya Rathore",
    phone: "+91 98290 44101",
    email: "vikram.rathore@rajasthanfin.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    purpose: "VIP Guest Meeting",
    roomNumber: "201",
    floorNumber: "2nd Floor",
    amount: 28500,
    hostPerson: "Meera Rathore (Room 201)",
    hostType: "Resident Guest",
    idProofType: "Aadhaar Card",
    idProofNumber: "XXXX-XXXX-8921",
    vehicleNumber: "RJ14 CB 8921 (Fortuner)",
    gateNumber: "Main Royal Gate 1",
    accompanyingCount: 1,
    checkInTime: "2026-09-24T09:30:00.000Z",
    checkInFormatted: "09:30 AM",
    checkOutTime: null,
    checkOutFormatted: null,
    status: "In Premises",
    date: "2026-09-24",
    badgeType: "VIP Visitor",
    securityOfficer: "Ramesh Guard (Gate 1)",
    remarks: "Met at VIP Suite for business discussions",
    orgId: "JP01",
    orgName: "Jaipur Branch",
  },
  {
    id: "VIS-2026-0924-002",
    name: "Sunil Khandelwal",
    phone: "+91 94140 33202",
    email: "sunil.dairy@jaipursupply.in",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    purpose: "Guest Visit",
    roomNumber: "105",
    floorNumber: "1st Floor",
    amount: 14200,
    hostPerson: "Sanjay Verma (Room 105)",
    hostType: "Resident Guest",
    idProofType: "Driving License",
    idProofNumber: "RJ-14-2018-09124",
    vehicleNumber: "RJ14 GA 4421",
    gateNumber: "Main Gate 1",
    accompanyingCount: 2,
    checkInTime: "2026-09-24T08:15:00.000Z",
    checkInFormatted: "08:15 AM",
    checkOutTime: "2026-09-24T09:45:00.000Z",
    checkOutFormatted: "09:45 AM",
    status: "Checked Out",
    date: "2026-09-24",
    badgeType: "Visitor",
    securityOfficer: "Ramesh Guard (Gate 1)",
    remarks: "Guest morning visit",
    orgId: "JP01",
    orgName: "Jaipur Branch",
  },
  {
    id: "VIS-2026-0924-003",
    name: "Dr. Ananya Singhal",
    phone: "+91 97840 55303",
    email: "ananya.singhal@apollohospital.org",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    purpose: "Guest Visit & Health Checkup",
    roomNumber: "202",
    floorNumber: "2nd Floor",
    amount: 5500,
    hostPerson: "Govind Sharma (Room 202)",
    hostType: "Resident Guest",
    idProofType: "Aadhaar Card",
    idProofNumber: "XXXX-XXXX-5514",
    vehicleNumber: "RJ14 DE 1102 (Honda City)",
    gateNumber: "Main Royal Gate 1",
    accompanyingCount: 0,
    checkInTime: "2026-09-24T11:00:00.000Z",
    checkInFormatted: "11:00 AM",
    checkOutTime: null,
    checkOutFormatted: null,
    status: "In Premises",
    date: "2026-09-24",
    badgeType: "Visitor",
    securityOfficer: "Ramesh Guard (Gate 1)",
    remarks: "Visiting family friend in Deluxe Room.",
    orgId: "JP01",
    orgName: "Jaipur Branch",
  },
  {
    id: "VIS-2026-0924-004",
    name: "Rajendra Pareek",
    phone: "+91 98280 66404",
    email: "r.pareek@daikinjapan.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    purpose: "Guest Meeting",
    roomNumber: "304",
    floorNumber: "3rd Floor",
    amount: 8200,
    hostPerson: "Rajiv Mehta (Room 304)",
    hostType: "Resident Guest",
    idProofType: "Company ID + DL",
    idProofNumber: "DAIKIN-TECH-882",
    vehicleNumber: "RJ14 EQ 9012",
    gateNumber: "Main Gate 1",
    accompanyingCount: 1,
    checkInTime: "2026-09-24T11:45:00.000Z",
    checkInFormatted: "11:45 AM",
    checkOutTime: null,
    checkOutFormatted: null,
    status: "In Premises",
    date: "2026-09-24",
    badgeType: "Visitor",
    securityOfficer: "Ramesh Guard (Gate 1)",
    remarks: "Visiting guest on 3rd Floor suite",
    orgId: "JP01",
    orgName: "Jaipur Branch",
  },
  {
    id: "VIS-2026-0924-005",
    name: "Kavita Jha",
    phone: "+91 96020 77505",
    email: "kavita.jha@weddingsbymantra.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    purpose: "Guest Meeting & Enquiry",
    roomNumber: "102",
    floorNumber: "1st Floor",
    amount: 4500,
    hostPerson: "Rohit Singhania (Room 102)",
    hostType: "Resident Guest",
    idProofType: "Voter ID",
    idProofNumber: "RJ/14/092/10029",
    vehicleNumber: "Walk-in",
    gateNumber: "Main Royal Gate 1",
    accompanyingCount: 3,
    checkInTime: "2026-09-24T12:30:00.000Z",
    checkInFormatted: "12:30 PM",
    checkOutTime: "2026-09-24T13:45:00.000Z",
    checkOutFormatted: "01:45 PM",
    status: "Checked Out",
    date: "2026-09-24",
    badgeType: "Visitor",
    securityOfficer: "Ramesh Guard (Gate 1)",
    remarks: "Guest visit in Room 102",
    orgId: "JP01",
    orgName: "Jaipur Branch",
  },
  {
    id: "VIS-2026-0924-006",
    name: "Amitabh Sen",
    phone: "+91 98310 88606",
    email: "amitabh.sen@tcs.com",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    purpose: "Room 104 Guest Family Visit",
    roomNumber: "104",
    floorNumber: "1st Floor",
    amount: 6000,
    hostPerson: "Suresh Gurjar (Room 104)",
    hostType: "Resident Guest",
    idProofType: "Passport",
    idProofNumber: "Z9102834",
    vehicleNumber: "RJ14 CZ 7721 (Creta)",
    gateNumber: "Main Royal Gate 1",
    accompanyingCount: 2,
    checkInTime: "2026-09-24T13:10:00.000Z",
    checkInFormatted: "01:10 PM",
    checkOutTime: null,
    checkOutFormatted: null,
    status: "In Premises",
    date: "2026-09-24",
    badgeType: "Visitor",
    securityOfficer: "Ramesh Guard (Gate 1)",
    remarks: "Family members visiting for lunch in Room 104",
    orgId: "JP01",
    orgName: "Jaipur Branch",
  },
  {
    id: "VIS-2026-0923-001",
    name: "Mohit Agarwal",
    phone: "+91 98291 99101",
    email: "mohit.agarwal@fintech.co.in",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    purpose: "Corporate Client Discussion",
    roomNumber: "201",
    floorNumber: "2nd Floor",
    amount: 19500,
    hostPerson: "Meera Rathore (Room 201)",
    hostType: "Resident Guest",
    idProofType: "Aadhaar Card",
    idProofNumber: "XXXX-XXXX-3341",
    vehicleNumber: "RJ14 AB 1010",
    gateNumber: "Main Royal Gate 1",
    accompanyingCount: 1,
    checkInTime: "2026-09-23T10:00:00.000Z",
    checkInFormatted: "10:00 AM",
    checkOutTime: "2026-09-23T12:30:00.000Z",
    checkOutFormatted: "12:30 PM",
    status: "Checked Out",
    date: "2026-09-23",
    badgeType: "Visitor",
    securityOfficer: "Ramesh Guard (Gate 1)",
    remarks: "Corporate event tie-up discussion in Room 201",
    orgId: "JP01",
    orgName: "Jaipur Branch",
  },
  {
    id: "VIS-2026-0818-001",
    name: "Deepak Sharma",
    phone: "+91 94140 88201",
    email: "deepak.linen@sharmatextiles.com",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    purpose: "Guest Visit",
    roomNumber: "101",
    floorNumber: "1st Floor",
    amount: 12000,
    hostPerson: "Rohan Mehra (Room 101)",
    hostType: "Resident Guest",
    idProofType: "Driving License",
    idProofNumber: "RJ-14-2015-88120",
    vehicleNumber: "RJ14 GA 9090",
    gateNumber: "Main Gate 1",
    accompanyingCount: 1,
    checkInTime: "2026-08-18T08:30:00.000Z",
    checkInFormatted: "08:30 AM",
    checkOutTime: "2026-08-18T10:00:00.000Z",
    checkOutFormatted: "10:00 AM",
    status: "Checked Out",
    date: "2026-08-18",
    badgeType: "Visitor",
    securityOfficer: "Ramesh Guard (Gate 1)",
    remarks: "August guest visit completed",
    orgId: "JP01",
    orgName: "Jaipur Branch",
  },
  {
    id: "VIS-2025-1215-001",
    name: "Harsh Vardhan Singh",
    phone: "+91 98290 11999",
    email: "harsh.singh@royalheritage.in",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    purpose: "Suite Guest Meeting",
    roomNumber: "301",
    floorNumber: "3rd Floor",
    amount: 35000,
    hostPerson: "Aditya Roy (Room 301)",
    hostType: "Resident Guest",
    idProofType: "Passport",
    idProofNumber: "N4410928",
    vehicleNumber: "RJ14 HH 0001",
    gateNumber: "Main Royal Gate 1",
    accompanyingCount: 3,
    checkInTime: "2025-12-15T11:00:00.000Z",
    checkInFormatted: "11:00 AM",
    checkOutTime: "2025-12-15T16:00:00.000Z",
    checkOutFormatted: "04:00 PM",
    status: "Checked Out",
    date: "2025-12-15",
    badgeType: "VIP Visitor",
    securityOfficer: "Ramesh Guard (Gate 1)",
    remarks: "Year 2025 VIP guest meeting",
    orgId: "JP01",
    orgName: "Jaipur Branch",
  },
];

export function getVisitorsRegister() {
  const key = getKey();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = DEFAULT_SEED_VISITORS.map((v) => ({
        ...v,
        orgId: getCurrentOrgId() || "JP01",
        orgName: getCurrentOrg() || "Jaipur Branch",
      }));
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let updated = false;
      const roomAmtMap = { "201": 28500, "105": 14200, "202": 5500, "304": 8200, "102": 4500, "104": 6000, "203": 7500, "101": 12000, "301": 35000 };
      parsed = parsed.map((v) => {
        let vCopy = { ...v };
        if (
          vCopy.hostPerson &&
          (vCopy.hostPerson.includes("Maintenance") ||
            vCopy.hostPerson.includes("Main Kitchen") ||
            vCopy.hostPerson.includes("Banquet") ||
            vCopy.hostPerson.includes("Housekeeping") ||
            vCopy.hostPerson.includes("Front Desk") ||
            vCopy.hostPerson.includes("Event Manager") ||
            vCopy.hostPerson.includes("Desk") ||
            vCopy.hostPerson.includes("Manager"))
        ) {
          if (vCopy.id === "VIS-2026-0924-002") { vCopy.roomNumber = "105"; vCopy.floorNumber = "1st Floor"; vCopy.hostPerson = "Sanjay Verma (Room 105)"; updated = true; }
          else if (vCopy.id === "VIS-2026-0924-004") { vCopy.roomNumber = "304"; vCopy.floorNumber = "3rd Floor"; vCopy.hostPerson = "Rajiv Mehta (Room 304)"; updated = true; }
          else if (vCopy.id === "VIS-2026-0924-005") { vCopy.roomNumber = "102"; vCopy.floorNumber = "1st Floor"; vCopy.hostPerson = "Rohit Singhania (Room 102)"; updated = true; }
          else {
            vCopy.roomNumber = vCopy.roomNumber || "201";
            vCopy.floorNumber = vCopy.floorNumber || "2nd Floor";
            vCopy.hostPerson = "Meera Rathore (Room 201)";
            updated = true;
          }
        }
        if (!vCopy.floorNumber && vCopy.roomNumber) {
          const num = parseInt(vCopy.roomNumber.toString().replace(/\D/g, ""), 10);
          if (num >= 100 && num < 200) vCopy.floorNumber = "1st Floor";
          else if (num >= 200 && num < 300) vCopy.floorNumber = "2nd Floor";
          else if (num >= 300 && num < 400) vCopy.floorNumber = "3rd Floor";
          else if (num >= 400 && num < 500) vCopy.floorNumber = "4th Floor";
          else vCopy.floorNumber = "1st Floor";
          updated = true;
        }
        if (vCopy.amount === undefined || vCopy.amount === null || isNaN(vCopy.amount)) {
          vCopy.amount = roomAmtMap[vCopy.roomNumber] || 5000;
          updated = true;
        }
        return vCopy;
      });
      if (updated) {
        localStorage.setItem(key, JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_SEED_VISITORS;
  } catch (err) {
    console.error("Failed to load visitors:", err);
    return DEFAULT_SEED_VISITORS;
  }
}

export function saveVisitorsRegister(visitors) {
  const key = getKey();
  try {
    localStorage.setItem(key, JSON.stringify(visitors));
    window.dispatchEvent(new CustomEvent("visitors_updated", { detail: visitors }));
  } catch (err) {
    console.error("Failed to save visitors:", err);
  }
}

export function addVisitor(visitorData) {
  const list = getVisitorsRegister();
  const orgId = getCurrentOrgId() || "JP01";
  const orgName = getCurrentOrg() || "Jaipur Branch";

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeFormatted = `${formattedHours}:${formattedMinutes} ${ampm}`;

  const countStr = (list.length + 1).toString().padStart(3, "0");
  const dateStr = now.toISOString().split("T")[0];
  const newId = `VIS-${dateStr.replace(/-/g, "")}-${countStr}`;

  const cleanRoom = visitorData.roomNumber?.toString().replace(/room/i, "").trim() || "201";
  const num = parseInt(cleanRoom.replace(/\D/g, ""), 10);
  let floor = visitorData.floorNumber;
  if (!floor) {
    if (num >= 100 && num < 200) floor = "1st Floor";
    else if (num >= 200 && num < 300) floor = "2nd Floor";
    else if (num >= 300 && num < 400) floor = "3rd Floor";
    else if (num >= 400 && num < 500) floor = "4th Floor";
    else floor = "1st Floor";
  }

  const newVisitor = {
    id: newId,
    name: visitorData.name?.trim() || "Guest Visitor",
    phone: visitorData.phone?.trim() || "+91 98000 00000",
    email: visitorData.email?.trim() || "visitor@guest.com",
    avatar: visitorData.avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?w=150&auto=format&fit=crop&q=80`,
    purpose: visitorData.purpose || "Guest Visit",
    roomNumber: cleanRoom,
    floorNumber: floor,
    amount: Number(visitorData.amount || 0),
    hostPerson: visitorData.hostPerson || `Resident Guest (Room ${cleanRoom})`,
    hostType: visitorData.hostType || "Hotel Guest",
    idProofType: visitorData.idProofType || "Aadhaar Card",
    idProofNumber: visitorData.idProofNumber || "XXXX-XXXX-0000",
    vehicleNumber: visitorData.vehicleNumber || "Walk-in",
    gateNumber: visitorData.gateNumber || "Main Gate 1",
    accompanyingCount: Number(visitorData.accompanyingCount) || 0,
    checkInTime: now.toISOString(),
    checkInFormatted: timeFormatted,
    checkOutTime: null,
    checkOutFormatted: null,
    status: "In Premises",
    date: dateStr,
    badgeType: visitorData.badgeType || "Visitor",
    securityOfficer: getUserName() || "Gate Security Officer",
    remarks: visitorData.remarks || "Checked in through Gate Security",
    orgId,
    orgName,
  };

  const updated = [newVisitor, ...list];
  saveVisitorsRegister(updated);

  logAction({
    action: "VISITOR_CHECK_IN",
    recordType: "Visitor",
    recordId: newId,
    details: `Visitor ${newVisitor.name} checked in to Room ${newVisitor.roomNumber} (${newVisitor.floorNumber}) with amount ₹${newVisitor.amount}`,
  });

  return newVisitor;
}

export function checkOutVisitor(visitorId) {
  const list = getVisitorsRegister();
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeFormatted = `${formattedHours}:${formattedMinutes} ${ampm}`;

  const updated = list.map((v) => {
    if (v.id === visitorId) {
      return {
        ...v,
        status: "Checked Out",
        checkOutTime: now.toISOString(),
        checkOutFormatted: timeFormatted,
      };
    }
    return v;
  });

  saveVisitorsRegister(updated);

  logAction({
    action: "VISITOR_CHECK_OUT",
    recordType: "Visitor",
    recordId: visitorId,
    details: `Visitor ${visitorId} checked out at ${timeFormatted}`,
  });

  return updated.find((v) => v.id === visitorId);
}

export function deleteVisitorRecord(visitorId) {
  const list = getVisitorsRegister();
  const updated = list.filter((v) => v.id !== visitorId);
  saveVisitorsRegister(updated);
}
