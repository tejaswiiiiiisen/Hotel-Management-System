import { Router, Request, Response } from "express";
import { query } from "../db.js";

const router = Router();

// Auto-migrate additional columns for housekeeping_tasks
(async () => {
  try {
    const cols = [
      "ALTER TABLE housekeeping_tasks ADD COLUMN shift VARCHAR(100) DEFAULT 'Morning'",
      "ALTER TABLE housekeeping_tasks ADD COLUMN cleaning_type VARCHAR(100) DEFAULT 'Check-Out Turnover'",
      "ALTER TABLE housekeeping_tasks ADD COLUMN started_at VARCHAR(100) NULL",
      "ALTER TABLE housekeeping_tasks ADD COLUMN duration_minutes INT DEFAULT 0",
      "ALTER TABLE housekeeping_tasks ADD COLUMN photo_proofs LONGTEXT NULL",
      "ALTER TABLE housekeeping_tasks ADD COLUMN housekeeper_remarks TEXT NULL",
      "ALTER TABLE housekeeping_tasks ADD COLUMN room_id INT NULL",
      "ALTER TABLE housekeeping_tasks ADD COLUMN staff_id VARCHAR(50) NULL",
      "ALTER TABLE housekeeping_tasks ADD COLUMN assigned_by VARCHAR(255) NULL",
      "ALTER TABLE housekeeping_tasks ADD COLUMN assigned_at VARCHAR(100) NULL",
      "ALTER TABLE housekeeping_tasks ADD COLUMN completed_at VARCHAR(100) NULL",
    ];
    for (const q of cols) {
      try {
        await query(q);
      } catch { }
    }
  } catch (e: any) {
    console.warn("Housekeeping schema migration check:", e.message);
  }
})();

function formatHkTask(r: any) {
  let photoProofs: string[] = [];
  if (r.photo_proofs) {
    try {
      photoProofs = typeof r.photo_proofs === "string" ? JSON.parse(r.photo_proofs) : r.photo_proofs;
    } catch {
      photoProofs = [r.photo_proofs];
    }
  } else if (r.photo_proof_url) {
    photoProofs = [r.photo_proof_url];
  }

  return {
    id: r.id,
    taskCode: r.task_code,
    orgId: r.org_id || "MA330",
    orgName: r.org_name || "Matcha Tea",
    roomId: r.room_id,
    room: r.room,
    floor: r.floor,
    roomType: r.room_type,
    staff: r.staff,
    staffId: r.staff_id,
    staffEmail: r.staff_email,
    staffAvatar: r.staff_avatar,
    shift: r.shift || "Morning",
    cleaningType: r.cleaning_type || "Check-Out Turnover",
    status: r.status,
    statusColor: r.status_color || "#d97706",
    statusBg: r.status_bg || "#fef3c7",
    priority: r.priority,
    priorityColor: r.priority_color || "#475569",
    priorityBg: r.priority_bg || "#f1f5f9",
    task: r.task,
    lastCleaned: r.last_cleaned,
    startedAt: r.started_at,
    durationMinutes: Number(r.duration_minutes || 0),
    progress: Number(r.progress || 10),
    icon: r.icon || "🧼",
    assignedTime: r.assigned_time,
    notes: r.notes,
    photoProofUrl: r.photo_proof_url,
    photoProofs: photoProofs,
    housekeeperRemarks: r.housekeeper_remarks || "",
    photoUploadedAt: r.photo_uploaded_at,
    approvalStatus: r.approval_status,
    approvedBy: r.approved_by,
    assignedBy: r.assigned_by,
    assignedAt: r.assigned_at,
    completedAt: r.completed_at,
    rejectedReason: r.rejected_reason,
    statusActionAt: r.status_action_at,
    statusActionBy: r.status_action_by,
  };
}

