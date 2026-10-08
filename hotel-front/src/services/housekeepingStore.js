import { addNotification } from "./notificationStore.js";
import { getCurrentOrgId, getCurrentOrg, getAuthHeaders, getUserName, getUserRole, getUserEmail } from "../auth.js";

const API_BASE = "http://localhost:4000/api/housekeeping";
const STAFF_API_BASE = "http://localhost:4000/api/staff";

// BroadcastChannels for real-time multi-tab synchronization
const hkChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("hk_tasks_updated") : null;
const attendanceChannel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("staff_attendance_updated") : null;

import { initialHkTasks as defaultInitialTasks } from "../data/dummyData/housekeepingData.js";

// Housekeeping task records with robust default initial tasks
export const initialHkTasks = Array.isArray(defaultInitialTasks) && defaultInitialTasks.length > 0 ? defaultInitialTasks : [];

const LOCAL_STORAGE_KEY = "luxury_pms_housekeeping_tasks";
const ATTENDANCE_STORAGE_KEY = "luxury_pms_staff_attendance";
const LEAVES_STORAGE_KEY = "luxury_pms_staff_leaves";

function getLocalTasks() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialHkTasks));
  return initialHkTasks;
}

function saveLocalTasks(tasks) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) { }
}

export function getHkTasks() {
  return getLocalTasks();
}

function broadcastHkUpdate(action, task = null, message = null) {
  window.dispatchEvent(
    new CustomEvent("hk_tasks_changed", {
      detail: { action, task, message },
    })
  );
  if (hkChannel) {
    try {
      hkChannel.postMessage({ action, task, message, timestamp: Date.now() });
    } catch (e) { }
  }
}

function broadcastAttendanceUpdate(action, data = null, message = null) {
  window.dispatchEvent(
    new CustomEvent("staff_attendance_changed", {
      detail: { action, data, message },
    })
  );
  if (attendanceChannel) {
    try {
      attendanceChannel.postMessage({ action, data, message, timestamp: Date.now() });
    } catch (e) { }
  }
}

// ----------------------------------------------------------------------------------
// HOUSEKEEPING TASKS API
// ----------------------------------------------------------------------------------

export async function fetchHkTasksFromAPI(filters = {}) {
  try {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      // Fallback to local storage if no auth token is available
      const tasks = getLocalTasks();
      return { tasks, metrics: computeHkMetrics(tasks) };
    }

    const orgId = filters.orgId || getCurrentOrgId();
    const query = new URLSearchParams();
    if (orgId) query.set("org_id", orgId);
    if (filters.floor && filters.floor !== "All Floors" && filters.floor !== "All") query.set("floor", filters.floor);
    if (filters.shift && filters.shift !== "All Shifts" && filters.shift !== "All") query.set("shift", filters.shift);
    if (filters.priority && filters.priority !== "All") query.set("priority", filters.priority);
    if (filters.status && filters.status !== "All") query.set("status", filters.status);
    if (filters.search) query.set("search", filters.search);

    const res = await fetch(`${API_BASE}/tasks?${query.toString()}`, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        saveLocalTasks(data.tasks);
        return { tasks: data.tasks, metrics: data.metrics };
      }
    }
  } catch (err) {
    console.warn("Backend API offline for fetchHkTasks, falling back to local cache:", err);
  }

  // Fallback to local storage
  const tasks = getLocalTasks();
  return { tasks, metrics: computeHkMetrics(tasks) };
}

export function computeHkMetrics(tasks = []) {
  const total = tasks.length;
  const clean = tasks.filter(
    (t) => t.status === "Cleaned & Approved" || (t.approvalStatus && t.approvalStatus.includes("Approved"))
  ).length;
  const inProgress = tasks.filter(
    (t) => t.status === "Cleaning" || t.status === "In Progress"
  ).length;
  const dirty = tasks.filter(
    (t) => t.status === "Dirty" || t.status === "Assigned" || t.status === "Needs Cleaning"
  ).length;
  const pendingApprovals = tasks.filter(
    (t) => t.status === "Photo Uploaded" || (t.approvalStatus && t.approvalStatus.includes("Pending"))
  ).length;
  const rescheduled = tasks.filter(
    (t) => t.status === "Re-cleaning Scheduled" || t.status === "Rescheduled"
  ).length;

  return {
    totalRooms: total,
    cleanCount: clean,
    cleanPercent: total > 0 ? Math.round((clean / total) * 100) : 0,
    inProgressCount: inProgress,
    dirtyCount: dirty,
    pendingApprovals,
    rescheduledCount: rescheduled,
    staffOnDuty: 4, // updated from attendance roster
  };
}

