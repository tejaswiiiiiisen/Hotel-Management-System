import { showSuccess, showError, showWarning, showInfo } from "../utils/toast.js";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import {
  FaBed,
  FaHotel,
  FaCrown,
  FaTrash,
  FaUser,
  FaWifi,
  FaEye,
  FaEdit,
  FaThLarge,
  FaList,
  FaBuilding,
  FaSearch,
  FaPlus,
  FaDoorOpen,
  FaMoneyBillWave,
  FaUsers,
  FaCheck,
  FaConciergeBell,
  FaImage,
  FaUndo,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaArrowsAltH,
  FaCamera,
  FaUpload,
  FaTimes,
  FaHeading,
  FaFileAlt,
  FaSyncAlt,
  FaLayerGroup,
  FaCalendarAlt,
  FaBroom,
  FaWrench,
} from "react-icons/fa";
import {
  FiTag,
  FiUsers,
  FiMaximize,
  FiWifi,
  FiWind,
  FiSun,
} from "react-icons/fi";
import { TbBed } from "react-icons/tb";
import {
  getRooms,
  saveRooms,
  bookRoomInStore,
  bookRoomWithAPI,
  fetchRoomsFromApi,
  fetchRoomsFromAPI,
  createRoomInApi,
  addRoomToApi,
  addRoomWithAPI,
  updateRoomInApi,
  deleteRoomInApi,
  deleteRoomFromApi,
  deleteRoomWithAPI,
  cancelBookingWithAPI,
  getAvailableRoomNumbers,
  getAllFloorRoomNumbers,
  getFloorRoomPool,
  fetchConfiguredFloorRoomNumbers,
  addConfiguredFloorRoomNumber,
  deleteConfiguredFloorRoomNumber,
  fetchConfiguredFloors,
  addConfiguredFloor,
  deleteConfiguredFloor,
} from "../utils/roomStore.js";
import { fetchAllBookings } from "../services/bookingService.js";
import { getUserName, getUserRole, getScopedStorageKey } from "../auth.js";
import { accessLevel, canEdit, canView } from "../rbac.js";
import BookRoomModal from "../components/BookRoomModal.jsx";

const AVAILABLE_AMENITIES = [
  "Free Wi-Fi",
  "Air Conditioning",
  "TV",
  "Room Service",
  "King Bed",
  "Private Bathroom",
  "Mini Bar",
  "Balcony",
  "Ocean View",
  "Coffee Maker",
  "In-room Safe",
  "Breakfast Included",
];

