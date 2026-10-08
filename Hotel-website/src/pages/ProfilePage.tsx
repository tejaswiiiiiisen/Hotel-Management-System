import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { showSuccess, showError, showWarning, showInfo, handleApiError } from "../utils/toast";
import {
  FiGrid,
  FiCalendar,
  FiUsers,
  FiUser,
  FiHome,
  FiSearch,
  FiBell,
  FiGlobe,
  FiLogOut,
  FiLock,
  FiCheckCircle,
  FiSave,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiX,
  FiLayers,
  FiMapPin,
  FiCreditCard,
  FiClock,
  FiEye,
  FiInfo,
  FiFileText,
  FiShield,
  FiDownload,
  FiCamera,
  FiFolder,
  FiUploadCloud,
} from "react-icons/fi";
import { useGuests } from "../context/GuestsContext";
import { useTitle } from "../lib/useTitle";
import { apiFetch } from "../lib/api";
import {
  uploadAvatarToSupabase,
  listSupabaseAvatars,
  isSupabaseConfigured,
} from "../lib/supabase";
import type { User, Room } from "../types";

const DUMMY_BOOKINGS = [
  {
    id: "RES-84920",
    roomName: "Royal Lakeview Suite",
    roomNumber: "Suite 402",
    floor: "4th Floor (Executive Lakeview Wing)",
    roomView: "Panoramic Lake & Alpine Mountain View",
    location: "Lakeside Promenade 12, Salzburg, Austria",
    type: "Current",
    status: "Active Stay",
    checkInDate: "16 Aug 2026",
    checkInTime: "02:00 PM",
    checkOutDate: "19 Aug 2026",
    checkOutTime: "11:00 AM",
    nights: 3,
    days: 4,
    guests: "2 Adults",
    guestList: [
      {
        name: "Neha Jaiswal",
        relation: "Primary / Lead Guest",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-4829",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Neha_Jaiswal_FrontBack.pdf",
      },
      {
        name: "Vikram Jaiswal",
        relation: "Co-Guest (Spouse)",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-8912",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Vikram_Jaiswal_FrontBack.pdf",
      },
    ],
    amountPaid: 540.00,
    nightlyRate: 180.00,
    paymentMethod: "Credit Card (Visa **** 4242)",
    paymentStatus: "Paid In Full",
    image: "/images/rooms/room-1.avif",
    amenities: ["King Bed", "Private Balcony", "Jacuzzi Spa", "24/7 Butler Service", "Free Ultra-Fast Wi-Fi"],
  },
  {
    id: "RES-71043",
    roomName: "Deluxe Alpine Vista Room",
    roomNumber: "Room 308",
    floor: "3rd Floor (Alpine Vista Wing)",
    roomView: "Mountain & Snow Valley View",
    location: "Lakeside Promenade 12, Salzburg, Austria",
    type: "Previous",
    status: "Checked Out",
    checkInDate: "02 Jul 2026",
    checkInTime: "02:00 PM",
    checkOutDate: "05 Jul 2026",
    checkOutTime: "11:00 AM",
    nights: 3,
    days: 4,
    guests: "2 Adults, 1 Child",
    guestList: [
      {
        name: "Neha Jaiswal",
        relation: "Primary / Lead Guest",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-4829",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Neha_Jaiswal_FrontBack.pdf",
      },
      {
        name: "Rohan Jaiswal",
        relation: "Co-Guest (Spouse)",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-3104",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Rohan_Jaiswal_FrontBack.pdf",
      },
      {
        name: "Kavya Jaiswal",
        relation: "Co-Guest (Child)",
        idType: "Passport / Birth Certificate",
        idNumber: "XXXX-9021",
        idStatus: "Verified & Approved",
        idDocName: "BirthCertificate_Kavya_Jaiswal.pdf",
      },
    ],
    amountPaid: 420.00,
    nightlyRate: 140.00,
    paymentMethod: "PayPal",
    paymentStatus: "Completed",
    image: "/images/rooms/room-2.avif",
    amenities: ["Double Queen Beds", "Mountain Balcony", "Mini Bar", "Complimentary Breakfast"],
  },
  {
    id: "RES-59281",
    roomName: "Grand Presidential Suite",
    roomNumber: "Suite 601",
    floor: "6th Floor (Penthouse Floor)",
    roomView: "360-Degree Panoramic View",
    location: "Lakeside Promenade 12, Salzburg, Austria",
    type: "Previous",
    status: "Checked Out",
    checkInDate: "14 May 2026",
    checkInTime: "02:00 PM",
    checkOutDate: "17 May 2026",
    checkOutTime: "11:00 AM",
    nights: 3,
    days: 4,
    guests: "2 Adults",
    guestList: [
      {
        name: "Neha Jaiswal",
        relation: "Primary / Lead Guest",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-4829",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Neha_Jaiswal_FrontBack.pdf",
      },
      {
        name: "Priya Sharma",
        relation: "Co-Guest (Friend)",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-7721",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Priya_Sharma_FrontBack.pdf",
      },
    ],
    amountPaid: 890.00,
    nightlyRate: 296.67,
    paymentMethod: "Credit Card (Mastercard **** 8819)",
    paymentStatus: "Completed",
    image: "/images/rooms/room-3.avif",
    amenities: ["Master Suite", "Private Terrace Pool", "VIP Lounge Access", "Airport Shuttle"],
  },
  {
    id: "RES-41928",
    roomName: "Luxury Panorama Penthouse",
    roomNumber: "Penthouse 702",
    floor: "7th Floor (Top Floor Penthouse)",
    roomView: "Skyline & Lakefront View",
    location: "Lakeside Promenade 12, Salzburg, Austria",
    type: "Previous",
    status: "Checked Out",
    checkInDate: "10 Feb 2026",
    checkInTime: "02:00 PM",
    checkOutDate: "14 Feb 2026",
    checkOutTime: "11:00 AM",
    nights: 4,
    days: 5,
    guests: "2 Adults",
    guestList: [
      {
        name: "Neha Jaiswal",
        relation: "Primary / Lead Guest",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-4829",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Neha_Jaiswal_FrontBack.pdf",
      },
      {
        name: "Vikram Jaiswal",
        relation: "Co-Guest (Spouse)",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-8912",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Vikram_Jaiswal_FrontBack.pdf",
      },
    ],
    amountPaid: 1120.00,
    nightlyRate: 280.00,
    paymentMethod: "Credit Card (Visa **** 9912)",
    paymentStatus: "Completed",
    image: "/images/rooms/room-4.avif",
    amenities: ["Sky Lounge", "Sauna & Steam Bath", "Full Kitchen", "Dedicated Concierge"],
  },
  {
    id: "RES-38102",
    roomName: "Executive Garden Bungalow",
    roomNumber: "Bungalow B-12",
    floor: "Ground Floor (Botanical Garden Courtyard)",
    roomView: "Private Garden & Fountain View",
    location: "Lakeside Promenade 12, Salzburg, Austria",
    type: "Previous",
    status: "Checked Out",
    checkInDate: "20 Dec 2025",
    checkInTime: "02:00 PM",
    checkOutDate: "23 Dec 2025",
    checkOutTime: "11:00 AM",
    nights: 3,
    days: 4,
    guests: "3 Adults",
    guestList: [
      {
        name: "Neha Jaiswal",
        relation: "Primary / Lead Guest",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-4829",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Neha_Jaiswal_FrontBack.pdf",
      },
      {
        name: "Anil Jaiswal",
        relation: "Co-Guest (Parent)",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-5109",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Anil_Jaiswal_FrontBack.pdf",
      },
      {
        name: "Sunita Jaiswal",
        relation: "Co-Guest (Parent)",
        idType: "Aadhaar Card",
        idNumber: "XXXX-XXXX-6612",
        idStatus: "Verified & Approved",
        idDocName: "Aadhaar_Sunita_Jaiswal_FrontBack.pdf",
      },
    ],
    amountPaid: 650.00,
    nightlyRate: 216.67,
    paymentMethod: "Apple Pay",
    paymentStatus: "Completed",
    image: "/images/rooms/room-5.avif",
    amenities: ["Garden Terrace", "Fireplace Lounge", "Breakfast Included", "Free Valet Parking"],
  },
];

