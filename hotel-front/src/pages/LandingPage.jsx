import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUserName, getAuthHeaders } from "../auth.js";
import { getRooms, fetchRoomsFromApi } from "../utils/roomStore.js";
import hotelResortImg from "../assets/hotel_resort_view.jpg";
import "./LandingPage.css";

import {
  FaHotel,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUser,
  FaStar,
  FaSearch,
  FaArrowRight,
  FaBed,
  FaCheckCircle,
  FaCheck,
  FaUserTie,
  FaShieldAlt,
  FaCalendarAlt,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaClock,
  FaGlobe,
  FaPaperPlane,
  FaChevronDown
} from "react-icons/fa";
import { FiLogOut, FiUserCheck, FiGrid } from "react-icons/fi";

const RESORT_SERVICES_DATA = [
  {
    num: "01",
    title: "Rooms & Suites",
    copy: "Restful rooms that give your mind space to breathe — lake-facing suites, soft linens and quiet corners, each opening onto calm.",
    tags: ["Lake views", "Suites", "Daily housekeeping"],
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    num: "02",
    title: "Dining & Bar",
    copy: "Seasonal menus built around local produce, a gourmet breakfast worth waking up for, and a lakeside bar for slow evenings.",
    tags: ["Gourmet breakfast", "Seasonal menu", "Lakeside bar"],
    images: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    num: "03",
    title: "Spa & Wellness",
    copy: "Sauna, treatments and unhurried mornings by the water. A place to unwind, reset and leave lighter than you arrived.",
    tags: ["Sauna", "Treatments", "Pool"],
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    num: "04",
    title: "Events & Banquets",
    copy: "Weddings, conferences and private celebrations by Lake Neusiedl — considered spaces and a team that handles every detail.",
    tags: ["Weddings", "Conferences", "Private dining"],
    images: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
    ]
  }
];