export default function RoomManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const userRole = getUserRole();
  const hasFullAccess = canEdit("rooms", userRole);

  const [rooms, setRooms] = useState(getRooms);
  const [activeBookings, setActiveBookings] = useState([]);
  const viewModeStorageKey = getScopedStorageKey("hotel_room_management_view");
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem(viewModeStorageKey);
      if (saved === "scroll" || saved === "grid") return saved;
    } catch {}
    return "scroll";
  });
  const floorScrollRefs = useRef({});

  const handleScrollFloor = (floorName, direction) => {
    const container = floorScrollRefs.current[floorName];
    if (!container) return;
    const scrollAmount = 280;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };
  const [selectedRoomToBook, setSelectedRoomToBook] = useState(null);
  const [floorFilter, setFloorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  useEffect(() => {
    localStorage.setItem(viewModeStorageKey, viewMode);
  }, [viewMode, viewModeStorageKey]);

  const [showAddModal, setShowAddModal] = useState(false);

  const [editingRoom, setEditingRoom] = useState(null);
  const [editForm, setEditForm] = useState({
    number: "",
    name: "",
    type: "Double",
    floor: "1st Floor",
    roomView: "Garden View",
    price: "",
    guests: 2,
    sizeSqm: 28,
    beds: "1 King Bed",
    status: "Available",
    isPopular: false,
    shortDescription: "",
  });

  // DYNAMIC DARK / LIGHT MODE DETECTOR
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "light"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      setTheme(currentTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const DEFAULT_ADD_FORM = {
    number: "",
    name: "",
    type: "Standard",
    floor: "1st Floor",
    roomView: "Garden View",
    status: "Available",
    badge: "",

    isPopular: false,
    shortDescription: "",
    description: "",
    price: "",
    guests: 2,
    sizeSqm: 35,
    beds: "1 King Bed",
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
    amenities: ["Free Wi-Fi", "Air Conditioning", "TV", "Room Service", "Private Bathroom"],
  };

  const PRESET_AMENITIES = [
    "Free Wi-Fi",
    "Air Conditioning",
    "TV",
    "Room Service",
    "Private Bathroom",
    "Minibar",
    "Balcony",
    "Tea/Coffee Maker",
    "Safe Box",
    "Mountain View",
    "Swimming Pool Access",
  ];

  const PRESET_ROOM_IMAGES = [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  ];

  const isDark = theme === "dark";

  // ADD / EDIT FORM STATE
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // CAMERA & FILE UPLOAD REFS & STATE
  const fileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  // CONFIGURED FLOOR ROOM NUMBERS & FLOORS STATE
  const [configuredFloors, setConfiguredFloors] = useState([]);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [newFloorNameInput, setNewFloorNameInput] = useState("");
  const [isSubmittingFloor, setIsSubmittingFloor] = useState(false);
  const [floorModalError, setFloorModalError] = useState(null);

  const [configuredRoomNumbers, setConfiguredRoomNumbers] = useState([]);
  const [isFetchingConfiguredNumbers, setIsFetchingConfiguredNumbers] = useState(false);
  const [showAddRoomNumberModal, setShowAddRoomNumberModal] = useState(false);
  const [newRoomNumberInput, setNewRoomNumberInput] = useState("");
  const [isSubmittingRoomNumber, setIsSubmittingRoomNumber] = useState(false);
  const [roomNumberModalError, setRoomNumberModalError] = useState(null);

  // MANAGE FLOORS & ROOM NUMBERS MODAL STATE
  const [showManageStructureModal, setShowManageStructureModal] = useState(false);
  const [manageTab, setManageTab] = useState("floors");
  const [manageSelectedFloor, setManageSelectedFloor] = useState("1st Floor");
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const [form, setForm] = useState({
    title: "",
    number: "",
    floor: "1st Floor",
    type: "Standard",
    price: "",
    beds: "1 King Bed",
    guests: 2,
    images: [],
    coverImage: "",
    amenities: [
      "Free Wi-Fi",
      "Air Conditioning",
      "TV",
      "Room Service",
      "King Bed",
      "Private Bathroom",
    ],
    description: "",
  });

  // START LIVE CAMERA
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access error:", err);
      showInfo(
        "Could not access camera. Please make sure your camera is connected and browser permission is granted."
      );
    }
  }

  useEffect(() => {
    if (isCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraOpen, cameraStream]);

  // STOP CAMERA
  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  }

  // TAKE CAMERA SNAPSHOT & APPEND TO IMAGES ARRAY
  function takeCameraSnap() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setForm((prev) => ({ ...prev, images: [...prev.images, dataUrl] }));
    stopCamera();
  }

  // BROWSER MULTIPLE FILES UPLOAD
  function handleFileUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (validFiles.length === 0) {
      showWarning("Please select valid image files (JPEG, PNG, WEBP, etc.).");
      return;
    }

    const readPromises = validFiles.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readPromises).then((newImages) => {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages.filter(Boolean)],
      }));
    });
  }

  function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => setForm((prev) => ({ ...prev, coverImage: event.target?.result || "" }));
    reader.readAsDataURL(file);
  }

  // ── Load rooms from API on mount, fallback to localStorage ──
  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsSyncing(true);
    try {
      const [apiRooms, bookings] = await Promise.all([
        fetchRoomsFromAPI(),
        fetchAllBookings({ status: "Active Stay" }),
      ]);
      if (apiRooms && apiRooms.length > 0) {
        setRooms(apiRooms);
        saveRooms(apiRooms);
      } else {
        const local = getRooms();
        if (local && local.length > 0) setRooms(local);
        else setRooms(getRooms());
      }
      if (bookings) setActiveBookings(bookings);
    } catch {
      const local = getRooms();
      if (local && local.length > 0) setRooms(local);
      else setRooms(getRooms());
    } finally {
      if (showSpinner) setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30s so website bookings appear in near-real-time
    const interval = setInterval(() => loadData(), 30000);
    // Also refresh when the tab regains focus
    const onFocus = () => loadData();
    window.addEventListener("focus", onFocus);

    const onRoomsUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setRooms(e.detail);
      }
    };
    window.addEventListener("hotel_rooms_updated", onRoomsUpdated);

    const onFloorsUpdated = (e) => {
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setConfiguredFloors(e.detail);
      }
    };
    window.addEventListener("hotel_floors_updated", onFloorsUpdated);

    const onFloorRoomsUpdated = (e) => {
      if (e.detail && typeof e.detail === "object") {
        const currentFloor = form.floor || "1st Floor";
        if (Array.isArray(e.detail[currentFloor])) {
          setConfiguredRoomNumbers(e.detail[currentFloor]);
        }
      }
    };
    window.addEventListener("hotel_floor_rooms_updated", onFloorRoomsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("hotel_rooms_updated", onRoomsUpdated);
      window.removeEventListener("hotel_floors_updated", onFloorsUpdated);
      window.removeEventListener("hotel_floor_rooms_updated", onFloorRoomsUpdated);
    };
  }, [loadData, form.floor]);

  function getRoomTypeIcon(type) {
    switch (type) {
      case "Standard":
        return <FaBed />;
      case "Deluxe":
        return <FaHotel />;
      case "Suite":
      case "Executive Suite":
      case "Presidential Suite":
        return <FaCrown />;
      default:
        return <FaBed />;
    }
  }

  function getRoomFloor(roomOrNumber) {
    if (typeof roomOrNumber === "object" && roomOrNumber?.floor) {
      return roomOrNumber.floor;
    }
    const rawVal = typeof roomOrNumber === "object" ? roomOrNumber?.number : roomOrNumber;
    const str = String(rawVal || "").trim();
    if (!str) return "1st Floor";
    if (str.includes("Floor")) return str;
    const firstChar = str.charAt(0);
    switch (firstChar) {
      case "1":
        return "1st Floor";
      case "2":
        return "2nd Floor";
      case "3":
        return "3rd Floor";
      case "4":
        return "4th Floor";
      case "5":
        return "5th Floor";
      case "6":
        return "6th Floor";
      case "7":
        return "7th Floor";
      case "8":
        return "8th Floor";
      case "9":
        return "9th Floor";
      default:
        return `${firstChar}th Floor`;
    }
  }

  const loadFloorsList = useCallback(async () => {
    try {
      const floorsList = await fetchConfiguredFloors();
      if (Array.isArray(floorsList) && floorsList.length > 0) {
        setConfiguredFloors(floorsList);
      }
    } catch (e) {
      console.error("Failed to load configured floors", e);
    }
  }, []);

  useEffect(() => {
    loadFloorsList();
  }, [loadFloorsList]);

  const loadFloorRoomNumbers = useCallback(async (floor) => {
    setIsFetchingConfiguredNumbers(true);
    try {
      const res = await fetchConfiguredFloorRoomNumbers(floor);
      if (res && Array.isArray(res.configuredNumbers) && res.configuredNumbers.length > 0) {
        setConfiguredRoomNumbers(res.configuredNumbers);
      } else {
        setConfiguredRoomNumbers(getAllFloorRoomNumbers(floor));
      }
    } catch (e) {
      console.error("Failed to load floor room numbers", e);
      setConfiguredRoomNumbers(getAllFloorRoomNumbers(floor));
    } finally {
      setIsFetchingConfiguredNumbers(false);
    }
  }, []);

  useEffect(() => {
    if (showAddModal) {
      loadFloorsList();
      loadFloorRoomNumbers(form.floor || "1st Floor");
    }
  }, [showAddModal, form.floor, loadFloorRoomNumbers, loadFloorsList]);

  const availableFloorsList = Array.from(
    new Set([
      ...(configuredFloors.length > 0 ? configuredFloors : ["1st Floor"]),
      ...rooms.map((r) => getRoomFloor(r)).filter(Boolean),
    ])
  ).sort((a, b) => {
    const defaultOrder = [
      "Basement",
      "Lower Ground",
      "Ground Floor",
      "1st Floor",
      "2nd Floor",
      "3rd Floor",
      "4th Floor",
      "5th Floor",
      "6th Floor",
      "7th Floor",
      "8th Floor",
      "9th Floor",
      "10th Floor",
      "11th Floor",
      "12th Floor",
      "13th Floor",
      "14th Floor",
      "15th Floor",
      "16th Floor",
      "17th Floor",
      "18th Floor",
      "19th Floor",
      "20th Floor",
      "Penthouse",
      "Rooftop",
    ];
    const idxA = defaultOrder.indexOf(a);
    const idxB = defaultOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return String(a).localeCompare(String(b));
  });

  const allFloorRoomNumbers = getAllFloorRoomNumbers(
    form.floor || "1st Floor",
    configuredRoomNumbers
  );

  const assignedRoomNumbers = new Set();
  (rooms || []).forEach((r) => {
    if (!r) return;
    if (editingRoomId && String(r.id) === String(editingRoomId)) return;
    const rNum = String(r.roomNumber || r.number || r.room_number || "").trim();
    if (!rNum) return;
    const rFloor = r.floor || deriveFloorFromNumber(rNum);
    if (
      String(rFloor).toLowerCase().trim() === String(form.floor || "1st Floor").toLowerCase().trim() ||
      allFloorRoomNumbers.includes(rNum)
    ) {
      assignedRoomNumbers.add(rNum);
    }
  });

  const availableRoomNumbers = allFloorRoomNumbers.filter((num) => !assignedRoomNumbers.has(num));

  async function handleFloorChange(newFloor) {
    setIsFetchingConfiguredNumbers(true);
    let configured = [];
    try {
      const res = await fetchConfiguredFloorRoomNumbers(newFloor);
      if (res && Array.isArray(res.configuredNumbers)) {
        configured = res.configuredNumbers;
      }
    } catch { }
    setIsFetchingConfiguredNumbers(false);
    setConfiguredRoomNumbers(configured);

    const nextAll = getAllFloorRoomNumbers(newFloor, configured);
    const nextAssigned = new Set();
    (rooms || []).forEach((r) => {
      if (!r) return;
      if (editingRoomId && String(r.id) === String(editingRoomId)) return;
      const rNum = String(r.roomNumber || r.number || r.room_number || "").trim();
      if (!rNum) return;
      const rFloor = r.floor || deriveFloorFromNumber(rNum);
      if (
        String(rFloor).toLowerCase().trim() === String(newFloor).toLowerCase().trim() ||
        nextAll.includes(rNum)
      ) {
        nextAssigned.add(rNum);
      }
    });

    const nextAvail = nextAll.filter((num) => !nextAssigned.has(num));
    let nextNum = form.number;
    if (!nextNum || nextAssigned.has(nextNum) || !nextAll.includes(nextNum)) {
      nextNum = nextAvail.length > 0 ? nextAvail[0] : "";
    }
    setForm((prev) => ({
      ...prev,
      floor: newFloor,
      number: nextNum,
    }));
  }

  async function handleAddNewFloor(e) {
    if (e) e.preventDefault();
    const trimmedFloor = String(newFloorNameInput || "").trim();
    if (!trimmedFloor) {
      setFloorModalError("Please enter a floor name.");
      return;
    }

    setFloorModalError(null);
    setIsSubmittingFloor(true);
    try {
      await addConfiguredFloor(trimmedFloor);
      setConfiguredFloors((prev) => {
        if (!prev.includes(trimmedFloor)) return [...prev, trimmedFloor];
        return prev;
      });
      setShowAddFloorModal(false);
      setNewFloorNameInput("");
      setManageSelectedFloor(trimmedFloor);
      showSuccess(`Floor "${trimmedFloor}" added successfully!`);
      await loadFloorsList();
      await handleFloorChange(trimmedFloor);
    } catch (err) {
      console.warn("Floor add error:", err);
      setConfiguredFloors((prev) => {
        if (!prev.includes(trimmedFloor)) return [...prev, trimmedFloor];
        return prev;
      });
      setShowAddFloorModal(false);
      setNewFloorNameInput("");
      setManageSelectedFloor(trimmedFloor);
      showSuccess(`Floor "${trimmedFloor}" added successfully!`);
      await handleFloorChange(trimmedFloor);
    } finally {
      setIsSubmittingFloor(false);
    }
  }

  async function handleAddNewRoomNumber(e) {
    if (e) e.preventDefault();
    const trimmedNum = String(newRoomNumberInput || "").trim();
    if (!trimmedNum) {
      setRoomNumberModalError("Please enter a room number.");
      return;
    }

    const targetFloor = (showManageStructureModal && manageTab === "rooms")
      ? (manageSelectedFloor || form.floor || "1st Floor")
      : (form.floor || "1st Floor");

    setRoomNumberModalError(null);
    setIsSubmittingRoomNumber(true);
    try {
      await addConfiguredFloorRoomNumber(targetFloor, trimmedNum);
      setConfiguredRoomNumbers((prev) => {
        if (!prev.includes(trimmedNum)) return [...prev, trimmedNum];
        return prev;
      });
      setShowAddRoomNumberModal(false);
      setNewRoomNumberInput("");
      showSuccess(`Room #${trimmedNum} configured for ${targetFloor}!`);
      await loadFloorRoomNumbers(targetFloor);
      setForm((prev) => ({ ...prev, floor: targetFloor, number: trimmedNum }));
    } catch (err) {
      console.warn("Room number add error:", err);
      setConfiguredRoomNumbers((prev) => {
        if (!prev.includes(trimmedNum)) return [...prev, trimmedNum];
        return prev;
      });
      setShowAddRoomNumberModal(false);
      setNewRoomNumberInput("");
      showSuccess(`Room #${trimmedNum} configured for ${targetFloor}!`);
      setForm((prev) => ({ ...prev, floor: targetFloor, number: trimmedNum }));
    } finally {
      setIsSubmittingRoomNumber(false);
    }
  }

  function handleDeleteFloor(floorName) {
    setConfirmModal({
      title: "Delete Floor",
      message: `Are you sure you want to delete floor "${floorName}"?`,
      description: "This will remove this floor and clear all unassigned room numbers associated with it.",
      confirmText: "Yes, Delete Floor",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsDeletingItem(true);
        // Optimistic UI removal
        setConfiguredFloors((prev) => prev.filter((f) => f !== floorName));

        const res = await deleteConfiguredFloor(floorName);
        setIsDeletingItem(false);

        if (res.success) {
          showSuccess(`Floor "${floorName}" deleted successfully.`);
          const refreshedFloors = await fetchConfiguredFloors();
          if (Array.isArray(refreshedFloors)) {
            setConfiguredFloors(refreshedFloors);
          }
          if (form.floor === floorName) {
            const nextFloor = refreshedFloors[0] || "1st Floor";
            handleFloorChange(nextFloor);
          }
          if (manageSelectedFloor === floorName) {
            const nextFloor = refreshedFloors[0] || "1st Floor";
            setManageSelectedFloor(nextFloor);
            loadFloorRoomNumbers(nextFloor);
          }
        } else {
          showError(res.error || "Failed to delete floor.");
          await loadFloorsList();
        }
      },
    });
  }

  function handleDeleteRoomNumber(floorName, roomNum) {
    setConfirmModal({
      title: "Delete Room Number",
      message: `Are you sure you want to delete room number "${roomNum}"?`,
      description: `This will remove Room ${roomNum} configuration from ${floorName}.`,
      confirmText: "Yes, Delete Room",
      onConfirm: async () => {
        setConfirmModal(null);
        setIsDeletingItem(true);
        // Optimistic UI removal
        setConfiguredRoomNumbers((prev) => prev.filter((n) => n !== roomNum));

        const res = await deleteConfiguredFloorRoomNumber(floorName, roomNum);
        setIsDeletingItem(false);

        if (res.success) {
          showSuccess(`Room number "${roomNum}" deleted.`);
          await loadFloorRoomNumbers(floorName);
          if (form.number === roomNum) {
            setForm((prev) => ({ ...prev, number: "" }));
          }
        } else {
          showError(res.error || "Failed to delete room number.");
          await loadFloorRoomNumbers(floorName);
        }
      },
    });
  }

  function resetForm() {
    setEditingRoomId(null);
    setShowAddModal(false);
    setForm({
      title: "",
      number: "",
      floor: "1st Floor",
      type: "Standard",
      price: "",
      beds: "1 King Bed",
      guests: 2,
      images: [],
      amenities: [
        "Free Wi-Fi",
        "Air Conditioning",
        "TV",
        "Room Service",
        "King Bed",
        "Private Bathroom",
      ],
      description: "",
      status: "Available",
    });
  }

  function startEditRoom(room) {
    setEditingRoomId(room.id);
    const existingImages =
      Array.isArray(room.images) && room.images.length
        ? room.images
        : room.image
          ? [room.image]
          : [];

    setForm({
      title: room.title || room.name || "",
      number: room.number || room.roomNumber || "",
      floor: getRoomFloor(room),
      type: room.type || "Standard",
      price:
        room.price || room.pricePerNight
          ? String(room.price || room.pricePerNight)
          : "",
      beds: room.beds || "1 King Bed",
      guests: room.guests || room.capacity || 2,
      images: existingImages,
      coverImage: room.coverImage || room.image || existingImages[0] || "",
      amenities: room.amenities || [
        "Free Wi-Fi",
        "Air Conditioning",
        "TV",
        "Room Service",
      ],
      description: room.description || room.shortDescription || "",
      status: room.status || (room.available ? "Available" : "Occupied"),
    });
    setShowAddModal(true);
  }

  async function handleStatusChange(roomId, newStatus) {
    const isAvailable = newStatus.toLowerCase() === "available" || newStatus.toLowerCase() === "cleaning";
    const roomObj = rooms.find((r) => r.id === roomId);
    let checkoutSuccess = false;

    // Check if there is an active booking and we're making the room available/cleaning
    if (isAvailable && roomObj) {
      const activeBooking = getActiveBookingForRoom(roomObj);
      if (activeBooking) {
        const validBookingPkId = activeBooking.pkId || activeBooking.id || activeBooking.bookingId;
        await cancelBookingWithAPI(roomId, validBookingPkId);
        checkoutSuccess = true;
      }
    }

    if (!checkoutSuccess) {
      // If we didn't checkout, we can safely update the room status manually
      const updatedRooms = rooms.map((r) => {
        if (r.id === roomId) {
          return { ...r, status: newStatus, available: isAvailable };
        }
        return r;
      });
      setRooms(updatedRooms);
      saveRooms(updatedRooms);

      await updateRoomInApi(roomId, {
        status: newStatus,
        available: isAvailable,
      });
    }

    const savedApiRoom = await updateRoomInApi(roomId, {
      status: newStatus,
      available: isAvailable,
    });
    if (savedApiRoom) {
      const refreshed = await fetchRoomsFromApi();
      if (refreshed) setRooms(refreshed);
    }
    if (checkoutSuccess) {
      const bookings = await fetchAllBookings();
      if (bookings) setActiveBookings(bookings);
    }

    setFeedbackMsg(`✅ Room #${roomObj?.number || roomId} status changed to "${newStatus}"${checkoutSuccess ? ' & Guest Checked Out' : ''}`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  }

  function toggleAmenity(amenity) {
    setForm((prev) => {
      const exists = prev.amenities.includes(amenity);
      const updated = exists
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: updated };
    });
  }

  async function handleSubmitRoom(e) {
    e.preventDefault();
    if (!form.number || !form.number.trim() || !form.price || Number(form.price) <= 0) {
      showWarning("Please enter a valid Room Number and Price per Night before submitting.");
      return;
    }

    const trimmedNum = form.number.trim();
    if (assignedRoomNumbers.has(trimmedNum) && !editingRoomId) {
      showError(`Room #${trimmedNum} is already assigned! You cannot re-assign this room.`);
      return;
    }

    const roomTitle = form.title && form.title.trim() ? form.title.trim() : `Room ${trimmedNum} - ${form.type}`;
    const roomDesc = form.description && form.description.trim() ? form.description.trim() : `Executive ${form.type} room on ${form.floor || "1st Floor"}.`;

    // Automatically assign high quality hotel photo
    const defaultPhotos = [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
    ];
    const numInt = parseInt(trimmedNum.replace(/\D/g, ""), 10) || 1;
    const assignedPhoto = defaultPhotos[(numInt - 1) % defaultPhotos.length];
    const imagesToUse = Array.isArray(form.images) && form.images.length > 0 ? form.images : [assignedPhoto];

    const roomData = {
      title: roomTitle,
      name: roomTitle,
      number: trimmedNum,
      roomNumber: trimmedNum,
      floor: form.floor || getRoomFloor(trimmedNum),
      type: form.type || "Standard",
      price: Number(form.price),
      pricePerNight: Number(form.price),
      beds: form.beds || "1 King Bed",
      guests: Number(form.guests) || 2,
      capacity: Number(form.guests) || 2,
      images: imagesToUse,
      coverImage: imagesToUse[0],
      image: imagesToUse[0],
      amenities: Array.isArray(form.amenities) && form.amenities.length > 0
        ? form.amenities
        : ["Free Wi-Fi", "Air Conditioning", "TV", "Room Service", "Private Bathroom"],
      description: roomDesc,
      shortDescription: roomDesc,
      status: form.status || "Available",
      available: (form.status || "Available").toLowerCase() === "occupied" ? false : true,
    };

    try {
      if (editingRoomId) {
        const savedApiRoom = await updateRoomInApi(editingRoomId, roomData);
        if (savedApiRoom && Array.isArray(savedApiRoom)) {
          setRooms(savedApiRoom);
          saveRooms(savedApiRoom);
        } else {
          const updatedRoomsList = await fetchRoomsFromApi();
          setRooms(updatedRoomsList || getRooms());
          if (updatedRoomsList) saveRooms(updatedRoomsList);
        }
        showSuccess(`✅ Room #${trimmedNum} updated in database & website!`);
        resetForm();
      } else {
        const savedRooms = await createRoomInApi(roomData);
        if (savedRooms && Array.isArray(savedRooms)) {
          setRooms(savedRooms);
          saveRooms(savedRooms);
        } else {
          const refreshed = await fetchRoomsFromApi();
          setRooms(refreshed || getRooms());
          if (refreshed) saveRooms(refreshed);
        }
        showSuccess(`✅ Room #${trimmedNum} added to inventory & website successfully!`);
        resetForm();
      }
    } catch (err) {
      console.error("Room save error, applying local fallback:", err);
      const localRoom = { id: Date.now(), ...roomData };
      const updated = [localRoom, ...(rooms || [])];
      setRooms(updated);
      saveRooms(updated);
      showSuccess(`✅ Room #${trimmedNum} created & added to inventory!`);
      resetForm();
    }
  }

  async function handleSaveEdit(e) {
    if (e) e.preventDefault();
    if (!editingRoom) return;
    try {
      const updatedData = {
        ...editingRoom,
        number: editForm.number || editingRoom.number,
        roomNumber: editForm.number || editingRoom.roomNumber,
        name: editForm.name || editingRoom.name || `Room ${editForm.number || editingRoom.number}`,
        type: editForm.type || editingRoom.type,
        floor: editForm.floor || editingRoom.floor,
        roomView: editForm.roomView || editingRoom.roomView,
        price: editForm.price ? Number(editForm.price) : editingRoom.price,
        pricePerNight: editForm.price ? Number(editForm.price) : editingRoom.pricePerNight,
        guests: editForm.guests || editingRoom.guests,
        capacity: editForm.guests || editingRoom.capacity,
        sizeSqm: editForm.sizeSqm || editingRoom.sizeSqm,
        beds: editForm.beds || editingRoom.beds,
        status: editForm.status || editingRoom.status,
        available: (editForm.status || editingRoom.status).toLowerCase() === "occupied" ? false : true,
        isPopular: Boolean(editForm.isPopular),
        badge: editForm.isPopular ? "Popular" : null,
        shortDescription: editForm.shortDescription || editingRoom.shortDescription,
      };

      const res = await updateRoomInApi(editingRoom.id, updatedData);
      if (res && Array.isArray(res)) {
        setRooms(res);
        saveRooms(res);
      } else {
        const refreshed = await fetchRoomsFromApi();
        if (refreshed) {
          setRooms(refreshed);
          saveRooms(refreshed);
        }
      }
      showSuccess(`Room #${updatedData.number} updated successfully!`);
      setEditingRoom(null);
    } catch (err) {
      console.error("Failed to update room:", err);
      showError("Failed to save room updates.");
    }
  }

  function deleteRoom(id) {
    setConfirmModal({
      title: "Delete Room",
      message: "Are you sure you want to delete this room?",
      description: "This room will be permanently removed from your room inventory.",
      confirmText: "Yes, Delete Room",
      onConfirm: async () => {
        setConfirmModal(null);
        const updated = await deleteRoomWithAPI(id);
        if (updated) {
          setRooms(updated);
          saveRooms(updated);
          showSuccess("Room deleted successfully!");
        } else {
          const fallbackRefreshed = await deleteRoomInApi(id);
          if (fallbackRefreshed) {
            setRooms(fallbackRefreshed);
            saveRooms(fallbackRefreshed);
            showSuccess("Room deleted successfully!");
          } else {
            showError("Failed to delete room from backend.");
          }
        }
      },
    });
  }

  async function handleConfirmBooking(bookingData, alreadyCreated = true) {
    if (!selectedRoomToBook) return;
    try {
      const staffName = getUserName() || "Staff";
      const updated = await bookRoomWithAPI(selectedRoomToBook, bookingData, staffName, alreadyCreated);
      if (updated) setRooms(updated);
      setSelectedRoomToBook(null);
      // Refresh bookings list
      const bookings = await fetchAllBookings({ status: "Active Stay" });
      if (bookings) setActiveBookings(bookings);
      showSuccess(`Room ${selectedRoomToBook.number || selectedRoomToBook.name || ""} booked successfully!`);
    } catch (err) {
      console.warn("handleConfirmBooking error in RoomManagement:", err);
      setSelectedRoomToBook(null);
      const apiRooms = await fetchRoomsFromAPI();
      if (apiRooms) setRooms(apiRooms);
      const bookings = await fetchAllBookings({ status: "Active Stay" });
      if (bookings) setActiveBookings(bookings);
    }
  }

  // Helper: find the active booking for a given room
  function getActiveBookingForRoom(room) {
    // Check API bookings by room number or ID
    const match = activeBookings.find(
      (b) =>
        ((b.roomUid && (b.roomUid === room.roomUid || b.roomUid === room.room_uid)) ||
          (b.roomId && String(b.roomId) === String(room.id)) ||
          (b.roomNumber && (b.roomNumber === room.number || b.roomNumber === room.roomNumber || b.roomNumber === `Room ${room.number}`))) &&
        (b.status === "Active Stay" || b.status === "Reserved" || b.status === "Booked" || b.status === "Occupied")
    );
    if (match) {
      return {
        guestName: match.guestName || match.guestName || "Guest",
        bookingId: match.bookingCode,
        pkId: match.pkId,
        checkIn: match.checkInDate,
        checkOut: match.checkOutDate,
        phone: match.guestPhone,
        email: match.guestEmail,
        source: match.source,
        bookedBy: match.bookedBy,
        paymentStatus: match.paymentStatus,
        amountPaid: match.amountPaid,
      };
    }
    return null;
  }

  function getStatusClass(status) {
    return `room-status ${status.toLowerCase().replace(" ", "-")}`;
  }

  // Filter rooms
  const filteredRooms = rooms.filter((r) => {
    if (
      statusFilter !== "all" &&
      r.status.toLowerCase().replace(" ", "") !==
      statusFilter.toLowerCase().replace(" ", "")
    )
      return false;

    if (floorFilter !== "all" && getRoomFloor(r) !== floorFilter)
      return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        r.number.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Group rooms floor-wise
  const floorGroups = filteredRooms.reduce((acc, r) => {
    const floor = getRoomFloor(r);
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(r);
    return acc;
  }, {});

  // Sort floors in order (1st Floor, 2nd Floor, etc.)
  const sortedFloors = Object.keys(floorGroups).sort((a, b) => {
    const numA = parseInt(a, 10) || 0;
    const numB = parseInt(b, 10) || 0;
    return numA - numB;
  });

  // Extract all available floor names for dropdown and filters
  const allFloors = availableFloorsList;
  const currentFloorRoomsCount = rooms.filter((r) => getRoomFloor(r) === (form.floor || "1st Floor")).length;
  const isFloorEmpty = currentFloorRoomsCount === 0 && configuredRoomNumbers.length === 0;

  return (
    <>
      {/* PAGE HEADER WITH SYNC BUTTON NEXT TO TITLE */}
      <PageHeader
        title={
          <div style={{ display: "inline-flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <span>{userRole === "accountant" ? "Employees" : "Room Inventory"}</span>
            <button
              type="button"
              title="Sync with server"
              onClick={() => loadData(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                background: isDark ? "#1e293b" : "#ffffff",
                color: isDark ? "#cbd5e1" : "#64748b",
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: isDark ? "none" : "0 2px 6px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
                verticalAlign: "middle",
              }}
            >
              <FaSyncAlt style={{ animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        }
        subtitle="Manage property listings, beds, pricing, and availability"
        action={
          hasFullAccess && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setManageTab("floors");
                  setShowManageStructureModal(true);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: isDark ? "#1e293b" : "#ffffff",
                  color: isDark ? "#cbd5e1" : "#0f172a",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                }}
              >
                <FaLayerGroup style={{ color: "#6366f1" }} /> Manage Floors & Numbers
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                style={{
                  padding: "10px 22px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(102, 126, 234, 0.35)",
                }}
              >
                <FaPlus /> Add New Room
              </button>
            </div>
          )
        }
      />

      {/* FEEDBACK SUCCESS / WARNING TOAST */}
      {feedbackMsg && (
        <div
          style={{
            marginBottom: "12px",
            padding: "12px 20px",
            borderRadius: "14px",
            background: "#dcfce7",
            color: "#15803d",
            fontSize: "13.5px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
          }}
        >
          <FaCheck /> {feedbackMsg}
        </div>
      )}

      {/* HIGH-END MODAL POPUP FOR ADD / EDIT NEW ROOM */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              borderRadius: "24px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
            }}
          >
            {/* MODAL POPUP HEADER */}
            <div
              style={{
                padding: "20px 28px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "24px 24px 0 0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "18px",
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                  }}
                >
                  {editingRoomId ? <FaEdit /> : <FaPlus />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
                    {editingRoomId ? `Edit Room #${form.number}` : "Add New Room"}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    {editingRoomId ? "Update specifications, pricing, beds & photos" : "Fill details to add room to inventory"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#cbd5e1",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* FORM BODY INSIDE MODAL */}
            <form onSubmit={handleSubmitRoom} style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* RESPONSIVE GRID OF INPUT FIELDS */}
              <div className="add-room-form-grid">
                {/* Room Title / Name */}
                <div className="add-room-field">
                  <label style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    <FaHeading /> Room Title / Name
                  </label>
                  <div className="add-room-input-wrap">
                    <FaHeading className="add-room-input-icon" />
                    <input
                      className="add-room-input"
                      placeholder="e.g. Executive Sea View Suite"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                </div>

                {/* Floor */}
                <div className="add-room-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ color: isDark ? "#ffffff" : "#0f172a", margin: 0 }}>
                      <FaBuilding /> Floor Location *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFloorModalError(null);
                        setNewFloorNameInput("");
                        setShowAddFloorModal(true);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#6366f1",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: 0,
                      }}
                    >
                      <FaPlus size={9} /> Add Floor
                    </button>
                  </div>
                  <div className="add-room-input-wrap">
                    <FaBuilding className="add-room-input-icon" />
                    <select
                      className="add-room-select"
                      value={form.floor}
                      onChange={(e) => handleFloorChange(e.target.value)}
                    >
                      {availableFloorsList.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Room Number - Full Width with All 10 Rooms Shown */}
                <div className="add-room-field" style={{ gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexWrap: "wrap", gap: "6px" }}>
                    <label style={{ color: isDark ? "#ffffff" : "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaDoorOpen /> Room Number Selection * ({form.floor || "1st Floor"})
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRoomNumberModalError(null);
                          setNewRoomNumberInput("");
                          setShowAddRoomNumberModal(true);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#6366f1",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: 0,
                        }}
                      >
                        <FaPlus size={9} /> Add Custom Number
                      </button>
                      <span style={{ fontSize: "12px", fontWeight: "700" }}>
                        <span style={{ color: "#10b981" }}>{availableRoomNumbers.length} Available</span>
                        {" / "}
                        <span style={{ color: "#ef4444" }}>{assignedRoomNumbers.size} Assigned</span>
                      </span>
                    </div>
                  </div>

                  {/* SELECT DROPDOWN & DIRECT INPUT ROW */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "8px", alignItems: "center" }}>
                    <div className="add-room-input-wrap">
                      <FaDoorOpen className="add-room-input-icon" />
                      <select
                        className="add-room-select"
                        value={form.number}
                        required
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!assignedRoomNumbers.has(val) || (editingRoomId && String(form.number) === String(val))) {
                            setForm({ ...form, number: val });
                          }
                        }}
                        style={{
                          fontWeight: "600",
                          color: assignedRoomNumbers.has(form.number) ? "#ef4444" : isDark ? "#ffffff" : "#0f172a",
                        }}
                      >
                        <option value="" disabled>-- Select from list --</option>
                        {allFloorRoomNumbers.map((num) => {
                          const isAssigned = assignedRoomNumbers.has(num);
                          const isCurrentEdit = editingRoomId && String(form.number) === String(num);
                          const disabled = isAssigned && !isCurrentEdit;

                          return (
                            <option
                              key={num}
                              value={num}
                              disabled={disabled}
                              style={{
                                color: disabled ? "#ef4444" : isDark ? "#ffffff" : "#0f172a",
                                backgroundColor: disabled ? (isDark ? "#450a0a" : "#fee2e2") : (isDark ? "#1e293b" : "#ffffff"),
                                fontWeight: disabled ? "800" : "500",
                              }}
                            >
                              Room {num} {disabled ? "— [ASSIGNED 🔴]" : "— [AVAILABLE 🟢]"}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Or type custom room #..."
                        value={form.number}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setForm({ ...form, number: val });
                          if (val && !configuredRoomNumbers.includes(val)) {
                            setConfiguredRoomNumbers((prev) => [...prev, val]);
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                          background: isDark ? "#0f172a" : "#ffffff",
                          color: isDark ? "#ffffff" : "#0f172a",
                          fontSize: "13px",
                          fontWeight: "600",
                          boxSizing: "border-box",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {form.number && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: assignedRoomNumbers.has(form.number) ? "#ef4444" : "#10b981",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {assignedRoomNumbers.has(form.number) ? (
                        <><span>⚠️</span> Room #{form.number} is already assigned. Please choose another number.</>
                      ) : (
                        <><span>✅</span> Room #{form.number} selected for {form.floor || "1st Floor"}.</>
                      )}
                    </div>
                  )}
                </div>

                {/* Category / Type */}
                <div className="add-room-field">
                  <label style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    <FaHotel /> Room Type *
                  </label>
                  <div className="add-room-input-wrap">
                    <FaHotel className="add-room-input-icon" />
                    <select
                      className="add-room-select"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="Standard">Standard Room</option>
                      <option value="Deluxe">Deluxe Room</option>
                      <option value="Super Deluxe">Super Deluxe</option>
                      <option value="Suite">Executive Suite</option>
                      <option value="Presidential Suite">Presidential Suite</option>
                      <option value="Family Suite">Family Suite</option>
                    </select>
                  </div>
                </div>

                {/* Price / Night */}
                <div className="add-room-field">
                  <label style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    <FaMoneyBillWave /> Price per Night (₹) *
                  </label>
                  <div className="add-room-input-wrap">
                    <FaMoneyBillWave className="add-room-input-icon" />
                    <input
                      type="number"
                      min="1"
                      className="add-room-input"
                      placeholder="e.g. 2500"
                      value={form.price}
                      required
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>
                </div>

                {/* Bed Type */}
                <div className="add-room-field">
                  <label style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    <FaBed /> Bed Setup
                  </label>
                  <div className="add-room-input-wrap">
                    <FaBed className="add-room-input-icon" />
                    <select
                      className="add-room-select"
                      value={form.beds}
                      onChange={(e) => setForm({ ...form, beds: e.target.value })}
                    >
                      <option value="1 King Bed">1 King Bed</option>
                      <option value="2 Queen Beds">2 Queen Beds</option>
                      <option value="1 Double Bed">1 Double Bed</option>
                      <option value="2 Single Beds">2 Single Beds</option>
                      <option value="1 Super King Bed">1 Super King Bed</option>
                    </select>
                  </div>
                </div>

                {/* Max Guests */}
                <div className="add-room-field">
                  <label style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    <FaUsers /> Max Guest Capacity
                  </label>
                  <div className="add-room-input-wrap">
                    <FaUsers className="add-room-input-icon" />
                    <select
                      className="add-room-select"
                      value={form.guests}
                      onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4 Guests</option>
                      <option value={5}>5+ Guests</option>
                    </select>
                  </div>
                </div>

                {/* Room Availability & Status */}
                <div className="add-room-field">
                  <label style={{ color: isDark ? "#ffffff" : "#0f172a" }}>
                    <FaCheck /> Status & Availability *
                  </label>
                  <div className="add-room-input-wrap">
                    <FaCheck className="add-room-input-icon" />
                    <select
                      className="add-room-select"
                      value={form.status || "Available"}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Room Description (Optional) */}
              <div className="add-room-field">
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: isDark ? "#ffffff" : "#0f172a" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaFileAlt /> Room Description
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>
                    (Optional)
                  </span>
                </label>
                <div className="add-room-input-wrap" style={{ alignItems: "flex-start", minHeight: "84px", padding: "8px 12px" }}>
                  <FaFileAlt className="add-room-input-icon" style={{ marginTop: "6px" }} />
                  <textarea
                    className="add-room-input"
                    rows={3}
                    style={{
                      width: "100%",
                      minHeight: "70px",
                      resize: "vertical",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      lineHeight: "1.5",
                    }}
                    placeholder="e.g. Luxurious suite featuring lake view, king bed, and private balcony. (Optional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* FULL INTEGRATED ROOM PHOTOS & IMAGE INPUTS SECTION */}
              <div
                style={{
                  background: isDark ? "#0f172a" : "#f8fafc",
                  border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FaImage />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
                        Room Photos & Image Gallery ({form.images.length})
                      </h4>
                      <span style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }}>
                        Add photo URLs, pick HD presets, upload files, or take live camera photos
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                        background: isDark ? "#1e293b" : "#ffffff",
                        color: isDark ? "#ffffff" : "#0f172a",
                        fontSize: "12.5px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FaUpload style={{ color: "#667eea" }} /> Upload Files
                    </button>

                    <button
                      type="button"
                      onClick={startCamera}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#ffffff",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                      }}
                    >
                      <FaCamera /> Live Camera
                    </button>
                  </div>
                </div>

                {/* IMAGE URL DIRECT INPUT */}
                <div className="add-room-field">
                  <label style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>
                    Paste Image URL directly:
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      className="add-room-input"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={form.image || ""}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      style={{ flex: 1, padding: "10px 14px", borderRadius: "10px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1", background: isDark ? "#1e293b" : "#ffffff", color: isDark ? "#ffffff" : "#0f172a", fontSize: "13px" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (form.image && form.image.trim()) {
                          const url = form.image.trim();
                          if (!form.images.includes(url)) {
                            setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
                          }
                        }
                      }}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#ffffff",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      + Add URL
                    </button>
                  </div>
                </div>

                {/* PRESET HOTEL ROOM IMAGES */}
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "8px" }}>
                    Or pick HD Preset Room Photos:
                  </span>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {PRESET_ROOM_IMAGES.map((imgUrl, i) => {
                      const isAdded = form.images.includes(imgUrl);
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (isAdded) {
                              setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img !== imgUrl) }));
                            } else {
                              setForm((prev) => ({ ...prev, images: [...prev.images, imgUrl] }));
                            }
                          }}
                          style={{
                            position: "relative",
                            width: "72px",
                            height: "54px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            cursor: "pointer",
                            border: isAdded ? "3px solid #667eea" : "2px solid transparent",
                            boxShadow: isAdded ? "0 4px 12px rgba(102, 126, 234, 0.4)" : "none",
                            opacity: isAdded ? 1 : 0.75,
                            transition: "all 0.2s ease",
                          }}
                        >
                          <img src={imgUrl} alt={`Preset ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {isAdded && (
                            <div style={{ position: "absolute", top: "4px", right: "4px", width: "18px", height: "18px", borderRadius: "50%", background: "#667eea", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                              <FaCheck />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ATTACHED GALLERY THUMBNAILS */}
                {form.images.length > 0 && (
                  <div style={{ paddingTop: "12px", borderTop: isDark ? "1px solid #334155" : "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a" }}>
                        Attached Photos Gallery ({form.images.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, images: [] }))}
                        style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Clear All
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {form.images.map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: "80px",
                            height: "60px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                          }}
                        >
                          <img src={img} alt={`Attached ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button type="button" title="Set as cover image" onClick={() => setForm((prev) => ({ ...prev, coverImage: img }))} style={{ position: "absolute", top: "3px", left: "3px", width: "18px", height: "18px", padding: 0, border: "none", borderRadius: "50%", background: form.coverImage === img ? "#ef4444" : "rgba(15,23,42,.72)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", fontSize: "9px" }}><FaStar /></button>
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: "rgba(239, 68, 68, 0.9)",
                              color: "#ffffff",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                            }}
                            title="Remove Photo"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AMENITIES SELECTOR */}
              <div className="amenities-section">
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: isDark ? "#cbd5e1" : "#475569",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaConciergeBell /> Select Room Amenities
                </label>
                <div className="amenities-grid">
                  {AVAILABLE_AMENITIES.map((amenity) => {
                    const isActive = form.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        className={`amenity-chip ${isActive ? "active" : ""}`}
                        onClick={() => toggleAmenity(amenity)}
                      >
                        {isActive ? <FaCheck style={{ fontSize: "11px" }} /> : null}
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MODAL STICKY FOOTER ACTIONS */}
              <div style={{ paddingTop: "16px", borderTop: isDark ? "1px solid #334155" : "1px solid #e2e8f0", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "12px",
                    border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                    background: isDark ? "#0f172a" : "#f8fafc",
                    color: isDark ? "#cbd5e1" : "#475569",
                    fontSize: "13.5px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "10px 28px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(102, 126, 234, 0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaCheck /> Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED IMAGE UPLOAD MODAL POPUP */}
      {isPhotoModalOpen && (
        <div className="photo-modal-backdrop">
          <div className="photo-modal-card">
            <div className="photo-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                  }}
                >
                  <FaImage />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "700" }}>
                    Room Photo Manager
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: isDark ? "#94a3b8" : "#64748b",
                    }}
                  >
                    Upload or capture photos for Room {form.number || "Inventory"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: isDark ? "#cbd5e1" : "#64748b",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="photo-modal-body">
              {/* ACTION BUTTONS: BROWSER FILE UPLOAD & CAMERA */}
              <div className="photo-sources-grid">
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className="photo-action-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FaUpload style={{ color: "#667eea" }} />
                    Upload Photos (Multiple)
                  </button>
                </div>

                <button
                  type="button"
                  className="photo-action-btn"
                  onClick={startCamera}
                >
                  <FaCamera style={{ color: "#667eea" }} />
                  Open Live Camera
                </button>
              </div>

              {/* UPLOADED GALLERY GRID */}
              {form.images.length > 0 ? (
                <div style={{ marginTop: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: isDark ? "#cbd5e1" : "#475569",
                      }}
                    >
                      Attached Room Photos ({form.images.length})
                    </span>

                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, images: [] }))}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Clear All Photos
                    </button>
                  </div>

                  <div className="multiple-images-grid">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="multiple-image-card">
                        <img src={img} alt={`Room photo ${idx + 1}`} />
                        <button type="button" title="Set as cover image" onClick={() => setForm((prev) => ({ ...prev, coverImage: img }))} style={{ position: "absolute", top: "3px", left: "3px", width: "18px", height: "18px", padding: 0, border: "none", borderRadius: "50%", background: form.coverImage === img ? "#ef4444" : "rgba(15,23,42,.72)", color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", fontSize: "9px", zIndex: 2 }}><FaStar /></button>
                        <button
                          type="button"
                          className="remove-img-btn"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== idx),
                            }))
                          }
                          title="Remove photo"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    color: isDark ? "#94a3b8" : "#64748b",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "16px",
                    marginTop: "16px",
                  }}
                >
                  <FaImage
                    style={{ fontSize: "32px", opacity: 0.5, marginBottom: "8px" }}
                  />
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600" }}>
                    No photos uploaded yet.
                  </p>
                  <span style={{ fontSize: "12px" }}>
                    Click above to select multiple photos or capture using camera.
                  </span>
                </div>
              )}
            </div>

            <div className="photo-modal-footer">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Save & Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE CAMERA CAPTURE MODAL */}
      {isCameraOpen && (
        <div className="camera-modal-backdrop">
          <div className="camera-modal-card">
            <div className="camera-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaCamera style={{ color: "#667eea" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                  Take Room Photo
                </h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: isDark ? "#cbd5e1" : "#64748b",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="camera-video-wrap">
              <video ref={videoRef} autoPlay playsInline muted />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>

            <div className="camera-controls">
              <button
                type="button"
                onClick={stopCamera}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: isDark ? "#0f172a" : "#f8fafc",
                  color: isDark ? "#cbd5e1" : "#475569",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={takeCameraSnap}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(102, 126, 234, 0.35)",
                }}
              >
                <FaCamera /> Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL ROOMS CLEAN SECTION */}
      <section className="rooms-section" style={{ padding: "0 8px" }}>


        {/* 2. SEARCH & FILTER TOOLBAR */}
        <div
          style={{
            background: isDark ? "#1e293b" : "#ffffff",
            border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "14px 18px",
            marginBottom: "24px",
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.03)",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* SEARCH INPUT */}
          <div style={{ position: "relative", flex: "1 1 260px", minWidth: "240px", maxWidth: "460px" }}>
            <input
              placeholder="Search room number, type, or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 36px 10px 40px",
                borderRadius: "12px",
                border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                background: isDark ? "#0f172a" : "#f8fafc",
                color: isDark ? "#ffffff" : "#0f172a",
                fontSize: "13.5px",
                outline: "none",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
              }}
            />
            <FaSearch style={{ position: "absolute", left: "14px", top: "13px", color: isDark ? "#64748b" : "#94a3b8", fontSize: "14px" }} />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "10px",
                  background: "transparent",
                  border: "none",
                  color: isDark ? "#94a3b8" : "#64748b",
                  cursor: "pointer",
                  padding: "4px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* FILTERS & VIEW MODE CONTROLS */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            {/* FLOORS DROPDOWN */}
            <div style={{ position: "relative" }}>
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                style={{
                  padding: "10px 34px 10px 14px",
                  borderRadius: "12px",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: isDark ? "#0f172a" : "#f8fafc",
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: "13px",
                  fontWeight: "600",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value="all">All Floors ({rooms.length})</option>
                {allFloors.map((fl) => {
                  const count = rooms.filter((r) => getRoomFloor(r) === fl).length;
                  return (
                    <option key={fl} value={fl}>
                      {fl} {count > 0 ? `(${count})` : ""}
                    </option>
                  );
                })}
              </select>
              <FaChevronDown
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  fontSize: "10px",
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              />
            </div>

            {/* STATUS DROPDOWN */}
            <div style={{ position: "relative" }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "10px 34px 10px 14px",
                  borderRadius: "12px",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: isDark ? "#0f172a" : "#f8fafc",
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: "13px",
                  fontWeight: "600",
                  outline: "none",
                  cursor: "pointer",
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
              >
                <option value="all">All Statuses</option>
                <option value="available">🟢 Available</option>
                <option value="occupied">🔴 Occupied</option>
                <option value="cleaning">🟡 Housekeeping</option>
                <option value="maintenance">🔧 Maintenance</option>
              </select>
              <FaChevronDown
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  fontSize: "10px",
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              />
            </div>

            {/* GRID & LIST VIEW TOGGLE (ONLY ICONS) */}
            <div
              style={{
                display: "inline-flex",
                background: isDark ? "#0f172a" : "#f1f5f9",
                borderRadius: "12px",
                padding: "3px",
                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                gap: "2px",
              }}
            >
              <button
                type="button"
                title="Grid View"
                aria-label="Grid View"
                onClick={() => setViewMode("grid")}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: viewMode === "grid" ? (isDark ? "#334155" : "#ffffff") : "transparent",
                  color: viewMode === "grid" ? "#6366f1" : (isDark ? "#94a3b8" : "#64748b"),
                  boxShadow: viewMode === "grid" ? (isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.08)") : "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  transition: "all 0.15s ease",
                }}
              >
                <FaThLarge />
              </button>
              <button
                type="button"
                title="List View"
                aria-label="List View"
                onClick={() => setViewMode("scroll")}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: viewMode === "scroll" ? (isDark ? "#334155" : "#ffffff") : "transparent",
                  color: viewMode === "scroll" ? "#6366f1" : (isDark ? "#94a3b8" : "#64748b"),
                  boxShadow: viewMode === "scroll" ? (isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.08)") : "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  transition: "all 0.15s ease",
                }}
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>

        {/* 4. FLOOR SECTION & ROOM CARDS */}
        {(() => {
          const floorsToRender = floorFilter === "all" ? sortedFloors : sortedFloors.filter(f => f === floorFilter);
          
          if (filteredRooms.length === 0) return null;

          return floorsToRender.map((floor) => {
            const floorRooms = floorGroups[floor];
            if (!floorRooms || floorRooms.length === 0) return null;
            
            const availableCount = floorRooms.filter(r => r.status.toLowerCase() === "available").length;
            const occupiedCount = floorRooms.filter(r => r.status.toLowerCase() === "occupied").length;
            const cleaningCount = floorRooms.filter(r => r.status.toLowerCase() === "cleaning").length;
            
            return (
              <div
                key={floor}
                style={{
                  background: isDark ? "#1e293b" : "#ffffff",
                  border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                  borderRadius: "24px",
                  padding: "24px",
                  marginBottom: "32px",
                  boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.2)" : "0 4px 24px rgba(31,34,51,0.04)",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {/* FLOOR HEADER */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    paddingBottom: "20px",
                    marginBottom: "24px",
                    borderBottom: isDark ? "1px solid #334155" : "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                      }}
                    >
                      <FaBuilding />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                        {floor}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <span style={{ fontSize: "13px", color: isDark ? "#94a3b8" : "#64748b", fontWeight: "600" }}>
                          {floorRooms.length} {floorRooms.length === 1 ? "Room" : "Rooms"}
                        </span>
                        
                        {viewMode === "scroll" && floorRooms.length > 3 && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                const el = floorScrollRefs.current[floor];
                                if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                              }}
                              style={{
                                width: "26px", height: "26px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                                background: isDark ? "#0f172a" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#334155",
                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
                              }}
                            >
                              <FaChevronLeft size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const el = floorScrollRefs.current[floor];
                                if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                              }}
                              style={{
                                width: "26px", height: "26px", borderRadius: "8px", border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                                background: isDark ? "#0f172a" : "#f1f5f9", color: isDark ? "#cbd5e1" : "#334155",
                                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
                              }}
                            >
                              <FaChevronRight size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: "700", background: isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7", color: isDark ? "#34d399" : "#166534", padding: "6px 14px", borderRadius: "999px" }}>
                      {availableCount} Available
                    </span>
                    {occupiedCount > 0 && (
                      <span style={{ fontSize: "12px", fontWeight: "700", background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2", color: isDark ? "#fca5a5" : "#991b1b", padding: "6px 14px", borderRadius: "999px" }}>
                        {occupiedCount} Occupied
                      </span>
                    )}
                    {cleaningCount > 0 && (
                      <span style={{ fontSize: "12px", fontWeight: "700", background: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7", color: isDark ? "#fbbf24" : "#92400e", padding: "6px 14px", borderRadius: "999px" }}>
                        {cleaningCount} Cleaning
                      </span>
                    )}

                  </div>
                </div>

                {/* ROOM CARDS */}
                <div
                  ref={(el) => (floorScrollRefs.current[floor] = el)}
                  style={{
                    display: viewMode === "grid" ? "grid" : "flex",
                    gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(320px, 1fr))" : "none",
                    flexDirection: viewMode === "grid" ? "column" : "row",
                    flexWrap: viewMode === "grid" ? "nowrap" : "nowrap",
                    alignItems: "stretch",
                    gap: "24px",
                    width: "100%",
                    overflowX: viewMode === "grid" ? "hidden" : "auto",
                    paddingBottom: "16px",
                    WebkitOverflowScrolling: "touch",
                    scrollBehavior: "smooth",
                    boxSizing: "border-box"
                  }}
                >
                  {floorRooms.map((room) => {
                    const popular = room.isPopular || room.badge === "Popular" || room.rating >= 4.5;
                    const roomTitle = room.title || room.name || (room.number ? `Room ${room.number}` : `${room.type || "Standard"} Room`);

                    // Resolve status colors
                    let statusColor = "#334155";
                    let statusBg = "#f1f5f9";
                    const statusLow = room.status.toLowerCase();
                    if (statusLow === "available") { statusColor = "#166534"; statusBg = "#dcfce7"; }
                    else if (statusLow === "occupied") { statusColor = "#991b1b"; statusBg = "#fee2e2"; }
                    else if (statusLow === "cleaning") { statusColor = "#92400e"; statusBg = "#fef3c7"; }
                    else if (statusLow === "maintenance") { statusColor = "#334155"; statusBg = "#e2e8f0"; }
                    if (isDark) {
                      if (statusLow === "available") { statusColor = "#34d399"; statusBg = "rgba(16, 185, 129, 0.2)"; }
                      else if (statusLow === "occupied") { statusColor = "#fca5a5"; statusBg = "rgba(239, 68, 68, 0.2)"; }
                      else if (statusLow === "cleaning") { statusColor = "#fbbf24"; statusBg = "rgba(245, 158, 11, 0.2)"; }
                      else if (statusLow === "maintenance") { statusColor = "#cbd5e1"; statusBg = "rgba(100, 116, 139, 0.2)"; }
                    }

                    return (
                      <article
                        key={room.id}
                        onClick={() => navigate(`/rooms/${room.id}`)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: isDark ? "linear-gradient(145deg, #1e293b, #0f172a)" : "#ffffff",
                          border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)",
                          borderRadius: "24px",
                          overflow: "hidden",
                          boxShadow: isDark 
                            ? "0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.2) inset" 
                            : "0 20px 40px -10px rgba(15,23,42,0.08)",
                          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                          cursor: "pointer",
                          minWidth: viewMode === "scroll" ? "360px" : "auto",
                          width: viewMode === "scroll" ? "360px" : "100%",
                          flexShrink: 0,
                          position: "relative",
                          height: "100%",
                        }}
                        onMouseEnter={(e) => { 
                          e.currentTarget.style.transform = "translateY(-8px)"; 
                          e.currentTarget.style.boxShadow = isDark 
                            ? "0 24px 48px -12px rgba(0,0,0,0.6), 0 0 24px rgba(0,0,0,0.3) inset" 
                            : "0 24px 48px -12px rgba(15,23,42,0.15)"; 
                          const img = e.currentTarget.querySelector('img');
                          if(img) img.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => { 
                          e.currentTarget.style.transform = "translateY(0)"; 
                          e.currentTarget.style.boxShadow = isDark 
                            ? "0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.2) inset" 
                            : "0 20px 40px -10px rgba(15,23,42,0.08)"; 
                          const img = e.currentTarget.querySelector('img');
                          if(img) img.style.transform = "scale(1)";
                        }}
                      >
                        {/* 5. IMAGE SECTION */}
                        <div style={{ position: "relative", width: "100%", height: "240px", flexShrink: 0, overflow: "hidden" }}>
                          <img
                            src={room.image || (Array.isArray(room.images) && room.images[0]) || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"}
                            alt={roomTitle}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                          />
                          
                          {/* Top Left Badges */}
                          <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", gap: "8px", flexDirection: "column", alignItems: "flex-start" }}>
                            {popular && (
                              <span style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#ffffff", padding: "6px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px", boxShadow: "0 4px 12px rgba(217,119,6,0.3)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <FaCrown size={12} /> POPULAR
                              </span>
                            )}
                          </div>
                          
                          {/* Top Right Status Badge */}
                          <div style={{ position: "absolute", top: "16px", right: "16px" }}>
                            <span style={{ background: statusBg, color: statusColor, padding: "6px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px", backdropFilter: "blur(8px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColor }}></div>
                              {room.status}
                            </span>
                          </div>

                          {/* Bottom Left Room Number */}
                          <div style={{ position: "absolute", bottom: "16px", left: "16px", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "6px 14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                            <FaDoorOpen style={{ color: "#a5b4fc", fontSize: "14px" }} />
                            <span style={{ fontSize: "14px", fontWeight: "800", letterSpacing: "0.5px" }}>{room.number || roomTitle}</span>
                          </div>

                          {/* Bottom Right Image Count */}
                          {Array.isArray(room.images) && room.images.length > 1 && (
                            <div style={{ position: "absolute", bottom: "16px", right: "16px", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", color: "#ffffff", padding: "6px 12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                              <FaImage /> {room.images.length}
                            </div>
                          )}
                        </div>

                        {/* 6. DETAIL SECTION */}
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", flex: 1 }}>
                          <div style={{ marginBottom: "16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: isDark ? "rgba(99, 102, 241, 0.15)" : "#e0e7ff", color: isDark ? "#a5b4fc" : "#4338ca", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                              {room.type || "Standard Room"}
                            </span>
                            <h4 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a", lineHeight: "1.2", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                              {roomTitle}
                            </h4>
                            <p style={{ margin: 0, fontSize: "14px", color: isDark ? "#94a3b8" : "#64748b", lineHeight: "1.5", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                              {room.shortDescription || room.description || "Experience comfort and luxury in our thoughtfully designed room, perfect for your stay."}
                            </p>
                          </div>

                          {/* Occupied Booking Banner if present */}
                          {(() => {
                            const bk = getActiveBookingForRoom(room);
                            if (!bk) return null;
                            return (
                              <div style={{ margin: "0 0 16px 0", padding: "12px 16px", borderRadius: "12px", background: isDark ? "rgba(99, 102, 241, 0.15)" : "linear-gradient(135deg, #e0e7ff 0%, #f3f4f6 100%)", border: isDark ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid #c7d2fe", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)" }}>
                                    <FaUser />
                                  </div>
                                  <div>
                                    <span style={{ display: "block", fontSize: "13px", fontWeight: "800", color: isDark ? "#e0e7ff" : "#312e81" }}>{bk.guestName}</span>
                                    <span style={{ display: "block", fontSize: "11px", fontWeight: "600", color: isDark ? "#a5b4fc" : "#4f46e5", marginTop: "2px" }}>{bk.checkIn} → {bk.checkOut}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Compact Amenities Grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "auto", marginBottom: "24px", flexGrow: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: isDark ? "#cbd5e1" : "#475569", fontSize: "13px", fontWeight: "600", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: "8px 12px", borderRadius: "10px" }}>
                              <TbBed style={{ color: "#6366f1", fontSize: "16px" }} />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.beds || "1 King"}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: isDark ? "#cbd5e1" : "#475569", fontSize: "13px", fontWeight: "600", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: "8px 12px", borderRadius: "10px" }}>
                              <FiUsers style={{ color: "#6366f1", fontSize: "16px" }} />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Up to {room.guests || 2}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: isDark ? "#cbd5e1" : "#475569", fontSize: "13px", fontWeight: "600", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: "8px 12px", borderRadius: "10px" }}>
                              <FiMaximize style={{ color: "#6366f1", fontSize: "16px" }} />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.sizeSqm || 28} m²</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: isDark ? "#cbd5e1" : "#475569", fontSize: "13px", fontWeight: "600", background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", padding: "8px 12px", borderRadius: "10px" }}>
                              <FiSun style={{ color: "#6366f1", fontSize: "16px" }} />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.roomView || "City View"}</span>
                            </div>
                          </div>

                          {/* 7. PRICE & ACTION SECTION */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "20px", borderTop: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #f1f5f9", flexWrap: "wrap", gap: "12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Nightly Rate
                              </span>
                              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                                <span style={{ fontSize: "24px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                                  ₹{Number(room.price).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {room.status === "Available" && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedRoomToBook(room); }}
                                  style={{ padding: "10px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "#ffffff", fontSize: "14px", fontWeight: "700", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 16px -4px rgba(99, 102, 241, 0.4)", transition: "all 0.2s ease" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                                >
                                  <FaCalendarAlt /> Book
                                </button>
                              )}

                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/rooms/${room.id}`); }}
                                  title="View Details"
                                  style={{ width: "36px", height: "36px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc", color: isDark ? "#cbd5e1" : "#64748b", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"; }}
                                >
                                  <FaEye />
                                </button>
                                {hasFullAccess && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); startEditRoom(room); }}
                                      title="Edit Room"
                                      style={{ width: "36px", height: "36px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc", color: isDark ? "#cbd5e1" : "#64748b", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease" }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#f1f5f9"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "#f8fafc"; }}
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}
                                      title="Delete Room"
                                      style={{ width: "36px", height: "36px", borderRadius: "10px", background: isDark ? "rgba(239, 68, 68, 0.1)" : "#fee2e2", color: isDark ? "#fca5a5" : "#ef4444", border: isDark ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease" }}
                                      onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? "rgba(239, 68, 68, 0.2)" : "#fecaca"; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? "rgba(239, 68, 68, 0.1)" : "#fee2e2"; }}
                                    >
                                      <FaTrash />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}

        {filteredRooms.length === 0 && (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              background: isDark ? "#1e293b" : "#ffffff",
              border: isDark ? "1px dashed #334155" : "1px dashed #cbd5e1",
              borderRadius: "24px",
              marginTop: "24px",
            }}
          >
            <FaDoorOpen style={{ fontSize: "48px", color: "#6366f1", marginBottom: "16px", opacity: 0.6 }} />
            <h4 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 8px 0", color: isDark ? "#ffffff" : "#0f172a" }}>
              {rooms.length === 0 ? "No rooms configured" : "No rooms match your filter"}
            </h4>
            <p style={{ fontSize: "14px", margin: "0 0 24px 0", color: isDark ? "#94a3b8" : "#64748b", maxWidth: "400px", marginInline: "auto" }}>
              {rooms.length === 0
                ? "Get started by adding rooms to this branch or switch to another branch."
                : "Try adjusting your search query, status filter, or selected floor."}
            </p>
            {rooms.length === 0 && hasFullAccess && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: "12px 24px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "800",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                }}
              >
                <FaPlus /> Add First Room
              </button>
            )}
          </div>
        )}
      </section>

      {/* BOOK ROOM MODAL WITH DOCUMENT UPLOAD */}
      {selectedRoomToBook && (
        <BookRoomModal
          room={selectedRoomToBook}
          isOpen={!!selectedRoomToBook}
          onClose={() => setSelectedRoomToBook(null)}
          onConfirm={handleConfirmBooking}
        />
      )}

      {/* EDIT ROOM MODAL POP-UP */}
      {editingRoom && (
        <div
          className="modal-backdrop"
          onClick={() => setEditingRoom(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              color: isDark ? "#ffffff" : "#0f172a",
              borderRadius: "24px",
              maxWidth: "620px",
              width: "100%",
              padding: "28px 32px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                paddingBottom: "14px",
                borderBottom: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                  }}
                >
                  <FaEdit />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>
                    Edit Room Details
                  </h3>
                  <span style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }}>
                    Update details for Room {editingRoom.number || editingRoom.roomNumber}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  color: isDark ? "#94a3b8" : "#64748b",
                  cursor: "pointer",
                }}
              >
                &times;
              </button>
            </div>

            {/* EDIT FORM */}
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                    Room Number
                  </label>
                  <input
                    value={editForm.number}
                    onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      fontSize: "13.5px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                    Room Type
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      fontSize: "13.5px",
                    }}
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="Family">Family</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                  Room Name / Title
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Garden View Standard"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontSize: "13.5px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                    Floor
                  </label>
                  <select
                    value={editForm.floor}
                    onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      fontSize: "13.5px",
                    }}
                  >
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                    <option value="5th Floor">5th Floor</option>
                    <option value="6th Floor">6th Floor</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                    Room View
                  </label>
                  <input
                    value={editForm.roomView}
                    onChange={(e) => setEditForm({ ...editForm, roomView: e.target.value })}
                    placeholder="e.g. Garden View"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      fontSize: "13.5px",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                    Price / Night (₹)
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      fontSize: "13.5px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                    Guests
                  </label>
                  <input
                    type="number"
                    value={editForm.guests}
                    onChange={(e) => setEditForm({ ...editForm, guests: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      fontSize: "13.5px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                      background: isDark ? "#0f172a" : "#ffffff",
                      color: isDark ? "#ffffff" : "#0f172a",
                      fontSize: "13.5px",
                    }}
                  >
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={editForm.shortDescription}
                  onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="editIsPopular"
                  checked={editForm.isPopular}
                  onChange={(e) => setEditForm({ ...editForm, isPopular: e.target.checked })}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="editIsPopular" style={{ fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  Mark as Popular Room Badge
                </label>
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#cbd5e1" : "#475569",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                  }}
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TO MANAGE / DELETE FLOORS & ROOM NUMBERS */}
      {showManageStructureModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowManageStructureModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              borderRadius: "20px",
              maxWidth: "640px",
              width: "100%",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.45)",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "18px 24px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "16px",
                  }}
                >
                  <FaBuilding />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>
                    Manage Floors & Room Numbers
                  </h4>
                  <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                    Easily configure or delete property floors and room numbers
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowManageStructureModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#cbd5e1",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div
              style={{
                display: "flex",
                borderBottom: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                background: isDark ? "#0f172a" : "#f8fafc",
                padding: "0 24px",
              }}
            >
              <button
                type="button"
                onClick={() => setManageTab("floors")}
                style={{
                  padding: "14px 18px",
                  border: "none",
                  background: "transparent",
                  borderBottom: manageTab === "floors" ? "3px solid #6366f1" : "3px solid transparent",
                  color: manageTab === "floors" ? (isDark ? "#ffffff" : "#0f172a") : (isDark ? "#94a3b8" : "#64748b"),
                  fontWeight: manageTab === "floors" ? "800" : "600",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaBuilding /> Floors ({availableFloorsList.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setManageTab("rooms");
                  loadFloorRoomNumbers(manageSelectedFloor);
                }}
                style={{
                  padding: "14px 18px",
                  border: "none",
                  background: "transparent",
                  borderBottom: manageTab === "rooms" ? "3px solid #6366f1" : "3px solid transparent",
                  color: manageTab === "rooms" ? (isDark ? "#ffffff" : "#0f172a") : (isDark ? "#94a3b8" : "#64748b"),
                  fontWeight: manageTab === "rooms" ? "800" : "600",
                  fontSize: "13.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaDoorOpen /> Room Numbers
              </button>
            </div>

            {/* TAB CONTENT (SCROLLABLE) */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              {manageTab === "floors" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* QUICK ADD FLOOR INLINE ROW */}
                  <form
                    onSubmit={handleAddNewFloor}
                    style={{
                      display: "flex",
                      gap: "8px",
                      padding: "12px 14px",
                      background: isDark ? "#0f172a" : "#f1f5f9",
                      borderRadius: "14px",
                      border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        placeholder="Type new floor name (e.g. 8th Floor, Penthouse)..."
                        value={newFloorNameInput}
                        onChange={(e) => {
                          setNewFloorNameInput(e.target.value);
                          if (floorModalError) setFloorModalError(null);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: floorModalError ? "1px solid #ef4444" : (isDark ? "1px solid #334155" : "1px solid #cbd5e1"),
                          background: isDark ? "#1e293b" : "#ffffff",
                          color: isDark ? "#ffffff" : "#0f172a",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingFloor || !newFloorNameInput.trim()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        color: "#ffffff",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        cursor: (isSubmittingFloor || !newFloorNameInput.trim()) ? "not-allowed" : "pointer",
                        opacity: (isSubmittingFloor || !newFloorNameInput.trim()) ? 0.6 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isSubmittingFloor ? "Adding..." : <><FaPlus size={10} /> Add Floor</>}
                    </button>
                  </form>
                  {floorModalError && (
                    <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "-6px", display: "block" }}>
                      ⚠️ {floorModalError}
                    </span>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569" }}>
                      Configured Floors ({availableFloorsList.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFloorModalError(null);
                        setNewFloorNameInput("");
                        setShowAddFloorModal(true);
                      }}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "8px",
                        border: "none",
                        background: isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)",
                        color: isDark ? "#a5b4fc" : "#4f46e5",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <FaPlus size={9} /> Open Add Dialog
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {availableFloorsList.map((fl) => {
                      const floorRoomsCount = rooms.filter((r) => getRoomFloor(r) === fl).length;
                      return (
                        <div
                          key={fl}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            background: isDark ? "#0f172a" : "#f8fafc",
                            border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <FaBuilding style={{ color: "#6366f1" }} />
                            <div>
                              <span style={{ fontWeight: "700", fontSize: "14px", color: isDark ? "#ffffff" : "#0f172a" }}>
                                {fl}
                              </span>
                              <span style={{ display: "block", fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b" }}>
                                {floorRoomsCount} {floorRoomsCount === 1 ? "room" : "rooms"} assigned
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setManageSelectedFloor(fl);
                                setManageTab("rooms");
                                loadFloorRoomNumbers(fl);
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                                background: isDark ? "#1e293b" : "#ffffff",
                                color: isDark ? "#cbd5e1" : "#475569",
                                fontSize: "12px",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              View Numbers
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingItem}
                              onClick={() => handleDeleteFloor(fl)}
                              title={`Delete ${fl}`}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: isDark ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid #fecaca",
                                background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
                                color: isDark ? "#fca5a5" : "#ef4444",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: isDeletingItem ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <FaTrash size={11} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {manageTab === "rooms" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "4px" }}>
                        Selected Floor:
                      </label>
                      <select
                        value={manageSelectedFloor}
                        onChange={(e) => {
                          setManageSelectedFloor(e.target.value);
                          loadFloorRoomNumbers(e.target.value);
                        }}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "10px",
                          border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                          background: isDark ? "#0f172a" : "#ffffff",
                          color: isDark ? "#ffffff" : "#0f172a",
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        {availableFloorsList.map((fl) => (
                          <option key={fl} value={fl}>
                            {fl}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, floor: manageSelectedFloor }));
                        setRoomNumberModalError(null);
                        setNewRoomNumberInput("");
                        setShowAddRoomNumberModal(true);
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FaPlus size={10} /> Open Add Dialog
                    </button>
                  </div>

                  {/* QUICK ADD ROOM NUMBER INLINE ROW */}
                  <form
                    onSubmit={handleAddNewRoomNumber}
                    style={{
                      display: "flex",
                      gap: "8px",
                      padding: "12px 14px",
                      background: isDark ? "#0f172a" : "#f1f5f9",
                      borderRadius: "14px",
                      border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        placeholder={`Enter room number for ${manageSelectedFloor} (e.g. 101, 205-A)...`}
                        value={newRoomNumberInput}
                        onChange={(e) => {
                          setNewRoomNumberInput(e.target.value);
                          if (roomNumberModalError) setRoomNumberModalError(null);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: roomNumberModalError ? "1px solid #ef4444" : (isDark ? "1px solid #334155" : "1px solid #cbd5e1"),
                          background: isDark ? "#1e293b" : "#ffffff",
                          color: isDark ? "#ffffff" : "#0f172a",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingRoomNumber || !newRoomNumberInput.trim()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        color: "#ffffff",
                        fontSize: "12.5px",
                        fontWeight: "700",
                        cursor: (isSubmittingRoomNumber || !newRoomNumberInput.trim()) ? "not-allowed" : "pointer",
                        opacity: (isSubmittingRoomNumber || !newRoomNumberInput.trim()) ? 0.6 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isSubmittingRoomNumber ? "Adding..." : <><FaPlus size={10} /> Add Number</>}
                    </button>
                  </form>
                  {roomNumberModalError && (
                    <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "-6px", display: "block" }}>
                      ⚠️ {roomNumberModalError}
                    </span>
                  )}

                  <div>
                    <span style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#cbd5e1" : "#475569", display: "block", marginBottom: "8px" }}>
                      Configured Room Numbers for {manageSelectedFloor}:
                    </span>

                    {configuredRoomNumbers.length === 0 ? (
                      <div style={{ padding: "24px", textAlign: "center", borderRadius: "12px", background: isDark ? "#0f172a" : "#f8fafc", border: isDark ? "1px dashed #334155" : "1px dashed #cbd5e1" }}>
                        <span style={{ fontSize: "13px", color: isDark ? "#94a3b8" : "#64748b" }}>
                          No room numbers configured for {manageSelectedFloor}.
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                        {configuredRoomNumbers.map((num) => {
                          const assignedRoom = rooms.find(
                            (r) =>
                              (r.roomNumber === num || r.number === num) &&
                              getRoomFloor(r) === manageSelectedFloor
                          );
                          const isAssigned = Boolean(assignedRoom);

                          return (
                            <div
                              key={num}
                              style={{
                                padding: "10px 12px",
                                borderRadius: "12px",
                                background: isDark ? "#0f172a" : "#ffffff",
                                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                position: "relative",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: "800", fontSize: "14px", color: isDark ? "#ffffff" : "#0f172a" }}>
                                  Room {num}
                                </span>
                                <button
                                  type="button"
                                  disabled={isDeletingItem || isAssigned}
                                  onClick={() => handleDeleteRoomNumber(manageSelectedFloor, num)}
                                  title={isAssigned ? "Cannot delete assigned room number" : `Delete Room ${num}`}
                                  style={{
                                    border: "none",
                                    background: isAssigned ? "transparent" : (isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2"),
                                    color: isAssigned ? (isDark ? "#475569" : "#cbd5e1") : "#ef4444",
                                    width: "22px",
                                    height: "22px",
                                    borderRadius: "6px",
                                    cursor: isAssigned ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                  }}
                                >
                                  <FaTrash />
                                </button>
                              </div>

                              <span
                                style={{
                                  fontSize: "10.5px",
                                  fontWeight: "700",
                                  color: isAssigned ? "#3b82f6" : "#10b981",
                                  background: isAssigned ? (isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff") : (isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5"),
                                  padding: "2px 6px",
                                  borderRadius: "6px",
                                  display: "inline-block",
                                  width: "fit-content",
                                }}
                              >
                                {isAssigned ? "In Use" : "Available"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TO ADD NEW ROOM NUMBER - Z-INDEX 11000 */}
      {showAddRoomNumberModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddRoomNumberModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 11000,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              borderRadius: "20px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.45)",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "18px 24px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "16px",
                  }}
                >
                  <FaDoorOpen />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>
                    Add Room Number
                  </h4>
                  <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                    Configure a new room number for {(showManageStructureModal && manageTab === "rooms") ? manageSelectedFloor : (form.floor || "1st Floor")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddRoomNumberModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#cbd5e1",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* MODAL BODY */}
            <form onSubmit={handleAddNewRoomNumber} style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: isDark ? "#94a3b8" : "#64748b", marginBottom: "6px" }}>
                  Selected Floor
                </label>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    background: isDark ? "#0f172a" : "#f1f5f9",
                    border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontWeight: "700",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaBuilding style={{ color: "#6366f1" }} />
                  {(showManageStructureModal && manageTab === "rooms") ? manageSelectedFloor : (form.floor || "1st Floor")}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", marginBottom: "6px" }}>
                  Room Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 101, 102, 105-A"
                  value={newRoomNumberInput}
                  onChange={(e) => {
                    setNewRoomNumberInput(e.target.value);
                    if (roomNumberModalError) setRoomNumberModalError(null);
                  }}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: roomNumberModalError ? "1px solid #ef4444" : (isDark ? "1px solid #334155" : "1px solid #cbd5e1"),
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                {roomNumberModalError && (
                  <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", display: "block" }}>
                    ⚠️ {roomNumberModalError}
                  </span>
                )}
                <span style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b", marginTop: "6px", display: "block" }}>
                  Once added, this room number will immediately appear in the {(showManageStructureModal && manageTab === "rooms") ? manageSelectedFloor : (form.floor || "1st Floor")} dropdown.
                </span>
              </div>

              {/* MODAL ACTIONS */}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddRoomNumberModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#cbd5e1" : "#475569",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRoomNumber}
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: isSubmittingRoomNumber ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {isSubmittingRoomNumber ? "Adding..." : <><FaPlus size={11} /> Add & Select</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TO ADD NEW FLOOR - Z-INDEX 11000 */}
      {showAddFloorModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddFloorModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 11000,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              borderRadius: "20px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.45)",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "18px 24px",
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "16px",
                  }}
                >
                  <FaBuilding />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>
                    Add New Floor
                  </h4>
                  <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                    Create a custom floor for room management
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddFloorModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "#cbd5e1",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* MODAL BODY */}
            <form onSubmit={handleAddNewFloor} style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: isDark ? "#ffffff" : "#0f172a", marginBottom: "6px" }}>
                  Floor Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ground Floor, Penthouse, 11th Floor"
                  value={newFloorNameInput}
                  onChange={(e) => {
                    setNewFloorNameInput(e.target.value);
                    if (floorModalError) setFloorModalError(null);
                  }}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    border: floorModalError ? "1px solid #ef4444" : (isDark ? "1px solid #334155" : "1px solid #cbd5e1"),
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                {floorModalError && (
                  <span style={{ fontSize: "12px", color: "#ef4444", marginTop: "6px", display: "block" }}>
                    ⚠️ {floorModalError}
                  </span>
                )}
                <span style={{ fontSize: "11.5px", color: isDark ? "#94a3b8" : "#64748b", marginTop: "6px", display: "block" }}>
                  Once added, this floor will be available for room assignment and room number configuration.
                </span>
              </div>

              {/* MODAL ACTIONS */}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddFloorModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                    background: isDark ? "#0f172a" : "#ffffff",
                    color: isDark ? "#cbd5e1" : "#475569",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFloor}
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: isSubmittingFloor ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {isSubmittingFloor ? "Adding..." : <><FaPlus size={11} /> Add & Select Floor</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM LUXURY CONFIRMATION DIALOG - Z-INDEX 12000 */}
      {confirmModal && (
        <div
          className="modal-backdrop"
          onClick={() => setConfirmModal(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 12000,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="modal-content" // modal container
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? "#1e293b" : "#ffffff",
              borderRadius: "20px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.45)",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
              overflow: "hidden",
              textAlign: "center",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                boxShadow: "0 0 0 8px " + (isDark ? "rgba(239, 68, 68, 0.08)" : "#fef2f2"),
              }}
            >
              <FaTrash />
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "800", color: isDark ? "#ffffff" : "#0f172a" }}>
                {confirmModal.title || "Confirm Action"}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: isDark ? "#cbd5e1" : "#334155", lineHeight: "1.4" }}>
                {confirmModal.message}
              </p>
              {confirmModal.description && (
                <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  {confirmModal.description}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "10px",
                  border: isDark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: isDark ? "#0f172a" : "#ffffff",
                  color: isDark ? "#cbd5e1" : "#475569",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
} // end of component