const ANIMATED_AVATARS = [
  {
    id: "transparent",
    name: "Transparent Minimal",
    bgClass: "bg-transparent border-2 border-slate-300 text-slate-700",
    glowClass: "ring-slate-300/40",
    icon: "✨",
  },
  {
    id: "royal",
    name: "Royal Purple",
    bgClass: "bg-gradient-to-tr from-[#667eea] via-[#764ba2] to-[#6b8cce]",
    glowClass: "ring-[#667eea]/40",
    icon: "👑",
  },
  {
    id: "emerald",
    name: "Emerald Luxury",
    bgClass: "bg-gradient-to-tr from-[#059669] via-[#10b981] to-[#34d399]",
    glowClass: "ring-emerald-500/40",
    icon: "💎",
  },
  {
    id: "sunset",
    name: "Gold Executive",
    bgClass: "bg-gradient-to-tr from-[#d97706] via-[#f59e0b] to-[#fbbf24]",
    glowClass: "ring-amber-500/40",
    icon: "🌟",
  },
  {
    id: "cyber",
    name: "VIP Magenta",
    bgClass: "bg-gradient-to-tr from-[#c026d3] via-[#e11d48] to-[#f43f5e]",
    glowClass: "ring-rose-500/40",
    icon: "⚡",
  },
];