// GET /api/housekeeping and /api/housekeeping/tasks - Fetch tasks & KPI metrics
async function handleGetHkTasks(req: Request, res: Response) {
  const orgId = req.query.org_id || req.query.orgId;
  const floor = req.query.floor as string;
  const shift = req.query.shift as string;
  const priority = req.query.priority as string;
  const status = req.query.status as string;
  const search = req.query.search as string;

  try {
    if (orgId) {
      await query(
        `INSERT INTO housekeeping_tasks
         (org_id, org_name, task_code, room, floor, room_type, staff, staff_email, status,
          status_color, status_bg, priority, priority_color, priority_bg, task, last_cleaned,
          progress, icon, assigned_time, notes, approval_status, shift, cleaning_type)
         SELECT b.org_id, b.org_id, CONCAT('HK-', LEFT(b.org_id, 2), '-', b.id),
                COALESCE(b.room_number, b.room_name), COALESCE(b.floor, '1st Floor'), COALESCE(b.type, 'Room'),
                'Unassigned', NULL, 'Cleaning', '#d97706', '#fef3c7', 'Normal', '#475569', '#f1f5f9',
                'Daily Stay Cleaning & Linen Refresh', 'In Progress', 10, '🧼', 'Today',
                CONCAT('Auto-created for booking:', b.id), 'Pending Cleaning', 'Morning', 'Stayover Service'
           FROM bookings b
          WHERE b.org_id = ? AND b.nights >= 2 AND b.status NOT IN ('Completed', 'Cancelled')
            AND NOT EXISTS (
              SELECT 1 FROM housekeeping_tasks h
               WHERE h.org_id = b.org_id AND h.notes = CONCAT('Auto-created for booking:', b.id)
            )`,
        [orgId]
      );
    }

    let sql = "SELECT * FROM housekeeping_tasks WHERE 1=1";
    const params: unknown[] = [];

    if (orgId) {
      sql += " AND org_id = ?";
      params.push(orgId);
    }

    if (floor && floor !== "All" && floor !== "All Floors") {
      sql += " AND floor LIKE ?";
      params.push(`%${floor}%`);
    }

    if (shift && shift !== "All" && shift !== "All Shifts") {
      sql += " AND shift = ?";
      params.push(shift);
    }

    if (priority && priority !== "All") {
      sql += " AND priority LIKE ?";
      params.push(`%${priority}%`);
    }

    if (status && status !== "All") {
      if (status === "Cleaned & Approved") {
        sql += " AND (status = 'Cleaned & Approved' OR approval_status LIKE '%Approved%')";
      } else if (status === "Rescheduled" || status === "Re-cleaning Scheduled") {
        sql += " AND (status = 'Rescheduled' OR status = 'Re-cleaning Scheduled' OR approval_status LIKE '%Rejected%')";
      } else if (status === "Photo Uploaded" || status === "Pending Approval") {
        sql += " AND (status = 'Photo Uploaded' OR approval_status LIKE '%Pending Approval%')";
      } else if (status === "In Progress" || status === "Cleaning") {
        sql += " AND (status = 'In Progress' OR status = 'Cleaning')";
      } else {
        sql += " AND status = ?";
        params.push(status);
      }
    }

    if (search && String(search).trim()) {
      const s = `%${String(search).trim()}%`;
      sql += " AND (room LIKE ? OR staff LIKE ? OR task LIKE ? OR floor LIKE ?)";
      params.push(s, s, s, s);
    }

    sql += " ORDER BY id DESC";

    const rows = await query<any>(sql, params);
    const tasks = rows.map(formatHkTask);

    // Calculate property-wide real-time metrics
    let totalRoomsCount = 25;
    try {
      const roomRows = await query<any>(
        "SELECT COUNT(*) as cnt FROM rooms WHERE (is_deleted = FALSE OR is_deleted IS NULL)" + (orgId ? " AND org_id = ?" : ""),
        orgId ? [orgId] : []
      );
      if (roomRows?.[0]?.cnt) totalRoomsCount = Number(roomRows[0].cnt);
    } catch {}

    let staffOnDutyCount = 0;
    try {
      const stfRows = await query<any>(
        "SELECT COUNT(*) as cnt FROM staff WHERE work_status = 'On Duty'" + (orgId ? " AND org_id = ?" : ""),
        orgId ? [orgId] : []
      );
      staffOnDutyCount = Number(stfRows?.[0]?.cnt || 0);
    } catch {}

    const cleanCount = tasks.filter((t) => t.status === "Cleaned & Approved" || (t.approvalStatus && t.approvalStatus.includes("Approved"))).length;
    const inProgressCount = tasks.filter((t) => t.status === "In Progress" || t.status === "Cleaning").length;
    const dirtyCount = tasks.filter((t) => t.status === "Unassigned" || t.status === "Rescheduled" || t.status === "Re-cleaning Scheduled").length;
    const pendingApprovalCount = tasks.filter((t) => t.status === "Photo Uploaded" || (t.approvalStatus && t.approvalStatus.includes("Pending"))).length;

    return res.json({
      success: true,
      count: tasks.length,
      tasks,
      metrics: {
        totalRooms: totalRoomsCount,
        cleanAndInspected: cleanCount,
        cleanPercentage: totalRoomsCount > 0 ? Math.round((cleanCount / totalRoomsCount) * 100) : 0,
        cleaningInProgress: inProgressCount,
        dirtyAwaiting: dirtyCount,
        pendingApprovals: pendingApprovalCount,
        staffOnDuty: staffOnDutyCount,
      },
    });
  } catch (err: any) {
    console.error("Error fetching housekeeping tasks:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch housekeeping tasks." });
  }
}

