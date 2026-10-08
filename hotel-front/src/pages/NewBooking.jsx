import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import BookRoomModal from "../components/BookRoomModal.jsx";
import { fetchRoomsFromAPI } from "../utils/roomStore.js";
import { TbBed, TbRulerMeasure } from "react-icons/tb";
import { FiUsers, FiWifi, FiWind, FiSun, FiTag, FiCheckCircle } from "react-icons/fi";
import { FaImage, FaStar } from "react-icons/fa";

export default function NewBooking() {
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

  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    async function loadRooms() {
      try {
        const rawRooms = await fetchRoomsFromAPI();
        const available = rawRooms.filter(
          (r) => r.status?.toLowerCase() === "available"
        );
        setAvailableRooms(available);
      } catch (err) {
        console.error("Failed to load rooms:", err);
      }
    }
    loadRooms();
  }, []);

  const handleBookRoom = (room, e) => {
    e.stopPropagation();
    setSelectedRoom(room);
    setIsBookModalOpen(true);
  };

  const handleCloseModal = async () => {
    setIsBookModalOpen(false);
    setSelectedRoom(null);
    try {
      const rawRooms = await fetchRoomsFromAPI();
      const available = rawRooms.filter(
        (r) => r.status?.toLowerCase() === "available"
      );
      setAvailableRooms(available);
    } catch (err) {
      console.error("Failed to refresh rooms:", err);
    }
  };

  // Custom premium styles
  const styles = {
    pageContainer: {
      padding: "24px",
      maxWidth: "1400px",
      margin: "0 auto",
      background: "transparent"
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
      gap: "32px",
    },
    card: {
      display: "flex",
      flexDirection: "column",
      background: isDark ? "linear-gradient(145deg, #1e293b, #0f172a)" : "#ffffff",
      borderRadius: "24px",
      overflow: "hidden",
      border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)",
      boxShadow: isDark 
        ? "0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.2) inset" 
        : "0 20px 40px -10px rgba(15,23,42,0.08)",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      position: "relative",
      height: "100%",
    },
    imageContainer: {
      position: "relative",
      width: "100%",
      height: "260px",
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    badge: {
      position: "absolute",
      top: "16px",
      left: "16px",
      background: "rgba(255, 255, 255, 0.9)",
      backdropFilter: "blur(8px)",
      color: "#0f172a",
      padding: "6px 14px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      letterSpacing: "0.5px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    photoCount: {
      position: "absolute",
      bottom: "16px",
      right: "16px",
      background: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(8px)",
      color: "#ffffff",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      border: "1px solid rgba(255,255,255,0.2)",
    },
    content: {
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      flex: 1,
    },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "12px",
    },
    title: {
      margin: 0,
      fontSize: "24px",
      fontWeight: "800",
      color: isDark ? "#ffffff" : "#0f172a",
      lineHeight: "1.2",
    },
    rating: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      color: "#fbbf24",
      fontSize: "14px",
      fontWeight: "700",
      background: isDark ? "rgba(251, 191, 36, 0.1)" : "#fef3c7",
      padding: "4px 8px",
      borderRadius: "8px",
    },
    description: {
      margin: "0 0 24px 0",
      fontSize: "15px",
      color: isDark ? "#94a3b8" : "#64748b",
      lineHeight: "1.6",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
    },
    featuresWrapper: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginBottom: "28px",
      flexGrow: 1,
    },
    featurePill: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      borderRadius: "999px",
      background: isDark ? "rgba(241, 245, 249, 0.05)" : "#f1f5f9",
      color: isDark ? "#cbd5e1" : "#475569",
      fontSize: "13px",
      fontWeight: "600",
      border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
    },
    footer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: "24px",
      borderTop: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #f1f5f9",
      marginTop: "auto",
    },
    priceWrapper: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },
    priceLabel: {
      fontSize: "12px",
      color: isDark ? "#94a3b8" : "#64748b",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    priceValue: {
      fontSize: "26px",
      fontWeight: "800",
      color: isDark ? "#ffffff" : "#0f172a",
      display: "flex",
      alignItems: "baseline",
      gap: "4px",
    },
    button: {
      background: isDark ? "#6366f1" : "#4f46e5",
      color: "#ffffff",
      border: "none",
      padding: "14px 28px",
      borderRadius: "14px",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      boxShadow: isDark 
        ? "0 8px 16px -4px rgba(99, 102, 241, 0.3)" 
        : "0 8px 16px -4px rgba(79, 70, 229, 0.3)",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }
  };

  return (
    <>
      <PageHeader
        title="New Booking"
        subtitle="Select an available room to create a new reservation"
      />

      <section style={styles.pageContainer}>
        {availableRooms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <h3 style={{ fontSize: "24px", color: isDark ? "#f8fafc" : "#0f172a", marginBottom: "12px" }}>No Rooms Available</h3>
            <p style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "16px" }}>
              All rooms are currently booked or occupied in this branch. Please check back later.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {availableRooms.map((room) => {
              const roomTitle =
                room.title ||
                room.name ||
                (room.number ? `Room ${room.number}` : `${room.type || "Standard"} Room`);

              const features = [
                { icon: TbBed, label: room.beds || "1 King Bed" },
                { icon: FiUsers, label: `Up to ${room.guests || 2} guests` },
                { icon: TbRulerMeasure, label: `${room.sizeSqm || 40} m²` },
                { icon: FiWifi, label: "Fast WiFi" },
                { icon: FiSun, label: room.roomView || (room.amenities && room.amenities[0]) || "City View" },
              ];

              return (
                <article
                  key={room.id}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  style={styles.card}
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
                    e.currentTarget.style.boxShadow = styles.card.boxShadow;
                    const img = e.currentTarget.querySelector('img');
                    if(img) img.style.transform = "scale(1)";
                  }}
                >
                  {/* IMAGE */}
                  <div style={styles.imageContainer}>
                    <img
                      src={room.image || (Array.isArray(room.images) && room.images[0]) || "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80"}
                      alt={roomTitle}
                      style={styles.image}
                    />
                    <div style={styles.badge}>
                      <FiCheckCircle style={{ color: "#10b981", fontSize: "14px" }} />
                      Available
                    </div>
                    {Array.isArray(room.images) && room.images.length > 1 && (
                      <div style={styles.photoCount}>
                        <FaImage /> {room.images.length}
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div style={styles.content}>
                    <div style={styles.titleRow}>
                      <h3 style={styles.title}>{roomTitle}</h3>
                      <div style={styles.rating}>
                        <FaStar /> 4.9
                      </div>
                    </div>
                    
                    <p style={styles.description}>
                      {room.shortDescription ||
                        room.description ||
                        "Experience absolute comfort and luxury in our thoughtfully designed space, perfectly curated for your unforgettable stay."}
                    </p>

                    <div style={styles.featuresWrapper}>
                      {features.map((f, i) => {
                        const IconComponent = f.icon;
                        return (
                          <div key={i} style={styles.featurePill}>
                            <IconComponent style={{ color: isDark ? "#818cf8" : "#6366f1", fontSize: "15px" }} />
                            {f.label}
                          </div>
                        );
                      })}
                    </div>

                    {/* FOOTER */}
                    <div style={styles.footer}>
                      <div style={styles.priceWrapper}>
                        <span style={styles.priceLabel}>Starting from</span>
                        <div style={styles.priceValue}>
                          ₹{(room.price || 2500).toLocaleString("en-IN")}
                          <span style={{ fontSize: "14px", fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>/night</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => handleBookRoom(room, e)}
                        style={styles.button}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = isDark 
                            ? "0 10px 20px -4px rgba(99, 102, 241, 0.4)" 
                            : "0 10px 20px -4px rgba(79, 70, 229, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = styles.button.boxShadow;
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isBookModalOpen && selectedRoom && (
        <BookRoomModal
          room={selectedRoom}
          onClose={handleCloseModal}
          onConfirm={() => {
            handleCloseModal();
            navigate("/rooms");
          }}
        />
      )}
    </>
  );
}