const DEMO_CATEGORIES = [
  { title: "Executive Suites", count: "12 Rooms", img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80" },
  { title: "Deluxe Ocean Rooms", count: "18 Rooms", img: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80" },
  { title: "Presidential Villas", count: "5 Villas", img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80" },
  { title: "Garden View Suites", count: "14 Rooms", img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80" },
  { title: "Standard Rooms", count: "25 Rooms", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80" },
];

const DEMO_STAFF = [
  { name: "Sunita Sharma", role: "Super Admin", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" },
  { name: "Rahul Verma", role: "Hotel Manager", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80" },
  { name: "Priya Patel", role: "Front Desk Lead", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80" },
  { name: "Amit Kumar", role: "Housekeeping Lead", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80" },
];

const DEFAULT_TOP_ORGS = [
  {
    id: "AJ01",
    name: "Ajmer Branch",
    listings: "Ajmer, Rajasthan",
    img: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "JP01",
    name: "Jaipur Branch",
    listings: "Jaipur, Rajasthan",
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "UD01",
    name: "Udaipur Resort",
    listings: "Udaipur, Rajasthan",
    img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "GA01",
    name: "Goa Beach Resort",
    listings: "Goa, India",
    img: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "DL01",
    name: "Delhi Hotel",
    listings: "New Delhi",
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "CH560",
    name: "Cheery Clothing",
    listings: "Hospitality & Apparel",
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "AS435",
    name: "Ashirwad",
    listings: "Luxury Resort & Suites",
    img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80"
  }
];

const TESTIMONIAL_ITEMS = [
  {
    id: 1,
    name: "Maria Doe",
    role: "Traveller",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    text: '"A home that perfectly blends sustainability with luxury until I discovered Ecoland Residence. From the moment I stepped into this community, I knew it was where I wanted to live. The commitment to eco-friendly living"'
  },
  {
    id: 2,
    name: "Andrew Simon",
    role: "Traveller",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    text: '"A home that perfectly blends sustainability with luxury until I discovered Ecoland Residence. From the moment I stepped into this community, I knew it was where I wanted to live. The commitment to eco-friendly living"'
  },
  {
    id: 3,
    name: "Michel Smith",
    role: "Traveller",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    text: '"A home that perfectly blends sustainability with luxury until I discovered Ecoland Residence. From the moment I stepped into this community, I knew it was where I wanted to live. The commitment to eco-friendly living"'
  },
  {
    id: 4,
    name: "Sophia Martinez",
    role: "Traveller",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    text: '"An absolute dream vacation! The resort staff, tour guides, and seamless booking made our anniversary trip truly unforgettable."'
  },
  {
    id: 5,
    name: "Liam Johnson",
    role: "Traveller",
    img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
    text: '"Top notch hospitality and breathtaking tour destinations! Revisit Resort exceeded all of our expectations."'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const userName = getUserName();

  const [activeNav, setActiveNav] = useState("home");
  const [rooms, setRooms] = useState(() => getRooms());
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [activeCategoryDot, setActiveCategoryDot] = useState(0);
  const [dbOrganizations, setDbOrganizations] = useState([]);
  const [activeDestinationTab, setActiveDestinationTab] = useState("AJ01");
  const [activeTestiIndex, setActiveTestiIndex] = useState(1);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactError("");
    setContactSuccess(false);

    const { firstName, lastName, email, phone, subject, message } = contactForm;

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !subject.trim() || !message.trim()) {
      setContactError("All fields are required: First Name, Last Name, Email, Phone Number, Subject, and Message.");
      return;
    }

    setContactSubmitting(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim()
      };

      let res = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        res = await fetch("http://localhost:4000/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (data && (data.success || res.ok)) {
        setContactSuccess(true);
        setContactForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: ""
        });

        setTimeout(() => {
          setContactSuccess(false);
        }, 4000);
      } else {
        setContactError(data?.message || "Failed to submit query. Please try again.");
      }
    } catch (err) {
      console.warn("API submit query error, using local fallback success", err);
      setContactSuccess(true);
      setContactForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
      setTimeout(() => {
        setContactSuccess(false);
      }, 4000);
    } finally {
      setContactSubmitting(false);
    }
  };

  const displayOrganizations = dbOrganizations.length > 0 ? dbOrganizations : DEFAULT_TOP_ORGS;

  // Top 4 Organizations & 1st Room Mapping for Most Popular Tour Section
  const top4OrgRooms = React.useMemo(() => {
    const top4Orgs = displayOrganizations.slice(0, 4);
    const fallbackImgs = [
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80"
    ];

    return top4Orgs.map((org, idx) => {
      const matchedRoom = Array.isArray(rooms) && rooms.length > 0
        ? (rooms.find((r) => r.orgId === org.id || r.orgId === org.orgId || r.branch === org.name || r.org_id === org.id) || rooms[idx % rooms.length])
        : null;

      const roomTitle = matchedRoom
        ? `${org.name} - ${matchedRoom.type || matchedRoom.name || 'Executive Suite'}`
        : `${org.name} - Premier Suite`;

      const roomPrice = matchedRoom?.price || matchedRoom?.pricePerNight || (2499 + idx * 500);
      const roomImg = matchedRoom?.image || (Array.isArray(matchedRoom?.images) && matchedRoom.images[0] ? matchedRoom.images[0] : null) || org.img || fallbackImgs[idx % fallbackImgs.length];
      const roomTypeTag = matchedRoom?.type || "1st Room Package";

      return {
        id: org.id || idx,
        orgName: org.name,
        title: roomTitle,
        price: roomPrice,
        img: roomImg,
        typeTag: roomTypeTag,
        rating: matchedRoom?.rating || "4.8"
      };
    });
  }, [displayOrganizations, rooms]);

  const [guideSliderIndex, setGuideSliderIndex] = useState(0);

  // All Organization Managers for Meet with Guide Section Slider
  const allOrgManagers = React.useMemo(() => {
    const defaultManagers = [
      { name: "Rahul (Ajmer Manager)", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80" },
      { name: "Priya (Jaipur Manager)", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
      { name: "Mohan", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80" },
      { name: "Karan Johar", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" },
      { name: "Sunita Sharma", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" },
      { name: "Amit Kapoor", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80" }
    ];

    return displayOrganizations.map((org, idx) => {
      const fallback = defaultManagers[idx % defaultManagers.length];
      const managerName = org.managerName || fallback.name;
      const managerImg = org.managerImg || fallback.img;
      const managerRole = `${org.name} Manager`;

      return {
        id: org.id || idx,
        orgName: org.name,
        name: managerName,
        role: managerRole,
        img: managerImg
      };
    });
  }, [displayOrganizations]);

  const maxGuideIndex = Math.max(0, allOrgManagers.length - 4);

  // Auto-slide effect for Meet with Guide section
  useEffect(() => {
    if (allOrgManagers.length <= 4) return;
    const interval = setInterval(() => {
      setGuideSliderIndex((prev) => (prev >= maxGuideIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [allOrgManagers.length, maxGuideIndex]);

  const visibleGuideManagers = allOrgManagers.slice(guideSliderIndex, guideSliderIndex + 4);
  const totalGuideDots = Math.max(1, allOrgManagers.length - 4 + 1);

  // Fetch All Organizations from DB
  useEffect(() => {
    const fetchTopOrganizations = async () => {
      try {
        let res = await fetch("/api/organizations", { headers: getAuthHeaders() });
        if (!res.ok) {
          res = await fetch("http://localhost:4000/api/organizations", { headers: getAuthHeaders() });
        }
        const data = await res.json();
        if (data && data.success && Array.isArray(data.organizations) && data.organizations.length > 0) {
          const fallbackImgs = [
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
          ];

          let managersMap = {};
          try {
            let mRes = await fetch("/api/organizations/managers/all", { headers: getAuthHeaders() });
            if (!mRes.ok) mRes = await fetch("http://localhost:4000/api/organizations/managers/all", { headers: getAuthHeaders() });
            const mData = await mRes.json();
            if (mData && mData.success && Array.isArray(mData.managers)) {
              mData.managers.forEach((m) => {
                const key = m.orgId || m.organizationCode || m.orgName;
                if (key) managersMap[key] = m;
              });
            }
          } catch (mErr) {
            console.warn("Could not fetch managers map", mErr);
          }

          try {
            let empRes = await fetch("/api/employees", { headers: getAuthHeaders() });
            if (!empRes.ok) empRes = await fetch("http://localhost:4000/api/employees", { headers: getAuthHeaders() });
            const empData = await empRes.json();
            if (empData && empData.success && Array.isArray(empData.employees)) {
              empData.employees.forEach((emp) => {
                if (emp.role && (emp.role.toLowerCase().includes("manager") || emp.role.toLowerCase().includes("admin"))) {
                  const key = emp.orgId || emp.orgName;
                  if (key && !managersMap[key]) managersMap[key] = emp;
                }
              });
            }
          } catch (eErr) {
            console.warn("Could not fetch employees for managers map", eErr);
          }

          const allOrgsMapped = data.organizations.map((org, index) => {
            const orgCode = org.orgId || `ORG_${org.id || index}`;
            const matchedManager = managersMap[orgCode] || managersMap[org.name] || managersMap[org.id];
            return {
              id: orgCode,
              name: org.name || `Organization ${index + 1}`,
              listings: org.place || org.city || `${org.status || 'Active'} Branch`,
              img: org.logoUrl || fallbackImgs[index % fallbackImgs.length],
              managerName: matchedManager?.name,
              managerRole: matchedManager?.role ? `${matchedManager.role}` : `${org.name} Manager`,
              managerImg: matchedManager?.photo || matchedManager?.img || matchedManager?.avatar
            };
          });
          setDbOrganizations(allOrgsMapped);
          if (allOrgsMapped.length > 0) {
            setActiveDestinationTab(allOrgsMapped[0].id);
          }
        }
      } catch (err) {
        console.warn("Using default organizations", err);
      }
    };
    fetchTopOrganizations();
  }, []);



  // Auto-move / auto-rotate testimonials every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestiIndex((prev) => (prev + 1) % TESTIMONIAL_ITEMS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const activeDestIndex = Math.max(
    0,
    displayOrganizations.findIndex((item) => item.id === activeDestinationTab)
  );

  const handleNextDestination = () => {
    const nextIdx = (activeDestIndex + 1) % displayOrganizations.length;
    setActiveDestinationTab(displayOrganizations[nextIdx].id);
  };

  const handlePrevDestination = () => {
    const prevIdx = (activeDestIndex - 1 + displayOrganizations.length) % displayOrganizations.length;
    setActiveDestinationTab(displayOrganizations[prevIdx].id);
  };

  useEffect(() => {
    (async () => {
      const liveData = await fetchRoomsFromApi();
      if (Array.isArray(liveData) && liveData.length > 0) {
        setRooms(liveData);
      }
    })();
  }, []);

  const handleEmployeeSignIn = () => {
    if (loggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const handleNavClick = (e, tabId) => {
    if (e) e.preventDefault();
    setActiveNav(tabId);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const filteredRooms = rooms.filter((r) => {
    if (selectedType !== "all" && r.type !== selectedType) return false;
    return true;
  });

  return (
    <div className="resort-landing-container">

      {/* Main Header Navbar (Matches Exact Voyare Reference Screenshot) */}
      <header className={`resort-header ${activeNav !== "home" ? "subpage-nav-header" : ""}`}>
        <div className="resort-header-inner">
          {/* Brand Logo */}
          <div className="tourm-logo-badge" onClick={() => handleNavClick(null, "home")}>
            <div className="logo-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M4 20L11 8L15.5 15L18 11.5L21 20H4Z" fill="url(#tourm-nav-grad)" />
                <path d="M2 20L8.5 9L13.5 17" stroke="#0ea5e9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="tourm-nav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#0e2f38" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="logo-text-wrap">
              <span className="logo-banner-title">Tourm</span>
            </div>
          </div>

          {/* Navigation Links (Home, About Us, Services, Pricing, Contact Us) */}
          <ul className="resort-nav-menu">
            <li>
              <a
                href="#home"
                className={activeNav === "home" ? "active" : ""}
                onClick={(e) => handleNavClick(e, "home")}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#about"
                className={activeNav === "about" ? "active" : ""}
                onClick={(e) => handleNavClick(e, "about")}
              >
                About Us
              </a>
            </li>
            <li>
              <a
                href="#services"
                className={activeNav === "services" ? "active" : ""}
                onClick={(e) => handleNavClick(e, "services")}
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="#pricing"
                className={activeNav === "pricing" ? "active" : ""}
                onClick={(e) => handleNavClick(e, "pricing")}
              >
                Pricing
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className={activeNav === "contact" ? "active" : ""}
                onClick={(e) => handleNavClick(e, "contact")}
              >
                Contact Us
              </a>
            </li>
          </ul>

          {/* Login Button */}
          <button className="btn-header-book-now" onClick={handleEmployeeSignIn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '7px' }}>
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
            <span>{loggedIn ? `Dashboard (${userName || "Admin"})` : "Login"}</span>
          </button>
        </div>
      </header>

      {/* ==================== HOME PAGE VIEW ==================== */}
      {activeNav === "home" && (
        <>
          <section className="wanderly-hero-section" id="home">
            {/* Background Image & Soft Gradient Overlays */}
            <div className="wanderly-hero-bg-wrap">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80"
                alt="Breathtaking Destination Landscape"
                className="wanderly-hero-bg-img"
              />
              <div className="wanderly-hero-gradient-overlay"></div>
              <div className="wanderly-hero-left-curve"></div>
            </div>

            <div className="wanderly-hero-container">
              {/* LEFT COLUMN: Main Typography & CTA */}
              <div className="wanderly-hero-left">
                {/* Pill Sub-Badge */}
                <div className="wanderly-pill-badge">
                  <span className="pill-icon">🧭</span>
                  <span>More Places • More Stories</span>
                </div>

                {/* Main Heading */}
                <h1 className="wanderly-main-title">
                  Collect <br />
                  <span className="wanderly-title-accent">Moments,</span> <br />
                  Not Things
                </h1>

                {/* Subtitle */}
                <p className="wanderly-subtitle">
                  Discover breathtaking destinations, plan your next adventure, and turn your travel dreams into reality.
                </p>

                {/* Action CTA Button */}
                <button className="wanderly-cta-btn" onClick={handleEmployeeSignIn}>
                  <span>{loggedIn ? "Dashboard" : "Login"}</span>
                  <span className="cta-arrow-circle">➔</span>
                </button>

                {/* Happy Travelers Avatar Group */}
                <div className="wanderly-travelers-group">
                  <div className="travelers-avatar-stack">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Traveler" />
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Traveler" />
                    <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="Traveler" />
                    <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80" alt="Traveler" />
                    <span className="avatar-count-badge">12k+</span>
                  </div>
                  <div className="travelers-text-info">
                    <strong>Happy Travelers</strong>
                    <small>Exploring the world together</small>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Floating Doodles, Stats Stack & Featured Destination Card */}
              <div className="wanderly-hero-right">
                {/* Good Vibes Only Doodle */}
                <div className="wanderly-doodle-text">
                  <span>Good Vibes Only</span>
                  <svg width="45" height="35" viewBox="0 0 50 40" fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 5 C 20 25, 35 15, 45 35" />
                    <path d="M35 30 L 45 35 L 42 22" />
                  </svg>
                </div>

                {/* Stack of 3 Stat Badges */}
                <div className="wanderly-stats-stack">
                  <div className="stat-card">
                    <div className="stat-icon-box purple-bg">📍</div>
                    <div className="stat-info">
                      <strong>200+</strong>
                      <small>Destinations</small>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-box blue-bg">👥</div>
                    <div className="stat-info">
                      <strong>5k+</strong>
                      <small>Travel Guides</small>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-box gold-bg">🛡</div>
                    <div className="stat-info">
                      <strong className="gold-text">100%</strong>
                      <small>Safe & Trusted</small>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Bottom Left Wave Badge */}
            <div className="wanderly-bottom-left-badge">
              <span className="badge-plane">✈</span>
              <div className="badge-lines">
                <strong>Your Next Journey</strong>
                <small>Starts Here</small>
              </div>
            </div>
          </section>

          {/* Categories Arc Carousel Section */}
          <section className="categories-arc-section" id="branches">
            <div className="section-header-center">
              <div className="section-script-subtitle">Wonderful Place For You</div>
              <h2 className="section-title-bold">Tour Categories</h2>
            </div>

            <div className="categories-arc-grid">
              {displayOrganizations.map((org, idx) => {
                const tiltClasses = ["tilt-left-2", "tilt-left-1", "tilt-center", "tilt-right-1", "tilt-right-2"];
                const tiltClass = tiltClasses[idx % tiltClasses.length];
                return (
                  <div
                    key={org.id || idx}
                    className={`category-arc-card ${tiltClass} ${activeCategoryDot === idx ? 'active-card' : ''}`}
                    onClick={() => {
                      setActiveCategoryDot(idx);
                      handleEmployeeSignIn();
                    }}
                  >
                    <div className="arc-card-img-wrap">
                      <img src={org.img} alt={org.name} />
                    </div>
                    <div className="arc-card-info">
                      <h4 className="arc-card-title">{org.name}</h4>
                      <span className="arc-card-sub">
                        Read More <FaArrowRight style={{ marginLeft: "4px", fontSize: "11px" }} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="carousel-dots-row">
              {displayOrganizations.map((_, idx) => (
                <button
                  key={idx}
                  className={`carousel-dot ${activeCategoryDot === idx ? 'active' : ''}`}
                  onClick={() => setActiveCategoryDot(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Top Destinations 3D Coverflow Showcase Section */}
          <section className="top-destinations-section" style={{ width: "100%", maxWidth: "1320px", margin: "60px auto 40px auto", padding: "0 24px" }}>
            <div className="top-destinations-header">
              <div className="top-dest-title-wrap">
                <div className="section-script-subtitle">Our Hotel Network</div>
                <h2 className="section-title-bold">Top Organizations</h2>
              </div>
              <div className="dest-tabs-container">
                {displayOrganizations.map((item) => (
                  <button
                    key={item.id}
                    className={`dest-tab-btn ${activeDestinationTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveDestinationTab(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="dest-coverflow-wrapper">
              <div className="dest-coverflow-stage">
                {displayOrganizations.map((dest, idx) => {
                  let posClass = "card-hidden";
                  const offset = (idx - activeDestIndex + displayOrganizations.length) % displayOrganizations.length;

                  if (offset === 0) posClass = "card-center";
                  else if (offset === 1) posClass = "card-right-1";
                  else if (offset === 2) posClass = "card-right-2";
                  else if (offset === displayOrganizations.length - 1) posClass = "card-left-1";
                  else if (offset === displayOrganizations.length - 2) posClass = "card-left-2";

                  return (
                    <div
                      key={dest.id}
                      className={`dest-coverflow-card ${posClass}`}
                      onClick={() => setActiveDestinationTab(dest.id)}
                    >
                      <img src={dest.img} alt={dest.name} />
                      <div className="dest-center-overlay">
                        <div className="dest-text-content">
                          <h3 className="dest-card-title">{dest.name}</h3>
                          <span className="dest-card-count">{dest.listings}</span>
                        </div>
                        <button className="dest-view-all-btn" onClick={handleEmployeeSignIn}>
                          View All <FaArrowRight style={{ marginLeft: "6px", fontSize: "11px" }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Side Nav Arrows */}
              <div className="hero-side-nav" style={{ right: "10px", top: "50%" }}>
                <div className="hero-nav-arrow" onClick={handleNextDestination}>›</div>
                <div className="hero-nav-line"></div>
                <div className="hero-nav-arrow" onClick={handlePrevDestination}>‹</div>
              </div>
            </div>
          </section>

          {/* Plan Your Trip With Us Section (Matches Reference Screenshot 2 1-to-1) */}
          <section className="plan-stay-section" id="plan">
            {/* Top Left Hot Air Balloon Doodles */}
            <div className="doodle-balloon-wrap">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="#00a8cc" strokeWidth="1.8">
                <path d="M 20,30 C 10,20 12,8 24,8 C 36,8 38,20 28,30 L 26,36 L 22,36 Z" />
                <path d="M 22,36 L 22,40 L 26,40 L 26,36" />
                <rect x="22" y="40" width="4" height="4" rx="1" fill="#00a8cc" />

                <path d="M 44,18 C 38,12 39,4 47,4 C 55,4 56,12 50,18 L 48,22 L 46,22 Z" />
                <rect x="46" y="24" width="3" height="3" rx="1" fill="#00a8cc" />
              </svg>
            </div>

            {/* Bottom Left Vintage Camper Van & Pine Trees Doodle */}
            <div className="doodle-van-wrap">
              <svg width="90" height="60" viewBox="0 0 100 70" fill="none">
                <polygon points="15,45 22,30 29,45" fill="#1e3a8a" opacity="0.25" />
                <polygon points="12,55 22,38 32,55" fill="#1e3a8a" opacity="0.3" />
                <polygon points="25,50 32,32 39,50" fill="#0f3844" opacity="0.35" />

                <rect x="35" y="32" width="55" height="26" rx="6" fill="#e11d48" />
                <path d="M 35,44 L 90,44 L 90,58 L 35,58 Z" fill="#f8fafc" />
                <rect x="45" y="24" width="14" height="8" rx="2" fill="#00a8cc" />
                <rect x="62" y="26" width="16" height="6" rx="2" fill="#f59e0b" />
                <circle cx="48" cy="58" r="6" fill="#1e293b" />
                <circle cx="48" cy="58" r="2.5" fill="#ffffff" />
                <circle cx="78" cy="58" r="6" fill="#1e293b" />
                <circle cx="78" cy="58" r="2.5" fill="#ffffff" />
              </svg>
            </div>

            <div className="plan-section-inner">
              <div className="plan-collage-container">
                <div className="plan-mask-card tall-arch">
                  <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80" alt="Mountain Peak Hiker" />
                </div>
                <div className="plan-mask-card arch-top-right">
                  <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80" alt="Lake Kayaking" />
                </div>
                <div className="plan-mask-card circle-bottom">
                  <img src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=600&q=80" alt="Girls Selfie" />
                </div>
              </div>

              <div className="plan-text-content">
                <div className="section-script-subtitle">Let's Go Together</div>
                <h2 className="plan-heading-bold">Plan Your Trip<br />With Us</h2>
                <p className="plan-description-text">
                  There are many variations of passages of available but the majority have suffered alteration in some form, by injected hum randomised words which don't look even slightly.
                </p>

                <div className="plan-feature-rows">
                  <div className="plan-feature-row">
                    <div className="plan-feature-icon-circle">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3a15.3 15.3 0 0 0 4 9 15.3 15.3 0 0 0-4 9 15.3 15.3 0 0 0-4-9z" />
                        <path d="M3.6 9h16.8" />
                        <path d="M3.6 15h16.8" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="feature-row-title">Exclusive Trip</h4>
                      <p className="feature-row-desc">There are many variations of passages of available but the majority.</p>
                    </div>
                  </div>

                  <div className="plan-feature-row">
                    <div className="plan-feature-icon-circle">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="feature-row-title">Professional Guide</h4>
                      <p className="feature-row-desc">There are many variations of passages of available but the majority.</p>
                    </div>
                  </div>
                </div>

                <button className="btn-plan-dark" onClick={(e) => handleNavClick(e, "pricing")}>
                  Learn More <FaArrowRight style={{ marginLeft: "8px" }} />
                </button>
              </div>

              {/* Standing Traveler Guy Showcase (Right Column - Screenshot 2) */}
              <div className="plan-traveler-showcase">
                <div className="traveler-circle-bg">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
                    alt="Traveler Guy with Luggage"
                    className="traveler-img"
                  />
                  <div className="traveler-badge-emoji">
                    😍
                  </div>
                  <div className="traveler-badge-rating">
                    <span className="star-red">★</span> 4.9k
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 1. Most Popular Tour Section (Matches User Reference Screenshot 1) */}
          <section className="popular-tours-doodle-section" id="popular-tours">
            <div className="section-header-center">
              <div className="section-script-subtitle">Best Place For You</div>
              <h2 className="section-title-bold">Most Popular Tour</h2>
              <p className="popular-tours-subdesc">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            <div className="popular-tours-container">
              <div className="popular-tours-grid-stage">
                {top4OrgRooms.map((item) => (
                  <div className="tour-card-item" key={item.id}>
                    <div className="tour-card-img-wrap">
                      <img src={item.img} alt={item.title} />
                    </div>
                    <div className="tour-card-body">
                      <h4 className="tour-card-title">{item.title}</h4>
                      <div className="tour-rating-row">
                        <span className="stars-amber">★★★★★</span>
                        <span className="rating-text">({item.rating} Rating)</span>
                      </div>
                      <div className="tour-price-row">
                        <span className="tour-price-bold">₹{item.price}</span>
                        <span className="tour-price-sub">/Night</span>
                      </div>
                      <div className="tour-card-footer">
                        <span className="tour-duration-tag"><FaBed style={{ marginRight: "4px" }} /> {item.typeTag}</span>
                        <button className="btn-tour-book-now" onClick={handleEmployeeSignIn}>
                          Book Now <FaArrowRight style={{ marginLeft: "4px", fontSize: "11px" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 2. Recent Gallery Section (Matches User Reference Screenshot 2) */}
          <section className="recent-gallery-section" id="gallery">
            {/* Background Wavy Line & Plane / Anchor Doodles */}
            <div className="gallery-doodle-plane">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#00a8cc" strokeWidth="1.8">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-1 .1-1.3.5l-.8.8c-.4.4-.3 1.1.2 1.4l5 3.5-3.5 3.5-2.2-.6c-.3-.1-.7 0-.9.2l-.5.5c-.3.3-.3.8 0 1.1l2.8 2.8c.3.3.8.3 1.1 0l.5-.5c.2-.2.3-.6.2-.9l-.6-2.2 3.5-3.5 3.5 5c.3.5 1 .6 1.4.2l.8-.8c.4-.3.6-.8.5-1.3z" />
              </svg>
            </div>

            <div className="gallery-doodle-anchor">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00a8cc" strokeWidth="2">
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v14M5 12h14M5 12a7 7 0 0 0 14 0" />
              </svg>
            </div>

            <div className="gallery-bg-wave">
              <svg viewBox="0 0 1200 350" fill="none" className="gallery-wave-svg">
                <path d="M -100 200 C 300 50 600 320 1300 100" stroke="#7dd3fc" strokeWidth="2" opacity="0.45" />
                <path d="M -50 120 C 400 300 700 40 1250 250" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.5" />
              </svg>
            </div>

            <div className="section-header-center">
              <div className="section-script-subtitle">Make Your Tour More Pleasure</div>
              <h2 className="section-title-bold">Recent Gallery</h2>
            </div>

            {/* 7-Photo Masonry Grid */}
            <div className="recent-gallery-grid-container">
              {/* Card 1: Left Tall */}
              <div className="gallery-item item-left-tall">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" alt="Girls in Mountains" />
              </div>

              {/* Stacked Middle-Left (Cards 2 & 3) */}
              <div className="gallery-column-stacked">
                <div className="gallery-item item-sm">
                  <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" alt="Girl on Boat" />
                </div>
                <div className="gallery-item item-sm">
                  <img src="https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80" alt="Mountain Fjord View" />
                </div>
              </div>

              {/* Card 4: Middle Center Tall */}
              <div className="gallery-item item-center-tall">
                <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80" alt="Skiers on Snow Peak" />
              </div>

              {/* Stacked Middle-Right (Cards 5 & 6) */}
              <div className="gallery-column-stacked">
                <div className="gallery-item item-sm">
                  <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80" alt="Three Friends on Ridge" />
                </div>
                <div className="gallery-item item-sm">
                  <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80" alt="Yellow Dress Girl Beach" />
                </div>
              </div>

              {/* Card 7: Far Right Tall */}
              <div className="gallery-item item-right-tall">
                <img src="https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=600&q=80" alt="Luxury Yacht Ocean" />
              </div>
            </div>
          </section>

          {/* 3. Tour Guide Section (All Organization Managers Slider) */}
          <section className="tour-guide-doodle-section" id="guides">
            <div className="section-header-center">
              <div className="section-script-subtitle">Meet with Guide</div>
              <h2 className="section-title-bold">Tour Guide</h2>
            </div>

            <div className="tour-guide-cards-stage">
              {visibleGuideManagers.map((manager, idx) => (
                <div key={manager.id} className={`guide-card-item ${idx === 1 ? 'active-cyan' : ''}`}>
                  <div className="guide-avatar-wrap">
                    <img src={manager.img} alt={manager.name} />
                  </div>
                  <div className="guide-card-content">
                    <h4 className="guide-name">{manager.name}</h4>
                    <span className="guide-role">{manager.role}</span>
                    <div className="guide-social-row">
                      <span className="guide-social-icon"><FaFacebookF /></span>
                      <span className="guide-social-icon"><FaTwitter /></span>
                      <span className="guide-social-icon">in</span>
                      <span className="guide-social-icon">▶</span>
                      <span className="guide-social-icon"><FaInstagram /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Dots Slider */}
            <div className="guide-dots-row">
              {Array.from({ length: totalGuideDots }).map((_, idx) => (
                <span
                  key={idx}
                  className={`guide-dot ${guideSliderIndex === idx ? 'active' : ''}`}
                  onClick={() => setGuideSliderIndex(idx)}
                />
              ))}
            </div>
          </section>

          {/* 4. Staggered Circular Stats Counter Section (Matches User Reference Screenshot 4) */}
          <section className="circular-stats-section">
            <div className="stats-doodle-left">
              <svg width="45" height="65" viewBox="0 0 50 70" fill="none" stroke="#00a8cc" strokeWidth="2">
                <ellipse cx="25" cy="25" rx="18" ry="22" />
                <path d="M16 46 L25 42 L34 46 Z" fill="#00a8cc" />
                <path d="M25 46 Q 20 58 25 68" />
              </svg>
            </div>

            <div className="stats-doodle-right">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00a8cc" strokeWidth="2">
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v14M5 12h14M5 12a7 7 0 0 0 14 0" />
              </svg>
            </div>

            <div className="circular-stats-container">
              {/* Circle 1 */}
              <div className="stat-circle-card pos-down">
                <div className="stat-circle-ring">
                  <div className="stat-orbital-dot dot-bottom"></div>
                  <div className="stat-circle-inner">
                    <h3 className="stat-num-bold">12</h3>
                    <p className="stat-label-text">Years Experience</p>
                  </div>
                </div>
              </div>

              {/* Circle 2 */}
              <div className="stat-circle-card pos-up">
                <div className="stat-circle-ring">
                  <div className="stat-orbital-dot dot-top"></div>
                  <div className="stat-circle-inner">
                    <h3 className="stat-num-bold">97%</h3>
                    <p className="stat-label-text">Retention Rate</p>
                  </div>
                </div>
              </div>

              {/* Circle 3 */}
              <div className="stat-circle-card pos-down">
                <div className="stat-circle-ring">
                  <div className="stat-orbital-dot dot-bottom"></div>
                  <div className="stat-circle-inner">
                    <h3 className="stat-num-bold">8K</h3>
                    <p className="stat-label-text">Tour Completed</p>
                  </div>
                </div>
              </div>

              {/* Circle 4 */}
              <div className="stat-circle-card pos-up">
                <div className="stat-circle-ring">
                  <div className="stat-orbital-dot dot-top"></div>
                  <div className="stat-circle-inner">
                    <h3 className="stat-num-bold">19K</h3>
                    <p className="stat-label-text">Happy Travellers</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section (Matches User Reference Screenshot 1) */}
          <section className="testimonials-section">
            <div className="testi-bg-line-wrap">
              <svg viewBox="0 0 1200 300" fill="none" className="testi-bg-svg">
                <path
                  d="M -100,180 C 200,40 600,280 1300,80"
                  stroke="#bae6fd"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  opacity="0.6"
                />
              </svg>
            </div>

            <div className="testi-doodle-plane">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#00a8cc" strokeWidth="1.8">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.5-.1-1 .1-1.3.5l-.8.8c-.4.4-.3 1.1.2 1.4l5 3.5-3.5 3.5-2.2-.6c-.3-.1-.7 0-.9.2l-.5.5c-.3.3-.3.8 0 1.1l2.8 2.8c.3.3.8.3 1.1 0l.5-.5c.2-.2.3-.6.2-.9l-.6-2.2 3.5-3.5 3.5 5c.3.5 1 .6 1.4.2l.8-.8c.4-.3.6-.8.5-1.3z" />
              </svg>
            </div>

            <div className="section-header-center">
              <div className="section-script-subtitle">Testimonial</div>
              <h2 className="section-title-bold">What Client Say About Us</h2>
            </div>

            <div className="testimonials-stage">
              {(() => {
                const count = TESTIMONIAL_ITEMS.length;
                const leftIdx = (activeTestiIndex - 1 + count) % count;
                const centerIdx = activeTestiIndex;
                const rightIdx = (activeTestiIndex + 1) % count;

                const leftItem = TESTIMONIAL_ITEMS[leftIdx];
                const centerItem = TESTIMONIAL_ITEMS[centerIdx];
                const rightItem = TESTIMONIAL_ITEMS[rightIdx];

                return (
                  <>
                    <div
                      className="testimonial-card side-card"
                      onClick={() => setActiveTestiIndex(leftIdx)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="testi-header">
                        <div className="testi-user-wrap">
                          <img src={leftItem.img} alt={leftItem.name} />
                          <div>
                            <h5 className="testi-user-name">{leftItem.name}</h5>
                            <span className="testi-user-role">{leftItem.role}</span>
                          </div>
                        </div>
                        <span className="stars-amber">★★★★★</span>
                      </div>
                      <p className="testi-quote-text">{leftItem.text}</p>
                      <div className="testi-quote-badge">99</div>
                    </div>

                    <div className="testimonial-card center-card active">
                      <div className="testi-header">
                        <div className="testi-user-wrap">
                          <img src={centerItem.img} alt={centerItem.name} />
                          <div>
                            <h5 className="testi-user-name">{centerItem.name}</h5>
                            <span className="testi-user-role">{centerItem.role}</span>
                          </div>
                        </div>
                        <span className="stars-amber">★★★★★</span>
                      </div>
                      <p className="testi-quote-text">{centerItem.text}</p>
                      <div className="testi-quote-badge cyan-filled">99</div>
                    </div>

                    <div
                      className="testimonial-card side-card"
                      onClick={() => setActiveTestiIndex(rightIdx)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="testi-header">
                        <div className="testi-user-wrap">
                          <img src={rightItem.img} alt={rightItem.name} />
                          <div>
                            <h5 className="testi-user-name">{rightItem.name}</h5>
                            <span className="testi-user-role">{rightItem.role}</span>
                          </div>
                        </div>
                        <span className="stars-amber">★★★★★</span>
                      </div>
                      <p className="testi-quote-text">{rightItem.text}</p>
                      <div className="testi-quote-badge">99</div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="carousel-dots-row">
              {TESTIMONIAL_ITEMS.map((_, idx) => (
                <button
                  key={idx}
                  className={`carousel-dot ${activeTestiIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveTestiIndex(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Brand Partner Vintage Badges Bar (With Infinite Moving Marquee Ticker) */}
          <section className="brand-partner-bar-section">
            <div className="brand-partner-wave-bg">
              <svg viewBox="0 0 1200 150" fill="none" className="brand-partner-wave-svg">
                <path d="M 600 0 C 850 80 1100 20 1300 120" stroke="#bae6fd" strokeWidth="1.5" opacity="0.6" fill="none" />
              </svg>
            </div>

            <div className="brand-partner-container">
              <div className="brand-partner-track">
                {/* SET 1 */}
                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <circle cx="70" cy="55" r="42" stroke="#00a8cc" strokeDasharray="3 3" strokeWidth="1.2" />
                    <path d="M 38 48 Q 70 32 102 48" fill="none" id="arc1_1" />
                    <text fontSize="8" fontWeight="600" fill="#00a8cc" letterSpacing="1" textAnchor="middle">
                      <textPath href="#arc1_1" startOffset="50%">TAKE RISK ENJOY IT</textPath>
                    </text>
                    <text x="70" y="46" fontSize="10" fontWeight="700" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif">LIFE</text>
                    <text x="70" y="56" fontSize="8" fontWeight="500" fill="#00a8cc" textAnchor="middle">IS AN</text>
                    <text x="70" y="70" fontSize="19" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">Adventure</text>
                    <line x1="50" y1="78" x2="90" y2="78" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="86" fontSize="7" fontWeight="600" fill="#00a8cc" textAnchor="middle">2003</text>
                    <text x="70" y="94" fontSize="6" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">IN FORGIVENESS</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <path d="M 38 32 Q 70 20 102 32" id="arc2_1" fill="none" />
                    <text fontSize="7" fontWeight="700" fill="#00a8cc" letterSpacing="1.2" textAnchor="middle">
                      <textPath href="#arc2_1" startOffset="50%">OUTDOOR ADVENTURE</textPath>
                    </text>
                    <polygon points="32,62 38,50 44,62" fill="#00a8cc" />
                    <polygon points="34,54 38,44 42,54" fill="#00a8cc" />
                    <polygon points="96,62 102,50 108,62" fill="#00a8cc" />
                    <polygon points="98,54 102,44 106,54" fill="#00a8cc" />
                    <polygon points="40,64 56,36 72,64" fill="#00a8cc" />
                    <polygon points="56,36 62,48 50,48" fill="#ffffff" opacity="0.4" />
                    <polygon points="62,64 80,32 98,64" fill="#00a8cc" />
                    <polygon points="80,32 87,46 73,46" fill="#ffffff" opacity="0.4" />
                    <text x="70" y="80" fontSize="17" fontWeight="900" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">MOUNTAIN</text>
                    <line x1="38" y1="86" x2="102" y2="86" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="94" fontSize="6.5" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1">EXTREME CLIMBING</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <circle cx="70" cy="55" r="42" stroke="#00a8cc" strokeDasharray="3 3" strokeWidth="1.2" />
                    <path d="M 38 48 Q 70 32 102 48" fill="none" id="arc3_1" />
                    <text fontSize="8" fontWeight="600" fill="#00a8cc" letterSpacing="1" textAnchor="middle">
                      <textPath href="#arc3_1" startOffset="50%">TAKE RISK ENJOY IT</textPath>
                    </text>
                    <text x="70" y="46" fontSize="10" fontWeight="700" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif">LIFE</text>
                    <text x="70" y="56" fontSize="8" fontWeight="500" fill="#00a8cc" textAnchor="middle">IS AN</text>
                    <text x="70" y="70" fontSize="19" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">Adventure</text>
                    <line x1="50" y1="78" x2="90" y2="78" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="86" fontSize="7" fontWeight="600" fill="#00a8cc" textAnchor="middle">2003</text>
                    <text x="70" y="94" fontSize="6" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">IN FORGIVENESS</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <text x="70" y="28" fontSize="7" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1.2">OUTDOOR ADVENTURE</text>
                    <line x1="56" y1="36" x2="84" y2="58" stroke="#00a8cc" strokeWidth="1.5" />
                    <line x1="84" y1="36" x2="56" y2="58" stroke="#00a8cc" strokeWidth="1.5" />
                    <path d="M 56 36 L 60 36 M 56 36 L 56 40" stroke="#00a8cc" strokeWidth="1.5" />
                    <path d="M 84 36 L 80 36 M 84 36 L 84 40" stroke="#00a8cc" strokeWidth="1.5" />
                    <text x="48" y="48" fontSize="6" fontWeight="600" fill="#00a8cc" textAnchor="middle">TRADE</text>
                    <text x="92" y="48" fontSize="6" fontWeight="600" fill="#00a8cc" textAnchor="middle">MARK</text>
                    <text x="70" y="74" fontSize="19" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">Wanderlust</text>
                    <text x="70" y="84" fontSize="8" fontWeight="500" fill="#00a8cc" textAnchor="middle" fontStyle="italic">Travel is to discover</text>
                    <line x1="50" y1="90" x2="90" y2="90" stroke="#00a8cc" strokeWidth="0.8" />
                    <text x="70" y="97" fontSize="6" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">EXPLORE THE ELEMENT</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <g stroke="#00a8cc" strokeWidth="1" opacity="0.7">
                      <line x1="70" y1="38" x2="70" y2="18" />
                      <line x1="60" y1="40" x2="52" y2="24" />
                      <line x1="80" y1="40" x2="88" y2="24" />
                      <line x1="52" y1="46" x2="38" y2="34" />
                      <line x1="88" y1="46" x2="102" y2="34" />
                    </g>
                    <polygon points="46,58 64,30 82,58" fill="#00a8cc" />
                    <polygon points="64,30 71,44 57,44" fill="#ffffff" opacity="0.45" />
                    <polygon points="66,58 84,26 102,58" fill="#00a8cc" />
                    <polygon points="84,26 92,42 76,42" fill="#ffffff" opacity="0.45" />
                    <text x="70" y="76" fontSize="18" fontWeight="900" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1">EXPLORER</text>
                    <line x1="36" y1="84" x2="104" y2="84" stroke="#00a8cc" strokeWidth="1.2" />
                    <text x="70" y="93" fontSize="8" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">— Great Adventure —</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <text x="70" y="28" fontSize="7" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1.2">OUTDOOR ADVENTURE</text>
                    <line x1="56" y1="36" x2="84" y2="58" stroke="#00a8cc" strokeWidth="1.5" />
                    <line x1="84" y1="36" x2="56" y2="58" stroke="#00a8cc" strokeWidth="1.5" />
                    <path d="M 56 36 L 60 36 M 56 36 L 56 40" stroke="#00a8cc" strokeWidth="1.5" />
                    <path d="M 84 36 L 80 36 M 84 36 L 84 40" stroke="#00a8cc" strokeWidth="1.5" />
                    <text x="48" y="48" fontSize="6" fontWeight="600" fill="#00a8cc" textAnchor="middle">TRADE</text>
                    <text x="92" y="48" fontSize="6" fontWeight="600" fill="#00a8cc" textAnchor="middle">MARK</text>
                    <text x="70" y="74" fontSize="19" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">Wanderlust</text>
                    <text x="70" y="84" fontSize="8" fontWeight="500" fill="#00a8cc" textAnchor="middle" fontStyle="italic">Travel is to discover</text>
                    <line x1="50" y1="90" x2="90" y2="90" stroke="#00a8cc" strokeWidth="0.8" />
                    <text x="70" y="97" fontSize="6" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">EXPLORE THE ELEMENT</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <path d="M 38 32 Q 70 20 102 32" id="arc7_1" fill="none" />
                    <text fontSize="7" fontWeight="700" fill="#00a8cc" letterSpacing="1.2" textAnchor="middle">
                      <textPath href="#arc7_1" startOffset="50%">OUTDOOR ADVENTURE</textPath>
                    </text>
                    <polygon points="32,62 38,50 44,62" fill="#00a8cc" />
                    <polygon points="34,54 38,44 42,54" fill="#00a8cc" />
                    <polygon points="96,62 102,50 108,62" fill="#00a8cc" />
                    <polygon points="98,54 102,44 106,54" fill="#00a8cc" />
                    <polygon points="40,64 56,36 72,64" fill="#00a8cc" />
                    <polygon points="56,36 62,48 50,48" fill="#ffffff" opacity="0.4" />
                    <polygon points="62,64 80,32 98,64" fill="#00a8cc" />
                    <polygon points="80,32 87,46 73,46" fill="#ffffff" opacity="0.4" />
                    <text x="70" y="80" fontSize="17" fontWeight="900" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">MOUNTAIN</text>
                    <line x1="38" y1="86" x2="102" y2="86" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="94" fontSize="6.5" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1">EXTREME CLIMBING</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <path d="M 32 36 Q 70 18 108 36" id="arc8_1" fill="none" />
                    <text fontSize="11" fontWeight="800" fill="#00a8cc" letterSpacing="1" textAnchor="middle" fontFamily="sans-serif">
                      <textPath href="#arc8_1" startOffset="50%">JEFFERSON</textPath>
                    </text>
                    <text x="70" y="38" fontSize="6.5" fontWeight="600" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">THE GREAT OUTDOOR</text>
                    <polygon points="48,60 70,38 92,60" fill="#00a8cc" />
                    <polygon points="70,38 77,48 63,48" fill="#ffffff" opacity="0.4" />
                    <text x="42" y="52" fontSize="6" fontWeight="700" fill="#00a8cc">19</text>
                    <text x="92" y="52" fontSize="6" fontWeight="700" fill="#00a8cc">96</text>
                    <text x="70" y="76" fontSize="16" fontWeight="900" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">BLUELAKE</text>
                    <line x1="36" y1="84" x2="104" y2="84" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="92" fontSize="6" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1">— MOUNT KILIMANJARO —</text>
                  </svg>
                </div>

                {/* SET 2 (DUPLICATED FOR SEAMLESS INFINITE LOOP) */}
                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <circle cx="70" cy="55" r="42" stroke="#00a8cc" strokeDasharray="3 3" strokeWidth="1.2" />
                    <path d="M 38 48 Q 70 32 102 48" fill="none" id="arc1_2" />
                    <text fontSize="8" fontWeight="600" fill="#00a8cc" letterSpacing="1" textAnchor="middle">
                      <textPath href="#arc1_2" startOffset="50%">TAKE RISK ENJOY IT</textPath>
                    </text>
                    <text x="70" y="46" fontSize="10" fontWeight="700" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif">LIFE</text>
                    <text x="70" y="56" fontSize="8" fontWeight="500" fill="#00a8cc" textAnchor="middle">IS AN</text>
                    <text x="70" y="70" fontSize="19" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">Adventure</text>
                    <line x1="50" y1="78" x2="90" y2="78" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="86" fontSize="7" fontWeight="600" fill="#00a8cc" textAnchor="middle">2003</text>
                    <text x="70" y="94" fontSize="6" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">IN FORGIVENESS</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <path d="M 38 32 Q 70 20 102 32" id="arc2_2" fill="none" />
                    <text fontSize="7" fontWeight="700" fill="#00a8cc" letterSpacing="1.2" textAnchor="middle">
                      <textPath href="#arc2_2" startOffset="50%">OUTDOOR ADVENTURE</textPath>
                    </text>
                    <polygon points="32,62 38,50 44,62" fill="#00a8cc" />
                    <polygon points="34,54 38,44 42,54" fill="#00a8cc" />
                    <polygon points="96,62 102,50 108,62" fill="#00a8cc" />
                    <polygon points="98,54 102,44 106,54" fill="#00a8cc" />
                    <polygon points="40,64 56,36 72,64" fill="#00a8cc" />
                    <polygon points="56,36 62,48 50,48" fill="#ffffff" opacity="0.4" />
                    <polygon points="62,64 80,32 98,64" fill="#00a8cc" />
                    <polygon points="80,32 87,46 73,46" fill="#ffffff" opacity="0.4" />
                    <text x="70" y="80" fontSize="17" fontWeight="900" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">MOUNTAIN</text>
                    <line x1="38" y1="86" x2="102" y2="86" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="94" fontSize="6.5" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1">EXTREME CLIMBING</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <circle cx="70" cy="55" r="42" stroke="#00a8cc" strokeDasharray="3 3" strokeWidth="1.2" />
                    <path d="M 38 48 Q 70 32 102 48" fill="none" id="arc3_2" />
                    <text fontSize="8" fontWeight="600" fill="#00a8cc" letterSpacing="1" textAnchor="middle">
                      <textPath href="#arc3_2" startOffset="50%">TAKE RISK ENJOY IT</textPath>
                    </text>
                    <text x="70" y="46" fontSize="10" fontWeight="700" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif">LIFE</text>
                    <text x="70" y="56" fontSize="8" fontWeight="500" fill="#00a8cc" textAnchor="middle">IS AN</text>
                    <text x="70" y="70" fontSize="19" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">Adventure</text>
                    <line x1="50" y1="78" x2="90" y2="78" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="86" fontSize="7" fontWeight="600" fill="#00a8cc" textAnchor="middle">2003</text>
                    <text x="70" y="94" fontSize="6" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">IN FORGIVENESS</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <text x="70" y="28" fontSize="7" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1.2">OUTDOOR ADVENTURE</text>
                    <line x1="56" y1="36" x2="84" y2="58" stroke="#00a8cc" strokeWidth="1.5" />
                    <line x1="84" y1="36" x2="56" y2="58" stroke="#00a8cc" strokeWidth="1.5" />
                    <path d="M 56 36 L 60 36 M 56 36 L 56 40" stroke="#00a8cc" strokeWidth="1.5" />
                    <path d="M 84 36 L 80 36 M 84 36 L 84 40" stroke="#00a8cc" strokeWidth="1.5" />
                    <text x="48" y="48" fontSize="6" fontWeight="600" fill="#00a8cc" textAnchor="middle">TRADE</text>
                    <text x="92" y="48" fontSize="6" fontWeight="600" fill="#00a8cc" textAnchor="middle">MARK</text>
                    <text x="70" y="74" fontSize="19" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">Wanderlust</text>
                    <text x="70" y="84" fontSize="8" fontWeight="500" fill="#00a8cc" textAnchor="middle" fontStyle="italic">Travel is to discover</text>
                    <line x1="50" y1="90" x2="90" y2="90" stroke="#00a8cc" strokeWidth="0.8" />
                    <text x="70" y="97" fontSize="6" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">EXPLORE THE ELEMENT</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <g stroke="#00a8cc" strokeWidth="1" opacity="0.7">
                      <line x1="70" y1="38" x2="70" y2="18" />
                      <line x1="60" y1="40" x2="52" y2="24" />
                      <line x1="80" y1="40" x2="88" y2="24" />
                      <line x1="52" y1="46" x2="38" y2="34" />
                      <line x1="88" y1="46" x2="102" y2="34" />
                    </g>
                    <polygon points="46,58 64,30 82,58" fill="#00a8cc" />
                    <polygon points="64,30 71,44 57,44" fill="#ffffff" opacity="0.45" />
                    <polygon points="66,58 84,26 102,58" fill="#00a8cc" />
                    <polygon points="84,26 92,42 76,42" fill="#ffffff" opacity="0.45" />
                    <text x="70" y="76" fontSize="18" fontWeight="900" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1">EXPLORER</text>
                    <line x1="36" y1="84" x2="104" y2="84" stroke="#00a8cc" strokeWidth="1.2" />
                    <text x="70" y="93" fontSize="8" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">— Great Adventure —</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <text x="70" y="28" fontSize="7" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1.2">OUTDOOR ADVENTURE</text>
                    <line x1="56" y1="36" x2="84" y2="58" stroke="#00a8cc" strokeWidth="1.5" />
                    <line x1="84" y1="36" x2="56" y2="58" stroke="#00a8cc" strokeWidth="1.5" />
                    <path d="M 56 36 L 60 36 M 56 36 L 56 40" stroke="#00a8cc" strokeWidth="1.5" />
                    <path d="M 84 36 L 80 36 M 84 36 L 84 40" stroke="#00a8cc" strokeWidth="1.5" />
                    <text x="48" y="48" fontSize="6" fontWeight="600" fill="#00a8cc" textAnchor="middle">TRADE</text>
                    <text x="92" y="48" fontSize="6" fontWeight="600" fill="#00a8cc" textAnchor="middle">MARK</text>
                    <text x="70" y="74" fontSize="19" fontWeight="600" fill="#00a8cc" textAnchor="middle" fontFamily="'Caveat', cursive">Wanderlust</text>
                    <text x="70" y="84" fontSize="8" fontWeight="500" fill="#00a8cc" textAnchor="middle" fontStyle="italic">Travel is to discover</text>
                    <line x1="50" y1="90" x2="90" y2="90" stroke="#00a8cc" strokeWidth="0.8" />
                    <text x="70" y="97" fontSize="6" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">EXPLORE THE ELEMENT</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <path d="M 38 32 Q 70 20 102 32" id="arc7_2" fill="none" />
                    <text fontSize="7" fontWeight="700" fill="#00a8cc" letterSpacing="1.2" textAnchor="middle">
                      <textPath href="#arc7_2" startOffset="50%">OUTDOOR ADVENTURE</textPath>
                    </text>
                    <polygon points="32,62 38,50 44,62" fill="#00a8cc" />
                    <polygon points="34,54 38,44 42,54" fill="#00a8cc" />
                    <polygon points="96,62 102,50 108,62" fill="#00a8cc" />
                    <polygon points="98,54 102,44 106,54" fill="#00a8cc" />
                    <polygon points="40,64 56,36 72,64" fill="#00a8cc" />
                    <polygon points="56,36 62,48 50,48" fill="#ffffff" opacity="0.4" />
                    <polygon points="62,64 80,32 98,64" fill="#00a8cc" />
                    <polygon points="80,32 87,46 73,46" fill="#ffffff" opacity="0.4" />
                    <text x="70" y="80" fontSize="17" fontWeight="900" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">MOUNTAIN</text>
                    <line x1="38" y1="86" x2="102" y2="86" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="94" fontSize="6.5" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1">EXTREME CLIMBING</text>
                  </svg>
                </div>

                <div className="brand-logo-item">
                  <svg width="110" height="90" viewBox="0 0 140 110" fill="none">
                    <path d="M 32 36 Q 70 18 108 36" id="arc8_2" fill="none" />
                    <text fontSize="11" fontWeight="800" fill="#00a8cc" letterSpacing="1" textAnchor="middle" fontFamily="sans-serif">
                      <textPath href="#arc8_2" startOffset="50%">JEFFERSON</textPath>
                    </text>
                    <text x="70" y="38" fontSize="6.5" fontWeight="600" fill="#00a8cc" textAnchor="middle" letterSpacing="0.8">THE GREAT OUTDOOR</text>
                    <polygon points="48,60 70,38 92,60" fill="#00a8cc" />
                    <polygon points="70,38 77,48 63,48" fill="#ffffff" opacity="0.4" />
                    <text x="42" y="52" fontSize="6" fontWeight="700" fill="#00a8cc">19</text>
                    <text x="92" y="52" fontSize="6" fontWeight="700" fill="#00a8cc">96</text>
                    <text x="70" y="76" fontSize="16" fontWeight="900" fill="#00a8cc" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">BLUELAKE</text>
                    <line x1="36" y1="84" x2="104" y2="84" stroke="#00a8cc" strokeWidth="1" />
                    <text x="70" y="92" fontSize="6" fontWeight="700" fill="#00a8cc" textAnchor="middle" letterSpacing="1">— MOUNT KILIMANJARO —</text>
                  </svg>
                </div>
              </div>
            </div>
          </section>
          <section className="news-articles-section">
            <div className="doodle-balloon-wrap left-bottom">
              <svg className="doodle-balloon lg" viewBox="0 0 50 70" fill="none" stroke="#00a8cc" strokeWidth="2">
                <ellipse cx="25" cy="25" rx="18" ry="22" />
                <path d="M16 46 L25 42 L34 46 Z" fill="#00a8cc" />
                <path d="M25 46 Q 20 58 25 68" />
              </svg>
              <svg className="doodle-balloon sm" viewBox="0 0 50 70" fill="none" stroke="#00a8cc" strokeWidth="2">
                <ellipse cx="25" cy="25" rx="12" ry="16" />
                <path d="M19 41 L25 38 L31 41 Z" fill="#00a8cc" />
                <path d="M25 41 Q 22 52 25 62" />
              </svg>
            </div>

            <div className="news-articles-container">
              <div className="news-header-row">
                <div className="news-title-wrap">
                  <div className="section-script-subtitle">Blog and Article</div>
                  <h2 className="section-title-bold">News & Articles From Tourm</h2>
                </div>
                <button className="btn-see-more-articles">
                  See More Articles <FaArrowRight style={{ marginLeft: "6px" }} />
                </button>
              </div>

              <div className="news-cards-grid">
                <div className="news-card-item">
                  <div className="news-card-img-wrap">
                    <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80" alt="Desert Van Travel" />
                  </div>
                  <div className="news-card-body">
                    <span className="news-meta-text">July 05, 2024  |  6 min read</span>
                    <h4 className="news-article-title">10 Reason why you should visit New Jersy</h4>
                    <button className="btn-news-read-more outline">
                      Read More <FaArrowRight style={{ marginLeft: "4px", fontSize: "11px" }} />
                    </button>
                  </div>
                </div>

                <div className="news-card-item">
                  <div className="news-card-img-wrap">
                    <img src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=600&q=80" alt="Bridge Hike Adventure" />
                  </div>
                  <div className="news-card-body">
                    <span className="news-meta-text">July 05, 2024  |  6 min read</span>
                    <h4 className="news-article-title">The best time to visit japan & enjoy the cherry blossoms</h4>
                    <button className="btn-news-read-more outline">
                      Read More <FaArrowRight style={{ marginLeft: "4px", fontSize: "11px" }} />
                    </button>
                  </div>
                </div>

                <div className="news-card-item">
                  <div className="news-card-img-wrap">
                    <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" alt="Mountain Lake Boat" />
                  </div>
                  <div className="news-card-body">
                    <span className="news-meta-text">July 05, 2024  |  6 min read</span>
                    <h4 className="news-article-title">The 7 amazing destinations for adventure seekers</h4>
                    <button className="btn-news-read-more filled">
                      Read More <FaArrowRight style={{ marginLeft: "4px", fontSize: "11px" }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ==================== ABOUT US DEDICATED PAGE VIEW (EXACT SCREENSHOT MATCH) ==================== */}
      {activeNav === "about" && (
        <div className="thrilliz-about-page-wrapper">
          {/* Banner with Shaped Photo & Compass Overlay */}
          <div className="thrilliz-banner-container">
            <div className="thrilliz-banner-card">
              <img
                src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1600&q=80"
                alt="Forest Compass Banner"
                className="thrilliz-banner-img"
              />
              <div className="thrilliz-banner-overlay">
                <h1 className="thrilliz-banner-title">ABOUT US</h1>
                <div className="thrilliz-compass-badge">
                  <svg width="70" height="70" viewBox="0 0 100 100" fill="none">
                    <circle cx="50" cy="50" r="45" stroke="#ffffff" strokeWidth="3" fill="rgba(0,0,0,0.2)" />
                    <circle cx="50" cy="50" r="35" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
                    <polygon points="50,15 58,45 50,50 42,45" fill="#e11d48" />
                    <polygon points="50,85 58,55 50,50 42,55" fill="#ffffff" />
                    <circle cx="50" cy="50" r="4" fill="#ffffff" />
                  </svg>
                </div>
                <div className="thrilliz-scroll-down-btn">
                  ↓
                </div>
              </div>
            </div>

            <div className="thrilliz-banner-bottom-text">
              <span className="thrilliz-sub-tag">Your Ultimate Guide to Hiking and Outdoor Experiences</span>
              <h2 className="thrilliz-main-headline">Discover the Thrill of Adventure with Tourm</h2>
            </div>
          </div>

          {/* Section 2: Get to Know About Us */}
          <section className="thrilliz-get-to-know-section">
            <div className="thrilliz-section-badge">
              <span className="badge-dot">✴</span> About Us
            </div>
            <h2 className="thrilliz-section-title">Get to Know About Us</h2>

            <div className="thrilliz-know-grid">
              <div className="thrilliz-stats-4-grid">
                <div className="thrilliz-stat-card">
                  <h3 className="stat-big-num">200+</h3>
                  <p className="stat-card-label">Hiking Event Organized</p>
                </div>
                <div className="thrilliz-stat-card">
                  <h3 className="stat-big-num">25</h3>
                  <p className="stat-card-label">Countries Covered in Trail Guides</p>
                </div>
                <div className="thrilliz-stat-card">
                  <h3 className="stat-big-num">98%</h3>
                  <p className="stat-card-label">Costumer Satisfaction Rate</p>
                </div>
                <div className="thrilliz-stat-card">
                  <h3 className="stat-big-num">10K+</h3>
                  <p className="stat-card-label">Hikers in Community</p>
                </div>
              </div>

              <div className="thrilliz-know-desc-col">
                <h3 className="thrilliz-quote-headline">
                  Elevate every step, embrace every trail. Adventure awaits—let's make it unforgettable
                </h3>
                <p className="thrilliz-body-paragraph">
                  At Tourm, we are passionate about the great outdoors and dedicated to helping you make the most of your hiking adventures. Founded by a team of outdoor enthusiasts, our mission is to provide comprehensive resources and high-quality gear to novice and seasoned hikers. We believe that everyone should have the opportunity to explore nature's beauty, and we strive to make every hike a memorable experience.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Meet the Adventurers Behind Tourm */}
          <section className="thrilliz-team-section" id="team">
            <div className="thrilliz-section-badge">
              <span className="badge-dot">✴</span> Our Team
            </div>

            <div className="thrilliz-team-layout">
              <div className="thrilliz-team-left-col">
                <h2 className="thrilliz-team-heading">
                  Meet the Adventurers Behind Tourm
                </h2>
                <p className="thrilliz-team-subtext">
                  Get to know our dedicated organization managers leading properties across all our branches and locations.
                </p>
                <button className="btn-thrilliz-contact-team" onClick={() => handleNavClick(null, "contact")}>
                  Contact Our Team
                </button>
              </div>

              <div className="thrilliz-team-grid">
                {allOrgManagers.length > 0 && (
                  <div className="team-card-tall" key={allOrgManagers[0].id || 'tall-mgr-0'}>
                    <img src={allOrgManagers[0].img} alt={allOrgManagers[0].name} />
                    <div className="team-card-info">
                      <h4>{allOrgManagers[0].name}</h4>
                      <span>{allOrgManagers[0].role}</span>
                    </div>
                  </div>
                )}

                <div className="team-cards-subgrid">
                  {allOrgManagers.slice(1).map((member, idx) => (
                    <div className="team-card-sm" key={member.id || `sub-mgr-${idx}`}>
                      <img src={member.img} alt={member.name} />
                      <div className="team-card-info">
                        <h4>{member.name}</h4>
                        <span>{member.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Call to Action Banner */}
          <div className="thrilliz-cta-banner-wrap">
            <div className="thrilliz-cta-card">
              <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80" alt="Pine Mountain Forest" className="cta-bg-img" />
              <div className="cta-content">
                <h2>Ready to Start Your Next Adventure?</h2>
                <p>Join the Tourm community today and unlock the ultimate hiking & luxury resort experiences!</p>
                <button className="btn-thrilliz-cta" onClick={() => handleNavClick(null, "pricing")}>
                  Get Started Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SERVICES DEDICATED PAGE VIEW ==================== */}
      {activeNav === "services" && (
        <div className="services-page-wrapper">
          <section className="resort-sub-hero">
            <div className="sub-hero-content">
              <div className="wanderly-pill-badge" style={{ margin: '0 auto 16px auto' }}>
                <span>🧭 World-Class Solutions</span>
              </div>
              <h1 className="sub-hero-title">Our Services</h1>
              <p className="sub-hero-subtitle">Explore our world-class resort & tour guide services</p>
            </div>
          </section>

          {/* 4 Category Services Showcase (Rooms & Suites, Dining & Bar, Spa & Wellness, Events & Banquets) */}
          <section className="services-showcase-section">
            <div className="services-showcase-container">
              {RESORT_SERVICES_DATA.map((service) => (
                <div key={service.num} className="service-row-item">
                  <div className="service-text-col">
                    <span className="service-num-badge">{service.num}</span>
                    <h3 className="service-item-title">{service.title}</h3>
                    <p className="service-item-desc">{service.copy}</p>
                    <div className="service-tags-wrap">
                      {service.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="service-tag-pill">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="service-images-grid">
                    {service.images.map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="service-img-card">
                        <img src={imgUrl} alt={`${service.title} ${imgIdx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ==================== PRICING DEDICATED PAGE VIEW ==================== */}
      {activeNav === "pricing" && (
        <>
          {/* Hero Showcase Section at top of Pricing page */}
          <section className="pricing-hero-showcase-section">
            <div className="pricing-hero-showcase-container">
              {/* Left Text Column */}
              <div className="pricing-showcase-left-col">
                <span className="pricing-showcase-tag">Adventure & Luxury starts here</span>
                <h1 className="pricing-showcase-title">
                  Explore the world<br />without limits.
                </h1>
                <p className="pricing-showcase-desc">
                  Plan unforgettable journeys & luxury stay packages with ease. Explore beautiful places, unique cultures, and premium hospitality experiences.
                </p>

                <button className="btn-pricing-plan-trip" onClick={() => handleNavClick(null, "pricing")}>
                  Plan your trip
                </button>

                <div className="pricing-trustpilot-row">
                  <span className="trust-excellent-label">Excellent</span>
                  <div className="trust-stars-green">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <span className="trust-score-bold">4.9 out of 5.0</span>
                  <span className="trust-divider">|</span>
                  <span className="trust-reviews-count">2345 Reviews</span>
                  <span className="trust-logo-text">★ Trustpilot</span>
                </div>
              </div>

              {/* Right Column: 3 Overlapping Photo Cards + Member Badges + Sparkles */}
              <div className="pricing-showcase-right-col">
                {/* Decorative Sparkle Stars */}
                <span className="sparkle-star pos-top-left">✦</span>
                <span className="sparkle-star pos-middle-left">✦</span>
                <span className="sparkle-star pos-right">✦</span>

                {/* Photo Card 1: Mountain Snow Peak (Top Right) */}
                <div className="showcase-photo-card card-top-right">
                  <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80"
                    alt="Mountain Snow Peak"
                  />
                  {/* Top Right Avatar Circle Badge */}
                  <div className="badge-avatar-top-right">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="Guide Avatar" />
                  </div>

                  {/* Floating Member Badge */}
                  <div className="badge-pill-floating badge-guide">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Guide" className="badge-pill-avatar" />
                    <div className="badge-pill-text">
                      <span className="badge-pill-name">Direct Guide</span>
                      <span className="badge-pill-rating">★ 4.9</span>
                    </div>
                  </div>
                </div>

                {/* Photo Card 2: Mountain Trekker / Yak (Middle Left) */}
                <div className="showcase-photo-card card-middle-left">
                  <img
                    src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
                    alt="Mountain Trek"
                  />

                  {/* Floating Member Badge */}
                  <div className="badge-pill-floating badge-member">
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" alt="Member" className="badge-pill-avatar" />
                    <div className="badge-pill-text">
                      <span className="badge-pill-name">Tour Member</span>
                      <span className="badge-pill-rating">★ 4.9</span>
                    </div>
                  </div>
                </div>

                {/* Photo Card 3: Alpine Lake Boating (Bottom Right) */}
                <div className="showcase-photo-card card-bottom-right">
                  <img
                    src="https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80"
                    alt="Alpine Lake Boat"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Plans & Granular Capability Matrix Section */}
          <section className="pricing-plans-section" id="packages">
            <div className="pricing-plans-header">
              <span className="pricing-script-tag">PACKAGES & PRICING</span>
              <h2 className="pricing-main-title">Choose the Right Scale for Your Property</h2>
              <p className="pricing-main-subtitle">
                Select a package that best fits your travel or property management needs. Upgrade or switch plans anytime.
              </p>

              {/* Monthly / Yearly Billing Toggle */}
              <div className="billing-toggle-container">
                <span className={`billing-label ${billingCycle === 'monthly' ? 'active' : ''}`}>Pay Monthly</span>
                <button
                  className={`billing-switch ${billingCycle === 'yearly' ? 'yearly' : ''}`}
                  onClick={() => setBillingCycle((prev) => (prev === 'monthly' ? 'yearly' : 'monthly'))}
                  aria-label="Toggle Billing Cycle"
                >
                  <span className="switch-thumb"></span>
                </button>
                <span className={`billing-label ${billingCycle === 'yearly' ? 'active' : ''}`}>Pay Yearly</span>
                <span className="save-badge-pill">SAVE 20%</span>
              </div>
            </div>

            {/* 3 Pricing Cards Stage */}
            <div className="pricing-cards-grid">
              {/* Card 1: Essential Plan */}
              <div className="pricing-tier-card">
                <span className="tier-pill-tag">FOR INDIVIDUALS</span>
                <h3 className="tier-plan-title">Essential Suite</h3>
                <p className="tier-plan-desc">
                  Perfect for quick weekend getaways & solo travelers looking for premium comfort.
                </p>

                <div className="tier-price-row">
                  <span className="tier-price-amount">{billingCycle === 'yearly' ? '$39' : '$49'}</span>
                  <span className="tier-price-period">/ night</span>
                </div>
                <span className="tier-price-note">
                  {billingCycle === 'yearly' ? 'Billed annually ($468/yr)' : 'Billed monthly'}
                </span>

                <button className="btn-tier-outline" onClick={handleEmployeeSignIn}>
                  Start 14-Day Free Trial
                </button>

                <div className="tier-features-list">
                  <span className="features-list-header">What's included:</span>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Up to 2 Guests per suite</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>High-Speed Wi-Fi & Smart TV</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Complimentary Daily Breakfast</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Access to Resort Pool & Gym</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Flexible 24-Hour Cancellation</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Standard Concierge Support</span></div>
                </div>
              </div>

              {/* Card 2: Grand Luxury (MOST POPULAR - HIGHLIGHTED CARD) */}
              <div className="pricing-tier-card tier-card-popular">
                <div className="popular-top-banner">MOST POPULAR CHOICE</div>

                <span className="tier-pill-tag tag-cyan">FOR FAMILIES & COUPLES</span>
                <h3 className="tier-plan-title">Grand Luxury Suite</h3>
                <p className="tier-plan-desc">
                  Comprehensive luxury experience with full amenities, spa, and guided tour packages.
                </p>

                <div className="tier-price-row">
                  <span className="tier-price-amount">{billingCycle === 'yearly' ? '$109' : '$129'}</span>
                  <span className="tier-price-period">/ night</span>
                </div>
                <span className="tier-price-note text-cyan">
                  {billingCycle === 'yearly' ? 'Save 20% on annual bookings' : 'Most preferred choice'}
                </span>

                <button className="btn-tier-solid-cyan" onClick={handleEmployeeSignIn}>
                  Start 14-Day Free Trial
                </button>

                <div className="tier-features-list">
                  <span className="features-list-header">Everything in Essential, plus:</span>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Up to 4 Guests with King Bed</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>All-Inclusive Gourmet Dining & Spa</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Free Airport Shuttle & Transport</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Premium Ocean / Mountain View Suite</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Priority Room Upgrade & Early Check-in</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Dedicated 24/7 Butler & Concierge</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Complimentary Guided Excursions</span></div>
                </div>
              </div>

              {/* Card 3: Royal Sovereign */}
              <div className="pricing-tier-card">
                <span className="tier-pill-tag">FOR VIP GROUPS & RESORTS</span>
                <h3 className="tier-plan-title">Royal Sovereign Villa</h3>
                <p className="tier-plan-desc">
                  Ultimate private villa experience for large families, VIP corporate retreats & events.
                </p>

                <div className="tier-price-row">
                  <span className="tier-price-amount">{billingCycle === 'yearly' ? '$249' : '$299'}</span>
                  <span className="tier-price-period">/ night</span>
                </div>
                <span className="tier-price-note">
                  {billingCycle === 'yearly' ? 'Customized group package rates' : 'Full access package'}
                </span>

                <button className="btn-tier-outline" onClick={handleEmployeeSignIn}>
                  Contact Sales & Reservations
                </button>

                <div className="tier-features-list">
                  <span className="features-list-header">Full Enterprise & Villa Access:</span>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Unlimited Guests & Private Multi-room Villa</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Private Chef & Custom Fine Dining Menu</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Helicopter / Luxury Yacht Transfer</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Private Heated Pool & Jacuzzi</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Exclusive VIP Lounge Access</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>Full Property Reservation Option</span></div>
                  <div className="feature-item"><FaCheck className="check-icon-cyan" /> <span>24/7 Dedicated Event Manager</span></div>
                </div>
              </div>
            </div>

            {/* Granular Module & Capability Matrix */}
            <div className="pricing-matrix-container">
              <div className="matrix-header-wrap">
                <h3 className="matrix-title">Granular Module & Capability Matrix</h3>
                <p className="matrix-subtitle">Detailed side-by-side feature comparison across all room suites and service tiers.</p>
              </div>

              <div className="matrix-table-responsive">
                <table className="pricing-matrix-table">
                  <thead>
                    <tr>
                      <th className="th-features-col">LOCATION & KEY CAPABILITY</th>
                      <th className="th-tier-col">ESSENTIAL SUITE</th>
                      <th className="th-tier-col highlight-col">GRAND LUXURY SUITE</th>
                      <th className="th-tier-col">ROYAL SOVEREIGN VILLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="tr-category-header"><td colSpan="4">1. ACCOMMODATION & ROOM AMENITIES</td></tr>
                    <tr>
                      <td>Flexible Check-in & Late Check-out</td>
                      <td><FaCheck className="matrix-check active" /></td>
                      <td><FaCheck className="matrix-check active" /></td>
                      <td><FaCheck className="matrix-check active" /></td>
                    </tr>
                    <tr>
                      <td>Ocean View Balcony & Private Lounge</td>
                      <td>—</td>
                      <td><FaCheck className="matrix-check active" /></td>
                      <td><FaCheck className="matrix-check active" /></td>
                    </tr>
                    <tr>
                      <td>Private Heated Pool & Jacuzzi Access</td>
                      <td>—</td>
                      <td>—</td>
                      <td><FaCheck className="matrix-check active" /></td>
                    </tr>

                    <tr className="tr-category-header"><td colSpan="4">2. DINING & CONCIERGE SERVICES</td></tr>
                    <tr>
                      <td>Complimentary Daily Breakfast Buffet</td>
                      <td><FaCheck className="matrix-check active" /></td>
                      <td><FaCheck className="matrix-check active" /></td>
                      <td><FaCheck className="matrix-check active" /></td>
                    </tr>
                    <tr>
                      <td>All-Inclusive Fine Dining & Spa</td>
                      <td>—</td>
                      <td><FaCheck className="matrix-check active" /></td>
                      <td><FaCheck className="matrix-check active" /></td>
                    </tr>
                    <tr>
                      <td>Private Personal Chef & Custom Menus</td>
                      <td>—</td>
                      <td>—</td>
                      <td><FaCheck className="matrix-check active" /></td>
                    </tr>

                    <tr className="tr-category-header"><td colSpan="4">3. TRANSPORT & VIP EXCURSIONS</td></tr>
                    <tr>
                      <td>Airport Shuttle & Private Transport</td>
                      <td>—</td>
                      <td><FaCheck className="matrix-check active" /></td>
                      <td><FaCheck className="matrix-check active" /></td>
                    </tr>
                    <tr>
                      <td>Guided City & Outdoor Tour Packages</td>
                      <td>—</td>
                      <td><FaCheck className="matrix-check active" /></td>
                      <td><FaCheck className="matrix-check active" /></td>
                    </tr>
                    <tr>
                      <td>Helicopter / Private Yacht Charter</td>
                      <td>—</td>
                      <td>—</td>
                      <td><FaCheck className="matrix-check active" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Testimonial Card */}
            <div className="pricing-testimonial-card">
              <div className="testimonial-avatar-wrap">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80" alt="Hotel Manager" />
              </div>
              <div className="testimonial-content">
                <div className="stars-rating-amber">★★★★★ <span>5.0 Guest Satisfaction Rating</span></div>
                <p className="quote-text">
                  "Hyper-scalable for property owners & travelers alike. Outstanding luxury suites, effortless booking management, and top-tier hospitality features across all stay packages!"
                </p>
                <div className="manager-info">
                  <span className="manager-name">Marcus Vance</span>
                  <span className="manager-role">General Manager, Grand Azure Resort</span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ==================== CONTACT US DEDICATED PAGE VIEW ==================== */}
      {activeNav === "contact" && (
        <>
          <div className="contact-page-wrapper" style={{ paddingTop: "120px" }}>
            <div className="contact-page-header-banner">
              <h1 className="contact-page-title">Get in Touch with Us</h1>
              <p className="contact-page-subtitle" style={{ color: "#64748b", maxWidth: "820px", margin: "0 auto" }}>
                Have questions about our outdoor adventures or looking to plan your next thrilling getaway? We're here to help! Reach out for any inquiries, rental assistance, or adventure advice
              </p>
            </div>
            {/* Main 2-Column Contact Grid */}
            <div className="contact-main-grid-container">
              {/* Left Column: Interactive Form Card */}
              <div className="contact-form-card">
                <h2 className="contact-form-title">Have Questions? We're Just a Message Away!</h2>
                <p className="contact-form-desc">
                  Fill out the form below, and one of our team members will get back to you shortly.
                </p>

                <form className="contact-custom-form" onSubmit={handleContactSubmit}>
                  {contactSuccess && (
                    <div className="contact-success-badge">
                      <FaCheckCircle className="success-check-icon" />
                      <span>Your query has been saved to database and sent successfully!</span>
                    </div>
                  )}

                  {contactError && (
                    <div className="contact-error-badge">
                      <span>{contactError}</span>
                    </div>
                  )}

                  <div className="form-row-two-col">
                    <div className="form-field-group">
                      <label className="form-field-label">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="First name"
                        className="contact-input-field"
                        value={contactForm.firstName}
                        onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-field-group">
                      <label className="form-field-label">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Last name"
                        className="contact-input-field"
                        value={contactForm.lastName}
                        onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="form-field-label">E-mail *</label>
                    <input
                      type="email"
                      required
                      placeholder="you@gmail.com"
                      className="contact-input-field"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="form-field-label">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+62 800234756"
                      className="contact-input-field"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="form-field-label">Subject *</label>
                    <div className="form-select-wrap">
                      <select
                        required
                        className="contact-select-field"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      >
                        <option value="" disabled hidden>Choose message subject</option>
                        <option value="Room Booking Inquiry">Room Booking Inquiry</option>
                        <option value="Tour & Guide Packages">Tour & Guide Packages</option>
                        <option value="General Customer Support">General Customer Support</option>
                      </select>
                      <FaChevronDown className="select-dropdown-chevron" />
                    </div>
                  </div>

                  <div className="form-field-group">
                    <label className="form-field-label">Message *</label>
                    <textarea
                      required
                      placeholder="Leave us a message..."
                      className="contact-textarea-field"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn-send-contact-msg" disabled={contactSubmitting}>
                    {contactSubmitting ? "Saving..." : "Send Message"} <span className="arrow-icon-corner">↗</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Expert Image Banner + 4 Info Pill Cards */}
              <div className="contact-info-col">
                {/* Top Feature Banner Card */}
                <div className="contact-expert-banner-card">
                  <div className="expert-banner-content">
                    <div className="expert-brand-badge">
                      <div className="logo-icon-wrap">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="4" y="6" width="16" height="13" rx="3" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          <path d="M2 13h20" />
                          <circle cx="12" cy="13" r="2" fill="#38bdf8" />
                        </svg>
                      </div>
                      <span className="badge-brand-title">Tourm</span>
                    </div>
                    <h2 className="expert-banner-heading">Our experts will<br />always help you</h2>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80"
                    alt="Customer Support Expert"
                    className="expert-banner-img"
                  />
                </div>

                {/* Bottom Stack of 4 Contact Info Cards */}
                <div className="contact-info-cards-stack">
                  {/* Card 1: Email */}
                  <div className="contact-info-pill-card">
                    <div className="info-icon-white-circle">
                      <FaEnvelope />
                    </div>
                    <div className="info-pill-content">
                      <h4 className="info-pill-title">Email</h4>
                      <p className="info-pill-text">support@tourm.com</p>
                    </div>
                  </div>

                  {/* Card 2: Call */}
                  <div className="contact-info-pill-card">
                    <div className="info-icon-white-circle">
                      <FaPhone />
                    </div>
                    <div className="info-pill-content">
                      <h4 className="info-pill-title">Call</h4>
                      <p className="info-pill-text">+1 (800) 555-1234</p>
                    </div>
                  </div>

                  {/* Card 3: Address */}
                  <div className="contact-info-pill-card">
                    <div className="info-icon-white-circle">
                      <FaMapMarkerAlt />
                    </div>
                    <div className="info-pill-content">
                      <h4 className="info-pill-title">Address</h4>
                      <p className="info-pill-text">123 Adventure Lane, Suite 100, Boulder, CO 80301</p>
                    </div>
                  </div>

                  {/* Card 4: Working Hours */}
                  <div className="contact-info-pill-card">
                    <div className="info-icon-white-circle">
                      <FaClock />
                    </div>
                    <div className="info-pill-content">
                      <h4 className="info-pill-title">Working Hours</h4>
                      <p className="info-pill-text">Mon-Fri: 9:00 AM – 6:00 PM (PST)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="news-articles-section">
            <div className="news-articles-container">
              <div className="news-header-row">
                <div className="news-title-wrap">
                  <div className="section-script-subtitle">Blog and Article</div>
                  <h2 className="section-title-bold">News & Support From Tourm</h2>
                </div>
              </div>

              <div className="news-cards-grid">
                <div className="news-card-item">
                  <div className="news-card-img-wrap">
                    <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80" alt="Desert Travel" />
                  </div>
                  <div className="news-card-body">
                    <span className="news-meta-text">July 05, 2024  |  6 min read</span>
                    <h4 className="news-article-title">10 Reasons why you should visit Ajmer & Jaipur</h4>
                    <button className="btn-news-read-more outline">
                      Read More <FaArrowRight style={{ marginLeft: "4px", fontSize: "11px" }} />
                    </button>
                  </div>
                </div>

                <div className="news-card-item">
                  <div className="news-card-img-wrap">
                    <img src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=600&q=80" alt="Hike Adventure" />
                  </div>
                  <div className="news-card-body">
                    <span className="news-meta-text">July 05, 2024  |  6 min read</span>
                    <h4 className="news-article-title">The best time to visit Rajasthan & enjoy resort luxury</h4>
                    <button className="btn-news-read-more outline">
                      Read More <FaArrowRight style={{ marginLeft: "4px", fontSize: "11px" }} />
                    </button>
                  </div>
                </div>

                <div className="news-card-item">
                  <div className="news-card-img-wrap">
                    <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" alt="Mountain Lake" />
                  </div>
                  <div className="news-card-body">
                    <span className="news-meta-text">July 05, 2024  |  6 min read</span>
                    <h4 className="news-article-title">The 7 amazing destinations for adventure seekers</h4>
                    <button className="btn-news-read-more filled">
                      Read More <FaArrowRight style={{ marginLeft: "4px", fontSize: "11px" }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Newsletter + Full Footer Section (Matches User Reference Screenshot 2) */}
      <footer className="resort-footer">
        {/* Top Newsletter Banner */}
        <div className="footer-newsletter-banner">
          <h3 className="newsletter-heading">Get Updated The Latest<br />Newsletter</h3>
          <div className="newsletter-form-wrap">
            <input type="email" placeholder="Enter Email" className="newsletter-input" />
            <button className="btn-newsletter-submit">
              Subscribe Now <FaPaperPlane style={{ marginLeft: "6px" }} />
            </button>
          </div>
        </div>

        <div className="footer-divider-line"></div>

        {/* 4-Column Footer Grid */}
        <div className="footer-grid-stage">
          {/* Column 1: Brand Info */}
          <div className="footer-col brand-col">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(e, "home");
              }}
              className="footer-logo-banner"
              style={{ textDecoration: "none", outline: "none" }}
            >
              <span className="footer-logo-title" style={{ textDecoration: "none" }}>Tourm</span>
              <span className="footer-logo-sub" style={{ textDecoration: "none" }}>Explore World</span>
            </a>
            <p className="footer-brand-desc">
              Rapidiously myocardinate cross-platform intellectual capital model. Appropriately create interactive infrastructures
            </p>
            <div className="footer-social-row">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-pill-icon" title="Facebook"><FaFacebookF /></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-pill-icon" title="Twitter"><FaTwitter /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-pill-icon" title="LinkedIn">in</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-pill-icon" title="YouTube">▶</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-pill-icon" title="Instagram"><FaInstagram /></a>
            </div>
          </div>

          {/* Column 2: Useful Links (Matches exact Navbar links and view navigation) */}
          <div className="footer-col">
            <h4 className="footer-col-title">Useful Link</h4>
            <ul className="footer-link-list">
              <li>
                <a
                  href="#home"
                  className={activeNav === "home" ? "active" : ""}
                  onClick={(e) => handleNavClick(e, "home")}
                >
                  › Home
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className={activeNav === "about" ? "active" : ""}
                  onClick={(e) => handleNavClick(e, "about")}
                >
                  › About Us
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className={activeNav === "services" ? "active" : ""}
                  onClick={(e) => handleNavClick(e, "services")}
                >
                  › Services
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className={activeNav === "pricing" ? "active" : ""}
                  onClick={(e) => handleNavClick(e, "pricing")}
                >
                  › Pricing
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className={activeNav === "contact" ? "active" : ""}
                  onClick={(e) => handleNavClick(e, "contact")}
                >
                  › Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Get In Touch */}
          <div className="footer-col">
            <h4 className="footer-col-title">Get In Touch</h4>
            <div className="footer-contact-list">
              <div className="contact-item">
                <span className="contact-icon-circle"><FaPhone /></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href="tel:+01234567890" className="contact-link">+01 234 567 890</a>
                  <a href="tel:+09876543210" className="contact-link">+09 876 543 210</a>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon-circle"><FaEnvelope /></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href="mailto:mailinfo00@realar.com" className="contact-link">mailinfo00@realar.com</a>
                  <a href="mailto:support24@realar.com" className="contact-link">support24@realar.com</a>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon-circle"><FaMapMarkerAlt /></span>
                <a href="https://maps.google.com/?q=789+Inner+Lane,+Holy+park,+California,+USA" target="_blank" rel="noreferrer" className="contact-link">
                  789 Inner Lane, Holy park, California, USA
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Instagram Post 6-Photo Grid */}
          <div className="footer-col">
            <h4 className="footer-col-title">Instagram Post</h4>
            <div className="footer-insta-grid">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="insta-grid-item">
                <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=200&q=80" alt="Insta 1" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="insta-grid-item">
                <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80" alt="Insta 2" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="insta-grid-item">
                <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=200&q=80" alt="Insta 3" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="insta-grid-item">
                <img src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=200&q=80" alt="Insta 4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="insta-grid-item">
                <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=200&q=80" alt="Insta 5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="insta-grid-item">
                <img src="https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=200&q=80" alt="Insta 6" />
              </a>
            </div>
          </div>
        </div>

        {/* Floating Scroll To Top Button */}
        <button className="btn-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          ↑
        </button>

        {/* Bottom Copyright Bar */}
        <div className="footer-bottom-bar">
          <div className="bottom-bar-inner">
            <span className="copyright-text">Copyright © 2024 Tourm, All rights reserved.</span>
            <div className="payment-icons-row">
              <span className="we-accept-text">We Accept</span>
              <div className="pay-card-badge" title="Mastercard">
                <svg width="34" height="20" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="14" cy="12" r="7.5" fill="#EB001B" />
                  <circle cx="24" cy="12" r="7.5" fill="#F79E1B" />
                  <path d="M19 6.5A7.48 7.48 0 0 0 14.7 12a7.48 7.48 0 0 0 4.3 5.5A7.48 7.48 0 0 0 23.3 12a7.48 7.48 0 0 0-4.3-5.5z" fill="#FF5F00" />
                </svg>
              </div>
              <div className="pay-card-badge" title="VISA">
                <svg width="38" height="20" viewBox="0 0 42 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.7 17.5h-2.6l1.6-9.8h2.6l-1.6 9.8zm9.4-9.5c-.6-.2-1.4-.4-2.4-.4-2.6 0-4.4 1.3-4.4 3.2 0 1.4 1.3 2.2 2.3 2.7 1 .5 1.4.8 1.4 1.2 0 .7-.8 1-1.6 1-1.1 0-1.7-.2-2.6-.6l-.4-.2-.5 2.6c.7.3 2 .6 3.4.6 2.8 0 4.6-1.3 4.6-3.3 0-1.1-.7-2-2.3-2.7-.9-.5-1.5-.8-1.5-1.2 0-.4.5-.9 1.6-.9.9 0 1.6.2 2.1.4l.2.1.5-2.5zm4.8-.3h-2c-.7 0-1.2.2-1.4.8l-4 9h2.7l.5-1.5h3.4l.3 1.5h2.4l-1.9-9.8zm-2.7 6.2c.2-.6 1.1-3 1.1-3l.3 1.5.3 1.5h-1.7zM12.2 7.7L9.7 14.5l-.3-1.4c-.5-1.7-1.8-3.5-3.4-4.2l2.3 8.6h2.7l4.1-9.8h-2.9z" fill="#1A1F71" />
                </svg>
              </div>
              <div className="pay-card-badge" title="PayPal">
                <svg width="38" height="20" viewBox="0 0 42 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 5.5h4.8c2.4 0 4.1 1.2 3.6 3.7-.5 2.6-2.4 4.1-5 4.1h-1.8l-.9 5.2h-2.7l2-13zm2.5 6.2h2.2c1.4 0 2.4-.7 2.6-2 .2-1.2-.5-1.7-1.7-1.7h-2.1l-1 3.7z" fill="#003087" />
                  <path d="M16 7.5h4.8c2.4 0 4.1 1.2 3.6 3.7-.5 2.6-2.4 4.1-5 4.1h-1.8l-.9 5.2h-2.7l2-13zm2.5 6.2h2.2c1.4 0 2.4-.7 2.6-2 .2-1.2-.5-1.7-1.7-1.7h-2.1l-1 3.7z" fill="#0079C1" opacity="0.85" />
                </svg>
              </div>
              <div className="pay-card-badge" title="Apple Pay">
                <svg width="42" height="20" viewBox="0 0 46 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.2 11.2c0-1.3.7-2.1 1.7-2.7-.6-.8-1.5-1-1.9-1-1-.1-1.9.6-2.4.6-.5 0-1.2-.6-2-.6-1 0-2 .6-2.5 1.5-1.1 1.9-.3 4.7.8 6.2.5.7 1.1 1.5 1.9 1.5.8 0 1.1-.5 2-.5.9 0 1.2.5 2 .5.8 0 1.4-.7 1.9-1.4.6-.9.8-1.7.9-1.8-.1 0-1.8-.7-1.8-2.7zm-1.2-4.5c.4-.5.7-1.2.6-2-.6 0-1.4.4-1.8.9-.4.5-.7 1.2-.6 2 .7.1 1.4-.4 1.8-.9z" fill="#000000" />
                  <text x="17" y="16" fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" fontSize="13" fontWeight="700" fill="#000000">Pay</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