router.get("/", handleGetHkTasks);
router.get("/tasks", handleGetHkTasks);

// POST /api/housekeeping and /api/housekeeping/tasks - Create & Assign Task
async function handleCreateHkTask(req: Request, res: Response) {
  const {
    orgId,
    org_id,
    orgName,
    org_name,
    room,
    floor,
    roomType,
    staff,
    staffEmail,
    staffAvatar,
    priority,
    task,
    shift,
    cleaningType,
    notes,
  } = req.body ?? {};

  const targetOrgId = String(org_id || orgId || "MA330").trim();
  const targetOrgName = String(org_name || orgName || "Matcha Tea").trim();
  const taskCode = `HK-${targetOrgId.substring(0, 2)}-${Math.floor(100 + Math.random() * 900)}`;

  const roomStr = room || "Room 101";
  const floorStr = floor || "1st Floor";
  const roomTypeStr = roomType || "Standard Room";
  const staffStr = staff || "Sunita Devi";
  const staffEmailStr = staffEmail || "housekeeping@hotel.com";
  const staffAvatarStr = staffAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80";
  const shiftStr = shift || "Morning";
  const cleaningTypeStr = cleaningType || "Check-Out Turnover";
  const priorityStr = priority || "Normal";

  const priorityColor = priorityStr.includes("VIP") ? "#7c3aed" : priorityStr.includes("Urgent") || priorityStr.includes("High") ? "#dc2626" : "#475569";
  const priorityBg = priorityStr.includes("VIP") ? "#f3e8ff" : priorityStr.includes("Urgent") || priorityStr.includes("High") ? "#fee2e2" : "#f1f5f9";
  const taskTitle = task || `${cleaningTypeStr} - ${roomStr}`;
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  try {
    const result: any = await query(
      `INSERT INTO housekeeping_tasks 
      (org_id, org_name, task_code, room, floor, room_type, staff, staff_email, staff_avatar, shift, cleaning_type, status, status_color, status_bg, priority, priority_color, priority_bg, task, last_cleaned, progress, icon, assigned_time, notes, approval_status, status_action_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Assigned', '#6366f1', '#e0e7ff', ?, ?, ?, ?, 'Assigned Today', 20, '🧼', ?, ?, 'Pending Cleaning', ?)`,
      [
        targetOrgId,
        targetOrgName,
        taskCode,
        roomStr,
        floorStr,
        roomTypeStr,
        staffStr,
        staffEmailStr,
        staffAvatarStr,
        shiftStr,
        cleaningTypeStr,
        priorityStr,
        priorityColor,
        priorityBg,
        taskTitle,
        nowStr,
        notes || "New housekeeping task assigned.",
        `Today, ${nowStr}`,
      ]
    );

    const insertedRows = await query<any>("SELECT * FROM housekeeping_tasks WHERE id = ?", [result.insertId]);
    const created = formatHkTask(insertedRows[0]);
    return res.status(201).json({ success: true, message: "Housekeeping task created successfully.", task: created });
  } catch (err: any) {
    console.error("Error creating housekeeping task:", err);
    return res.status(500).json({ success: false, message: "Failed to create housekeeping task." });
  }
}