export async function addHkTask(taskData) {
  const orgId = getCurrentOrgId();
  const token = sessionStorage.getItem("authToken");
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskData, orgId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          const local = getLocalTasks();
          const updated = [data.task, ...local.filter((t) => t.id !== data.task.id)];
          saveLocalTasks(updated);
          broadcastHkUpdate("TASK_CREATED", data.task, `✨ Room ${data.task.room} cleaning task created!`);
          return data.task;
        }
      }
    } catch (e) {
      console.warn("Backend offline for addHkTask, using local state:", e);
    }
  }

  // Local creation fallback
  const newTask = {
    id: `HK-${Date.now().toString().slice(-4)}`,
    floor: taskData.floor || "1st Floor",
    room: taskData.room || "Room 101",
    roomType: taskData.roomType || "Standard Room",
    task: taskData.task || "Full Sanitize & Turnover",
    cleaningType: taskData.cleaningType || "Check-Out Turnover",
    shift: taskData.shift || "Morning",
    priority: taskData.priority || "Normal",
    status: taskData.staff && taskData.staff !== "Unassigned" ? "Assigned" : "Dirty",
    progress: 0,
    staff: taskData.staff || "Unassigned",
    staffId: taskData.staffId || "",
    staffEmail: taskData.staffEmail || "",
    assignedTime: taskData.assignedTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    lastCleaned: "Awaiting Cleaning",
    photoProofs: taskData.photoProofUrl ? [taskData.photoProofUrl] : [],
    photoProofUrl: taskData.photoProofUrl || "",
    approvalStatus: "Not Submitted",
    icon: "🛏️",
    statusBg: "rgba(99, 102, 241, 0.12)",
    statusColor: "#6366f1",
  };
  const list = [newTask, ...getLocalTasks()];
  saveLocalTasks(list);
  broadcastHkUpdate("TASK_CREATED", newTask, `✨ Room ${newTask.room} task created & assigned!`);
  return newTask;
}

export async function startHkTask(taskId, staffName = "Housekeeping Staff") {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/start`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ staffName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.task) {
          updateLocalTask(data.task);
          broadcastHkUpdate("TASK_STARTED", data.task, `⏳ Room ${data.task.room} cleaning started by ${staffName}`);
          return data.task;
        }
      }
    } catch (e) {
      console.warn("Backend offline for startHkTask, updating local state:", e);
    }
  }

  // Local fallback
  const tasks = getLocalTasks();
  const index = tasks.findIndex((t) => String(t.id) === String(taskId));
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      status: "Cleaning",
      progress: 40,
      startedAt: new Date().toISOString(),
      approvalStatus: "Cleaning In Progress",
      statusBg: "rgba(245, 158, 11, 0.12)",
      statusColor: "#f59e0b",
      icon: "🧼",
    };
    saveLocalTasks(tasks);
    broadcastHkUpdate("TASK_STARTED", tasks[index], `⏳ Room ${tasks[index].room} cleaning started!`);
    return tasks[index];
  }
}

export async function uploadHkPhotoProofMulti(taskId, {
  photos = [],
  remarks = "",
  durationMinutes = 30,
  staffName = "Housekeeping Staff",
  staffEmail = "",
  staffId = "",
  orgId = "",
  orgName = "",
}) {
  const photoList = Array.isArray(photos) ? photos : [photos];
  const primaryUrl = photoList[0] || "";
  const effectiveOrgId = orgId || getCurrentOrgId() || "MA330";
  const effectiveOrgName = orgName || getCurrentOrg() || "Matcha Tea";

  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/upload-proof`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        photoUrl: primaryUrl,
        photos: photoList,
        remarks,
        durationMinutes,
        staffName,
        staffEmail,
        staffId,
        orgId: effectiveOrgId,
        orgName: effectiveOrgName,
        org_id: effectiveOrgId,
        org_name: effectiveOrgName,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.task) {
        updateLocalTask(data.task);
        broadcastHkUpdate("PHOTO_UPLOADED", data.task, `📸 Room ${data.task.room} proof photos uploaded!`);
        addNotification({
          taskId: data.task.id,
          isHkApproval: true,
          room: data.task.room,
          user: `${staffName} (Housekeeping)`,
          action: "uploaded photo proof of sanitization",
          target: data.task.room,
          message: `📸 Room ${data.task.room} photo proofs submitted. Needs Supervisor approval.`,
          category: "Alerts",
          type: "alert",
        });
        return data.task;
      }
    }
  } catch (e) {
    console.warn("Backend offline for upload proof, updating local state:", e);
  }

  // Local fallback
  const tasks = getLocalTasks();
  const index = tasks.findIndex((t) => String(t.id) === String(taskId));
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      status: "Photo Uploaded",
      progress: 90,
      photoProofs: photoList,
      photoProofUrl: primaryUrl,
      housekeeperRemarks: remarks,
      durationMinutes,
      staff: staffName || tasks[index].staff,
      staffEmail: staffEmail || tasks[index].staffEmail,
      staffId: staffId || tasks[index].staffId,
      orgId: effectiveOrgId,
      orgName: effectiveOrgName,
      photoUploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      approvalStatus: "Pending Supervisor Approval",
      statusBg: "rgba(139, 92, 246, 0.12)",
      statusColor: "#8b5cf6",
      icon: "📸",
    };
    saveLocalTasks(tasks);
    broadcastHkUpdate("PHOTO_UPLOADED", tasks[index], `📸 Room ${tasks[index].room} proof photos uploaded!`);
    addNotification({
      taskId: tasks[index].id,
      isHkApproval: true,
      room: tasks[index].room,
      user: `${staffName} (Housekeeping)`,
      action: "uploaded photo proof of sanitization",
      target: tasks[index].room,
      message: `📸 Room ${tasks[index].room} photo proofs submitted. Needs Supervisor approval.`,
      category: "Alerts",
      type: "alert",
    });
    return tasks[index];
  }
}