export default function ProfilePage() {
  useTitle("My Account — Hotel");
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeNav, setActiveNav] = useState<
    "personal" | "bookings" | "guests" | "profile" | "rooms" | "security"
  >("personal");
  const [activeTab, setActiveTab] = useState<
    "personal" | "guests" | "rooms" | "notifications" | "security" | "bookings"
  >("personal");
  const [bookingFilter, setBookingFilter] = useState<"All" | "Current" | "Previous">("All");
  const [selectedBookingModal, setSelectedBookingModal] = useState<typeof DUMMY_BOOKINGS[0] | null>(null);
  const [showCouponCard, setShowCouponCard] = useState(true);
  const [couponCopied, setCouponCopied] = useState(false);
  const { guests } = useGuests();

  // Rooms Management State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [roomSuccessMsg, setRoomSuccessMsg] = useState("");
  const [newRoom, setNewRoom] = useState({
    name: "",
    type: "Double",
    pricePerNight: 150,
    capacity: 2,
    sizeSqm: 30,
    beds: "1 King bed",
    shortDescription: "A modern room with stunning views and amenities.",
    images: "/images/1.webp",
  });

  // User Profile Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState("1995-05-15");
  const [country, setCountry] = useState("Austria");
  const [phone, setPhone] = useState("+43 664 1234567");
  const [address, setAddress] = useState(
    "Lakeside Promenade 12, Salzburg, Austria"
  );
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) {
          if (d && d.user) {
            setUser(d.user);
            const nameParts = (d.user.name || "").split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
            setEmail(d.user.email || "");
            setUsername(d.user.username || (d.user.email ? d.user.email.split("@")[0] : ""));
            if (d.user.dob) setDob(d.user.dob);
            if (d.user.country) setCountry(d.user.country);
            if (d.user.phone) setPhone(d.user.phone);
            if (d.user.address) setAddress(d.user.address);
            if (d.user.avatar) {
              setAvatar(d.user.avatar);
            } else {
              const savedAvatar = localStorage.getItem("user_avatar");
              if (savedAvatar) setAvatar(savedAvatar);
            }
          } else {
            navigate("/login");
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          navigate("/login");
        }
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [supabaseAvatars, setSupabaseAvatars] = useState<string[]>([]);

  const loadSupabaseGallery = useCallback(() => {
    if (user?.id && isSupabaseConfigured) {
      listSupabaseAvatars(user.id).then((urls) => {
        setSupabaseAvatars(urls);
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadSupabaseGallery();
    }
  }, [user?.id, loadSupabaseGallery]);

  const handleSelectSupabaseAvatar = async (url: string) => {
    setAvatar(url);
    localStorage.setItem("user_avatar", url);
    const fullName = `${firstName} ${lastName}`.trim() || user?.name || "";
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          dob,
          country,
          phone,
          address,
          avatar: url,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
      setUploadMsg("Selected image from Supabase Storage! ✓");
      setTimeout(() => setUploadMsg(""), 3000);
    } catch (err) {
      console.error("Select avatar error:", err);
    }
  };

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modalPreviewImage, setModalPreviewImage] = useState<string | null>(null);
  const [modalSelectedFile, setModalSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingTransparent, setIsProcessingTransparent] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const handleMakeTransparent = async () => {
    if (!modalPreviewImage || modalPreviewImage === "REMOVE_AVATAR") return;
    setIsProcessingTransparent(true);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = modalPreviewImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample 4 corners to detect background color
      const corners = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1],
      ];

      let totalR = 0, totalG = 0, totalB = 0;
      for (const [cx, cy] of corners) {
        const idx = (cy * canvas.width + cx) * 4;
        totalR += data[idx];
        totalG += data[idx + 1];
        totalB += data[idx + 2];
      }
      const bgR = Math.round(totalR / 4);
      const bgG = Math.round(totalG / 4);
      const bgB = Math.round(totalB / 4);

      const tolerance = 45;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
        const isNearWhite = r > 230 && g > 230 && b > 230;

        if (dist < tolerance || isNearWhite) {
          data[i + 3] = 0; // Make pixel transparent
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const transparentDataUrl = canvas.toDataURL("image/png");
      setModalPreviewImage(transparentDataUrl);

      const blob = await (await fetch(transparentDataUrl)).blob();
      const transparentFile = new File([blob], "profile_transparent.png", { type: "image/png" });
      setModalSelectedFile(transparentFile);

      setUploadMsg("✨ Background removed! Profile picture is now transparent.");
      setTimeout(() => setUploadMsg(""), 3000);
    } catch (err) {
      console.error("Background removal error:", err);
    } finally {
      setIsProcessingTransparent(false);
    }
  };

  const processSelectedModalFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showWarning("File size should be less than 5MB");
      return;
    }
    setModalSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setModalPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleModalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedModalFile(file);
  };

  const handleSaveModalImage = async () => {
    if (!modalPreviewImage && !modalSelectedFile) return;

    setIsUploading(true);
    setUploadMsg("Uploading profile image to Supabase Storage via backend...");

    try {
      if (modalPreviewImage === "REMOVE_AVATAR") {
        setAvatar(null);
        localStorage.removeItem("user_avatar");

        const fullName = `${firstName} ${lastName}`.trim() || user?.name || "";
        const res = await apiFetch("/api/auth/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName,
            dob,
            country,
            phone,
            address,
            avatar: "",
          }),
        });
        const data = await res.json();
        if (data.user) setUser(data.user);
        setUploadMsg("Profile picture removed ✓");
        setTimeout(() => setUploadMsg(""), 3000);
        return;
      }

      // Send base64 image data to backend endpoint /api/auth/upload-avatar
      // Backend handles Supabase Storage upload & updates MySQL DB user avatar
      const res = await apiFetch("/api/auth/upload-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: modalPreviewImage,
        }),
      });

      const data = await res.json();

      if (data.user) {
        setUser(data.user);
        const newAvatar = data.user.avatar || data.avatarUrl || modalPreviewImage;
        setAvatar(newAvatar);
        localStorage.setItem("user_avatar", newAvatar);

        if (newAvatar && newAvatar.startsWith("http")) {
          setUploadMsg("✅ Uploaded & saved to Supabase Storage via Backend!");
        } else {
          setUploadMsg("✅ Saved to backend profile!");
        }
        setTimeout(() => setUploadMsg(""), 4000);
      } else if (data.error) {
        setUploadMsg(`❌ Upload failed: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Save profile avatar error:", err);
      setUploadMsg(`❌ Upload failed: ${err?.message || "Please check connection & try again."}`);
    } finally {
      setIsUploading(false);
      setShowUploadModal(false);
      setModalSelectedFile(null);
      setModalPreviewImage(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showWarning("File size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    setUploadMsg("Uploading image to Supabase Storage...");

    try {
      let imageUrl: string | null = null;
      let supabaseErrorMsg: string | null = null;

      // Try uploading to Supabase Storage if configured
      if (isSupabaseConfigured) {
        const result = await uploadAvatarToSupabase(file, user?.id || "guest");
        if (result.url) {
          imageUrl = result.url;
        } else if (result.error) {
          supabaseErrorMsg = result.error;
          console.warn("[Supabase Upload Error]", result.error);
        }
      } else {
        supabaseErrorMsg = "Supabase URL & Anon Key missing in .env file";
      }

      // Fallback to base64 DataURL if Supabase is unconfigured or upload fails
      if (!imageUrl) {
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      setAvatar(imageUrl);
      localStorage.setItem("user_avatar", imageUrl);

      const fullName = `${firstName} ${lastName}`.trim() || user?.name || "";
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          dob,
          country,
          phone,
          address,
          avatar: imageUrl,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }

      if (imageUrl.startsWith("http") && !imageUrl.startsWith("data:")) {
        setUploadMsg("✅ Uploaded & saved to Supabase Storage!");
        loadSupabaseGallery();
      } else {
        setUploadMsg(`⚠️ ${supabaseErrorMsg || "Saved locally (Supabase unconfigured)"}`);
      }
    } catch (err: any) {
      console.error("Save profile avatar error:", err);
      setUploadMsg(`❌ Upload failed: ${err?.message || "Please check connection & try again."}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setAvatar(null);
    localStorage.removeItem("user_avatar");
    if (fileInputRef.current) fileInputRef.current.value = "";

    const fullName = `${firstName} ${lastName}`.trim() || user?.name || "";
    try {
      await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          dob,
          country,
          phone,
          address,
          avatar: "",
        }),
      });
    } catch (err) {
      console.error("Delete avatar error:", err);
    }
  };

  // Fetch Rooms from Database
  const loadRooms = () => {
    setLoadingRooms(true);
    apiFetch("/api/rooms")
      .then((r) => r.json())
      .then((d) => {
        if (d.rooms) setRooms(d.rooms);
      })
      .catch((err) => console.error("Error fetching rooms:", err))
      .finally(() => setLoadingRooms(false));
  };

  // User Bookings from Backend MySQL Database
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const loadBookings = () => {
    setLoadingBookings(true);
    apiFetch("/api/bookings/my-bookings")
      .then((r) => r.json())
      .then((d) => {
        if (d.bookings) {
          setUserBookings(d.bookings);
        }
      })
      .catch((err) => console.error("Fetch bookings error:", err))
      .finally(() => setLoadingBookings(false));
  };

  useEffect(() => {
    loadRooms();
    loadBookings();
  }, []);

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch { }
    window.location.href = "/login";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) {
      showWarning("Please enter your name.");
      return;
    }
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          username,
          dob,
          country,
          phone,
          address,
          avatar: avatar || "",
        }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      } else if (data.error) {
        showError(data.error);
      }
    } catch (err) {
      console.error("Save profile error:", err);
    }
  }

  // Create New Room API Call
  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoom.name) return;

    try {
      const res = await apiFetch("/api/rooms", {
        method: "POST",
        body: JSON.stringify({
          name: newRoom.name,
          type: newRoom.type,
          pricePerNight: Number(newRoom.pricePerNight),
          capacity: Number(newRoom.capacity),
          sizeSqm: Number(newRoom.sizeSqm),
          beds: newRoom.beds,
          shortDescription: newRoom.shortDescription,
          images: [newRoom.images || "/images/1.webp"],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "Failed to create room.");
        return;
      }
      if (data.room) {
        setRoomSuccessMsg(`Room "${data.room.name}" created successfully!`);
        setShowAddModal(false);
        setNewRoom({
          name: "",
          type: "Double",
          pricePerNight: 150,
          capacity: 2,
          sizeSqm: 30,
          beds: "1 King bed",
          shortDescription: "A modern room with stunning views and amenities.",
          images: "/images/1.webp",
        });
        loadRooms();
        setTimeout(() => setRoomSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  }

  // Delete Room API Call
  async function handleDeleteRoom(id: number, roomName: string) {
    if (!window.confirm(`Are you sure you want to delete room "${roomName}"?`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/rooms/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRoomSuccessMsg(`Room "${roomName}" deleted successfully!`);
        loadRooms();
        setTimeout(() => setRoomSuccessMsg(""), 4000);
      }
    } catch (err) {
      console.error("Failed to delete room:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream font-jost">
        <div className="text-navy font-semibold">Loading account dashboard...</div>
      </div>
    );
  }

  if (!user) return null;

  const fullUserName = `${firstName} ${lastName}`.trim() || user.name || "";
  const initials = (() => {
    const f = firstName.trim();
    const l = lastName.trim();
    if (f && l) {
      return (f.charAt(0) + l.charAt(0)).toUpperCase();
    }
    const parts = (fullUserName || user.name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    if (parts.length === 1 && parts[0]) {
      return parts[0].charAt(0).toUpperCase();
    }
    return "U";
  })();
  const initial = initials;
  const hour = new Date().getHours();
  const greetingTime =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen bg-cream p-3 sm:p-6 font-jost text-slate-800">
      {/* Outer Dashboard Window Container matching hotel project theme */}
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200/80 flex flex-col min-h-[90vh]">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-100 px-6 bg-white">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white font-bold text-lg shadow-md">
              H
            </div>
            <span className="text-xl font-black text-navy tracking-tight">
              Hotel
            </span>
          </Link>



          {/* Right Header User Controls */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <FiBell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#667eea]" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <FiGlobe className="h-3.5 w-3.5" />
              <span>EN</span>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt={fullUserName}
                  className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-2xs bg-transparent"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent border border-slate-200 text-slate-400 font-semibold text-xs shadow-2xs">
                  {initials}
                </div>
              )}
              <span className="hidden sm:block text-sm font-semibold text-navy">
                {fullUserName}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Grid Body */}
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* Left Sidebar */}
          <aside className="w-full lg:w-72 bg-[#f8fafc] border-r border-slate-100 p-5 flex flex-col justify-between">
            <div>
              {/* Greeting Card */}
              <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {greetingTime}
                </h2>
                <p className="text-base font-semibold text-navy mt-0.5">
                  {fullUserName}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Last Update, 18 Aug 2026
                </p>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveNav("personal");
                    setActiveTab("personal");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeNav === "personal"
                      ? "bg-brand text-white font-semibold shadow-md"
                      : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                >
                  <FiUser className="h-4 w-4" />
                  Personal Information
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNav("bookings");
                    setActiveTab("bookings");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeNav === "bookings"
                      ? "bg-brand text-white font-semibold shadow-md"
                      : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                >
                  <FiCalendar className="h-4 w-4" />
                  Bookings List
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNav("guests");
                    setActiveTab("guests");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeNav === "guests"
                      ? "bg-brand text-white font-semibold shadow-md"
                      : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                >
                  <FiUsers className="h-4 w-4" />
                  Guest List ({guests.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNav("security");
                    setActiveTab("security");
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${activeNav === "security"
                      ? "bg-brand text-white font-semibold shadow-md"
                      : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                >
                  <FiLock className="h-4 w-4" />
                  Security Settings
                </button>
              </nav>

              {/* User Active Coupon Card (Placed above Logout in Left Sidebar) */}
              {showCouponCard && (
                <div className="mt-6 relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#764ba2] via-[#667eea] to-[#f43f5e] p-4 text-white shadow-lg border border-white/20 transition-all hover:scale-[1.02]">
                  {/* Decorative Background Pattern Overlay */}
                  <div className="absolute -right-4 -bottom-6 opacity-20 pointer-events-none">
                    <svg className="w-28 h-28 text-white fill-current" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
                      <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                  </div>

                  {/* Top Header: Badge + Close Button */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-black leading-none tracking-tight">
                        25%
                      </div>
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-white/90 mt-0.5">
                        OFF COUPON
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCouponCard(false)}
                      title="Dismiss Coupon"
                      className="grid h-6 w-6 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Coupon Title & Description */}
                  <div className="mt-3">
                    <h4 className="text-xs font-bold text-white tracking-wide">
                      Luxury Suite Discount
                    </h4>
                    <p className="text-[11px] text-white/90 mt-0.5 font-medium leading-tight">
                      Valid on your next luxury stay booking
                    </p>
                  </div>

                  {/* Coupon Code & Copy Action */}
                  <div className="mt-3.5 flex items-center justify-between gap-2 rounded-xl bg-white/20 backdrop-blur-xs px-3 py-1.5 border border-white/30">
                    <span className="text-xs font-black tracking-widest text-white uppercase">
                      LUXURY25
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("LUXURY25");
                        setCouponCopied(true);
                        setTimeout(() => setCouponCopied(false), 2000);
                      }}
                      className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-extrabold text-navy shadow-xs hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      {couponCopied ? "Copied! ✓" : "Copy Code"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Bottom Controls */}
            <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-bold text-navy hover:underline"
              >
                <FiLogOut className="h-4 w-4 text-[#667eea]" /> Logout
              </button>
              <Link
                to="/"
                className="text-xs font-semibold text-slate-400 hover:text-navy"
              >
                Back to Site
              </Link>
            </div>
          </aside>

          {/* Right Main Content Area */}
          <main className="flex-1 bg-[#f4f5fa]/60 p-6 sm:p-8">
            {/* Breadcrumb */}
            <div className="text-xs font-medium text-slate-400 mb-1">
              <Link to="/" className="hover:text-navy">
                Home
              </Link>{" "}
              &raquo; <span className="text-slate-600">My Account</span>
            </div>

            <h1 className="text-2xl font-bold text-navy mb-6">My Account</h1>

            {/* Content Layout: 2-Col for Personal Info, Full Width for Bookings / Guests / Security */}
            <div className={`grid gap-6 ${activeTab === "personal" ? "lg:grid-cols-[260px_1fr]" : "grid-cols-1"}`}>
              {/* 2nd Card Column: Minimal Clean Profile Image Card (Personal Tab Only) */}
              {activeTab === "personal" && (
                <div className="h-fit rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                  {/* Large Avatar Circle with Click to Upload Modal */}
                  <div className="relative flex flex-col items-center">
                    <div
                      onClick={() => !isUploading && setShowUploadModal(true)}
                      title="Click to change profile picture"
                      className="relative flex h-36 w-36 items-center justify-center rounded-full bg-transparent border border-slate-200 shadow-xs overflow-hidden cursor-pointer group"
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={fullUserName}
                          className="h-full w-full object-cover rounded-full bg-transparent"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center bg-transparent text-slate-400 font-semibold text-4xl rounded-full tracking-wider"
                        >
                          {initials}
                        </div>
                      )}

                      {/* Loading Spinner Overlay when Uploading */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center z-10">
                          <div className="h-9 w-9 border-4 border-blue-100 border-t-[#2563eb] rounded-full animate-spin"></div>
                          <span className="text-[11px] font-bold text-[#2563eb] mt-2 tracking-tight">
                            Uploading...
                          </span>
                        </div>
                      )}

                      {!isUploading && (
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity text-xs font-semibold">
                          <FiCamera className="h-6 w-6 mb-1" />
                          Change Photo
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Name & Email */}
                  <h3 className="font-semibold text-slate-700 text-base tracking-tight mt-4">
                    {fullUserName}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] mt-0.5">
                    {email}
                  </p>
                </div>
              )}

              {/* Main Panel Content */}
              <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-slate-100">
                {/* BOOKINGS LIST TAB */}
                {activeTab === "bookings" && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-navy">
                          Your Bookings &amp; Reservations
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          View details of your active stays, previous check-outs, payment history, and timings.
                        </p>
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold shrink-0">
                        {(["All", "Current", "Previous"] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setBookingFilter(filter)}
                            className={`rounded-lg px-4 py-2 text-xs transition-all whitespace-nowrap ${bookingFilter === filter
                                ? "bg-white text-navy shadow-xs font-bold"
                                : "text-slate-500 hover:text-slate-800"
                              }`}
                          >
                            {filter === "All"
                              ? "All Bookings"
                              : filter === "Current"
                                ? "Current Stays"
                                : "Previous Bookings"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bookings List Cards */}
                    <div className="space-y-6">
                      {(userBookings.length > 0 ? userBookings : DUMMY_BOOKINGS).filter((b) => {
                        if (bookingFilter === "Current") return b.type === "Current";
                        if (bookingFilter === "Previous") return b.type === "Previous";
                        return true;
                      }).map((b) => (
                        <div
                          key={b.id}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-[#667eea]/40 transition-all"
                        >
                          {/* Card Top Banner Header */}
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[#f8fafc] px-6 py-3.5 text-xs">
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-navy text-sm">
                                Booking ID: {b.id}
                              </span>
                              <span
                                className={`rounded-full px-3 py-0.5 text-[11px] font-bold shadow-xs ${b.type === "Current"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-slate-200 text-slate-700"
                                  }`}
                              >
                                {b.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 text-slate-500 font-medium">
                                <FiCreditCard className="h-3.5 w-3.5 text-[#667eea]" />
                                <span>{b.paymentStatus}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedBookingModal(b)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-[#667eea] shadow-2xs hover:bg-[#667eea] hover:text-white transition-all cursor-pointer"
                              >
                                <FiEye className="h-3.5 w-3.5" />
                                View Details
                              </button>
                            </div>
                          </div>

                          {/* Main Card Content */}
                          <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              {/* Room Image & Details */}
                              <div className="flex gap-4">
                                <img
                                  src={b.image}
                                  alt={b.roomName}
                                  className="h-24 w-32 rounded-xl object-cover border border-slate-200 shadow-xs"
                                />
                                <div>
                                  <h3 className="text-base font-extrabold text-navy">
                                    {b.roomName}
                                  </h3>
                                  <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                    <FiMapPin className="h-3.5 w-3.5 text-[#667eea] shrink-0" />
                                    <span>{b.location}</span>
                                  </p>
                                  <p className="text-xs text-slate-400 mt-2 font-medium">
                                    Guests: <span className="text-slate-700 font-semibold">{b.guests}</span> • {b.nights} Nights
                                  </p>
                                </div>
                              </div>

                              {/* Amount & Payment Info */}
                              <div className="md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                  Total Paid
                                </div>
                                <div className="text-2xl font-black text-navy mt-0.5">
                                  €{b.amountPaid.toFixed(2)}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {b.paymentMethod}
                                </div>
                              </div>
                            </div>

                            {/* Check-In / Check-Out Timings Grid */}
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                              {/* Check-In */}
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                                  <FiClock className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Check-In Date &amp; Timing
                                  </div>
                                  <div className="text-xs font-extrabold text-navy mt-0.5">
                                    {b.checkInDate} <span className="font-medium text-slate-500">at {b.checkInTime}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Check-Out */}
                              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-3 sm:pt-0 sm:pl-4">
                                <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                                  <FiClock className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Check-Out Date &amp; Timing
                                  </div>
                                  <div className="text-xs font-extrabold text-navy mt-0.5">
                                    {b.checkOutDate} <span className="font-medium text-slate-500">at {b.checkOutTime}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ROOMS MANAGEMENT TAB */}
                {activeTab === "rooms" && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-lg font-bold text-navy">
                          Rooms & Suites Management
                        </h2>
                        <p className="text-xs text-slate-500">
                          Rooms added or deleted here directly reflect live on the website&apos;s Rooms & Suites page.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all"
                      >
                        <FiPlus className="h-4 w-4" /> Add New Room
                      </button>
                    </div>

                    {roomSuccessMsg && (
                      <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 border border-emerald-100">
                        <FiCheckCircle className="h-5 w-5 text-emerald-600" />
                        {roomSuccessMsg}
                      </div>
                    )}

                    {loadingRooms ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Loading rooms from database...
                      </div>
                    ) : rooms.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500">
                        No rooms in database. Click &quot;Add New Room&quot; to create one.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {rooms.map((room) => (
                          <div
                            key={room.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-slate-300 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={
                                  Array.isArray(room.images) && room.images[0]
                                    ? room.images[0]
                                    : "/images/1.webp"
                                }
                                alt={room.name}
                                className="h-16 w-20 rounded-lg object-cover border border-slate-200"
                              />
                              <div>
                                <h3 className="font-bold text-navy text-base">
                                  {room.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                  <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
                                    {room.type}
                                  </span>
                                  <span>{room.capacity} Guests</span>
                                  <span>• {room.sizeSqm} m²</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4">
                              <div className="text-right">
                                <div className="text-base font-extrabold text-navy">
                                  €{room.pricePerNight}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  per night
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteRoom(room.id, room.name)}
                                className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                title="Delete Room"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PERSONAL INFORMATION TAB */}
                {activeTab === "personal" && (
                  <div>
                    <h2 className="text-lg font-bold text-navy mb-6">
                      Personal Information
                    </h2>

                    {savedMsg && (
                      <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 border border-emerald-100">
                        <FiCheckCircle className="h-5 w-5 text-emerald-600" />
                        Profile updated successfully!
                      </div>
                    )}

                    {/* 2-Column Form */}
                    <form onSubmit={handleSave} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            First Name <span className="text-brand">*</span>
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#667eea] focus:bg-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Last Name <span className="text-brand">*</span>
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#667eea] focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Email <span className="text-brand">*</span>
                          </label>
                          <input
                            type="email"
                            value={email}
                            disabled
                            readOnly
                            className="w-full rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed select-none font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Username <span className="text-brand">*</span>
                          </label>
                          <input
                            type="text"
                            value={username}
                            disabled
                            readOnly
                            className="w-full rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed select-none font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Date of Birth <span className="text-brand">*</span>
                          </label>
                          <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#667eea] focus:bg-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Country <span className="text-brand">*</span>
                          </label>
                          <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#667eea] focus:bg-white transition-all"
                          >
                            <option value="Austria">Austria</option>
                            <option value="Germany">Germany</option>
                            <option value="India">India</option>
                            <option value="Switzerland">Switzerland</option>
                            <option value="United States">United States</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Phone Number <span className="text-brand">*</span>
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 555-0199"
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#667eea] focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Address <span className="text-brand">*</span>
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-[#667eea] focus:bg-white transition-all"
                        />
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3 text-sm font-bold text-white shadow-md hover:opacity-90 transition-all"
                        >
                          <FiSave className="h-4 w-4" /> Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === "guests" && (
                  <div>
                    <h2 className="text-lg font-bold text-navy mb-4">
                      Guests & Party Members
                    </h2>
                    <p className="text-xs text-slate-500 mb-6">
                      Manage guests registered under your account for quick room reservations.
                    </p>
                    <div className="space-y-3">
                      {guests.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-sm">
                              {g.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              Relationship: {g.relationship || "Guest"}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                            Age: {g.age || "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div>
                    <h2 className="text-lg font-bold text-navy mb-4">
                      Notification Settings
                    </h2>
                    <div className="space-y-4 text-sm text-slate-700">
                      <label className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                        <span>Email Notifications for Room Bookings</span>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 accent-[#667eea]"
                        />
                      </label>
                      <label className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                        <span>Special Offers & Seasonal Discounts</span>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 accent-[#667eea]"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div>
                    <h2 className="text-lg font-bold text-navy mb-4">
                      Security Settings
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Current Password
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#667eea]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          New Password
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#667eea]"
                        />
                      </div>
                      <button
                        type="button"
                        className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-navy">Add New Room</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Lakeview Suite"
                  value={newRoom.name}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, name: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#667eea]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Room Type *
                  </label>
                  <select
                    value={newRoom.type}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, type: e.target.value })
                    }
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm outline-none"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="Family">Family</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price / Night (€) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newRoom.pricePerNight}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        pricePerNight: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capacity (Guests)
                  </label>
                  <input
                    type="number"
                    value={newRoom.capacity}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        capacity: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Size (sqm)
                  </label>
                  <input
                    type="number"
                    value={newRoom.sizeSqm}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        sizeSqm: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={newRoom.shortDescription}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, shortDescription: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Image Path / URL
                </label>
                <input
                  type="text"
                  value={newRoom.images}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, images: e.target.value })
                  }
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand px-6 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* VIEW BOOKING DETAILS MODAL OVERLAY */}
      {selectedBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#f8fafc] px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-navy">
                    Booking Details &amp; Summary
                  </h3>
                  <span
                    className={`rounded-full px-3 py-0.5 text-[11px] font-bold shadow-xs ${selectedBookingModal.type === "Current"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-slate-200 text-slate-700"
                      }`}
                  >
                    {selectedBookingModal.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#667eea] mt-0.5">
                  Reference ID: {selectedBookingModal.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBookingModal(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-200/70 text-slate-600 hover:bg-slate-300 transition-colors"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Room Header Image Banner */}
              <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
                <img
                  src={selectedBookingModal.image}
                  alt={selectedBookingModal.roomName}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent flex items-end p-5">
                  <div>
                    <span className="rounded-md bg-[#667eea] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                      {selectedBookingModal.roomNumber}
                    </span>
                    <h4 className="text-xl font-black text-white mt-1">
                      {selectedBookingModal.roomName}
                    </h4>
                    <p className="flex items-center gap-1 text-xs text-slate-200 mt-0.5">
                      <FiMapPin className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span>{selectedBookingModal.location}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Room & Floor Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Room &amp; Floor Assigned
                  </div>
                  <div className="text-sm font-extrabold text-navy mt-1">
                    {selectedBookingModal.roomNumber}
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-0.5">
                    {selectedBookingModal.floor}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Room View
                  </div>
                  <div className="text-sm font-extrabold text-navy mt-1">
                    {selectedBookingModal.roomView}
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-0.5">
                    Premium Category View
                  </div>
                </div>
              </div>

              {/* Stay Duration & Timings Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h5 className="text-xs font-extrabold text-navy uppercase tracking-wider flex items-center gap-2">
                    <FiClock className="h-4 w-4 text-[#667eea]" /> Stay Duration &amp; Exact Timings
                  </h5>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-extrabold text-[#667eea] border border-indigo-100">
                    {selectedBookingModal.nights} Nights ({selectedBookingModal.days} Days Stay)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Check In */}
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-100">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-white font-bold text-xs shrink-0">
                      IN
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Check-In Date &amp; Time
                      </div>
                      <div className="text-xs font-extrabold text-navy mt-0.5">
                        {selectedBookingModal.checkInDate}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700">
                        at {selectedBookingModal.checkInTime}
                      </div>
                    </div>
                  </div>

                  {/* Check Out */}
                  <div className="flex items-center gap-3 rounded-xl bg-rose-50/70 p-3.5 border border-rose-100">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-600 text-white font-bold text-xs shrink-0">
                      OUT
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Check-Out Date &amp; Time
                      </div>
                      <div className="text-xs font-extrabold text-navy mt-0.5">
                        {selectedBookingModal.checkOutDate}
                      </div>
                      <div className="text-[11px] font-semibold text-rose-700">
                        at {selectedBookingModal.checkOutTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accompanying Guests & Aadhaar Card ID Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h5 className="text-xs font-extrabold text-navy uppercase tracking-wider flex items-center gap-2">
                    <FiUser className="h-4 w-4 text-[#667eea]" /> Accompanying Guests &amp; ID Proofs ({selectedBookingModal.guestList.length} Occupants)
                  </h5>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    <FiShield className="h-3.5 w-3.5 text-emerald-600" /> ID Verified
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedBookingModal.guestList.map((g, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white font-bold text-xs shadow-xs shrink-0">
                          {g.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-navy flex items-center gap-2">
                            <span>{g.name}</span>
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-[#667eea] border border-indigo-100">
                              {g.relation}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                            {g.idType}: <span className="font-bold text-slate-700">{g.idNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Aadhaar Photocopy Card Document Attachment */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-2xs">
                          <FiFileText className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[130px]">{g.idDocName}</span>
                        </div>
                        <button
                          type="button"
                          title="Download ID Photocopy"
                          onClick={() => showInfo(`Downloading ID Photocopy proof: ${g.idDocName}`)}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-[#667eea] text-white shadow-2xs hover:opacity-90 transition-all cursor-pointer"
                        >
                          <FiDownload className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities Badge List */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Included Room Amenities
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedBookingModal.amenities.map((am) => (
                    <span
                      key={am}
                      className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/60"
                    >
                      ✓ {am}
                    </span>
                  ))}
                </div>
              </div>

              {/* Payment & Billing Breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h5 className="text-xs font-extrabold text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FiCreditCard className="h-4 w-4 text-[#667eea]" /> Billing &amp; Payment Summary
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Nightly Rate (€{selectedBookingModal.nightlyRate.toFixed(2)} x {selectedBookingModal.nights} Nights)</span>
                    <span className="font-semibold">€{selectedBookingModal.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Taxes &amp; Service Fees</span>
                    <span className="font-semibold text-emerald-600">Included</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Payment Method</span>
                    <span className="font-medium text-slate-800">{selectedBookingModal.paymentMethod}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-sm text-navy">
                    <span>Total Paid Amount</span>
                    <span className="text-base text-brand">€{selectedBookingModal.amountPaid.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-[#f8fafc] px-6 py-4 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedBookingModal(null)}
                className="rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD PROFILE IMAGE MODAL OVERLAY */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col">
            {/* Top Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-navy tracking-tight">
                  Upload your profile image
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Choose an image that will appear everywhere in our app.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setModalPreviewImage(null);
                  setModalSelectedFile(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={modalFileInputRef}
              onChange={handleModalFileSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Drag & Drop Box */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Upload new image:
              </label>
              <div
                onClick={() => modalFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processSelectedModalFile(file);
                }}
                className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${isDragging
                    ? "border-[#3b82f6] bg-blue-50/80 scale-[1.01]"
                    : modalPreviewImage
                      ? "border-emerald-400 bg-emerald-50/30"
                      : "border-blue-200 bg-slate-50/60 hover:border-[#3b82f6] hover:bg-blue-50/30"
                  }`}
              >
                {modalPreviewImage && modalPreviewImage !== "REMOVE_AVATAR" ? (
                  <div className="flex flex-col items-center">
                    <div className="relative p-2 rounded-2xl bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:10px_10px] border border-slate-200/80 shadow-inner">
                      <img
                        src={modalPreviewImage}
                        alt="Preview"
                        className="h-24 w-24 rounded-2xl object-cover border border-white bg-transparent shadow-md"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-2xs border border-slate-200 text-slate-500 group-hover:text-[#3b82f6] transition-all">
                      <FiFolder className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-extrabold text-navy mt-3">
                      Click or drag and drop to upload your file
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">
                      PNG, JPG, WEBP, GIF, SVG (Max 5 MB)
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* OR Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-slate-200"></div>
              <span className="absolute bg-white px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                OR
              </span>
            </div>

            {/* Minimal Initial Circle Option */}
            <div className="mb-5 flex justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => {
                  setModalPreviewImage("REMOVE_AVATAR");
                  setModalSelectedFile(null);
                }}
                title="Use Default Initials Avatar"
                className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-transparent border-2 font-semibold text-slate-500 text-base transition-all cursor-pointer ${
                  modalPreviewImage === "REMOVE_AVATAR" || (!avatar && !modalPreviewImage)
                    ? "border-[#2563eb] ring-4 ring-[#2563eb]/20 scale-105"
                    : "border-slate-200 hover:border-slate-300 hover:scale-105"
                }`}
              >
                {initials}
                {(modalPreviewImage === "REMOVE_AVATAR" || (!avatar && !modalPreviewImage)) && (
                  <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-[#2563eb] text-white text-[10px] font-bold shadow-xs">
                    ✓
                  </span>
                )}
              </button>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setModalPreviewImage(null);
                  setModalSelectedFile(null);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModalImage}
                disabled={isUploading}
                className="rounded-2xl bg-[#2563eb] px-7 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {isUploading ? "Saving..." : "Save image"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