router.post("/", handleCreateHkTask);
router.post("/tasks", handleCreateHkTask);

// POST /api/housekeeping/assign-room - Assign a room to an employee
router.post("/assign-room", async (req: Request, res: Response) => {
  const {
    roomId,
    room_id,
    roomNumber,
    room_number,
    floor,
    roomType,
    room_type,
    employeeId,
    employee_id,
    employeeName,
    employee_name,
    employeeEmail,
    employee_email,
    cleaningType = "Check-Out Turnover",
    cleaning_type,
    shift = "Morning",
    priority = "Normal",
    notes = "",
    assignedBy = "Admin",
    assigned_by,
    orgId,
    org_id,
  } = req.body ?? {};

  const targetOrgId = String(org_id || orgId || "MA330").trim();
  const finalRoomId = roomId || room_id || null;
  const rawRoomNum = String(roomNumber || room_number || (finalRoomId ? `Room ${finalRoomId}` : "Room 101")).trim();
  const finalRoomNumber = rawRoomNum.startsWith("Room") ? rawRoomNum : `Room ${rawRoomNum}`;
  const finalFloor = floor || "1st Floor";
  const finalRoomType = roomType || room_type || "Deluxe Room";
  const finalEmployeeId = employeeId || employee_id || "HK-101";
  const finalEmployeeName = employeeName || employee_name || "Housekeeper";
  const finalEmployeeEmail = employeeEmail || employee_email || null;
  const finalCleaningType = cleaning_type || cleaningType || "Check-Out Turnover";
  const finalAssignedBy = assigned_by || assignedBy || "Admin";

  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  try {
    // Check if task already exists for this room
    let existing = await query<any>(
      "SELECT id FROM housekeeping_tasks WHERE (room_id = ? OR room = ? OR room = ?) AND status NOT IN ('Cleaned & Approved', 'Completed') ORDER BY id DESC LIMIT 1",
      [finalRoomId || 0, finalRoomNumber, rawRoomNum]
    );

    let taskId = existing?.[0]?.id;

    if (taskId) {
      await query(
        `UPDATE housekeeping_tasks 
         SET staff = ?, staff_id = ?, staff_email = ?, shift = ?, cleaning_type = ?, priority = ?,
             notes = ?, assigned_by = ?, assigned_at = ?, status = 'Assigned', status_color = '#6366f1', status_bg = '#e0e7ff',
             approval_status = 'Pending Cleaning', status_action_at = ?
         WHERE id = ?`,
        [finalEmployeeName, finalEmployeeId, finalEmployeeEmail, shift, finalCleaningType, priority, notes, finalAssignedBy, `Today, ${nowStr}`, `Today, ${nowStr}`, taskId]
      );
    } else {
      const taskCode = `HK-${targetOrgId.substring(0, 2)}-${Math.floor(100 + Math.random() * 900)}`;
      const taskTitle = `${finalCleaningType} & Sanitize`;
      const resIns: any = await query(
        `INSERT INTO housekeeping_tasks 
        (org_id, org_name, task_code, room_id, room, floor, room_type, staff, staff_id, staff_email, shift, cleaning_type, status, status_color, status_bg, priority, priority_color, priority_bg, task, last_cleaned, progress, icon, assigned_time, notes, approval_status, assigned_by, assigned_at, status_action_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Assigned', '#6366f1', '#e0e7ff', ?, '#475569', '#f1f5f9', ?, 'Assigned Today', 20, '🧼', ?, ?, 'Pending Cleaning', ?, ?, ?)`,
        [
          targetOrgId,
          "Matcha Tea",
          taskCode,
          finalRoomId,
          finalRoomNumber,
          finalFloor,
          finalRoomType,
          finalEmployeeName,
          finalEmployeeId,
          finalEmployeeEmail,
          shift,
          finalCleaningType,
          priority,
          taskTitle,
          nowStr,
          notes || "Room assigned for cleaning",
          finalAssignedBy,
          `Today, ${nowStr}`,
          `Today, ${nowStr}`,
        ]
      );
      taskId = resIns.insertId;
    }

    // Update rooms table to Cleaning
    if (finalRoomId) {
      await query("UPDATE rooms SET status = 'Cleaning', available = FALSE WHERE id = ?", [finalRoomId]);
    } else {
      const numOnly = rawRoomNum.replace(/\D/g, "");
      if (numOnly) {
        await query("UPDATE rooms SET status = 'Cleaning', available = FALSE WHERE room_number = ? OR room_number LIKE ?", [numOnly, `%${numOnly}%`]);
      }
    }

    const updated = await query<any>("SELECT * FROM housekeeping_tasks WHERE id = ?", [taskId]);
    return res.json({ success: true, message: `${finalRoomNumber} assigned to ${finalEmployeeName}!`, task: formatHkTask(updated[0]) });
  } catch (err: any) {
    console.error("Assign room error:", err);
    return res.status(500).json({ success: false, message: "Failed to assign room task." });
  }
});