export const uploadHkPhotoProof = (taskId, photoUrl, staffName, staffEmail) =>
  uploadHkPhotoProofMulti(taskId, { photos: [photoUrl], remarks: "Sanitization complete", staffName, staffEmail });

export const uploadHkVideoProof = uploadHkPhotoProof;

export async function approveHkTask(taskId, approverName = "Admin / Manager", approverRole = "manager") {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/approve`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ approverName, approverRole }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.task) {
          updateLocalTask(data.task);
          broadcastHkUpdate("TASK_APPROVED", data.task, `✅ Room ${data.task.room} approved & marked Clean!`);
          addNotification({
            user: `${approverName} (${approverRole})`,
            action: "approved room cleaning & marked Available",
            target: data.task.room,
            message: `✅ ${data.task.room} has been approved & marked Clean / Available in PMS.`,
            category: "Mentions",
            type: "system",
          });
          return data.task;
        }
      }
    } catch (e) {
      console.warn("Backend offline for approveHkTask, updating local state:", e);
    }
  }

  // Local fallback
  const tasks = getLocalTasks();
  const index = tasks.findIndex((t) => String(t.id) === String(taskId));
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      status: "Cleaned & Approved",
      progress: 100,
      approvedBy: approverName,
      statusActionAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      approvalStatus: "Cleaned & Approved",
      statusBg: "rgba(16, 185, 129, 0.12)",
      statusColor: "#10b981",
      icon: "✅",
    };
    saveLocalTasks(tasks);
    broadcastHkUpdate("TASK_APPROVED", tasks[index], `✅ Room ${tasks[index].room} approved & marked Clean!`);
    addNotification({
      user: approverName,
      action: "approved room cleaning & marked Available",
      target: tasks[index].room,
      message: `✅ ${tasks[index].room} has been approved & marked Clean / Available in PMS.`,
      category: "Mentions",
      type: "system",
    });
    return tasks[index];
  }
}

export async function rejectAndRescheduleHkTask(taskId, approverName = "Supervisor", approverRole = "manager", reason = "Recleaning required") {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/reschedule`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ approverName, approverRole, reason }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.task) {
          updateLocalTask(data.task);
          broadcastHkUpdate("TASK_REJECTED", data.task, `⚠️ Room ${data.task.room} rejected: ${reason}`);
          addNotification({
            user: `${approverName} (${approverRole})`,
            action: "rejected cleaning & rescheduled",
            target: data.task.room,
            message: `⚠️ Room ${data.task.room} photo rejected: ${reason}. Rescheduled with High Priority.`,
            category: "Alerts",
            type: "alert",
          });
          return data.task;
        }
      }
    } catch (e) {
      console.warn("Backend offline for reject, updating local state:", e);
    }
  }

  // Local fallback
  const tasks = getLocalTasks();
  const index = tasks.findIndex((t) => String(t.id) === String(taskId));
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      status: "Re-cleaning Scheduled",
      progress: 15,
      rejectedReason: reason,
      statusActionBy: approverName,
      statusActionAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      approvalStatus: "Rejected - Re-cleaning Scheduled",
      priority: "Urgent (VIP)",
      statusBg: "rgba(245, 158, 11, 0.12)",
      statusColor: "#f59e0b",
      icon: "⚠️",
    };
    saveLocalTasks(tasks);
    broadcastHkUpdate("TASK_REJECTED", tasks[index], `⚠️ Room ${tasks[index].room} rejected: ${reason}`);
    addNotification({
      user: approverName,
      action: "rejected cleaning & rescheduled",
      target: tasks[index].room,
      message: `⚠️ Room ${tasks[index].room} rejected: ${reason}. Rescheduled with High Priority.`,
      category: "Alerts",
      type: "alert",
    });
    return tasks[index];
  }
}

