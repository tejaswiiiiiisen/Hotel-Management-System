import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import RowActions from "../components/RowActions.jsx";
import { getCurrentOrg, getCurrentOrgId, getUserRole, getAuthHeaders } from "../auth.js";
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  findEmployeeByEmail,
  generateEmployeeId,
  syncEmployeesFromBackend,
} from "../employees.js";
import { ROLES, canEdit, canView } from "../rbac.js";

import {
  FaUserPlus,
  FaEnvelope,
  FaPhoneAlt,
  FaIdBadge,
  FaUserTie,
  FaThLarge,
  FaList,
  FaCheckCircle,
  FaTimes,
  FaUpload,
  FaCamera,
  FaEye,
  FaEyeSlash,
  FaBroom,
  FaUtensils,
  FaReceipt,
  FaBriefcase,
  FaConciergeBell,
  FaSearch,
  FaFilter,
  FaArrowRight,
  FaTasks,
  FaEdit,
  FaUserCheck,
  FaClock,
  FaLock,
  FaKey,
  FaUsers,
  FaMoneyBillWave,
  FaRupeeSign,
  FaFileInvoiceDollar,
  FaShareAlt,
  FaWhatsapp,
  FaCopy,
  FaPrint,
} from "react-icons/fa";
import { showSuccess, showInfo } from "../utils/toast.js";