// POST or PUT /api/housekeeping/tasks/:id/start - Housekeeper enters room & starts cleaning
async function handleStartCleaning(req: Request, res: Response) {
  const { id } = req.params;
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  try {
    await query(
      `UPDATE housekeeping_tasks 
       SET status = 'In Progress', status_color = '#6366f1', status_bg = '#e0e7ff', icon = '🧹', progress = 45,
           started_at = ?, last_cleaned = 'In Progress', status_action_at = ?
       WHERE id = ?`,
      [`Today, ${nowStr}`, `Today, ${nowStr}`, id]
    );

    const updated = await query<any>("SELECT * FROM housekeeping_tasks WHERE id = ?", [id]);
    if (updated.length > 0) {
      return res.json({ success: true, message: "Cleaning timer started.", task: formatHkTask(updated[0]) });
    }
  } catch (err: any) {
    console.error("Start cleaning error:", err);
  }
  return res.status(500).json({ success: false, message: "Failed to start cleaning task." });
}

router.post("/tasks/:id/start", handleStartCleaning);
router.post("/:id/start", handleStartCleaning);
router.put("/:id/start", handleStartCleaning);

// POST or PUT /api/housekeeping/tasks/:id/upload-proof - Upload photo/video proof
async function handleUploadProof(req: Request, res: Response) {
  const { id } = req.params;
  const { photoUrl, photoUrls, remarks, durationMinutes, orgId, org_id, orgName, org_name, staffName, staffEmail, staffId } = req.body ?? {};
  const effectiveOrgId = org_id || orgId;
  const effectiveOrgName = org_name || orgName;
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const defaultPhoto = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80";

  let photosList: string[] = [];
  if (Array.isArray(photoUrls) && photoUrls.length > 0) {
    photosList = photoUrls;
  } else if (photoUrl) {
    photosList = [photoUrl];
  } else {
    photosList = [defaultPhoto];
  }

  const primaryPhoto = photosList[0] || defaultPhoto;

  try {
    await query(
      `UPDATE housekeeping_tasks 
       SET status = 'Photo Uploaded', status_color = '#7c3aed', status_bg = '#ede9fe', progress = 90,
           photo_proof_url = ?, photo_proofs = ?, housekeeper_remarks = ?, duration_minutes = ?,
           photo_uploaded_at = ?, approval_status = 'Pending Approval', status_action_at = ?,
           org_id = COALESCE(?, org_id), org_name = COALESCE(?, org_name),
           staff = COALESCE(?, staff), staff_email = COALESCE(?, staff_email), staff_id = COALESCE(?, staff_id)
       WHERE id = ?`,
      [
        primaryPhoto,
        JSON.stringify(photosList),
        remarks || "Sanitization complete with all checklists verified.",
        Number(durationMinutes || 25),
        `Today, ${nowStr}`,
        `Today, ${nowStr}`,
        effectiveOrgId || null,
        effectiveOrgName || null,
        staffName || null,
        staffEmail || null,
        staffId || null,
        id,
      ]
    );

    const updatedRows = await query<any>("SELECT * FROM housekeeping_tasks WHERE id = ?", [id]);
    if (updatedRows.length > 0) {
      return res.json({
        success: true,
        message: "Cleaning proof uploaded successfully! Awaiting supervisor approval.",
        task: formatHkTask(updatedRows[0]),
      });
    }
  } catch (err: any) {
    console.error("Error uploading photo proof:", err);
  }
  return res.status(500).json({ success: false, message: "Failed to upload photo proof." });
}