export async function assignHkTask(taskId, staff, staffEmail, shift = "Morning") {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/assign`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ staff, staffEmail, shift }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.task) {
          updateLocalTask(data.task);
          broadcastHkUpdate("TASK_ASSIGNED", data.task, `Room ${data.task.room} assigned to ${staff}`);
          return data.task;
        }
      }
    } catch (e) {
      console.warn("Backend offline for assignHkTask, updating local state:", e);
    }
  }

  // Local fallback
  const tasks = getLocalTasks();
  const index = tasks.findIndex((t) => String(t.id) === String(taskId));
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      staff,
      staffEmail,
      shift,
      status: tasks[index].status === "Dirty" ? "Assigned" : tasks[index].status,
    };
    saveLocalTasks(tasks);
    broadcastHkUpdate("TASK_ASSIGNED", tasks[index], `Room ${tasks[index].room} assigned to ${staff}`);
    return tasks[index];
  }
}

function updateLocalTask(task) {
  if (!task) return;
  const tasks = getLocalTasks();
  const taskRoomNum = String(task.room || "").replace(/\D/g, "");
  const idx = tasks.findIndex(
    (t) =>
      (task.id && String(t.id) === String(task.id)) ||
      (taskRoomNum && String(t.room || "").replace(/\D/g, "") === taskRoomNum)
  );
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...task };
  } else {
    tasks.unshift(task);
  }
  saveLocalTasks(tasks);
}

export function subscribeHkTasks(callback) {
  const handleCustomEvent = async (e) => {
    try {
      const { tasks } = await fetchHkTasksFromAPI();
      callback(tasks, e.detail);
    } catch (err) {
      callback(getLocalTasks(), e.detail);
    }
  };

  const handleChannelMsg = async (e) => {
    if (e.data) {
      if (e.data.task) {
        updateLocalTask(e.data.task);
      }
      try {
        const { tasks } = await fetchHkTasksFromAPI();
        callback(tasks, e.data);
      } catch (err) {
        callback(getLocalTasks(), e.data);
      }
    }
  };

  window.addEventListener("hk_tasks_changed", handleCustomEvent);
  if (hkChannel) hkChannel.addEventListener("message", handleChannelMsg);

  return () => {
    window.removeEventListener("hk_tasks_changed", handleCustomEvent);
    if (hkChannel) hkChannel.removeEventListener("message", handleChannelMsg);
  };
}

// ----------------------------------------------------------------------------------
// STAFF ATTENDANCE & ROSTER API
// ----------------------------------------------------------------------------------

// Dynamic staff roster & leaves (No dummy data; loaded dynamically from backend DB)
export const initialRoster = [];
export const initialLeaves = [];

export async function assignRoomTaskAPI(assignData) {
  const orgId = getCurrentOrgId();
  const rawRoomNum = String(assignData.roomNumber || (assignData.roomId ? `Room ${assignData.roomId}` : "Room 101")).trim();
  const finalRoomNumber = rawRoomNum.startsWith("Room") ? rawRoomNum : `Room ${rawRoomNum}`;
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const localFallbackTask = {
    id: assignData.id || `HK-TASK-${Date.now().toString().slice(-4)}`,
    roomId: assignData.roomId,
    room: finalRoomNumber,
    floor: assignData.floor || "1st Floor",
    roomType: assignData.roomType || "Standard Room",
    staff: assignData.employeeName || "Housekeeper",
    staffId: assignData.employeeId || "HK-101",
    staffEmail: assignData.employeeEmail || "",
    shift: assignData.shift || "Morning",
    cleaningType: assignData.cleaningType || "Check-Out Turnover",
    task: `${assignData.cleaningType || "Turnover"} & Sanitize`,
    status: "Assigned",
    statusColor: "#6366f1",
    statusBg: "#e0e7ff",
    priority: assignData.priority || "Normal",
    assignedTime: nowStr,
    assignedBy: assignData.assignedBy || "Admin",
    approvalStatus: "Pending Cleaning",
    notes: assignData.notes || "",
  };

  try {
    const res = await fetch(`${API_BASE}/assign-room`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ...assignData, orgId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.task) {
        updateLocalTask(data.task);
        broadcastHkUpdate("TASK_ASSIGNED", data.task, `${assignData.roomNumber || data.task.room} assigned to ${assignData.employeeName || data.task.staff}`);
        return data.task;
      }
    }
  } catch (e) {
    console.warn("Backend offline for assignRoomTaskAPI, falling back to local sync:", e);
  }

  // Local fallback: update local cache & broadcast real-time event across tabs
  updateLocalTask(localFallbackTask);
  broadcastHkUpdate("TASK_ASSIGNED", localFallbackTask, `${finalRoomNumber} assigned to ${localFallbackTask.staff}`);
  return localFallbackTask;
}

export function getLocalRoster() {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(initialRoster));
  return initialRoster;
}

export function saveLocalRoster(list) {
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(list));
  } catch (e) { }
}

export function getLocalLeaves() {
  try {
    const raw = localStorage.getItem(LEAVES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(initialLeaves));
  return initialLeaves;
}

export function saveLocalLeaves(list) {
  try {
    localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(list));
  } catch (e) { }
}

export async function fetchAttendanceRoster() {
  const orgId = getCurrentOrgId();
  try {
    const res = await fetch(`${STAFF_API_BASE}/attendance?orgId=${encodeURIComponent(orgId)}`, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.roster)) {
        saveLocalRoster(data.roster);
        return { roster: data.roster, metrics: data.metrics };
      }
    }
  } catch (e) {
    console.warn("Backend attendance API offline, using local cache:", e);
  }

  const roster = getLocalRoster();
  const onDutyCount = roster.filter((r) => r.status === "On Duty").length;
  const offDutyCount = roster.filter((r) => r.status === "Off Duty").length;
  const onLeaveCount = roster.filter((r) => r.status === "On Leave").length;

  return {
    roster,
    metrics: {
      totalStaff: roster.length,
      onDutyCount,
      offDutyCount,
      onLeaveCount,
      activeAttendancePercentage: roster.length ? Math.round((onDutyCount / roster.length) * 100) : 0,
    },
  };
}

export async function clockInStaff({ staffId, staffName, staffEmail, shift = "Morning", floorSection = "All Floors", notes = "", orgId, orgName }) {
  const activeOrgId = orgId || getCurrentOrgId();
  const activeOrgName = orgName || getCurrentOrg();
  const effectiveEmail = staffEmail || getUserEmail() || "";
  try {
    const res = await fetch(`${STAFF_API_BASE}/attendance/clock-in`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, staffName, staffEmail: effectiveEmail, shift, floorSection, notes, orgId: activeOrgId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.record) {
        updateLocalAttendance(data.record);
        broadcastAttendanceUpdate("CLOCK_IN", data.record, `🕒 ${staffName} clocked in successfully!`);
        return data.record;
      }
    }
  } catch (e) {
    console.warn("Backend offline for clock in, using local storage:", e);
  }

  // Local fallback
  const list = getLocalRoster();
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  let record = list.find((r) =>
    (staffId && (String(r.staffId) === String(staffId) || String(r.id) === String(staffId))) ||
    (effectiveEmail && (r.email === effectiveEmail || r.staffEmail === effectiveEmail)) ||
    (staffName && r.staffName === staffName)
  );

  if (record) {
    record.clockIn = nowStr;
    record.clockOut = null;
    record.status = "On Duty";
    record.shift = shift;
    record.floorSection = floorSection;
    record.email = effectiveEmail || record.email;
    record.staffEmail = effectiveEmail || record.staffEmail;
    record.orgId = activeOrgId;
    record.orgName = activeOrgName;
  } else {
    record = {
      id: `ATT-${Date.now()}`,
      staffId: staffId || "HK-USER",
      staffName: staffName || "Housekeeper",
      email: effectiveEmail,
      staffEmail: effectiveEmail,
      orgId: activeOrgId,
      orgName: activeOrgName,
      floorSection,
      shift,
      clockIn: nowStr,
      clockOut: null,
      status: "On Duty",
      activeMinutes: 1,
    };
    list.unshift(record);
  }
  saveLocalRoster(list);

  if (effectiveEmail) {
    try {
      localStorage.setItem(
        `hk_staff_attendance_${effectiveEmail}`,
        JSON.stringify({ isCheckedIn: true, checkInTime: nowStr, checkOutTime: null, date: new Date().toDateString() })
      );
    } catch (e) {}
  }

  broadcastAttendanceUpdate("CLOCK_IN", record, `🕒 Clocked in at ${nowStr}`);
  return record;
}

export async function clockOutStaff({ staffId, staffEmail, notes = "", orgId }) {
  const activeOrgId = orgId || getCurrentOrgId();
  const effectiveEmail = staffEmail || getUserEmail() || "";
  try {
    const res = await fetch(`${STAFF_API_BASE}/attendance/clock-out`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, notes, orgId: activeOrgId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.record) {
        updateLocalAttendance(data.record);
        broadcastAttendanceUpdate("CLOCK_OUT", data.record, `🚪 Shift completed and clocked out!`);
        return data.record;
      }
    }
  } catch (e) {
    console.warn("Backend offline for clock out, using local storage:", e);
  }

  // Local fallback
  const list = getLocalRoster();
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  let record = list.find((r) =>
    (staffId && (String(r.staffId) === String(staffId) || String(r.id) === String(staffId))) ||
    (effectiveEmail && (r.email === effectiveEmail || r.staffEmail === effectiveEmail))
  );

  if (record) {
    record.clockOut = nowStr;
    record.status = "Off Duty";
    saveLocalRoster(list);
  } else {
    record = {
      id: `ATT-${Date.now()}`,
      staffId: staffId || "HK-USER",
      staffName: getUserName() || "Housekeeper",
      email: effectiveEmail,
      staffEmail: effectiveEmail,
      clockIn: "08:00 AM",
      clockOut: nowStr,
      status: "Off Duty",
    };
    list.unshift(record);
    saveLocalRoster(list);
  }

  if (effectiveEmail) {
    try {
      localStorage.setItem(
        `hk_staff_attendance_${effectiveEmail}`,
        JSON.stringify({ isCheckedIn: false, checkInTime: record.clockIn || nowStr, checkOutTime: nowStr, date: new Date().toDateString() })
      );
    } catch (e) {}
  }

  broadcastAttendanceUpdate("CLOCK_OUT", record, `🚪 Clocked out at ${nowStr}`);
  return record;
}

export async function overrideStaffAttendance(attendanceId, { clockIn, clockOut, status, adminNotes }) {
  try {
    const res = await fetch(`${STAFF_API_BASE}/attendance/${attendanceId}/override`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ clockIn, clockOut, status, adminNotes }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.record) {
        updateLocalAttendance(data.record);
        broadcastAttendanceUpdate("OVERRIDE", data.record, `⚙️ Attendance overridden by Admin`);
        return data.record;
      }
    }
  } catch (e) {
    console.warn("Backend offline for override, using local storage:", e);
  }

  // Local fallback
  const list = getLocalRoster();
  const index = list.findIndex((r) => String(r.id) === String(attendanceId));
  if (index !== -1) {
    list[index] = {
      ...list[index],
      clockIn: clockIn !== undefined ? clockIn : list[index].clockIn,
      clockOut: clockOut !== undefined ? clockOut : list[index].clockOut,
      status: status || list[index].status,
      adminNotes: adminNotes || list[index].adminNotes,
      overridden: true,
    };
    saveLocalRoster(list);
    broadcastAttendanceUpdate("OVERRIDE", list[index], `⚙️ Attendance record updated by Admin`);
    return list[index];
  }
}

function updateLocalAttendance(rec) {
  const list = getLocalRoster();
  const idx = list.findIndex((r) => String(r.id) === String(rec.id));
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...rec };
  } else {
    list.unshift(rec);
  }
  saveLocalRoster(list);
}

// ----------------------------------------------------------------------------------
// LEAVE MANAGEMENT API
// ----------------------------------------------------------------------------------

export async function fetchStaffLeaves() {
  const orgId = getCurrentOrgId();
  try {
    const res = await fetch(`${STAFF_API_BASE}/attendance/leaves?orgId=${encodeURIComponent(orgId)}`, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.leaves)) {
        saveLocalLeaves(data.leaves);
        return data.leaves;
      }
    }
  } catch (e) {
    console.warn("Backend leaves API offline, using local cache:", e);
  }
  return getLocalLeaves();
}

export async function applyStaffLeave({ staffId, staffName, staffEmail, leaveType, startDate, endDate, reason, orgId, orgName }) {
  const activeOrgId = orgId || getCurrentOrgId();
  const activeOrgName = orgName || getCurrentOrg();
  const effectiveEmail = staffEmail || getUserEmail() || "";
  try {
    const res = await fetch(`${STAFF_API_BASE}/attendance/leave`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, staffName, staffEmail: effectiveEmail, leaveType, startDate, endDate, reason, orgId: activeOrgId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.leave) {
        const leaves = [data.leave, ...getLocalLeaves()];
        saveLocalLeaves(leaves);
        broadcastAttendanceUpdate("LEAVE_APPLIED", data.leave, `📅 Leave request submitted by ${staffName}`);
        return data.leave;
      }
    }
  } catch (e) {
    console.warn("Backend offline for leave application, using local storage:", e);
  }

  // Local fallback
  const newLeave = {
    id: `LV-${Date.now().toString().slice(-4)}`,
    staffId: staffId || "HK-USER",
    staffName: staffName || getUserName() || "Housekeeping Staff",
    staffEmail: effectiveEmail,
    email: effectiveEmail,
    orgId: activeOrgId,
    orgName: activeOrgName,
    leaveType,
    startDate,
    endDate,
    reason,
    status: "Pending",
    appliedAt: new Date().toLocaleString(),
    adminNotes: "",
  };
  const list = [newLeave, ...getLocalLeaves()];
  saveLocalLeaves(list);

  // Update employee record status in roster to "On Leave"
  const rosterList = getLocalRoster();
  const staffRec = rosterList.find((r) =>
    (staffId && (String(r.staffId) === String(staffId) || String(r.id) === String(staffId))) ||
    (effectiveEmail && (r.email === effectiveEmail || r.staffEmail === effectiveEmail))
  );
  if (staffRec) {
    staffRec.status = "On Leave";
    saveLocalRoster(rosterList);
  }

  if (effectiveEmail) {
    try {
      const savedHistory = JSON.parse(localStorage.getItem(`hk_leave_history_${effectiveEmail}`) || "[]");
      savedHistory.unshift(newLeave);
      localStorage.setItem(`hk_leave_history_${effectiveEmail}`, JSON.stringify(savedHistory));
    } catch (e) {}
  }

  broadcastAttendanceUpdate("LEAVE_APPLIED", newLeave, `📅 Leave application submitted!`);
  return newLeave;
}

export async function updateStaffLeaveStatus(leaveId, { status, adminNotes = "" }) {
  try {
    const res = await fetch(`${STAFF_API_BASE}/attendance/leave/${leaveId}/status`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.leave) {
        updateLocalLeave(data.leave);
        broadcastAttendanceUpdate("LEAVE_STATUS", data.leave, `Leave request marked ${status}`);
        return data.leave;
      }
    }
  } catch (e) {
    console.warn("Backend offline for leave update, using local storage:", e);
  }

  // Local fallback
  const list = getLocalLeaves();
  const index = list.findIndex((l) => String(l.id) === String(leaveId));
  if (index !== -1) {
    list[index] = { ...list[index], status, adminNotes };
    saveLocalLeaves(list);
    broadcastAttendanceUpdate("LEAVE_STATUS", list[index], `Leave request ${status}`);
    return list[index];
  }
}

function updateLocalLeave(leave) {
  const list = getLocalLeaves();
  const idx = list.findIndex((l) => String(l.id) === String(leave.id));
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...leave };
  } else {
    list.unshift(leave);
  }
  saveLocalLeaves(list);
}

export function subscribeStaffAttendance(callback) {
  const handleCustomEvent = async (e) => {
    try {
      const roster = await fetchAttendanceRoster();
      const leaves = await fetchStaffLeaves();
      callback({ ...roster, leaves }, e.detail);
    } catch (err) {
      callback({ roster: getLocalRoster(), leaves: getLocalLeaves() }, e.detail);
    }
  };

  const handleChannelMsg = (e) => {
    if (e.data) {
      callback({ roster: getLocalRoster(), leaves: getLocalLeaves() }, e.data);
    }
  };

  window.addEventListener("staff_attendance_changed", handleCustomEvent);
  if (attendanceChannel) attendanceChannel.addEventListener("message", handleChannelMsg);

  return () => {
    window.removeEventListener("staff_attendance_changed", handleCustomEvent);
    if (attendanceChannel) attendanceChannel.removeEventListener("message", handleChannelMsg);
  };
}

// ----------------------------------------------------------------------------------
// AUTOMATED SALARY & LEAVE DEDUCTION ENGINE FOR HOUSEKEEPING
// Specification: Base salary (e.g. ₹30,000 for 20 days).
// Rule: EXCEPT SUNDAY (Sunday weekly off = ₹0 deduction).
// Any other leave day (Mon-Sat) automatically deducts ₹1,000 per day!
// ----------------------------------------------------------------------------------
export function calculateHousekeepingSalaryAndBalance({
  staffEmail = "",
  staffId = "",
  baseSalary = 30000,
  baseDays = 20,
  leavesList = null,
} = {}) {
  const allLeaves = Array.isArray(leavesList) ? leavesList : getLocalLeaves();
  const effectiveEmail = (staffEmail || getUserEmail() || "").toLowerCase().trim();
  const effectiveId = String(staffId || "").toLowerCase().trim();

  // Load individual housekeeper leaves from localStorage if present
  let userLeaves = [];
  if (effectiveEmail) {
    try {
      const savedUserLeaves = JSON.parse(localStorage.getItem(`hk_leave_history_${effectiveEmail}`) || "[]");
      if (Array.isArray(savedUserLeaves)) {
        userLeaves = savedUserLeaves;
      }
    } catch (e) {}
  }

  // Combine and deduplicate
  const combined = [...userLeaves, ...allLeaves.filter((l) => {
    const lEmail = (l.staffEmail || l.email || "").toLowerCase().trim();
    const lId = String(l.staffId || "").toLowerCase().trim();
    return (effectiveEmail && lEmail === effectiveEmail) || (effectiveId && lId === effectiveId);
  })];

  const uniqueLeaves = [];
  const seenIds = new Set();
  combined.forEach((l) => {
    const idKey = l.id || `${l.startDate}_${l.endDate}_${l.reason || ""}`;
    if (!seenIds.has(idKey)) {
      seenIds.add(idKey);
      uniqueLeaves.push(l);
    }
  });

  // Default seed leaves if no leaves exist yet:
  // 1 Sunday leave (09 Aug 2026, Sunday -> ₹0 exempt)
  // 2 Weekday leaves (12 & 13 Aug 2026, Wed & Thu -> ₹1,000 each = ₹2,000)
  const targetLeaves = uniqueLeaves.length > 0 ? uniqueLeaves : [
    {
      id: "LV-094",
      type: "Sick Leave",
      startDate: "2026-08-09",
      endDate: "2026-08-09",
      dates: "09 Aug 2026",
      days: 1,
      status: "Approved",
      reason: "Sunday Weekly Off Rest",
    },
    {
      id: "LV-102",
      type: "Casual Leave",
      startDate: "2026-08-12",
      endDate: "2026-08-13",
      dates: "12 Aug 2026 - 13 Aug 2026",
      days: 2,
      status: "Approved",
      reason: "Family event / Personal matter",
    },
  ];

  let sundayLeavesCount = 0;
  let nonSundayLeavesCount = 0;
  const processedLeaveDays = [];

  targetLeaves.forEach((leave) => {
    let start = leave.startDate ? new Date(leave.startDate) : null;
    let end = leave.endDate ? new Date(leave.endDate) : null;

    if (!start || isNaN(start.getTime())) {
      if (leave.dates) {
        const parts = leave.dates.split(/to|-/).map((s) => s.trim());
        start = new Date(parts[0]);
        end = parts[1] ? new Date(parts[1]) : new Date(parts[0]);
      }
    }

    if (!start || isNaN(start.getTime())) {
      const days = Number(leave.days) || 1;
      nonSundayLeavesCount += days;
      processedLeaveDays.push({
        leaveId: leave.id,
        type: leave.type || "Casual Leave",
        dateFormatted: leave.dates || "Recent Leave",
        dayName: "Weekday",
        isSunday: false,
        deduction: days * 1000,
        status: leave.status || "Approved",
        reason: leave.reason || "Personal Leave",
        ruleApplied: "Weekday Leave (-₹1,000 Auto Deducted)",
      });
      return;
    }

    if (!end || isNaN(end.getTime()) || end < start) {
      end = new Date(start);
    }

    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const endLimit = new Date(end);
    endLimit.setHours(0, 0, 0, 0);

    while (cur <= endLimit) {
      const dayOfWeek = cur.getDay(); // 0 is Sunday
      const dayName = cur.toLocaleDateString("en-US", { weekday: "long" });
      const dateFormatted = cur.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      if (dayOfWeek === 0) {
        // SUNDAY IS EXEMPT: 0 DEDUCTION
        sundayLeavesCount++;
        processedLeaveDays.push({
          leaveId: leave.id,
          type: leave.type || "Weekly Off",
          dateFormatted,
          dayName,
          isSunday: true,
          deduction: 0,
          status: leave.status || "Approved",
          reason: leave.reason || "Sunday Off",
          ruleApplied: "Sunday Exemption (₹0 Deducted)",
        });
      } else {
        // MON-SAT: AUTOMATIC 1000 DEDUCTION
        nonSundayLeavesCount++;
        processedLeaveDays.push({
          leaveId: leave.id,
          type: leave.type || "Casual Leave",
          dateFormatted,
          dayName,
          isSunday: false,
          deduction: 1000,
          status: leave.status || "Approved",
          reason: leave.reason || "Leave",
          ruleApplied: "Non-Sunday Leave (-₹1,000 Auto Deducted)",
        });
      }

      cur.setDate(cur.getDate() + 1);
    }
  });

  const totalDeductions = nonSundayLeavesCount * 1000;
  const netBalance = Math.max(0, baseSalary - totalDeductions);
  const totalLeaveDays = sundayLeavesCount + nonSundayLeavesCount;
  const daysWorked = Math.max(0, baseDays - nonSundayLeavesCount);

  return {
    baseSalary,
    baseDays,
    dailyRate: Math.round(baseSalary / baseDays),
    sundayLeavesCount,
    sundayLeaveCount: sundayLeavesCount,
    nonSundayLeavesCount,
    weekdayLeaveCount: nonSundayLeavesCount,
    weekdayLeavesCount: nonSundayLeavesCount,
    totalLeaveDays,
    leaveCount: totalLeaveDays,
    totalDeductions,
    netBalance,
    daysWorked,
    processedLeaveDays: processedLeaveDays || [],
    deductionLogs: (processedLeaveDays || []).map((d) => ({
      date: d.dateFormatted,
      dayName: d.dayName,
      isSunday: d.isSunday,
      deduction: d.deduction,
      reason: d.reason,
      status: d.status,
      ruleApplied: d.ruleApplied,
    })),
    leaves: targetLeaves || [],
  };
}