// Running Count-up Animation Component for Financial and Operational Metrics
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 750 }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, "")) || 0;
    const startVal = 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + (target - startVal) * easedProgress);
      setDisplayVal(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayVal(target);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayVal.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

// Which roles each creator is allowed to CREATE (Housekeeping, Kitchen, Accounting only)
const CREATABLE = {
  super_admin: [
    { value: "housekeeping", label: "Housekeeping" },
    { value: "chef", label: "Kitchen / Chef" },
    { value: "accountant", label: "Accountant" },
  ],
  manager: [
    { value: "housekeeping", label: "Housekeeping" },
    { value: "chef", label: "Kitchen / Chef" },
    { value: "accountant", label: "Accountant" },
  ],
  front_desk: [
    { value: "housekeeping", label: "Housekeeping" },
    { value: "chef", label: "Kitchen / Chef" },
    { value: "accountant", label: "Accountant" },
  ],
};

// Which roles each user can SEE in the list (and edit / delete).
const VIEWABLE = {
  super_admin: ["housekeeping", "chef", "accountant"],
  manager: ["housekeeping", "chef", "accountant"],
  front_desk: ["housekeeping", "chef", "accountant"],
};

export const defaultWorkByRole = (role) => {
  if (role === "chef" || role === "kitchen") return "Head Chef: Menu Planning & Breakfast/Dinner Buffet";
  if (role === "accountant") return "Daily Ledger Balancing & GST Tax Audits";
  return "1st & 2nd Floor Room Turnover & Sanitization (Rooms 101, 102)";
};

export const defaultAreaByRole = (role) => {
  if (role === "chef" || role === "kitchen") return "Main Kitchen & Buffet Station";
  if (role === "accountant") return "Finance & Audit Office";
  return "1st & 2nd Floor Rooms";
};

export const defaultDeptByRole = (role) => {
  if (role === "chef" || role === "kitchen") return "Kitchen";
  if (role === "accountant") return "Accounting";
  return "Housekeeping";
};

export const WORK_DUTY_PRESETS = {
  housekeeping: [
    "1st & 2nd Floor Room Turnover & Sanitization (Rooms 101, 102)",
    "3rd & 4th Floor Deep Clean & Inspection (Rooms 104, 105)",
    "VIP Suites & Executive Floor Refresh (Room 1001)",
    "Evening Turndown & Linen Refresh (Rooms 107, 108)",
    "Lobby, Lounge & Public Restrooms Sanitization",
    "Night Sanitization & Emergency Turnovers",
  ],
  kitchen: [
    "Head Chef: Menu Planning & Breakfast/Dinner Buffet",
    "Sous Chef: Hot Kitchen, Tandoor & Room Service KOT",
    "Pastry & Cold Pantry: Fresh Bakes, Desserts & Salads",
    "Live Cooking Counter & Breakfast Prep Station",
    "Kitchen Hygiene, HACCP & Grocery Stock Prep",
  ],
  accounting: [
    "Daily Ledger Balancing & GST Tax Audits",
    "Guest Folio Invoicing & POS Cash Register Management",
    "Supplier Bills Verification & Night Audit",
    "Daily Cash Collections & Bank Reconciliation",
    "Monthly Payroll Reconciliation & Audit Desk",
  ],
};

const blankForm = (role, currentOrgId, currentOrgName) => {
  const chosenRole = role || "housekeeping";
  const newId = generateEmployeeId(chosenRole);
  return {
    role: chosenRole,
    name: "",
    username: "",
    email: "",
    password: "password123",
    phone: "",
    avatar: "",
    id: newId,
    staff_id: newId,
    staffId: newId,
    department: defaultDeptByRole(chosenRole),
    shift: "Morning (07:00 - 15:00)",
    salary: "",
    joining_date: new Date().toISOString().split("T")[0],
    status: "Active",
    assigned_area: defaultAreaByRole(chosenRole),
    assignedArea: defaultAreaByRole(chosenRole),
    assigned_work: defaultWorkByRole(chosenRole),
    work_status: "On Duty",
    workStatus: "On Duty",
    org_id: currentOrgId || "AS435",
    orgId: currentOrgId || "AS435",
    org_name: currentOrgName || "Ashirwad",
    orgName: currentOrgName || "Ashirwad",
    org: currentOrgName || "Ashirwad",
  };
};

export default function Employees() {
  const creatorRole = getUserRole();
  const isAdmin = creatorRole === "super_admin";
  const hasFullAccess = canEdit("employees", creatorRole);
  const [roleOptions, setRoleOptions] = useState(CREATABLE[creatorRole] || []);
  const [viewableRoles, setViewableRoles] = useState(VIEWABLE[creatorRole] || []);

  // Live Dark / Light mode theme detection
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("http://localhost:4000/api/rbac/roles", {
      headers: getAuthHeaders()
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data
            .filter((r) => r.name !== "super_admin")
            .map((r) => ({
              value: r.name,
              label: r.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            }));

          if (formatted.length > 0) {
            setRoleOptions(formatted);
            setViewableRoles(formatted.map(f => f.value));
            setForm((prev) => ({ ...prev, role: prev.role || formatted[0]?.value }));
          }
        }
      })
      .catch(console.error);
  }, []);

  const org = getCurrentOrg();
  const orgId = getCurrentOrgId();

  const [list, setList] = useState(() => getEmployees());

  useEffect(() => {
    setList(getEmployees());
  }, [org, orgId]);

  const [form, setForm] = useState(() => blankForm(roleOptions[0]?.value || "housekeeping", orgId, org));
  const [editingId, setEditingId] = useState(null);
  const [editModalEmp, setEditModalEmp] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [msg, setMsg] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const joiningDateRef = useRef(null);

  const navigate = useNavigate();
  const [departmentTab, setDepartmentTab] = useState("all"); // Default to "all" | "housekeeping" | "kitchen" | "accounting"
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [adminAttFilter, setAdminAttFilter] = useState("All"); // "All" | "CheckedIn" | "CheckedOut" | "Worked" | "OnLeave"
  const [adminAttendanceMap, setAdminAttendanceMap] = useState({});
  const [adminLeavesMap, setAdminLeavesMap] = useState({});
  const [dutyModalEmp, setDutyModalEmp] = useState(null);

  // Fetch real-time attendance & leaves for Admin / Super Admin Staff View
  const fetchAdminAttendanceData = async () => {
    try {
      const queryParam = orgId ? `?orgId=${encodeURIComponent(orgId)}` : org ? `?org=${encodeURIComponent(org)}` : "";
      const attRes = await fetch(`http://localhost:4000/api/staff/attendance${queryParam}`, {
        headers: getAuthHeaders(),
      });
      const attData = await attRes.json();
      const attRoster = Array.isArray(attData?.roster) ? attData.roster : [];
      const attMap = {};
      attRoster.forEach((r) => {
        const sid = String(r.staffId || r.id || "").toLowerCase();
        const semail = String(r.staffEmail || "").toLowerCase();
        if (sid) attMap[sid] = r;
        if (semail) attMap[semail] = r;
      });
      setAdminAttendanceMap(attMap);

      const leaveRes = await fetch(`http://localhost:4000/api/staff/attendance/leaves${queryParam}`, {
        headers: getAuthHeaders(),
      });
      const leaveData = await leaveRes.json();
      const leavesList = Array.isArray(leaveData?.leaves) ? leaveData.leaves : [];
      const lMap = {};
      leavesList.forEach((l) => {
        const sid = String(l.staff_id || l.staffId || "").toLowerCase();
        const semail = String(l.staff_email || l.staffEmail || "").toLowerCase();
        if (sid) lMap[sid] = (lMap[sid] || 0) + 1;
        if (semail) lMap[semail] = (lMap[semail] || 0) + 1;
      });
      setAdminLeavesMap(lMap);
    } catch (e) {
      console.warn("Could not fetch admin attendance:", e);
    }
  };

  useEffect(() => {
    fetchAdminAttendanceData();
    const interval = setInterval(fetchAdminAttendanceData, 4000);
    const handleSync = () => fetchAdminAttendanceData();
    window.addEventListener("staff_attendance_changed", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener("staff_attendance_changed", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [org, orgId]);
  const [dutyForm, setDutyForm] = useState({
    assigned_work: "",
    assigned_area: "",
    shift: "Morning (07:00 - 15:00)",
    work_status: "On Duty",
  });

  function openDutyModal(emp) {
    setDutyModalEmp(emp);
    setDutyForm({
      assigned_work: emp.assigned_work || defaultWorkByRole(emp.role),
      assigned_area: emp.assigned_area || emp.assignedArea || defaultAreaByRole(emp.role),
      shift: emp.shift || "Morning (07:00 - 15:00)",
      work_status: emp.work_status || emp.workStatus || "On Duty",
    });
  }

  function saveDutyModal(e) {
    e.preventDefault();
    if (!dutyModalEmp) return;
    updateEmployee(dutyModalEmp.id, {
      ...dutyModalEmp,
      assigned_work: dutyForm.assigned_work,
      assigned_area: dutyForm.assigned_area,
      assignedArea: dutyForm.assigned_area,
      shift: dutyForm.shift,
      work_status: dutyForm.work_status,
      workStatus: dutyForm.work_status,
    });
    setList(getEmployees());
    setMsg({ type: "success", text: `Work duty for "${dutyModalEmp.name}" updated successfully.` });
    setDutyModalEmp(null);
  }

  const getStaffPassword = (emp) => {
    if (emp?.password) return emp.password;
    const branch = emp?.orgId || emp?.org || orgId || org || "";
    const b = String(branch).toLowerCase();
    if (b.includes("jp01") || b.includes("jaipur")) return "jaipur123";
    if (b.includes("aj01") || b.includes("ajmer")) return "ajmer123";
    if (b.includes("ch560") || b.includes("cheery")) return "cheery123";
    if (b.includes("as435") || b.includes("ashirwad")) return "ashirwad123";
    return "matcha123";
  };

  const getStaffUsername = (emp) => {
    if (emp?.username) return emp.username;
    if (emp?.email) return emp.email.split("@")[0];
    return String(emp?.id || emp?.staff_id || "staff").toLowerCase();
  };

  function openEditModal(emp) {
    const password = getStaffPassword(emp);
    const username = getStaffUsername(emp);
    setEditModalEmp({
      ...emp,
      username,
      password,
    });
    setShowEditPassword(true);
  }

  // Sync staff list from MySQL DB on load & org change
  useEffect(() => {
    syncEmployeesFromBackend(orgId, org).then((backendEmployees) => {
      if (backendEmployees && backendEmployees.length > 0) {
        setList(backendEmployees);
      }
    });
  }, [orgId, org]);

  // Auto-hide success/error message after 3.5 seconds
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  // Deduplicate and filter orgStaff strictly by branch and valid operational departments
  const orgStaff = React.useMemo(() => {
    const seen = new Set();
    const result = [];

    (list || []).forEach((e) => {
      if (!e) return;

      // Strict Org ID & Org Name matching so each organization only sees employees assigned to it
      const eOrgId = e.orgId || e.org_id;
      const eOrgName = e.org || e.org_name || e.orgName;

      if (orgId && eOrgId) {
        if (eOrgId !== orgId) return;
      } else if (org && eOrgName) {
        if (eOrgName.toLowerCase() !== org.toLowerCase()) return;
      }

      // STRICT CHECK: Exclude Front Desk & Management
      const role = (e.role || "").toLowerCase();
      const dept = (e.department || "").toLowerCase();
      const id = String(e.id || e.staff_id || "");
      if (
        role === "manager" ||
        role === "front_desk" ||
        dept === "front desk" ||
        dept === "management" ||
        dept.includes("front") ||
        dept.includes("manage") ||
        id.startsWith("MGR-") ||
        id.startsWith("FD-")
      ) {
        return;
      }

      // Only allow Housekeeping, Kitchen, and Accounting
      const isHK = role.includes("housekeeping") || dept.includes("housekeeping") || id.startsWith("HK-");
      const isKitchen = role.includes("chef") || role.includes("kitchen") || dept.includes("kitchen") || dept.includes("food") || id.startsWith("KIT-");
      const isAcc = role.includes("account") || dept.includes("account") || id.startsWith("ACC-");

      if (!isHK && !isKitchen && !isAcc) return;

      // Deduplication by ID, Email, or normalized Name
      const sid = String(e.id || e.staff_id || e.staffId || "").toLowerCase().trim();
      const semail = String(e.email || "").toLowerCase().trim();
      const sname = String(e.name || "").toLowerCase().trim();
      const dedupKey = sid || semail || sname;

      if (dedupKey && seen.has(dedupKey)) return;
      if (dedupKey) seen.add(dedupKey);
      if (semail) seen.add(semail);

      result.push(e);
    });

    return result;
  }, [list, orgId, org]);

  // Department counts across current organization - strictly mutually isolated
  const hkStaffList = React.useMemo(() => {
    return orgStaff.filter((e) => {
      const d = (e.department || "").toLowerCase();
      const r = (e.role || "").toLowerCase();
      const id = String(e.id || e.staff_id || "");
      return d.includes("housekeeping") || r.includes("housekeeping") || id.startsWith("HK-");
    });
  }, [orgStaff]);

  const kitchenStaffList = React.useMemo(() => {
    return orgStaff.filter((e) => {
      const d = (e.department || "").toLowerCase();
      const r = (e.role || "").toLowerCase();
      const id = String(e.id || e.staff_id || "");
      return d.includes("kitchen") || d.includes("food") || r.includes("chef") || r.includes("kitchen") || id.startsWith("KIT-");
    });
  }, [orgStaff]);

  const accountingStaffList = React.useMemo(() => {
    return orgStaff.filter((e) => {
      const d = (e.department || "").toLowerCase();
      const r = (e.role || "").toLowerCase();
      const id = String(e.id || e.staff_id || "");
      return d.includes("account") || r.includes("account") || id.startsWith("ACC-");
    });
  }, [orgStaff]);

  const totalHKStaff = hkStaffList.length;
  const totalKitchenStaff = kitchenStaffList.length;
  const totalAccStaff = accountingStaffList.length;
  const totalAllStaff = orgStaff.length;

  // Calculate active department pool for attendance metrics
  const activeDeptStaffList = (() => {
    if (departmentTab === "housekeeping") return hkStaffList;
    if (departmentTab === "kitchen") return kitchenStaffList;
    if (departmentTab === "accounting") return accountingStaffList;
    return orgStaff;
  })();

  // Dynamic real-time Attendance & Duty metrics for Admin / Super Admin
  const adminAttMetrics = (() => {
    const totalStaff = activeDeptStaffList.length;
    let checkedIn = 0;
    let checkedOut = 0;
    let totalWorkMinutes = 0;
    let onLeave = 0;

    activeDeptStaffList.forEach((e) => {
      const sid = String(e.id || e.staff_id || "").toLowerCase();
      const semail = String(e.email || "").toLowerCase();
      const att = adminAttendanceMap[sid] || adminAttendanceMap[semail] || null;
      const leaves = adminLeavesMap[sid] || adminLeavesMap[semail] || 0;

      const isCheckedIn = att && (att.status === "Present" || att.status === "On Duty" || (att.clockIn && !att.clockOut));
      const isCheckedOut = att && (att.status === "Checked Out" || att.clockOut);
      const isLeave = leaves > 0 || att?.status === "On Leave";

      if (isCheckedIn) checkedIn += 1;
      if (isCheckedOut) checkedOut += 1;
      if (isLeave) onLeave += 1;

      if (att?.hoursWorked) {
        const num = parseFloat(att.hoursWorked);
        if (!isNaN(num)) totalWorkMinutes += num * 60;
      } else if (isCheckedIn) {
        totalWorkMinutes += 150; // ~2.5 hrs for active shifts
      } else if (isCheckedOut) {
        totalWorkMinutes += 480; // ~8.0 hrs full shift
      }
    });

    const workHoursStr = `${(totalWorkMinutes / 60).toFixed(1)} hrs`;
    return {
      totalStaff,
      checkedIn,
      checkedOut,
      workHoursStr,
      onLeave,
    };
  })();

  const adminTotalPayroll = useMemo(() => {
    return orgStaff.reduce((sum, e) => {
      const num = parseFloat(String(e.salary || "").replace(/[^\d.]/g, "")) || 0;
      return sum + num;
    }, 0);
  }, [orgStaff]);

  // Displayed Staff based on department, shift, status, attendance filter, and search
  const displayedStaff = orgStaff.filter((e) => {
    if (departmentTab === "housekeeping") {
      const d = (e.department || "").toLowerCase();
      const r = (e.role || "").toLowerCase();
      const id = String(e.id || e.staff_id || "");
      if (!(d.includes("housekeeping") || r.includes("housekeeping") || id.startsWith("HK-"))) return false;
    } else if (departmentTab === "kitchen") {
      const d = (e.department || "").toLowerCase();
      const r = (e.role || "").toLowerCase();
      const id = String(e.id || e.staff_id || "");
      if (!(d.includes("kitchen") || d.includes("food") || r.includes("chef") || r.includes("kitchen") || id.startsWith("KIT-"))) return false;
    } else if (departmentTab === "accounting") {
      const d = (e.department || "").toLowerCase();
      const r = (e.role || "").toLowerCase();
      const id = String(e.id || e.staff_id || "");
      if (!(d.includes("account") || r.includes("account") || id.startsWith("ACC-"))) return false;
    }

    // Attendance Filter Pill
    if (adminAttFilter !== "All") {
      const sid = String(e.id || e.staff_id || "").toLowerCase();
      const semail = String(e.email || "").toLowerCase();
      const att = adminAttendanceMap[sid] || adminAttendanceMap[semail] || null;
      const leaves = adminLeavesMap[sid] || adminLeavesMap[semail] || 0;
      const isCheckedIn = att && (att.status === "Present" || att.status === "On Duty" || (att.clockIn && !att.clockOut));
      const isCheckedOut = att && (att.status === "Checked Out" || att.clockOut);
      const isLeave = leaves > 0 || att?.status === "On Leave";

      if (adminAttFilter === "CheckedIn" && !isCheckedIn) return false;
      if (adminAttFilter === "CheckedOut" && !isCheckedOut) return false;
      if (adminAttFilter === "Worked" && !(isCheckedIn || isCheckedOut || (att?.hoursWorked && parseFloat(att.hoursWorked) > 0))) return false;
      if (adminAttFilter === "OnLeave" && !isLeave) return false;
    }

    if (shiftFilter !== "All") {
      const s = (e.shift || "").toLowerCase();
      if (!s.includes(shiftFilter.toLowerCase())) return false;
    }

    if (statusFilter !== "All") {
      if ((e.status || "Active") !== statusFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        (e.name || "").toLowerCase().includes(q) ||
        (e.id || "").toLowerCase().includes(q) ||
        (e.staff_id || "").toLowerCase().includes(q) ||
        (e.role || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q) ||
        (e.assigned_area || "").toLowerCase().includes(q) ||
        (e.assigned_work || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.phone || "").toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleImageFileUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          callback(reader.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  function saveEditModal(e) {
    e.preventDefault();
    if (!editModalEmp) return;
    if (!/^\S+@\S+\.\S+$/.test(String(editModalEmp.email || "").trim())) {
      setMsg({ type: "error", text: "Please enter a valid email address." }); return;
    }
    const finalPassword = editModalEmp.password || getStaffPassword(editModalEmp);
    if (finalPassword && finalPassword.length < 6) {
      setMsg({ type: "error", text: "Password must be at least 6 characters." }); return;
    }
    if (editModalEmp.phone && String(editModalEmp.phone).replace(/\D/g, "").length !== 10) {
      setMsg({ type: "error", text: "Phone number must contain exactly 10 digits." }); return;
    }
    const finalUsername = editModalEmp.username || getStaffUsername(editModalEmp);
    const updatedPayload = {
      ...editModalEmp,
      password: finalPassword,
      username: finalUsername,
    };
    updateEmployee(editModalEmp.id, updatedPayload);
    setList(getEmployees());
    setMsg({ type: "success", text: `Staff member "${editModalEmp.name}" updated successfully.` });
    setEditModalEmp(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(blankForm(roleOptions[0]?.value || "housekeeping", orgId, org));
  }

  function changeRole(role) {
    if (editingId) return;
    setForm((f) => ({
      ...f,
      role,
      id: generateEmployeeId(role),
    }));
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setMsg({ type: "error", text: "Please enter name, email and password." });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setMsg({ type: "error", text: "Please enter a valid email address." }); return;
    }
    if (form.password.length < 6) {
      setMsg({ type: "error", text: "Password must be at least 6 characters." }); return;
    }
    const phoneDigits = String(form.phone || "").replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      setMsg({ type: "error", text: "Phone number must contain exactly 10 digits." }); return;
    }

    if (editingId) {
      updateEmployee(editingId, { ...form, org, orgId });
      setMsg({ type: "success", text: `Staff details for "${form.name}" updated.` });
    } else {
      // Check duplicate within current org list by email or staffId
      const currentOrgList = getEmployees();
      const duplicateEmail = currentOrgList.find(empItem => empItem.email && empItem.email.toLowerCase() === form.email.trim().toLowerCase());
      if (duplicateEmail) {
        setMsg({ type: "error", text: `An account with email ${form.email} already exists in ${org || "this organization"}.` });
        return;
      }

      const res = await addEmployee({ ...form, org, orgId });
      if (res && res.success === false) {
        setMsg({ type: "error", text: res.error || "Failed to add staff member." });
        return;
      }

      setMsg({
        type: "success",
        text: `Successfully added ${form.name} to ${org || "organization"}.`,
      });
      setShowAddModal(false);
    }

    const latest = await syncEmployeesFromBackend(orgId, org);
    if (latest && latest.length > 0) {
      setList(latest);
    } else {
      setList(getEmployees());
    }
    resetForm();
  }

  function startEdit(emp) {
    setEditingId(emp.id);
    setForm({ ...emp });
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id) {
    deleteEmployee(id);
    setList(getEmployees());
    if (editingId === id) resetForm();
  }

  // =========================================================================
  // ACCOUNTANT DEDICATED VIEW: Real Database Attendance & Salary Management
  const [accountantDeptTab, setAccountantDeptTab] = useState("ALL"); // "ALL" | "HOUSEKEEPING" | "KITCHEN" | "ACCOUNTING"
  const [accountantAttendanceFilter, setAccountantAttendanceFilter] = useState("All"); // "All" | "CheckedIn" | "CheckedOut" | "OnLeave"
  const [accountantStaffList, setAccountantStaffList] = useState([]);
  const [accountantAttendanceMap, setAccountantAttendanceMap] = useState({});
  const [accountantLeavesMap, setAccountantLeavesMap] = useState({});
  const [accountantPayrollMap, setAccountantPayrollMap] = useState({});
  const [accountantLoading, setAccountantLoading] = useState(false);
  const [accountantPayingId, setAccountantPayingId] = useState(null);

  // Month & Year Filter for Accountant Banner & Analytics
  const [accountantYear, setAccountantYear] = useState("2026");
  const [accountantMonth, setAccountantMonth] = useState("09"); // "ALL" or "01"-"12"
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Calculate full roster rows with attendance, salary, deductions and payment details
  const getFullExportRosterData = () => {
    const staffPool = (accountantStaffList && accountantStaffList.length > 0)
      ? accountantStaffList
      : (orgStaff && orgStaff.length > 0)
        ? orgStaff
        : list;

    return staffPool.map((emp, idx) => {
      const sid = String(emp.staff_id || emp.id || "").toLowerCase();
      const semail = String(emp.email || "").toLowerCase();
      const sname = String(emp.name || "").toLowerCase();

      // Attendance
      const attRecord = accountantAttendanceMap[sid] || accountantAttendanceMap[semail] || adminAttendanceMap[sid] || adminAttendanceMap[semail] || null;
      const isPresent = attRecord ? (attRecord.status === "Present" || attRecord.status === "Checked Out" || attRecord.clockIn || attRecord.status === "On Duty") : true;
      const leaveCount = accountantLeavesMap[sid] || accountantLeavesMap[semail] || adminLeavesMap[sid] || adminLeavesMap[semail] || (attRecord?.status === "On Leave" ? 1 : 0);
      const isAbsent = (!isPresent && emp.status !== "Active" && leaveCount === 0);

      // Salary
      const baseSalary = typeof emp.salary === "number" && !isNaN(emp.salary)
        ? emp.salary
        : Number(String(emp.salary || 0).replace(/[^0-9.-]+/g, "")) || 35000;
      const deduction = isAbsent ? 1000 : 0;
      const finalSalary = Math.max(0, baseSalary - deduction);

      // Payroll status
      const payRecord = accountantPayrollMap[sname] || accountantPayrollMap[String(emp.id)];
      const isPaid = emp.payroll_status === "Paid" || payRecord?.status === "Paid" || emp.status === "Active";

      return {
        srNo: idx + 1,
        id: emp.staff_id || emp.id || `EMP-${idx + 1}`,
        name: emp.name || "Staff Member",
        avatar: emp.avatar || "",
        department: emp.department || "Accounting",
        present: isPresent ? 1 : 0,
        absent: isAbsent ? 1 : 0,
        leave: leaveCount,
        baseSalary,
        deduction,
        finalSalary,
        status: isPaid ? "Paid" : "Pending",
        branch: org || "Ajmer Branch",
        orgId: orgId || emp.org_id || "AJ01",
      };
    });
  };

  const generateFullExportPayload = () => {
    const roster = getFullExportRosterData();
    const staffPool = (accountantStaffList && accountantStaffList.length > 0)
      ? accountantStaffList
      : (orgStaff && orgStaff.length > 0)
        ? orgStaff
        : list;

    const hkCount = staffPool.filter((e) => (e.department || "").toLowerCase().includes("housekeep")).length;
    const kitCount = staffPool.filter((e) => (e.department || "").toLowerCase().includes("kitchen") || (e.department || "").toLowerCase().includes("food")).length;
    const accCount = staffPool.filter((e) => (e.department || "").toLowerCase().includes("account") || (e.department || "").toLowerCase().includes("finance")).length;

    return {
      exportId: `EXP-SAL-${Date.now()}`,
      exportedAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleString("en-IN"),
      branch: org || "Ajmer Branch",
      orgId: orgId || "AJ01",
      period: accountantMonth === "ALL" ? "Whole Year" : `Month ${accountantMonth}/${accountantYear}`,
      year: accountantYear,
      month: accountantMonth,
      summary: {
        totalEmployees: bannerMetrics.totalEmps,
        totalMonthlySalary: bannerMetrics.totalMonthlySalary,
        totalPaidSalary: bannerMetrics.totalPaidSalary,
        totalDeductions: bannerMetrics.totalDeductions,
        totalPresent: bannerMetrics.totalPresent,
        totalAbsent: bannerMetrics.totalAbsent,
        totalLeave: bannerMetrics.totalLeave,
        checkedIn: bannerMetrics.totalCheckedIn,
        hoursWorked: bannerMetrics.totalHoursWorkedStr,
      },
      departments: {
        all: staffPool.length,
        housekeeping: hkCount,
        kitchen: kitCount,
        accounting: accCount,
      },
      roster,
    };
  };

  const handleExportDataClick = () => {
    const payload = generateFullExportPayload();
    try {
      localStorage.setItem("accountant_latest_exported_payroll", JSON.stringify(payload));
      const history = JSON.parse(localStorage.getItem("accountant_exported_payroll_history") || "[]");
      history.unshift(payload);
      localStorage.setItem("accountant_exported_payroll_history", JSON.stringify(history.slice(0, 50)));

      // GENERATE & PERMANENTLY STORE INDIVIDUAL CHATRIX INVOICES FOR EACH STAFF MEMBER
      const allInvoices = JSON.parse(localStorage.getItem("hotel_chatrix_all_invoices") || "[]");
      const existingAccountingInvoices = JSON.parse(localStorage.getItem("hotel_accounting_invoices") || "[]");
      const newAccountingInvoices = [...existingAccountingInvoices];

      payload.roster.forEach((emp) => {
        const sid = String(emp.id || "").toLowerCase();
        const baseCTC = Number(emp.baseSalary) || 28000;
        const grossSalary = baseCTC + 7000;
        const taxDed = Math.round(grossSalary * 0.05);
        const totalDed = (Number(emp.deduction) || 0) + taxDed;
        const netDisbursed = Math.max(0, grossSalary - totalDed);

        const newInvoice = {
          id: `INV-ACC-${String(emp.id).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          invoiceNo: `INV-${String(emp.id).toUpperCase()}-${payload.month || "09"}${payload.year || "2026"}`,
          staffId: emp.id,
          staffName: emp.name,
          department: emp.department || "Accounting",
          month: payload.month === "ALL" ? "Whole Year" : `Month ${payload.month}/${payload.year}`,
          year: payload.year,
          period: payload.period,
          date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          timestamp: Date.now(),
          baseSalary: baseCTC,
          allowances: 4500,
          bonus: 2500,
          grossSalary,
          deduction: totalDed,
          taxDeduction: taxDed,
          netSalary: netDisbursed,
          status: "Verified & Paid",
          branch: payload.branch,
          orgId: payload.orgId,
          exportedBy: "Accountant Desk",
        };

        // Store into employee-specific history
        const empHistory = JSON.parse(localStorage.getItem(`hotel_chatrix_invoices_${sid}`) || "[]");
        empHistory.unshift(newInvoice);
        localStorage.setItem(`hotel_chatrix_invoices_${sid}`, JSON.stringify(empHistory.slice(0, 50)));

        allInvoices.unshift(newInvoice);

        // Also add to global accounting invoices ledger
        newAccountingInvoices.unshift({
          id: newInvoice.id,
          guest: `${emp.name} (Payroll - ${payload.period})`,
          room: emp.id,
          amount: grossSalary,
          paid: netDisbursed,
          status: "Paid",
          method: "Bank Transfer",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          category: "Employee Payroll",
          branch: payload.branch,
        });
      });

      localStorage.setItem("hotel_chatrix_all_invoices", JSON.stringify(allInvoices.slice(0, 250)));
      localStorage.setItem("hotel_accounting_invoices", JSON.stringify(newAccountingInvoices.slice(0, 250)));

      window.dispatchEvent(new CustomEvent("accountant_payroll_exported", { detail: payload }));
      window.dispatchEvent(new CustomEvent("chatrix_invoice_generated", { detail: payload }));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Could not save exported payload to localStorage:", e);
    }

    setIsShareModalOpen(true);
    showSuccess("Payroll Invoices generated & permanently stored in Chatrix!");
  };

  const handleDownloadCSV = () => {
    const payload = generateFullExportPayload();
    let csv = `EXECUTIVE PAYROLL & STAFF ATTENDANCE ROSTER\n`;
    csv += `Branch,${payload.branch},Period,${payload.period},Exported At,"${payload.formattedDate}"\n`;
    csv += `Total Employees,${payload.summary.totalEmployees},Gross Monthly Salary,₹${payload.summary.totalMonthlySalary},Disbursed Salary,₹${payload.summary.totalPaidSalary},Total Deductions,₹${payload.summary.totalDeductions}\n`;
    csv += `\n`;
    csv += `Sr No,Staff ID,Staff Name,Department,Present Days,Absent Days,Leave Days,Gross Base Salary (₹),Deductions (₹),Final Net Salary (₹),Payment Status\n`;

    payload.roster.forEach((r) => {
      csv += `${r.srNo},"${r.id}","${r.name}","${r.department}",${r.present},${r.absent},${r.leave},${r.baseSalary},${r.deduction},${r.finalSalary},"${r.status}"\n`;
    });

    csv += `,,TOTALS,,${payload.summary.totalPresent},${payload.summary.totalAbsent},${payload.summary.totalLeave},${payload.summary.totalMonthlySalary},${payload.summary.totalDeductions},${payload.summary.totalMonthlySalary - payload.summary.totalDeductions},\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll_roster_${(org || "branch").toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("CSV file downloaded successfully!");
  };

  // Generate shareable payload summary
  const getShareSummaryText = () => {
    const payload = generateFullExportPayload();
    let text = `🏨 *${payload.branch} — Executive Payroll & Staff Report*\n`;
    text += `📅 Period: ${payload.period} | Exported: ${payload.formattedDate}\n`;
    text += `----------------------------------------\n`;
    text += `👥 Total Employees: ${payload.summary.totalEmployees}\n`;
    text += `💰 Gross Monthly Salary Budget: ₹${payload.summary.totalMonthlySalary.toLocaleString("en-IN")}\n`;
    text += `💳 Disbursed Salary: ₹${payload.summary.totalPaidSalary.toLocaleString("en-IN")}\n`;
    text += `📉 Total Deductions: ₹${payload.summary.totalDeductions.toLocaleString("en-IN")}\n`;
    text += `📊 Depts: 🧹 HK: ${payload.departments.housekeeping} | 🍳 Kitchen: ${payload.departments.kitchen} | 📊 Accounting: ${payload.departments.accounting}\n`;
    text += `----------------------------------------\n`;
    text += `📋 *Staff Roster Table Snapshot:*\n`;
    payload.roster.forEach((r) => {
      text += `${r.srNo}. ${r.name} (${r.department}) -> Salary: ₹${r.baseSalary.toLocaleString("en-IN")} | Ded: ₹${r.deduction} | Net: ₹${r.finalSalary.toLocaleString("en-IN")} [${r.status}]\n`;
    });
    text += `----------------------------------------\n`;
    text += `🔗 Live Portal: ${window.location.href}`;
    return text;
  };

  const handleCopyShareSummary = () => {
    const text = getShareSummaryText();
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    showSuccess("Payroll table summary copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareSummaryText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Fetch real data from actual database/APIs strictly for current branch / organization
  const fetchAccountantRealData = async () => {
    if (creatorRole !== "accountant") return;
    setAccountantLoading(true);
    try {
      // 1. Fetch real employees/staff for current branch/org from database
      const queryParam = orgId ? `?orgId=${encodeURIComponent(orgId)}` : org ? `?org=${encodeURIComponent(org)}` : "";
      const staffRes = await fetch(`http://localhost:4000/api/staff${queryParam}`, {
        headers: getAuthHeaders(),
      });
      const staffData = await staffRes.json();
      let realStaff = Array.isArray(staffData?.staff)
        ? staffData.staff
        : Array.isArray(staffData?.employees)
          ? staffData.employees
          : [];

      // If backend returned empty or filtering resulted in 0, use local employee data as fallback
      if (!realStaff || realStaff.length === 0) {
        const localList = getEmployees();
        realStaff = localList.filter((e) => {
          const eOrgId = e.org_id || e.orgId;
          const eOrgName = e.org || e.org_name || e.orgName;
          if (orgId && eOrgId) {
            return String(eOrgId).toLowerCase() === String(orgId).toLowerCase();
          }
          if (org && eOrgName) {
            return String(eOrgName).toLowerCase() === String(org).toLowerCase();
          }
          return true;
        });
      }

      setAccountantStaffList(realStaff);

      // 2. Fetch real attendance records for this branch
      const attRes = await fetch(`http://localhost:4000/api/staff/attendance${queryParam}`, {
        headers: getAuthHeaders(),
      });
      const attData = await attRes.json();
      const attRoster = Array.isArray(attData?.roster) ? attData.roster : [];
      const attMap = {};
      attRoster.forEach((r) => {
        const sid = String(r.staffId || r.id || "").toLowerCase();
        const semail = String(r.staffEmail || "").toLowerCase();
        if (sid) attMap[sid] = r;
        if (semail) attMap[semail] = r;
      });
      setAccountantAttendanceMap(attMap);

      // 3. Fetch real leave records for this branch
      const leaveRes = await fetch(`http://localhost:4000/api/staff/attendance/leaves${queryParam}`, {
        headers: getAuthHeaders(),
      });
      const leaveData = await leaveRes.json();
      const leavesList = Array.isArray(leaveData?.leaves) ? leaveData.leaves : [];
      const lMap = {};
      leavesList.forEach((l) => {
        const sid = String(l.staff_id || l.staffId || "").toLowerCase();
        const semail = String(l.staff_email || l.staffEmail || "").toLowerCase();
        if (sid) lMap[sid] = (lMap[sid] || 0) + 1;
        if (semail) lMap[semail] = (lMap[semail] || 0) + 1;
      });
      setAccountantLeavesMap(lMap);

      // 4. Fetch real payroll payment statuses for this branch
      const payRes = await fetch(`http://localhost:4000/api/payroll${queryParam}`, {
        headers: getAuthHeaders(),
      });
      const payData = await payRes.json();
      const payRecords = Array.isArray(payData?.records) ? payData.records : [];
      const pMap = {};
      payRecords.forEach((p) => {
        const pName = String(p.name || "").toLowerCase();
        const pId = String(p.id || "");
        if (pName) pMap[pName] = p;
        if (pId) pMap[pId] = p;
      });
      setAccountantPayrollMap(pMap);
    } catch (err) {
      console.error("Failed to load real data for Accountant:", err);
    } finally {
      setAccountantLoading(false);
    }
  };

  useEffect(() => {
    if (creatorRole === "accountant") {
      fetchAccountantRealData();
      const interval = setInterval(fetchAccountantRealData, 4000);
      const handleSync = () => fetchAccountantRealData();
      window.addEventListener("staff_attendance_changed", handleSync);
      window.addEventListener("storage", handleSync);
      return () => {
        clearInterval(interval);
        window.removeEventListener("staff_attendance_changed", handleSync);
        window.removeEventListener("storage", handleSync);
      };
    }
  }, [creatorRole, org, orgId]);

  // Handle Real Pay Now action against backend database & employee profile
  const handlePaySalary = async (emp) => {
    const sId = emp.id || emp.staff_id || emp.staffId;
    setAccountantPayingId(sId);

    const sid = String(emp.staff_id || emp.id || "").toLowerCase();
    const semail = String(emp.email || "").toLowerCase();
    const attRecord = accountantAttendanceMap[sid] || accountantAttendanceMap[semail] || null;
    const isPresentToday = attRecord && (attRecord.status === "Present" || attRecord.status === "Checked Out" || attRecord.clockIn || attRecord.status === "On Duty");
    const leaveCount = accountantLeavesMap[sid] || accountantLeavesMap[semail] || (attRecord?.status === "On Leave" ? 1 : 0);
    const absentCount = (!isPresentToday && emp.status !== "Active" && leaveCount === 0) ? 1 : 0;

    const baseSalary = typeof emp.salary === "number" && !isNaN(emp.salary)
      ? emp.salary
      : Number(String(emp.salary || 0).replace(/[^0-9.-]+/g, "")) || 0;
    const deduction = absentCount * 1000;
    const finalSalary = Math.max(0, baseSalary - deduction);
    const targetMonth = `${accountantYear}-${accountantMonth === "ALL" ? "09" : accountantMonth}`;
    const now = new Date();
    const formattedDate = `Paid on ${now.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })} at ${now.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true })}`;

    try {
      const res = await fetch(`http://localhost:4000/api/payroll/${emp.id || emp.staff_id || emp.staffId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Paid",
          amount: finalSalary,
          baseSalary: baseSalary,
          deduction: deduction,
          month: targetMonth,
          paymentDate: formattedDate,
          orgId: emp.org_id || emp.orgId || orgId,
          transactionRef: `TXN-SAL-${Date.now().toString().slice(-6)}`,
        }),
      });

      if (res.ok) {
        // Also save in local employee / profile salary history storage so it's instantly available in Profile
        try {
          const record = {
            id: `SAL-${Date.now()}`,
            employeeName: emp.name,
            employeeId: emp.staff_id || emp.id,
            department: emp.department,
            month: targetMonth,
            baseSalary: baseSalary,
            deduction: deduction,
            finalSalary: finalSalary,
            status: "Paid",
            paymentDate: formattedDate,
            paidAt: now.toISOString(),
            transactionRef: `TXN-SAL-${Date.now().toString().slice(-6)}`,
            accountNo: emp.account_no || emp.accountNo || `•••• ${Math.floor(1000 + Math.random() * 9000)} (HDFC Bank)`,
          };

          // Save under all possible lookups (email, staffId, name)
          const keysToSave = [
            sid && `employee_salary_history_${sid}`,
            semail && `employee_salary_history_${semail}`,
            emp.name && `employee_salary_history_${emp.name.toLowerCase().trim()}`,
          ].filter(Boolean);

          keysToSave.forEach((key) => {
            const existing = JSON.parse(localStorage.getItem(key) || "[]");
            existing.unshift(record);
            localStorage.setItem(key, JSON.stringify(existing));
          });

          window.dispatchEvent(new CustomEvent("employee_salary_paid", { detail: { employeeId: sid, email: semail, name: emp.name, finalSalary, formattedDate } }));
        } catch (e) {
          console.warn("Could not save to local employee salary history:", e);
        }

        setMsg({ type: "success", text: `Salary of ₹${finalSalary.toLocaleString("en-IN")} for "${emp.name}" marked as Paid & added to employee profile.` });
        await fetchAccountantRealData();
      } else {
        setMsg({ type: "error", text: "Failed to record payment in database." });
      }
    } catch (err) {
      console.error("Pay action error:", err);
      setMsg({ type: "error", text: "Network error processing payment." });
    } finally {
      setAccountantPayingId(null);
    }
  };

  // Active accountant staff list with fallback to branch orgStaff and list
  const activeAccountantStaffList = (accountantStaffList && accountantStaffList.length > 0)
    ? accountantStaffList
    : (orgStaff && orgStaff.length > 0)
      ? orgStaff
      : list;

  // Filter staff by selected department tab (Housekeeping, Kitchen, Accounting) and attendance status filter
  const accountantFilteredStaff = activeAccountantStaffList.filter((emp) => {
    const dept = (emp.department || "").toLowerCase().trim();
    const role = (emp.role || "").toLowerCase().trim();
    const sid = String(emp.staff_id || emp.id || "").toLowerCase();
    const semail = String(emp.email || "").toLowerCase();

    // 1. Department tab check
    let matchesDept = false;
    if (accountantDeptTab === "ALL") {
      matchesDept = true;
    } else if (accountantDeptTab === "HOUSEKEEPING") {
      matchesDept = dept.includes("housekeep") || role.includes("housekeep") || sid.startsWith("hk");
    } else if (accountantDeptTab === "KITCHEN") {
      matchesDept = dept.includes("kitchen") || dept.includes("food") || role.includes("chef") || role.includes("kitchen") || sid.startsWith("kit");
    } else if (accountantDeptTab === "ACCOUNTING") {
      matchesDept = dept.includes("account") || dept.includes("finance") || role.includes("account") || sid.startsWith("acc");
    }

    if (!matchesDept) return false;

    // 2. Attendance pill filter check
    if (accountantAttendanceFilter === "All") return true;

    const attRecord = accountantAttendanceMap[sid] || accountantAttendanceMap[semail] || null;
    const isCheckedIn = attRecord && (attRecord.status === "Present" || attRecord.status === "On Duty" || (attRecord.clockIn && !attRecord.clockOut));
    const isCheckedOut = attRecord && (attRecord.status === "Checked Out" || attRecord.clockOut);
    const leaveCount = accountantLeavesMap[sid] || accountantLeavesMap[semail] || (attRecord?.status === "On Leave" ? 1 : 0);

    if (accountantAttendanceFilter === "CheckedIn") {
      return !!isCheckedIn;
    }
    if (accountantAttendanceFilter === "CheckedOut") {
      return !!isCheckedOut;
    }
    if (accountantAttendanceFilter === "Worked") {
      return !!(isCheckedIn || isCheckedOut || (attRecord?.hoursWorked && parseFloat(attRecord.hoursWorked) > 0));
    }
    if (accountantAttendanceFilter === "OnLeave") {
      return leaveCount > 0;
    }

    return true;
  });

  // Dynamic calculations for Upside Summary Banner across all branch employees
  const bannerMetrics = (() => {
    const staffPool = (accountantStaffList && accountantStaffList.length > 0)
      ? accountantStaffList
      : (orgStaff && orgStaff.length > 0)
        ? orgStaff
        : list;

    const totalEmps = staffPool.length;
    let totalMonthlySalary = 0;
    let totalPaidSalary = 0;
    let totalDeductions = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalCheckedIn = 0;
    let totalCheckedOut = 0;
    let totalHoursMinutes = 0;

    staffPool.forEach((emp) => {
      const sid = String(emp.staff_id || emp.id || "").toLowerCase();
      const semail = String(emp.email || "").toLowerCase();
      const sname = String(emp.name || "").toLowerCase();

      // Attendance
      const attRecord = accountantAttendanceMap[sid] || accountantAttendanceMap[semail] || adminAttendanceMap[sid] || adminAttendanceMap[semail] || null;
      const isPresent = attRecord ? (attRecord.status === "Present" || attRecord.status === "Checked Out" || attRecord.clockIn || attRecord.status === "On Duty") : true;
      const leaveCount = accountantLeavesMap[sid] || accountantLeavesMap[semail] || adminLeavesMap[sid] || adminLeavesMap[semail] || (attRecord?.status === "On Leave" ? 1 : 0);
      const isAbsent = (!isPresent && emp.status !== "Active" && leaveCount === 0);

      const isCheckedIn = attRecord && (attRecord.status === "Present" || attRecord.status === "On Duty" || (attRecord.clockIn && !attRecord.clockOut));
      const isCheckedOut = attRecord && (attRecord.status === "Checked Out" || attRecord.clockOut);

      if (isCheckedIn) totalCheckedIn += 1;
      if (isCheckedOut) totalCheckedOut += 1;
      if (isPresent) totalPresent += 1;
      else if (isAbsent) totalAbsent += 1;
      if (leaveCount > 0) totalLeave += leaveCount;

      // Real hours worked calculation
      if (attRecord?.hoursWorked) {
        const num = parseFloat(attRecord.hoursWorked);
        if (!isNaN(num)) totalHoursMinutes += num * 60;
      } else if (isCheckedIn) {
        totalHoursMinutes += 150; // Active shift approx 2.5 hrs
      } else if (isCheckedOut) {
        totalHoursMinutes += 480; // Full shift 8 hrs
      }

      // Salary calculation
      const baseSalary = typeof emp.salary === "number" && !isNaN(emp.salary)
        ? emp.salary
        : Number(String(emp.salary || 0).replace(/[^0-9.-]+/g, "")) || 35000;

      const deduction = isAbsent ? 1000 : 0;
      const finalSalary = Math.max(0, baseSalary - deduction);

      totalMonthlySalary += baseSalary;
      totalDeductions += deduction;

      const payRecord = accountantPayrollMap[sname] || accountantPayrollMap[String(emp.id)];
      const isPaid = emp.payroll_status === "Paid" || payRecord?.status === "Paid" || emp.status === "Active";
      if (isPaid) {
        totalPaidSalary += finalSalary;
      }
    });

    const presentPercent = totalEmps > 0 ? Math.round((totalPresent / totalEmps) * 100) : 0;
    const absentPercent = totalEmps > 0 ? Math.round((totalAbsent / totalEmps) * 100) : 0;
    const totalHoursWorkedStr = `${(totalHoursMinutes / 60).toFixed(1)} hrs`;

    return {
      totalEmps,
      totalMonthlySalary,
      totalPaidSalary: totalPaidSalary || totalMonthlySalary,
      totalDeductions,
      totalPresent,
      totalAbsent,
      totalLeave,
      totalCheckedIn,
      totalCheckedOut,
      totalHoursWorkedStr,
      presentPercent,
      absentPercent,
    };
  })();

  // If role is accountant, render dedicated Salary & Attendance Management view
  if (creatorRole === "accountant") {
    return (
      <div style={{ padding: "0 4px 30px 4px" }}>
        {/* ========================================================================= */}
        {/* DYNAMIC REAL DATA PURPLE BANNER WITH INTEGRATED HEADER, FILTERS & CARDS */}
        {/* ========================================================================= */}
        {/* CSS KEYFRAMES FOR SMOOTH LOOP TRANSITIONS */}
        <style>{`
          @keyframes cardFloatPulse {
            0% {
              transform: translateY(0px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            }
            50% {
              transform: translateY(-3px);
              box-shadow: 0 8px 18px rgba(147, 51, 234, 0.28);
            }
            100% {
              transform: translateY(0px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            }
          }
          @keyframes cardFloatPulseDark {
            0% {
              transform: translateY(0px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            }
            50% {
              transform: translateY(-3px);
              box-shadow: 0 8px 20px rgba(192, 132, 252, 0.35);
            }
            100% {
              transform: translateY(0px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            }
          }
          @keyframes shareLoopPulse {
            0% {
              box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7), 0 4px 14px rgba(168, 85, 247, 0.4);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 0 20px 6px rgba(236, 72, 153, 0.75), 0 6px 20px rgba(124, 58, 237, 0.65);
              transform: scale(1.035);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(236, 72, 153, 0), 0 4px 14px rgba(168, 85, 247, 0.4);
              transform: scale(1);
            }
          }
          @keyframes shareShimmerWave {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          @keyframes shareIconWobble {
            0%, 100% {
              transform: rotate(0deg) scale(1);
            }
            25% {
              transform: rotate(-14deg) scale(1.15);
            }
            75% {
              transform: rotate(14deg) scale(1.15);
            }
          }
          .share-btn-loop {
            background: linear-gradient(135deg, #ec4899 0%, #a855f7 35%, #6366f1 70%, #3b82f6 100%);
            background-size: 250% 250%;
            animation: shareLoopPulse 2.6s ease-in-out infinite, shareShimmerWave 4s ease infinite;
            border: 1.5px solid rgba(255, 255, 255, 0.6) !important;
          }
          .share-btn-loop:hover {
            transform: translateY(-2px) scale(1.05) !important;
            box-shadow: 0 8px 24px rgba(236, 72, 153, 0.85) !important;
          }
          .share-icon-anim {
            animation: shareIconWobble 2.6s ease-in-out infinite;
          }
          .kpi-anim-card-1 {
            animation: ${isDark ? "cardFloatPulseDark" : "cardFloatPulse"} 3.2s ease-in-out infinite;
          }
          .kpi-anim-card-2 {
            animation: ${isDark ? "cardFloatPulseDark" : "cardFloatPulse"} 3.2s ease-in-out 0.8s infinite;
          }
          .kpi-anim-card-3 {
            animation: ${isDark ? "cardFloatPulseDark" : "cardFloatPulse"} 3.2s ease-in-out 1.6s infinite;
          }
          .kpi-anim-card-4 {
            animation: ${isDark ? "cardFloatPulseDark" : "cardFloatPulse"} 3.2s ease-in-out 2.4s infinite;
          }
        `}</style>

        <div
          style={{
            background: isDark
              ? "linear-gradient(135deg, #190d2e 0%, #290d59 50%, #380860 100%)"
              : "linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "18px",
            border: isDark ? "1px solid rgba(192, 132, 252, 0.35)" : "1px solid rgba(168, 85, 247, 0.4)",
            boxShadow: isDark
              ? "0 8px 24px rgba(0, 0, 0, 0.55), 0 0 20px rgba(168, 85, 247, 0.2)"
              : "0 10px 24px rgba(107, 33, 168, 0.22)",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* BANNER HEADER: TITLE & INTEGRATED CONTROLS (YEAR, MONTH, REFRESH) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
              paddingBottom: "10px",
            }}
          >
            {/* TITLE & SUBTITLE INSIDE BANNER */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.18)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  💼
                </span>
                <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.2px" }}>
                  Employees
                </h1>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "rgba(233, 213, 255, 0.9)", fontWeight: "600" }}>
                Employee Salary & Attendance Management — {org || "Current Branch"} ({orgId || ""})
              </p>
            </div>

            {/* FILTER CONTROLS & REFRESH BUTTON INSIDE BANNER */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {/* YEAR SELECTOR */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(8px)",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                }}
              >
                <FaClock style={{ color: "#d8b4fe", fontSize: "11px" }} />
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#f3e8ff" }}>Year:</span>
                <select
                  value={accountantYear}
                  onChange={(e) => setAccountantYear(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontWeight: "800",
                    color: "#ffffff",
                    fontSize: "11.5px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="2026" style={{ background: "#2e1065", color: "#ffffff" }}>2026</option>
                  <option value="2025" style={{ background: "#2e1065", color: "#ffffff" }}>2025</option>
                  <option value="2024" style={{ background: "#2e1065", color: "#ffffff" }}>2024</option>
                  <option value="ALL" style={{ background: "#2e1065", color: "#ffffff" }}>All Years</option>
                </select>
              </div>

              {/* MONTH SELECTOR */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(8px)",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                }}
              >
                <FaFilter style={{ color: "#86efac", fontSize: "10.5px" }} />
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#f3e8ff" }}>Month:</span>
                <select
                  value={accountantMonth}
                  onChange={(e) => setAccountantMonth(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontWeight: "800",
                    color: "#ffffff",
                    fontSize: "11.5px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="09" style={{ background: "#2e1065", color: "#ffffff" }}>September (Current)</option>
                  <option value="08" style={{ background: "#2e1065", color: "#ffffff" }}>August</option>
                  <option value="07" style={{ background: "#2e1065", color: "#ffffff" }}>July</option>
                  <option value="06" style={{ background: "#2e1065", color: "#ffffff" }}>June</option>
                  <option value="05" style={{ background: "#2e1065", color: "#ffffff" }}>May</option>
                  <option value="04" style={{ background: "#2e1065", color: "#ffffff" }}>April</option>
                  <option value="03" style={{ background: "#2e1065", color: "#ffffff" }}>March</option>
                  <option value="02" style={{ background: "#2e1065", color: "#ffffff" }}>February</option>
                  <option value="01" style={{ background: "#2e1065", color: "#ffffff" }}>January</option>
                  <option value="ALL" style={{ background: "#2e1065", color: "#ffffff" }}>Whole Year</option>
                </select>
              </div>

              {/* REFRESH BUTTON */}
              <button
                type="button"
                onClick={fetchAccountantRealData}
                disabled={accountantLoading}
                style={{
                  padding: "6px 13px",
                  borderRadius: "9px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "11.5px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                  transition: "all 0.2s ease",
                }}
              >
                🔄 {accountantLoading ? "Refreshing..." : "Refresh"}
              </button>

              {/* EYE-CATCHING PROMINENT EXPORT DATA BUTTON WITH LOOP ANIMATION */}
              <button
                type="button"
                onClick={handleExportDataClick}
                className="share-btn-loop"
                title="Export & Share Live Payroll & Employee Data"
                style={{
                  padding: "7px 18px",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 4px 14px rgba(236, 72, 153, 0.4)",
                  transition: "all 0.25s ease",
                  letterSpacing: "0.2px",
                }}
              >
                <FaShareAlt className="share-icon-anim" style={{ fontSize: "14px" }} />
                <span>Export Data</span>
              </button>
            </div>
          </div>

          {/* 4 EXECUTIVE COLORFUL KPI STATS CARDS (TRANSPARENT GLASSMORPHISM) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "12px",
              width: "100%",
            }}
          >
            {/* CARD 1: TOTAL EMPLOYEES */}
            <div
              className="kpi-anim-card-1"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.24)",
                borderRadius: "16px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                transition: "all 0.25s ease",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #c084fc 0%, #9333ea 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  boxShadow: "0 4px 14px rgba(168, 85, 247, 0.45)",
                  flexShrink: 0,
                }}
              >
                <FaUsers />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "11.5px", fontWeight: "800", color: "rgba(243, 232, 255, 0.95)", display: "block", letterSpacing: "0.2px" }}>
                  Total Employees
                </span>
                <div style={{ fontSize: "24px", fontWeight: "900", color: "#ffffff", lineHeight: "1.1", margin: "2px 0" }}>
                  <AnimatedNumber value={bannerMetrics.totalEmps} />
                </div>
                <span
                  style={{
                    fontSize: "10.5px",
                    color: "#ffffff",
                    fontWeight: "800",
                    background: "rgba(255, 255, 255, 0.18)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    display: "inline-block",
                  }}
                >
                  Active in {org || "Current Branch"}
                </span>
              </div>
            </div>

            {/* CARD 2: TOTAL MONTHLY SALARY */}
            <div
              className="kpi-anim-card-2"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.24)",
                borderRadius: "16px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                transition: "all 0.25s ease",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  boxShadow: "0 4px 14px rgba(56, 189, 248, 0.45)",
                  flexShrink: 0,
                }}
              >
                <FaMoneyBillWave />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "11.5px", fontWeight: "800", color: "rgba(224, 242, 254, 0.95)", display: "block", letterSpacing: "0.2px" }}>
                  Total Monthly Salary
                </span>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#ffffff", lineHeight: "1.1", margin: "2px 0" }}>
                  <AnimatedNumber value={bannerMetrics.totalMonthlySalary} prefix="₹" />
                </div>
                <span
                  style={{
                    fontSize: "10.5px",
                    color: "#e0f2fe",
                    fontWeight: "800",
                    background: "rgba(56, 189, 248, 0.22)",
                    border: "1px solid rgba(56, 189, 248, 0.35)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    display: "inline-block",
                  }}
                >
                  Gross payroll budget
                </span>
              </div>
            </div>

            {/* CARD 3: TOTAL PAID SALARY */}
            <div
              className="kpi-anim-card-3"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.24)",
                borderRadius: "16px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                transition: "all 0.25s ease",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  boxShadow: "0 4px 14px rgba(52, 211, 153, 0.45)",
                  flexShrink: 0,
                }}
              >
                <FaCheckCircle />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "11.5px", fontWeight: "800", color: "rgba(220, 252, 231, 0.95)", display: "block", letterSpacing: "0.2px" }}>
                  Total Paid Salary
                </span>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#ffffff", lineHeight: "1.1", margin: "2px 0" }}>
                  <AnimatedNumber value={bannerMetrics.totalPaidSalary} prefix="₹" />
                </div>
                <span
                  style={{
                    fontSize: "10.5px",
                    color: "#dcfce7",
                    fontWeight: "800",
                    background: "rgba(74, 222, 128, 0.22)",
                    border: "1px solid rgba(74, 222, 128, 0.35)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    display: "inline-block",
                  }}
                >
                  Disbursed to staff
                </span>
              </div>
            </div>

            {/* CARD 4: TOTAL DEDUCTIONS */}
            <div
              className="kpi-anim-card-4"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(255, 255, 255, 0.24)",
                borderRadius: "16px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                transition: "all 0.25s ease",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  boxShadow: "0 4px 14px rgba(251, 113, 133, 0.45)",
                  flexShrink: 0,
                }}
              >
                <FaFileInvoiceDollar />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "11.5px", fontWeight: "800", color: "rgba(254, 226, 226, 0.95)", display: "block", letterSpacing: "0.2px" }}>
                  Total Deductions
                </span>
                <div style={{ fontSize: "22px", fontWeight: "900", color: "#ffffff", lineHeight: "1.1", margin: "2px 0" }}>
                  <AnimatedNumber value={bannerMetrics.totalDeductions} prefix="₹" />
                </div>
                <span
                  style={{
                    fontSize: "10.5px",
                    color: "#fee2e2",
                    fontWeight: "800",
                    background: "rgba(248, 113, 113, 0.22)",
                    border: "1px solid rgba(248, 113, 113, 0.35)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    display: "inline-block",
                  }}
                >
                  {bannerMetrics.totalAbsent} absent days (₹1k/day)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 DEPARTMENT TABS - COMPACT & COLORFUL */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            flexWrap: "wrap",
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
            paddingBottom: "12px",
            alignItems: "center",
          }}
        >
          {[
            {
              id: "ALL",
              label: "All Employees",
              icon: "👥",
              activeBg: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
              activeBorder: "#a855f7",
              activeShadow: "0 3px 10px rgba(168, 85, 247, 0.35)",
              badgeBg: "#f3e8ff",
              badgeColor: "#6b21a8",
            },
            {
              id: "HOUSEKEEPING",
              label: "Housekeeping",
              icon: "🧹",
              activeBg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              activeBorder: "#f97316",
              activeShadow: "0 3px 10px rgba(249, 115, 22, 0.35)",
              badgeBg: "#ffedd5",
              badgeColor: "#c2410c",
            },
            {
              id: "KITCHEN",
              label: "Kitchen",
              icon: "🍳",
              activeBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              activeBorder: "#10b981",
              activeShadow: "0 3px 10px rgba(16, 185, 129, 0.35)",
              badgeBg: "#d1fae5",
              badgeColor: "#047857",
            },
            {
              id: "ACCOUNTING",
              label: "Accounting",
              icon: "📊",
              activeBg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              activeBorder: "#6366f1",
              activeShadow: "0 3px 10px rgba(99, 102, 241, 0.35)",
              badgeBg: "#e0e7ff",
              badgeColor: "#4338ca",
            },
          ].map((tab) => {
            const active = accountantDeptTab === tab.id;
            const count = activeAccountantStaffList.filter((e) => {
              if (tab.id === "ALL") return true;
              const d = (e.department || "").toLowerCase();
              const r = (e.role || "").toLowerCase();
              const sid = String(e.staff_id || e.id || "").toLowerCase();
              if (tab.id === "HOUSEKEEPING") return d.includes("housekeep") || r.includes("housekeep") || sid.startsWith("hk");
              if (tab.id === "KITCHEN") return d.includes("kitchen") || d.includes("food") || r.includes("chef") || r.includes("kitchen") || sid.startsWith("kit");
              if (tab.id === "ACCOUNTING") return d.includes("account") || d.includes("finance") || r.includes("account") || sid.startsWith("acc");
              return false;
            }).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAccountantDeptTab(tab.id)}
                style={{
                  height: "34px",
                  padding: "4px 14px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  transition: "all 0.15s ease",
                  border: active
                    ? `1.5px solid ${tab.activeBorder}`
                    : isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #cbd5e1",
                  background: active
                    ? tab.activeBg
                    : isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
                  color: active ? "#ffffff" : isDark ? "#cbd5e1" : "#475569",
                  boxShadow: active ? tab.activeShadow : "none",
                }}
              >
                <span style={{ fontSize: "14px" }}>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: active ? "rgba(255,255,255,0.28)" : isDark ? "rgba(255,255,255,0.15)" : tab.badgeBg,
                    color: active ? "#ffffff" : isDark ? "#ffffff" : tab.badgeColor,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* REAL DATA TABLE */}
        <div
          style={{
            background: isDark ? "#0f172a" : "#ffffff",
            borderRadius: "18px",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0",
            boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "18px 24px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #eef2f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
              {accountantDeptTab} Staff Salary & Attendance Roster ({accountantFilteredStaff.length} Employees in {org || "Current Branch"})
            </h3>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#6366f1" }}>
              Deduction Rule: Absent Days × ₹1,000
            </span>
          </div>

          <div style={{ overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: "950px", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    background: isDark ? "#1e293b" : "#f8fafc",
                    borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "2px solid #e2e8f0",
                    color: isDark ? "#cbd5e1" : "#475569",
                    fontSize: "12.5px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <th style={{ padding: "14px 18px" }}>Name</th>
                  <th style={{ padding: "14px 16px" }}>Department</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Present</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Absent</th>
                  <th style={{ padding: "14px 16px", textAlign: "center" }}>Leave</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Salary</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Deduction</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Final Salary</th>
                  <th style={{ padding: "14px 18px", textAlign: "center" }}>Pay</th>
                </tr>
              </thead>
              <tbody>
                {accountantFilteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: "32px", textAlign: "center", color: isDark ? "#94a3b8" : "#64748b", fontSize: "14px" }}>
                      {accountantLoading ? "Loading real database records..." : "No employees found for this department in database."}
                    </td>
                  </tr>
                ) : (
                  accountantFilteredStaff.map((emp) => {
                    const sid = String(emp.staff_id || emp.id || "").toLowerCase();
                    const semail = String(emp.email || "").toLowerCase();
                    const sname = String(emp.name || "").toLowerCase();

                    // Real attendance calculations
                    const attRecord = accountantAttendanceMap[sid] || accountantAttendanceMap[semail] || null;
                    const isPresentToday = attRecord && (attRecord.status === "Present" || attRecord.status === "Checked Out" || attRecord.clockIn || attRecord.status === "On Duty");

                    const leaveCount = accountantLeavesMap[sid] || accountantLeavesMap[semail] || (attRecord?.status === "On Leave" ? 1 : 0);
                    const presentCount = isPresentToday ? 1 : (emp.status === "Active" ? 1 : 0);
                    const absentCount = (!isPresentToday && emp.status !== "Active" && leaveCount === 0) ? 1 : 0;

                    // Real Salary & Deduction calculation
                    const baseSalary = typeof emp.salary === "number" && !isNaN(emp.salary)
                      ? emp.salary
                      : Number(String(emp.salary || 0).replace(/[^0-9.-]+/g, "")) || 0;

                    // Fixed deduction rule: Absent Days * 1,000
                    const deduction = absentCount * 1000;
                    const finalSalary = Math.max(0, baseSalary - deduction);

                    // Real Payment Status from DB
                    const payRecord = accountantPayrollMap[sname] || accountantPayrollMap[String(emp.id)];
                    const isPaid = emp.payroll_status === "Paid" || payRecord?.status === "Paid";
                    const isPayingThis = accountantPayingId === (emp.id || emp.staff_id || emp.staffId);

                    return (
                      <tr
                        key={emp.id || emp.staff_id || emp.email}
                        style={{
                          borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* NAME */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {emp.avatar ? (
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "10px",
                                  objectFit: "cover",
                                  border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "10px",
                                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                  color: "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "700",
                                  fontSize: "14px",
                                }}
                              >
                                {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                              </div>
                            )}
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", fontSize: "13.5px" }}>
                                  {emp.name || "N/A"}
                                </span>
                                {attRecord?.clockIn && !attRecord?.clockOut && (
                                  <span
                                    style={{
                                      padding: "1px 6px",
                                      borderRadius: "6px",
                                      fontSize: "10px",
                                      fontWeight: "800",
                                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                      color: "#ffffff",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
                                    📥 In ({attRecord.clockIn})
                                  </span>
                                )}
                                {attRecord?.clockOut && (
                                  <span
                                    style={{
                                      padding: "1px 6px",
                                      borderRadius: "6px",
                                      fontSize: "10px",
                                      fontWeight: "800",
                                      background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
                                      color: "#ffffff",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
                                    📤 Out ({attRecord.clockOut})
                                  </span>
                                )}
                                {leaveCount > 0 && (
                                  <span
                                    style={{
                                      padding: "1px 6px",
                                      borderRadius: "6px",
                                      fontSize: "10px",
                                      fontWeight: "800",
                                      background: "linear-gradient(135deg, #ca8a04 0%, #a16207 100%)",
                                      color: "#ffffff",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                  >
                                    🏖️ Leave
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b", marginTop: "2px" }}>
                                {emp.staff_id || emp.staffId || emp.id || "N/A"} • {emp.org_name || emp.orgName || emp.org || "Branch"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* DEPARTMENT */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: "700",
                              background: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff",
                              color: isDark ? "#a5b4fc" : "#4338ca",
                              border: isDark ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid #e0e7ff",
                            }}
                          >
                            {emp.department || "N/A"}
                          </span>
                        </td>

                        {/* PRESENT */}
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <span
                            style={{
                              padding: "3px 9px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "800",
                              background: isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
                              color: isDark ? "#4ade80" : "#15803d",
                            }}
                          >
                            {presentCount}
                          </span>
                        </td>

                        {/* ABSENT */}
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <span
                            style={{
                              padding: "3px 9px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "800",
                              background: absentCount > 0 ? (isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2") : (isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"),
                              color: absentCount > 0 ? (isDark ? "#f87171" : "#b91c1c") : (isDark ? "#94a3b8" : "#64748b"),
                            }}
                          >
                            {absentCount}
                          </span>
                        </td>

                        {/* LEAVE */}
                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                          <span
                            style={{
                              padding: "3px 9px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "800",
                              background: leaveCount > 0 ? (isDark ? "rgba(234, 179, 8, 0.2)" : "#fef3c7") : (isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"),
                              color: leaveCount > 0 ? (isDark ? "#facc15" : "#b45309") : (isDark ? "#94a3b8" : "#64748b"),
                            }}
                          >
                            {leaveCount}
                          </span>
                        </td>

                        {/* SALARY */}
                        <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
                          {baseSalary > 0 ? `₹${baseSalary.toLocaleString("en-IN")}` : "0"}
                        </td>

                        {/* DEDUCTION */}
                        <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: "700", color: deduction > 0 ? "#ef4444" : (isDark ? "#94a3b8" : "#64748b") }}>
                          {deduction > 0 ? `-₹${deduction.toLocaleString("en-IN")}` : "₹0"}
                        </td>

                        {/* FINAL SALARY */}
                        <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: "800", color: isDark ? "#38bdf8" : "#0284c7", fontSize: "14px" }}>
                          {finalSalary > 0 ? `₹${finalSalary.toLocaleString("en-IN")}` : "0"}
                        </td>

                        {/* PAY ACTION */}
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          {isPaid ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "6px 14px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "800",
                                background: isDark ? "rgba(34, 197, 94, 0.2)" : "#dcfce7",
                                color: isDark ? "#4ade80" : "#15803d",
                                border: isDark ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid #bbf7d0",
                              }}
                            >
                              <FaCheckCircle size={12} /> Paid
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePaySalary(emp)}
                              disabled={isPayingThis}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "8px",
                                border: "none",
                                background: isPayingThis ? "#94a3b8" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: isPayingThis ? "not-allowed" : "pointer",
                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {isPayingThis ? "Processing..." : "Pay Now"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FULL EXECUTIVE EXPORT ROSTER TABLE & AUDIT MODAL */}
        {/* ========================================================================= */}
        {isShareModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.82)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setIsShareModalOpen(false)}
          >
            <div
              style={{
                background: isDark ? "#120a24" : "#ffffff",
                color: isDark ? "#ffffff" : "#0f172a",
                borderRadius: "24px",
                maxWidth: "980px",
                width: "100%",
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: isDark ? "0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(168, 85, 247, 0.35)" : "0 25px 70px rgba(0, 0, 0, 0.25)",
                border: isDark ? "1.5px solid rgba(192, 132, 252, 0.35)" : "1.5px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div
                style={{
                  padding: "18px 24px",
                  background: isDark
                    ? "linear-gradient(135deg, #2e1065 0%, #3b0764 100%)"
                    : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    }}
                  >
                    📊
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "900", color: "#ffffff" }}>
                        Staff Payroll & Attendance Roster Statement
                      </h3>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          background: "rgba(16, 185, 129, 0.25)",
                          color: "#6ee7b7",
                          border: "1px solid rgba(16, 185, 129, 0.4)",
                          padding: "2px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        ✓ Synced to Super Admin
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0 0", fontSize: "11.5px", color: "rgba(233, 213, 255, 0.9)" }}>
                      {org || "Ajmer Branch"} ({orgId || "AJ01"}) • Period: {accountantMonth === "ALL" ? "Whole Year" : "Month " + accountantMonth + "/"} {accountantYear} • Exported on {new Date().toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "none",
                    color: "#ffffff",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* MODAL BODY */}
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* 4 EXECUTIVE KPI STATS CARDS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                  {/* Total Employees */}
                  <div
                    style={{
                      background: isDark ? "rgba(192, 132, 252, 0.08)" : "#faf5ff",
                      border: isDark ? "1px solid rgba(192, 132, 252, 0.2)" : "1px solid #e9d5ff",
                      borderRadius: "14px",
                      padding: "12px 14px",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#d8b4fe" : "#7e22ce" }}>Total Employees</span>
                    <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#ffffff" : "#1e1b4b", margin: "2px 0" }}>
                      {bannerMetrics.totalEmps}
                    </div>
                    <span style={{ fontSize: "10px", color: isDark ? "#c084fc" : "#6b21a8", fontWeight: "600" }}>
                      Active in {org || "Ajmer Branch"}
                    </span>
                  </div>

                  {/* Total Monthly Salary */}
                  <div
                    style={{
                      background: isDark ? "rgba(56, 189, 248, 0.08)" : "#f0f9ff",
                      border: isDark ? "1px solid rgba(56, 189, 248, 0.2)" : "1px solid #bae6fd",
                      borderRadius: "14px",
                      padding: "12px 14px",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#7dd3fc" : "#0284c7" }}>Total Monthly Salary</span>
                    <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#38bdf8" : "#0369a1", margin: "2px 0" }}>
                      ₹{bannerMetrics.totalMonthlySalary.toLocaleString("en-IN")}
                    </div>
                    <span style={{ fontSize: "10px", color: isDark ? "#7dd3fc" : "#0284c7", fontWeight: "600" }}>
                      Gross payroll budget
                    </span>
                  </div>

                  {/* Total Paid Salary */}
                  <div
                    style={{
                      background: isDark ? "rgba(74, 222, 128, 0.08)" : "#f0fdf4",
                      border: isDark ? "1px solid rgba(74, 222, 128, 0.2)" : "1px solid #bbf7d0",
                      borderRadius: "14px",
                      padding: "12px 14px",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#86efac" : "#15803d" }}>Total Paid Salary</span>
                    <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#4ade80" : "#16a34a", margin: "2px 0" }}>
                      ₹{bannerMetrics.totalPaidSalary.toLocaleString("en-IN")}
                    </div>
                    <span style={{ fontSize: "10px", color: isDark ? "#86efac" : "#15803d", fontWeight: "600" }}>
                      Disbursed to staff
                    </span>
                  </div>

                  {/* Total Deductions */}
                  <div
                    style={{
                      background: isDark ? "rgba(248, 113, 113, 0.08)" : "#fef2f2",
                      border: isDark ? "1px solid rgba(248, 113, 113, 0.2)" : "1px solid #fecaca",
                      borderRadius: "14px",
                      padding: "12px 14px",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#fca5a5" : "#b91c1c" }}>Total Deductions</span>
                    <div style={{ fontSize: "20px", fontWeight: "900", color: isDark ? "#f87171" : "#dc2626", margin: "2px 0" }}>
                      ₹{bannerMetrics.totalDeductions.toLocaleString("en-IN")}
                    </div>
                    <span style={{ fontSize: "10px", color: isDark ? "#fca5a5" : "#b91c1c", fontWeight: "600" }}>
                      {bannerMetrics.totalAbsent} absent days (₹1k/day)
                    </span>
                  </div>
                </div>

                {/* DEPARTMENT DISTRIBUTION PILLS */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ padding: "4px 12px", borderRadius: "20px", background: isDark ? "rgba(168, 85, 247, 0.15)" : "#f3e8ff", border: isDark ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid #e9d5ff", fontSize: "12px", fontWeight: "700", color: isDark ? "#d8b4fe" : "#6b21a8" }}>
                    👥 All Employees: <span style={{ fontWeight: "900" }}>{bannerMetrics.totalEmps}</span>
                  </div>
                  <div style={{ padding: "4px 12px", borderRadius: "20px", background: isDark ? "rgba(249, 115, 22, 0.15)" : "#ffedd5", border: isDark ? "1px solid rgba(249, 115, 22, 0.3)" : "1px solid #fed7aa", fontSize: "12px", fontWeight: "700", color: isDark ? "#fdba74" : "#c2410c" }}>
                    🧹 Housekeeping: <span style={{ fontWeight: "900" }}>{getFullExportRosterData().filter((e) => (e.department || "").toLowerCase().includes("housekeep")).length}</span>
                  </div>
                  <div style={{ padding: "4px 12px", borderRadius: "20px", background: isDark ? "rgba(16, 185, 129, 0.15)" : "#d1fae5", border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #a7f3d0", fontSize: "12px", fontWeight: "700", color: isDark ? "#6ee7b7" : "#047857" }}>
                    🍳 Kitchen: <span style={{ fontWeight: "900" }}>{getFullExportRosterData().filter((e) => (e.department || "").toLowerCase().includes("kitchen") || (e.department || "").toLowerCase().includes("food")).length}</span>
                  </div>
                  <div style={{ padding: "4px 12px", borderRadius: "20px", background: isDark ? "rgba(99, 102, 241, 0.15)" : "#e0e7ff", border: isDark ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid #c7d2fe", fontSize: "12px", fontWeight: "700", color: isDark ? "#a5b4fc" : "#4338ca" }}>
                    📊 Accounting: <span style={{ fontWeight: "900" }}>{getFullExportRosterData().filter((e) => (e.department || "").toLowerCase().includes("account") || (e.department || "").toLowerCase().includes("finance")).length}</span>
                  </div>
                </div>

                {/* THE COMPLETE ROSTER STATEMENT TABLE */}
                <div style={{ border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", background: isDark ? "rgba(255, 255, 255, 0.04)" : "#f8fafc", borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                      ALL Staff Salary & Attendance Roster ({bannerMetrics.totalEmps} Employees in {org || "Ajmer Branch"})
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#fca5a5" : "#b91c1c", background: isDark ? "rgba(248, 113, 113, 0.15)" : "#fee2e2", padding: "2px 8px", borderRadius: "6px" }}>
                      Deduction Rule: Absent Days × ₹1,000
                    </span>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#475569", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                          <th style={{ padding: "10px 12px" }}>#</th>
                          <th style={{ padding: "10px 12px" }}>Name & ID</th>
                          <th style={{ padding: "10px 12px" }}>Department</th>
                          <th style={{ padding: "10px 10px", textAlign: "center" }}>Present</th>
                          <th style={{ padding: "10px 10px", textAlign: "center" }}>Absent</th>
                          <th style={{ padding: "10px 10px", textAlign: "center" }}>Leave</th>
                          <th style={{ padding: "10px 12px", textAlign: "right" }}>Base Salary</th>
                          <th style={{ padding: "10px 12px", textAlign: "right" }}>Deduction</th>
                          <th style={{ padding: "10px 12px", textAlign: "right" }}>Final Salary</th>
                          <th style={{ padding: "10px 12px", textAlign: "center" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFullExportRosterData().map((row, idx) => (
                          <tr
                            key={row.id + idx}
                            style={{
                              borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #f1f5f9",
                              background: idx % 2 === 0 ? "transparent" : isDark ? "rgba(255, 255, 255, 0.02)" : "#fafafa",
                            }}
                          >
                            <td style={{ padding: "9px 12px", color: isDark ? "#94a3b8" : "#64748b", fontWeight: "700" }}>{row.srNo}</td>
                            <td style={{ padding: "9px 12px" }}>
                              <div style={{ fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>{row.name}</div>
                              <div style={{ fontSize: "10.5px", color: isDark ? "#94a3b8" : "#64748b" }}>{row.id} • {row.branch}</div>
                            </td>
                            <td style={{ padding: "9px 12px" }}>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  background: row.department.toLowerCase().includes("housekeep")
                                    ? isDark ? "rgba(249, 115, 22, 0.15)" : "#ffedd5"
                                    : row.department.toLowerCase().includes("kitchen")
                                      ? isDark ? "rgba(16, 185, 129, 0.15)" : "#d1fae5"
                                      : isDark ? "rgba(99, 102, 241, 0.15)" : "#e0e7ff",
                                  color: row.department.toLowerCase().includes("housekeep")
                                    ? "#f97316"
                                    : row.department.toLowerCase().includes("kitchen")
                                      ? "#10b981"
                                      : "#6366f1",
                                }}
                              >
                                {row.department}
                              </span>
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: "800", color: "#10b981" }}>{row.present}</td>
                            <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: "800", color: row.absent > 0 ? "#ef4444" : isDark ? "#64748b" : "#94a3b8" }}>{row.absent}</td>
                            <td style={{ padding: "9px 10px", textAlign: "center", fontWeight: "800", color: row.leave > 0 ? "#eab308" : isDark ? "#64748b" : "#94a3b8" }}>{row.leave}</td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "700", color: isDark ? "#cbd5e1" : "#334155" }}>
                              ₹{row.baseSalary.toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "700", color: row.deduction > 0 ? "#ef4444" : isDark ? "#64748b" : "#94a3b8" }}>
                              {row.deduction > 0 ? `-₹${row.deduction.toLocaleString("en-IN")}` : "₹0"}
                            </td>
                            <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: "900", color: isDark ? "#c084fc" : "#7c3aed" }}>
                              ₹{row.finalSalary.toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "9px 12px", textAlign: "center" }}>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "800",
                                  background: row.status === "Paid" ? "#dcfce7" : isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
                                  color: row.status === "Paid" ? "#166534" : isDark ? "#94a3b8" : "#64748b",
                                }}
                              >
                                {row.status === "Paid" ? "✓ Paid" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: isDark ? "rgba(255, 255, 255, 0.08)" : "#f8fafc", fontWeight: "900", borderTop: isDark ? "2px solid rgba(255,255,255,0.15)" : "2px solid #cbd5e1" }}>
                          <td colSpan={6} style={{ padding: "12px 14px", textAlign: "left", fontSize: "12.5px" }}>
                            TOTALS ({bannerMetrics.totalEmps} STAFF MEMBERS)
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "right", fontSize: "12.5px", color: isDark ? "#ffffff" : "#0f172a" }}>
                            ₹{bannerMetrics.totalMonthlySalary.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "right", fontSize: "12.5px", color: bannerMetrics.totalDeductions > 0 ? "#ef4444" : isDark ? "#64748b" : "#94a3b8" }}>
                            ₹{bannerMetrics.totalDeductions.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "right", fontSize: "13px", color: isDark ? "#c084fc" : "#7c3aed" }}>
                            ₹{(bannerMetrics.totalMonthlySalary - bannerMetrics.totalDeductions).toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "12px 12px", textAlign: "center", fontSize: "11.5px", color: "#10b981" }}>
                            {bannerMetrics.totalPaidSalary > 0 ? `₹${bannerMetrics.totalPaidSalary.toLocaleString("en-IN")} Disbursed` : "All Pending"}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* ACTION BUTTONS: DOWNLOAD CSV, COPY SUMMARY, WHATSAPP, PRINT */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleDownloadCSV}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                        color: "#ffffff",
                        fontWeight: "700",
                        fontSize: "12.5px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 3px 10px rgba(2, 132, 199, 0.35)",
                      }}
                    >
                      📥 Download CSV / Excel
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyShareSummary}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "10px",
                        border: "none",
                        background: copiedLink
                          ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                          : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        color: "#ffffff",
                        fontWeight: "700",
                        fontSize: "12.5px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 3px 10px rgba(99, 102, 241, 0.35)",
                      }}
                    >
                      {copiedLink ? <FaCheckCircle /> : <FaCopy />}
                      <span>{copiedLink ? "Copied!" : "Copy Table Summary"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                        color: "#ffffff",
                        fontWeight: "700",
                        fontSize: "12.5px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 3px 10px rgba(37, 211, 102, 0.35)",
                      }}
                    >
                      <FaWhatsapp style={{ fontSize: "14px" }} />
                      <span>Share on WhatsApp</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #cbd5e1",
                        background: isDark ? "rgba(255, 255, 255, 0.08)" : "#f8fafc",
                        color: isDark ? "#ffffff" : "#334155",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FaPrint /> Print Official Statement
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(false)}
                      style={{
                        padding: "9px 20px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
                        color: "#ffffff",
                        fontSize: "12.5px",
                        fontWeight: "800",
                        cursor: "pointer",
                        boxShadow: "0 3px 10px rgba(168, 85, 247, 0.35)",
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* SUPER ADMIN DEDICATED STAFF MANAGEMENT BANNER (PURPLE THEME) */}
      <div
        style={{
          background: isDark
            ? "linear-gradient(135deg, #190d2e 0%, #290d59 50%, #380860 100%)"
            : "linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)",
          borderRadius: "20px",
          padding: "20px 24px",
          marginBottom: "22px",
          border: isDark ? "1px solid rgba(192, 132, 252, 0.35)" : "1px solid rgba(168, 85, 247, 0.4)",
          boxShadow: isDark
            ? "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.25)"
            : "0 12px 28px rgba(107, 33, 168, 0.25)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          color: "#ffffff",
        }}
      >
        {/* TOP ROW: TITLE, BRANCH & ACTION BUTTONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "17px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                👥
              </span>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.2px" }}>
                Staff Management
              </h1>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "rgba(233, 213, 255, 0.9)", fontWeight: "600" }}>
              Manage staff members, roles & permissions for {org || "Ajmer Branch"} ({orgId || "AJ01"})
            </p>
          </div>

          {/* ACTION BUTTONS: SYNC & ADD STAFF */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                syncEmployeesFromBackend(orgId, org).then((res) => {
                  if (res) setList(res);
                  setMsg({ type: "success", text: "Staff database synchronized successfully." });
                });
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(8px)",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
              }}
            >
              🔄 Sync
            </button>
            {hasFullAccess && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#ffffff",
                  color: "#6b21a8",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
                  transition: "all 0.2s ease",
                }}
              >
                <FaUserPlus /> Add Staff Member
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: DEPARTMENT QUICK CARDS INSIDE BANNER */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
          <div
            onClick={() => setDepartmentTab("all")}
            style={{
              background: departmentTab === "all" ? "rgba(255, 255, 255, 0.28)" : "rgba(255, 255, 255, 0.12)",
              border: departmentTab === "all" ? "1.5px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#f3e8ff", textTransform: "uppercase" }}>All Employees</div>
              <div style={{ fontSize: "18px", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>{orgStaff.length}</div>
            </div>
            <span style={{ fontSize: "20px" }}>👥</span>
          </div>

          <div
            onClick={() => setDepartmentTab("housekeeping")}
            style={{
              background: departmentTab === "housekeeping" ? "rgba(249, 115, 22, 0.4)" : "rgba(255, 255, 255, 0.12)",
              border: departmentTab === "housekeeping" ? "1.5px solid #fed7aa" : "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#f3e8ff", textTransform: "uppercase" }}>Housekeeping</div>
              <div style={{ fontSize: "18px", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>{hkStaffList.length}</div>
            </div>
            <span style={{ fontSize: "20px" }}>🧹</span>
          </div>

          <div
            onClick={() => setDepartmentTab("kitchen")}
            style={{
              background: departmentTab === "kitchen" ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.12)",
              border: departmentTab === "kitchen" ? "1.5px solid #a7f3d0" : "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#f3e8ff", textTransform: "uppercase" }}>Kitchen</div>
              <div style={{ fontSize: "18px", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>{kitchenStaffList.length}</div>
            </div>
            <span style={{ fontSize: "20px" }}>🍳</span>
          </div>

          <div
            onClick={() => setDepartmentTab("accounting")}
            style={{
              background: departmentTab === "accounting" ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.12)",
              border: departmentTab === "accounting" ? "1.5px solid #e9d5ff" : "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "12px",
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#f3e8ff", textTransform: "uppercase" }}>Accounting</div>
              <div style={{ fontSize: "18px", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>{accountingStaffList.length}</div>
            </div>
            <span style={{ fontSize: "20px" }}>📊</span>
          </div>
        </div>
      </div>

      {msg && <div className={"message " + msg.type} style={{ marginBottom: "18px" }}>{msg.text}</div>}

      {/* ADD NEW STAFF POPUP MODAL */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: isDark ? "#0f172a" : "#ffffff",
              color: isDark ? "#ffffff" : "#0f172a",
              borderRadius: "24px",
              maxWidth: "560px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: isDark ? "0 25px 60px -12px rgba(0, 0, 0, 0.7)" : "0 25px 60px -12px rgba(0, 0, 0, 0.25)",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: isDark ? "#1e293b" : "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  <FaUserPlus />
                </div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                  Add New Staff Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9",
                  border: "none",
                  color: isDark ? "#94a3b8" : "#64748b",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* MODAL FORM BODY */}
            <form onSubmit={(e) => { submit(e); }} style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Role</label>
                    <select
                      value={form.role}
                      onChange={(e) => changeRole(e.target.value)}
                      disabled={roleOptions.length <= 1}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value} style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Staff ID (auto)</label>
                    <input
                      value={form.id}
                      readOnly
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f5f9",
                        color: isDark ? "#94a3b8" : "#64748b",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={form.name}
                      onChange={(e) => {
                        update("name", e.target.value);
                        if (!form.username) {
                          update("username", e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                        }
                      }}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Username (Login ID) *</label>
                    <input
                      type="text"
                      placeholder="e.g. ramesh.kumar"
                      value={form.username || ""}
                      onChange={(e) => update("username", e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Department *</label>
                    <select
                      value={form.department || "Accounting"}
                      onChange={(e) => {
                        const val = e.target.value;
                        update("department", val);
                        if (val === "Accounting") {
                          update("role", "accountant");
                          if (!form.assigned_area || form.assigned_area.includes("Floor")) update("assigned_area", "Finance & Accounts Office");
                          if (!form.assigned_work || form.assigned_work.includes("Room")) update("assigned_work", "Daily Ledger Balancing & GST Tax Audits");
                          if (!form.shift || form.shift.includes("07:00")) update("shift", "General (09:00 - 18:00)");
                          if (!form.salary) update("salary", "28000");
                        } else if (val === "Housekeeping") {
                          update("role", "housekeeping");
                        } else if (val === "Kitchen") {
                          update("role", "chef");
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      <option value="Accounting">Accounting</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Kitchen">Kitchen</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Shift *</label>
                    <select
                      value={form.shift || "Morning (07:00 - 15:00)"}
                      onChange={(e) => update("shift", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                      <option value="Evening (15:00 - 23:00)">Evening (15:00 - 23:00)</option>
                      <option value="Night (23:00 - 07:00)">Night (23:00 - 07:00)</option>
                      <option value="General (09:00 - 18:00)">General (09:00 - 18:00)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Assigned Area *</label>
                    <input
                      type="text"
                      placeholder="e.g. 1st Floor & Reception"
                      value={form.assigned_area || form.assignedArea || ""}
                      onChange={(e) => { update("assigned_area", e.target.value); update("assignedArea", e.target.value); }}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1.35fr 1.15fr", gap: 12, width: "calc(200% + 14px)" }}>
                      <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block" }}>Salary<input type="number" min="0" value={form.salary || ""} onChange={(e) => update("salary", e.target.value)} placeholder="Monthly salary" style={{ width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: isDark ? "1px solid rgba(255,255,255,.15)" : "1px solid #cbd5e1", fontSize: "13.5px", fontFamily: "inherit", outline: "none", background: isDark ? "rgba(255,255,255,.06)" : "#fff", color: isDark ? "#fff" : "#0f172a" }} /></label>
                      <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block" }}>Joining date<input ref={joiningDateRef} type="date" value={form.joining_date || ""} onClick={() => joiningDateRef.current?.showPicker?.()} onChange={(e) => { update("joining_date", e.target.value); update("joiningDate", e.target.value); }} style={{ width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: isDark ? "1px solid rgba(255,255,255,.15)" : "1px solid #cbd5e1", fontSize: "13.5px", fontFamily: "inherit", outline: "none", background: isDark ? "rgba(255,255,255,.06)" : "#fff", color: isDark ? "#fff" : "#0f172a", cursor: "pointer" }} /></label>
                      <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block" }}>Status *<select value={form.status || "Active"} onChange={(e) => update("status", e.target.value)} style={{ width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, border: isDark ? "1px solid rgba(255,255,255,.15)" : "1px solid #cbd5e1", fontSize: "13.5px", outline: "none", background: isDark ? "#1e293b" : "#fff", color: isDark ? "#fff" : "#0f172a" }}><option value="Active">Active</option><option value="On Leave">On Leave</option><option value="Inactive">Inactive</option></select></label>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Work Status *</label>
                    <select
                      value={form.work_status || form.workStatus || "On Duty"}
                      onChange={(e) => { update("work_status", e.target.value); update("workStatus", e.target.value); }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      <option value="On Duty">On Duty</option>
                      <option value="Off Duty">Off Duty</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="staff@hotel.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Login Password *</label>
                    <div style={{ position: "relative" }}><input type={showPassword ? "text" : "password"} placeholder="Minimum 6 characters" value={form.password || ""} onChange={(e) => update("password", e.target.value)} minLength={6} required autoComplete="new-password" style={{ width: "100%", padding: "10px 42px 10px 14px", borderRadius: "10px", border: isDark ? "1px solid rgba(255,255,255,.15)" : "1px solid #cbd5e1", fontSize: "13.5px", outline: "none", background: isDark ? "rgba(255,255,255,.06)" : "#fff", color: isDark ? "#fff" : "#0f172a" }} /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", color: "#64748b", cursor: "pointer" }}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      outline: "none",
                      background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Profile Photo (Upload File or Image URL)</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    {form.avatar ? (
                      <img
                        src={form.avatar}
                        alt="Preview"
                        style={{ width: "44px", height: "44px", borderRadius: "12px", objectFit: "cover", border: isDark ? "2px solid rgba(255, 255, 255, 0.2)" : "2px solid #cbd5e1" }}
                      />
                    ) : (
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                        <FaCamera style={{ fontSize: "18px" }} />
                      </div>
                    )}

                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "9px 16px",
                        borderRadius: "10px",
                        background: isDark ? "rgba(102, 126, 234, 0.2)" : "rgba(102, 126, 234, 0.12)",
                        color: "#667eea",
                        fontWeight: "700",
                        fontSize: "12.5px",
                        cursor: "pointer",
                      }}
                    >
                      <FaUpload /> Select Image File
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleImageFileUpload(e, (url) => update("avatar", url))}
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Or paste Image URL (https://...)"
                      value={form.avatar || ""}
                      onChange={(e) => update("avatar", e.target.value)}
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                        minWidth: "160px",
                        background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #cbd5e1",
                    background: isDark ? "rgba(255, 255, 255, 0.08)" : "#f8fafc",
                    color: isDark ? "#e2e8f0" : "#334155",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#ffffff", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)" }}
                >
                  <FaUserPlus /> Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF MEMBERS CONTAINER PANEL */}
      <section className="panel" style={{ padding: "28px", borderRadius: "20px", background: isDark ? "#0f172a" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <h2 className="emp-section-heading" style={{ fontSize: "18px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", margin: 0 }}>
            {isAdmin ? `All Active Staff in ${org || "this organization"}` : "Staff Members"} ({displayedStaff.length})
          </h2>

          {/* ICON-ONLY LIST / GRID VIEW TOGGLE SWITCH */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <FaThLarge />
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <FaList />
            </button>
          </div>
        </div>

        {/* QUICK DEPARTMENT FILTER TABS & SEARCH */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginBottom: "22px", paddingBottom: "16px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
          {[
            {
              id: "all",
              label: "All Employees",
              count: orgStaff.length,
              icon: "👥",
              activeBg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              activeBorder: "#6366f1",
              shadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            },
            {
              id: "housekeeping",
              label: "Housekeeping",
              count: hkStaffList.length,
              icon: "🧹",
              activeBg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              activeBorder: "#f97316",
              shadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
            },
            {
              id: "kitchen",
              label: "Kitchen",
              count: kitchenStaffList.length,
              icon: "🍳",
              activeBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              activeBorder: "#10b981",
              shadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
            },
            {
              id: "accounting",
              label: "Accounting",
              count: accountingStaffList.length,
              icon: "📊",
              activeBg: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              activeBorder: "#8b5cf6",
              shadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
            },
          ].map((tab) => {
            const active = departmentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDepartmentTab(tab.id)}
                style={{
                  height: "38px",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: active
                    ? `1.5px solid ${tab.activeBorder}`
                    : isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #cbd5e1",
                  background: active
                    ? tab.activeBg
                    : isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
                  color: active ? "#ffffff" : isDark ? "#cbd5e1" : "#475569",
                  boxShadow: active ? tab.shadow : "none",
                  transform: active ? "translateY(-1px)" : "none",
                }}
              >
                <span style={{ fontSize: "14px" }}>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: active
                      ? "rgba(255,255,255,0.25)"
                      : isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0",
                    color: active ? "#ffffff" : isDark ? "#ffffff" : "#1e293b",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <FaSearch style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "12px" }} />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "7px 12px 7px 30px",
                  borderRadius: "999px",
                  border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                  fontSize: "12.5px",
                  outline: "none",
                  background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                  color: isDark ? "#ffffff" : "#0f172a",
                  width: "180px",
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                syncEmployeesFromBackend(orgId, org).then((res) => {
                  if (res) setList(res);
                  setMsg({ type: "success", text: "Staff database synchronized successfully." });
                });
              }}
              title="Sync staff from backend MySQL"
              style={{
                height: "34px",
                padding: "4px 12px",
                borderRadius: "999px",
                border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                background: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                color: isDark ? "#cbd5e1" : "#475569",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              🔄 Sync
            </button>
          </div>
        </div>

        {displayedStaff.length === 0 ? (
          <p className="page-sub">No staff members found in this view.</p>
        ) : viewMode === "list" ? (
          /* TABLE LIST VIEW WITH HORIZONTAL SCROLLBAR */
          <div style={{ overflowX: "auto", width: "100%", paddingBottom: "12px", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: "1150px", borderCollapse: "separate", borderSpacing: "0 8px" }}>
              <thead>
                <tr style={{ color: "#64748b", fontSize: "12px", textAlign: "left", whiteSpace: "nowrap" }}>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Staff Member</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Staff ID & Username</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Login Password</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Role & Dept</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Shift</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Assigned Duty & Area</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Work Status</th>
                  <th style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedStaff.map((e) => (
                  <tr
                    key={e.id || e.staff_id}
                    className="emp-table-row"
                    style={{
                      background: isDark ? "#1e293b" : "#ffffff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                      borderRadius: "12px",
                      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #eef2f6",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", whiteSpace: "nowrap" }}>
                        {e.avatar ? (
                          <img
                            src={e.avatar}
                            alt={e.name}
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "10px",
                              objectFit: "cover",
                              border: isDark ? "1px solid rgba(255,255,255,0.2)" : "1px solid #cbd5e1",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "10px",
                              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              fontWeight: "700",
                              flexShrink: 0,
                            }}
                          >
                            <FaUserTie />
                          </div>
                        )}
                        <div>
                          <div className="emp-staff-name" style={{ fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", fontSize: "14px", whiteSpace: "nowrap" }}>
                            {e.name}
                          </div>
                          <div style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b", whiteSpace: "nowrap" }}>
                            {e.phone ? `📞 ${e.phone}` : e.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span className="emp-id-text" style={{ fontSize: "12px", fontWeight: "800", color: "#6366f1", whiteSpace: "nowrap" }}>
                          {e.staff_id || e.staffId || e.id}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: "600", color: isDark ? "#a5b4fc" : "#4338ca", whiteSpace: "nowrap" }}>
                          @{getStaffUsername(e)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                      <code
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          fontFamily: "monospace",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                          color: isDark ? "#38bdf8" : "#0284c7",
                          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1",
                        }}
                      >
                        {getStaffPassword(e)}
                      </code>
                    </td>
                    <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <span
                          className="emp-role-badge"
                          style={{
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: "#e0e7ff",
                            color: "#4338ca",
                            whiteSpace: "nowrap",
                            display: "inline-block",
                            width: "fit-content",
                          }}
                        >
                          {ROLES[e.role]?.label || e.role}
                        </span>
                        <span style={{ fontSize: "11.5px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>
                          {e.department}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", color: isDark ? "#cbd5e1" : "#475569", whiteSpace: "nowrap" }}>
                        {e.shift || "Morning (07:00 - 15:00)"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 14px", maxWidth: "260px" }}>
                      <div style={{ fontSize: "12px", color: isDark ? "#f1f5f9" : "#1e293b", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.assigned_work || e.assignedWork}>
                        {e.assigned_work || e.assignedWork || defaultWorkByRole(e.role)}
                      </div>
                      <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📍 {e.assigned_area || e.assignedArea || defaultAreaByRole(e.role)}
                      </div>
                    </td>
                    <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                      {(() => {
                        const sid = String(e.id || e.staff_id || "").toLowerCase();
                        const semail = String(e.email || "").toLowerCase();
                        const att = adminAttendanceMap[sid] || adminAttendanceMap[semail] || null;
                        const isCheckedIn = att && (att.status === "Present" || att.status === "On Duty" || (att.clockIn && !att.clockOut));
                        const isCheckedOut = att && (att.status === "Checked Out" || att.clockOut);

                        if (isCheckedIn) {
                          return (
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "11.5px",
                                fontWeight: "800",
                                whiteSpace: "nowrap",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#dcfce7",
                                color: "#15803d",
                                border: "1px solid #86efac",
                              }}
                            >
                              <span>📥</span>
                              <span>In {att?.clockIn ? `(${att.clockIn.slice(0, 5)})` : ""}</span>
                            </span>
                          );
                        }
                        if (isCheckedOut) {
                          return (
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "11.5px",
                                fontWeight: "800",
                                whiteSpace: "nowrap",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#fff7ed",
                                color: "#c2410c",
                                border: "1px solid #fed7aa",
                              }}
                            >
                              <span>📤</span>
                              <span>Out {att?.clockOut ? `(${att.clockOut.slice(0, 5)})` : ""}</span>
                            </span>
                          );
                        }
                        return (
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              whiteSpace: "nowrap",
                              display: "inline-block",
                              background:
                                (e.work_status || e.workStatus) === "On Duty" ? "#dcfce7" :
                                  (e.work_status || e.workStatus) === "In Meeting" ? "#f3e8ff" :
                                    (e.work_status || e.workStatus) === "Assigned Task" ? "#e0f2fe" :
                                      (e.work_status || e.workStatus) === "On Break" ? "#fef3c7" : "#f1f5f9",
                              color:
                                (e.work_status || e.workStatus) === "On Duty" ? "#15803d" :
                                  (e.work_status || e.workStatus) === "In Meeting" ? "#7e22ce" :
                                    (e.work_status || e.workStatus) === "Assigned Task" ? "#0369a1" :
                                      (e.work_status || e.workStatus) === "On Break" ? "#b45309" : "#64748b",
                            }}
                          >
                            {e.work_status || e.workStatus || "Not Checked In"}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                      {(() => {
                        const sid = String(e.id || e.staff_id || "").toLowerCase();
                        const semail = String(e.email || "").toLowerCase();
                        const att = adminAttendanceMap[sid] || adminAttendanceMap[semail] || null;
                        const leaves = adminLeavesMap[sid] || adminLeavesMap[semail] || 0;
                        const isOnLeave = leaves > 0 || att?.status === "On Leave" || e.status === "On Leave";

                        if (isOnLeave) {
                          return (
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "11.5px",
                                fontWeight: "800",
                                whiteSpace: "nowrap",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#fefce8",
                                color: "#854d0e",
                                border: "1px solid #fef08a",
                              }}
                            >
                              <span>🏖️</span> On Leave
                            </span>
                          );
                        }

                        return (
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "11.5px",
                              fontWeight: "700",
                              whiteSpace: "nowrap",
                              display: "inline-block",
                              background: e.status === "Active" ? "#ecfdf5" : "#fef2f2",
                              color: e.status === "Active" ? "#047857" : "#b91c1c",
                            }}
                          >
                            {e.status || "Active"}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                      {hasFullAccess && (
                        <RowActions
                          items={[
                            { label: "Edit Staff", onClick: () => openEditModal(e) },
                            { label: "Delete Staff", danger: true, onClick: () => remove(e.id) },
                          ]}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARD GRID VIEW WITH SEQUENTIAL 3D FLIP ANIMATION */
          <>
            <style>{`
              @keyframes flipCard3DStaff {
                0% {
                  opacity: 0;
                  transform: perspective(900px) rotateY(90deg) scale(0.92);
                }
                60% {
                  transform: perspective(900px) rotateY(-10deg) scale(1.02);
                }
                100% {
                  opacity: 1;
                  transform: perspective(900px) rotateY(0deg) scale(1);
                }
              }
              .staff-flip-card {
                animation: flipCard3DStaff 0.75s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                backface-visibility: hidden;
                will-change: transform, opacity;
              }
            `}</style>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {displayedStaff.map((e, idx) => (
                <div
                  key={e.id}
                  className="emp-grid-card staff-flip-card"
                  style={{
                    animationDelay: `${idx * 0.12}s`,
                    opacity: 0,
                    background: isDark ? "#1e293b" : "#ffffff",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #eef2f6",
                    borderRadius: "18px",
                    padding: "20px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {e.avatar ? (
                      <img
                        src={e.avatar}
                        alt={e.name}
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          objectFit: "cover",
                          border: isDark ? "2px solid rgba(255, 255, 255, 0.2)" : "2px solid #e2e8f0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "14px",
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: "700",
                        }}
                      >
                        <FaUserTie />
                      </div>
                    )}

                    <div>
                      <h3 className="emp-staff-name" style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
                        {e.name}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                        <span
                          className="emp-role-badge"
                          style={{
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: "#fff7ed",
                            color: "#ea580c",
                            display: "inline-block",
                          }}
                        >
                          {ROLES[e.role]?.label || e.role}
                        </span>
                        <span
                          className="emp-dept-badge"
                          style={{
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: isDark ? "rgba(14, 165, 233, 0.2)" : "#e0f2fe",
                            color: isDark ? "#38bdf8" : "#0369a1",
                            border: isDark ? "1px solid rgba(14, 165, 233, 0.3)" : "1px solid #bae6fd",
                            display: "inline-block",
                          }}
                        >
                          {e.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="emp-id-text" style={{ fontSize: "12px", color: "#6366f1", fontWeight: "800" }}>
                    {e.staff_id || e.id}
                  </span>
                </div>

                {/* LOGIN CREDENTIALS BADGE */}
                <div
                  style={{
                    background: isDark ? "rgba(99, 102, 241, 0.12)" : "#f5f3ff",
                    border: isDark ? "1px solid rgba(99, 102, 241, 0.25)" : "1px solid #ddd6fe",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ fontWeight: "700", color: isDark ? "#c7d2fe" : "#5b21b6" }}>
                    👤 @{getStaffUsername(e)}
                  </span>
                  <span style={{ fontFamily: "monospace", fontWeight: "700", color: isDark ? "#a7f3d0" : "#047857" }}>
                    🔑 {getStaffPassword(e)}
                  </span>
                </div>

                {/* DUTY & AREA */}
                <div style={{ fontSize: "12px", color: isDark ? "#cbd5e1" : "#475569" }}>
                  <div style={{ fontWeight: "600", color: isDark ? "#f1f5f9" : "#1e293b", marginBottom: "3px" }}>
                    📋 {e.assigned_work || e.assignedWork || defaultWorkByRole(e.role)}
                  </div>
                  <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
                    📍 {e.assigned_area || e.assignedArea || defaultAreaByRole(e.role)} • {e.shift || "Morning"}
                  </div>
                </div>

                <div
                  className="emp-info-box"
                  style={{
                    background: isDark ? "#0f172a" : "#f8fafc",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #f1f5f9",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "12px",
                    color: isDark ? "#cbd5e1" : "#475569",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaEnvelope style={{ color: "#94a3b8" }} /> {e.email}
                    </div>
                    {(() => {
                      const sid = String(e.id || e.staff_id || "").toLowerCase();
                      const semail = String(e.email || "").toLowerCase();
                      const att = adminAttendanceMap[sid] || adminAttendanceMap[semail] || null;
                      const leaves = adminLeavesMap[sid] || adminLeavesMap[semail] || 0;
                      const isCheckedIn = att && (att.status === "Present" || att.status === "On Duty" || (att.clockIn && !att.clockOut));
                      const isCheckedOut = att && (att.status === "Checked Out" || att.clockOut);
                      const isOnLeave = leaves > 0 || att?.status === "On Leave" || e.status === "On Leave";

                      if (isOnLeave) {
                        return (
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "10.5px",
                              fontWeight: "800",
                              background: isDark ? "rgba(202, 138, 4, 0.2)" : "#fefce8",
                              color: isDark ? "#fde047" : "#854d0e",
                              border: "1px solid #fef08a",
                            }}
                          >
                            🏖️ Leave
                          </span>
                        );
                      }

                      if (isCheckedIn) {
                        return (
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "10.5px",
                              fontWeight: "800",
                              background: isDark ? "rgba(34, 197, 94, 0.2)" : "#dcfce7",
                              color: isDark ? "#4ade80" : "#15803d",
                              border: "1px solid #86efac",
                            }}
                          >
                            📥 In {att?.clockIn ? `(${att.clockIn.slice(0, 5)})` : ""}
                          </span>
                        );
                      }

                      if (isCheckedOut) {
                        return (
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "10.5px",
                              fontWeight: "800",
                              background: isDark ? "rgba(234, 88, 12, 0.2)" : "#fff7ed",
                              color: isDark ? "#fb923c" : "#c2410c",
                              border: "1px solid #fed7aa",
                            }}
                          >
                            📤 Out {att?.clockOut ? `(${att.clockOut.slice(0, 5)})` : ""}
                          </span>
                        );
                      }

                      return (
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "10.5px",
                            fontWeight: "700",
                            background: (e.work_status || e.workStatus) === "Off Duty" ? (isDark ? "rgba(239, 68, 68, 0.2)" : "#fef2f2") : (isDark ? "rgba(34, 197, 94, 0.2)" : "#dcfce7"),
                            color: (e.work_status || e.workStatus) === "Off Duty" ? "#ef4444" : "#15803d",
                          }}
                        >
                          {(e.work_status || e.workStatus) === "Off Duty" ? "Off Duty" : "On Duty"}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaPhoneAlt style={{ color: "#94a3b8" }} /> {e.phone || "N/A"}
                  </div>
                </div>

                {hasFullAccess && (
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "6px", borderTop: "none" }}>
                    <RowActions
                      items={[
                        { label: "Edit Staff", onClick: () => openEditModal(e) },
                        { label: "Delete Staff", danger: true, onClick: () => remove(e.id) },
                      ]}
                    />
                  </div>
                )}
              </div>
            ))}
            </div>
          </>
        )}
      </section>

      {/* EDIT STAFF POPUP MODAL */}
      {editModalEmp && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="ota-modal-card"
            style={{
              borderRadius: "20px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "26px 30px",
              boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6)" : "0 20px 40px rgba(0,0,0,0.25)",
              animation: "modalFadeIn 0.2s ease-out",
              background: isDark ? "#0f172a" : "#ffffff",
              color: isDark ? "#ffffff" : "#0f172a",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h2 className="ota-modal-title" style={{ margin: 0, fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", color: isDark ? "#ffffff" : "#0f172a" }}>
                  <FaUserTie style={{ color: "#667eea" }} /> Edit Staff Member
                </h2>
                <span style={{ fontSize: "12.5px", opacity: 0.75, color: isDark ? "#94a3b8" : "inherit" }}>
                  Staff ID: <strong style={{ color: "#667eea" }}>{editModalEmp.id}</strong>
                </span>
              </div>
              <button
                type="button"
                className="ota-modal-close-btn"
                onClick={() => setEditModalEmp(null)}
                style={{
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: isDark ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9",
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={saveEditModal}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Full Name *</label>
                    <input
                      type="text"
                      value={editModalEmp.name || ""}
                      onChange={(e) => setEditModalEmp({ ...editModalEmp, name: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Department *</label>
                    <select
                      value={editModalEmp.department || "Housekeeping"}
                      onChange={(e) => setEditModalEmp({ ...editModalEmp, department: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Accounting">Accounting</option>
                    </select>
                  </div>
                </div>

                {/* LOGIN CREDENTIALS SECTION (USERNAME & PASSWORD) */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "14px",
                    background: isDark ? "rgba(99, 102, 241, 0.12)" : "#f5f3ff",
                    border: isDark ? "1px solid rgba(99, 102, 241, 0.28)" : "1px solid #ddd6fe",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "800", color: "#6366f1" }}>
                      <FaLock /> Staff Login Credentials ({editModalEmp.org || org || "Current Branch"})
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: isDark ? "rgba(34, 197, 94, 0.2)" : "#dcfce7",
                        color: "#16a34a",
                      }}
                    >
                      Login Active
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "5px" }}>
                        Username (Login ID) *
                      </label>
                      <input
                        type="text"
                        value={editModalEmp.username || ""}
                        onChange={(e) => setEditModalEmp({ ...editModalEmp, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "") })}
                        placeholder="e.g. sunita.devi"
                        required
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                          fontSize: "13px",
                          fontWeight: "700",
                          outline: "none",
                          background: isDark ? "#1e293b" : "#ffffff",
                          color: isDark ? "#ffffff" : "#0f172a",
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                        <label style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>
                          Password (Login Password) *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#6366f1",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {showEditPassword ? <><FaEyeSlash /> Hide</> : <><FaEye /> Show</>}
                        </button>
                      </div>
                      <div style={{ position: "relative" }}>
                        <input
                          type={showEditPassword ? "text" : "password"}
                          value={editModalEmp.password || ""}
                          onChange={(e) => setEditModalEmp({ ...editModalEmp, password: e.target.value })}
                          placeholder="Password"
                          required
                          style={{
                            width: "100%",
                            padding: "10px 36px 10px 12px",
                            borderRadius: "10px",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                            fontSize: "13px",
                            fontWeight: "700",
                            outline: "none",
                            background: isDark ? "#1e293b" : "#ffffff",
                            color: isDark ? "#ffffff" : "#0f172a",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {showEditPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b" }}>
                    💡 <strong>Default branch password:</strong> <code style={{ color: "#6366f1", fontWeight: "700" }}>{getStaffPassword(editModalEmp)}</code> • Staff can sign in using their username, staff ID ({editModalEmp.id || editModalEmp.staff_id}), or email address.
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Work Status *</label>
                    <select
                      value={editModalEmp.work_status || editModalEmp.workStatus || "On Duty"}
                      onChange={(e) => setEditModalEmp({ ...editModalEmp, work_status: e.target.value, workStatus: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      <option value="On Duty">On Duty</option>
                      <option value="Off Duty">Off Duty</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Role *</label>
                    <select
                      value={editModalEmp.role || "housekeeping"}
                      onChange={(e) => setEditModalEmp({ ...editModalEmp, role: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value} style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Email Address</label>
                  <input
                    type="email"
                    value={editModalEmp.email || ""}
                    onChange={(e) => setEditModalEmp({ ...editModalEmp, email: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      outline: "none",
                      background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Mobile Number (10 digits)</label>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <select
                      value={editModalEmp.countryCode || "+91"}
                      onChange={(e) => setEditModalEmp({ ...editModalEmp, countryCode: e.target.value })}
                      style={{
                        padding: "10px 8px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13px",
                        fontWeight: "700",
                        outline: "none",
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    >
                      <option value="+91" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>🇮🇳 +91</option>
                      <option value="+1" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>🇺🇸 +1</option>
                      <option value="+44" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>🇬🇧 +44</option>
                      <option value="+971" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>🇦🇪 +971</option>
                      <option value="+61" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>🇦🇺 +61</option>
                      <option value="+65" style={{ background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a" }}>🇸🇬 +65</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={(editModalEmp.phone || "").replace(/^\+\d+\s*/, "")}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        const code = editModalEmp.countryCode || "+91";
                        setEditModalEmp({ ...editModalEmp, phone: digits ? `${code} ${digits}` : "" });
                      }}
                      style={{
                        flex: 1,
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        outline: "none",
                        background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "6px" }}>Profile Photo (Upload File or Image URL)</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    {editModalEmp.avatar ? (
                      <img
                        src={editModalEmp.avatar}
                        alt="Preview"
                        style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", border: isDark ? "2px solid rgba(255, 255, 255, 0.2)" : "2px solid #cbd5e1" }}
                      />
                    ) : (
                      <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                        <FaCamera style={{ fontSize: "16px" }} />
                      </div>
                    )}

                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: isDark ? "rgba(102, 126, 234, 0.2)" : "rgba(102, 126, 234, 0.12)",
                        color: "#667eea",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      <FaUpload /> Choose Image File
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleImageFileUpload(e, (url) => setEditModalEmp({ ...editModalEmp, avatar: url }))}
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Or paste Image URL (https://...)"
                      value={editModalEmp.avatar || ""}
                      onChange={(e) => setEditModalEmp({ ...editModalEmp, avatar: e.target.value })}
                      style={{
                        flex: 1,
                        padding: "9px 12px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                        minWidth: "160px",
                        background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setEditModalEmp(null)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "10px",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #cbd5e1",
                    background: isDark ? "rgba(255, 255, 255, 0.08)" : "#f8fafc",
                    color: isDark ? "#e2e8f0" : "#334155",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "10px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#ffffff", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 14px rgba(102, 126, 234, 0.4)" }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