router.post("/tasks/:id/upload-proof", handleUploadProof);
router.post("/:id/upload-proof", handleUploadProof);
router.put("/:id/upload-proof", handleUploadProof);
router.put("/:id/photo", handleUploadProof);

// POST or PUT /api/housekeeping/tasks/:id/approve - Supervisor marks Clean & Approved
async function handleApproveTask(req: Request, res: Response) {
  const { id } = req.params;
  const { approverName, approverRole } = req.body ?? {};
  const roleLabel = approverRole === "super_admin" ? "General Manager" : approverRole === "front_desk" ? "Front Desk" : "Supervisor";
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const approvedByStr = `${approverName || "Supervisor"} (${roleLabel})`;

  try {
    await query(
      `UPDATE housekeeping_tasks 
       SET status = 'Cleaned & Approved', status_color = '#16a34a', status_bg = '#dcfce7', progress = 100,
           approval_status = ?, approved_by = ?, last_cleaned = ?, status_action_at = ?, status_action_by = ?
       WHERE id = ?`,
      [`Approved by ${approvedByStr}`, approvedByStr, `Today, ${nowStr}`, `Today, ${nowStr}`, approvedByStr, id]
    );

    const updatedRows = await query<any>("SELECT * FROM housekeeping_tasks WHERE id = ?", [id]);
    if (updatedRows.length > 0) {
      const taskObj = updatedRows[0];
      // Automatically mark Room as Clean & Available in PMS rooms table!
      if (taskObj.room) {
        const roomNum = String(taskObj.room).replace(/\D/g, "");
        if (roomNum) {
          try {
            await query(
              "UPDATE rooms SET status = 'Available', available = TRUE WHERE (room_number = ? OR room_number LIKE ?)",
              [roomNum, `%${roomNum}%`]
            );
          } catch (rErr) {
            console.warn("Could not sync room availability status:", rErr);
          }
        }
      }

      return res.json({ success: true, message: "Room verified, approved & marked Available in PMS.", task: formatHkTask(taskObj) });
    }
  } catch (err: any) {
    console.error("Error approving housekeeping task:", err);
  }
  return res.status(500).json({ success: false, message: "Failed to approve task." });
}

router.post("/tasks/:id/approve", handleApproveTask);
router.post("/:id/approve", handleApproveTask);
router.put("/:id/approve", handleApproveTask);

// POST or PUT /api/housekeeping/tasks/:id/reschedule (or reject) - Supervisor re-cleaning scheduled
async function handleRescheduleTask(req: Request, res: Response) {
  const { id } = req.params;
  const { approverName, approverRole, reason } = req.body ?? {};
  const roleLabel = approverRole === "super_admin" ? "General Manager" : "Supervisor";
  const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const actionByStr = `${approverName || "Supervisor"} (${roleLabel})`;
  const rejectReason = reason || "Re-cleaning required: Surface dust or smudges detected.";

  try {
    await query(
      `UPDATE housekeeping_tasks 
       SET status = 'Rescheduled', status_color = '#d97706', status_bg = '#fef3c7', icon = '🔄', progress = 25,
           priority = 'Urgent', priority_color = '#dc2626', priority_bg = '#fee2e2',
           approval_status = 'Rejected - Re-cleaning Scheduled', rejected_reason = ?,
           status_action_at = ?, status_action_by = ?
       WHERE id = ?`,
      [rejectReason, `Today, ${nowStr}`, actionByStr, id]
    );

    const updatedRows = await query<any>("SELECT * FROM housekeeping_tasks WHERE id = ?", [id]);
    if (updatedRows.length > 0) {
      const taskObj = updatedRows[0];
      // Mark room as Cleaning / Dirty in PMS rooms table
      if (taskObj.room) {
        const roomNum = String(taskObj.room).replace(/\D/g, "");
        if (roomNum) {
          try {
            await query("UPDATE rooms SET status = 'Cleaning', available = FALSE WHERE room_number = ? OR room_number LIKE ?", [roomNum, `%${roomNum}%`]);
          } catch {}
        }
      }

      return res.json({ success: true, message: "Task rescheduled with high priority for re-cleaning.", task: formatHkTask(taskObj) });
    }
  } catch (err: any) {
    console.error("Error rescheduling task:", err);
  }
  return res.status(500).json({ success: false, message: "Failed to reschedule task." });
}

router.post("/tasks/:id/reschedule", handleRescheduleTask);
router.post("/:id/reschedule", handleRescheduleTask);
router.post("/tasks/:id/reject", handleRescheduleTask);
router.post("/:id/reject", handleRescheduleTask);
router.put("/:id/reject", handleRescheduleTask);

// PUT /api/housekeeping/:id/assign - Supervisor assigns a task to a housekeeper
router.put("/:id/assign", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { staff, staffEmail, staffAvatar, shift, priority } = req.body ?? {};
  if (!staff || !staffEmail) return res.status(400).json({ success: false, message: "Housekeeper name and email are required." });

  try {
    await query(
      `UPDATE housekeeping_tasks 
       SET staff = ?, staff_email = ?, staff_avatar = COALESCE(?, staff_avatar),
           shift = COALESCE(?, shift), priority = COALESCE(?, priority),
           status = CASE WHEN status = 'Unassigned' THEN 'Assigned' ELSE status END,
           approval_status = CASE WHEN photo_proof_url IS NULL THEN 'Pending Cleaning' ELSE 'Pending Approval' END
       WHERE id = ?`,
      [staff, staffEmail, staffAvatar || null, shift || null, priority || null, id]
    );
    const rows = await query<any>("SELECT * FROM housekeeping_tasks WHERE id = ?", [id]);
    return res.json({ success: true, task: formatHkTask(rows[0]) });
  } catch (err) {
    console.error("Assign housekeeping task error:", err);
    return res.status(500).json({ success: false, message: "Failed to assign housekeeping task." });
  }
});

// DELETE /api/housekeeping/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM housekeeping_tasks WHERE id = ?", [id]);
    return res.json({ success: true, message: "Task deleted successfully." });
  } catch (err: any) {
    console.error("Error deleting housekeeping task:", err);
    return res.status(500).json({ success: false, message: "Failed to delete task." });
  }
});

export default router;
