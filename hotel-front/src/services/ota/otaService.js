import { otaStorage } from "./otaStorage.js";
import { getOTAAdapter } from "./otaAdapter.js";
import { addNotification } from "../notificationStore.js";

const API_BASE_URL = "http://localhost:4000/api/ota";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const otaService = {
  /**
   * Recalculate dynamic statistics & sync with backend
   */
  async recalculateData() {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      const data = await res.json();
      if (data.success && data.stats) {
        return data.stats;
      }
    } catch {
      // Fallback
    }
    return this.getDashboardStats();
  },

  /**
   * Get dynamic dashboard stats from backend or fallback
   */
  getDashboardStats() {
    const connections = otaStorage.getConnections();
    const activeConnections = connections.filter(
      (c) => c.status === "CONNECTED" || c.status === "SYNCING"
    ).length;

    const totalRevenue30d = connections.reduce((sum, c) => sum + (c.revenue30Days || 0), 0);
    const totalBookings30d = connections.reduce((sum, c) => sum + (c.bookings30Days || 0), 0);

    return {
      activeConnections,
      totalConnections: connections.length,
      totalRevenue30d,
      totalBookings30d,
    };
  },

  /**
   * Test connection to an OTA
   */
  async testConnection(channelId, propertyId, apiKey, apiSecret, forceFail = false) {
    await delay(800);

    if (!propertyId || !apiKey) {
      throw new Error("Please enter Property ID and Demo API Key.");
    }

    const shouldFail = forceFail || Math.random() < 0.1;
    if (shouldFail) {
      throw new Error("Unable to connect to OTA. Connection timed out or credentials invalid.");
    }

    const adapter = getOTAAdapter(channelId);
    return await adapter.testConnection(propertyId, apiKey, apiSecret);
  },

  /**
   * Connect a new channel or reconnect an existing one (Backend DB + HTTP POST)
   */
  async connectChannel(config) {
    const { channelId, displayName, propertyId, apiKey, apiSecret, autoSync = true } = config;

    try {
      const res = await fetch(`${API_BASE_URL}/channels/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          displayName,
          propertyId,
          apiKey,
          apiSecret,
          autoSync,
        }),
      });

      const data = await res.json();
      if (data.success && data.channel) {
        const connections = otaStorage.getConnections();
        const idx = connections.findIndex((c) => c.id === channelId);
        if (idx >= 0) {
          connections[idx] = data.channel;
        } else {
          connections.push(data.channel);
        }
        otaStorage.saveConnections(connections);

        addNotification({
          user: "OTA Channel Manager",
          action: `connected new OTA channel ${data.channel.displayName}`,
          message: `✓ ${data.channel.displayName} is now active and 2-way synced in MySQL DB.`,
          category: "Alerts",
          type: "alert",
        });

        return data.channel;
      }
    } catch (err) {
      console.warn("⚠️ Connect API call failed, falling back locally:", err);
    }

    // Local fallback if backend unavailable
    await delay(600);
    const connections = otaStorage.getConnections();
    const existingIndex = connections.findIndex((c) => c.id === channelId);
    const now = new Date().toISOString();
    let updatedConnection;

    if (existingIndex >= 0) {
      updatedConnection = {
        ...connections[existingIndex],
        status: "CONNECTED",
        propertyId: propertyId || connections[existingIndex].propertyId,
        lastSyncedAt: now,
        autoSyncEnabled: autoSync,
        credentialsConfigured: true,
        syncError: null,
        active: true,
      };
      connections[existingIndex] = updatedConnection;
    } else {
      updatedConnection = {
        id: channelId,
        name: displayName,
        displayName: displayName,
        logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Booking.com_logo.svg",
        iconBg: "#3b82f6",
        status: "CONNECTED",
        propertyId: propertyId || `PROP-${channelId.toUpperCase()}-101`,
        syncedRooms: 42,
        totalRooms: 42,
        liveRate: 4200,
        bookings30Days: 15,
        revenue30Days: 63000,
        lastSyncedAt: now,
        autoSyncEnabled: autoSync,
        syncInterval: 15,
        credentialsConfigured: true,
        syncError: null,
        active: true,
      };
      connections.push(updatedConnection);
    }

    otaStorage.saveConnections(connections);
    return updatedConnection;
  },

  /**
   * Disconnect an OTA Channel (Backend DB + HTTP POST)
   */
  async disconnectChannel(channelId) {
    try {
      const res = await fetch(`${API_BASE_URL}/channels/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId }),
      });
      const data = await res.json();
      if (data.success && data.channel) {
        const connections = otaStorage.getConnections();
        const idx = connections.findIndex((c) => c.id === channelId);
        if (idx >= 0) connections[idx] = data.channel;
        otaStorage.saveConnections(connections);
        return data.channel;
      }
    } catch (err) {
      console.warn("⚠️ Disconnect API error:", err);
    }

    // Local fallback
    const connections = otaStorage.getConnections();
    const index = connections.findIndex((c) => c.id === channelId);
    if (index !== -1) {
      connections[index].status = "DISCONNECTED";
      otaStorage.saveConnections(connections);
    }
  },

  /**
   * Sync Now action (Backend DB + HTTP POST)
   */
  async syncChannel(channelId, forceFail = false) {
    try {
      const res = await fetch(`${API_BASE_URL}/channels/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, forceFail }),
      });

      const data = await res.json();
      if (data.success && data.channel) {
        const connections = otaStorage.getConnections();
        const index = connections.findIndex((c) => c.id === channelId);
        if (index >= 0) connections[index] = data.channel;
        otaStorage.saveConnections(connections);

        addNotification({
          user: "OTA Sync Engine",
          action: `synced ${data.channel.displayName}`,
          message: `✓ ${data.channel.displayName} rates & inventory updated in MySQL DB.`,
          category: "Alerts",
          type: "alert",
        });

        return data.channel;
      } else if (!data.success) {
        throw new Error(data.message || "Sync failed");
      }
    } catch (err) {
      console.warn("⚠️ Sync API call error, falling back:", err.message);
      if (err.message?.includes("failed")) throw err;
    }

    // Local fallback
    await delay(800);
    const connections = otaStorage.getConnections();
    const index = connections.findIndex((c) => c.id === channelId);
    if (index !== -1) {
      connections[index].status = "CONNECTED";
      connections[index].lastSyncedAt = new Date().toISOString();
      otaStorage.saveConnections(connections);
    }
  },

  /**
   * Update Room Rates & Inventory for an OTA Channel
   */
  async updateRoomRates(channelId, roomUpdates, triggerSync = false) {
    const rooms = otaStorage.getRooms();
    const updatedRooms = rooms.map((room) => {
      const found = roomUpdates.find((u) => u.id === room.id);
      if (found) {
        return {
          ...room,
          otaRates: {
            ...room.otaRates,
            [channelId]: Number(found.rate),
          },
          availableInventory: Number(found.availableInventory),
          minStay: Number(found.minStay),
          maxStay: Number(found.maxStay),
          stopSell: Boolean(found.stopSell),
        };
      }
      return room;
    });

    otaStorage.saveRooms(updatedRooms);

    if (triggerSync) {
      await this.syncChannel(channelId, false);
    }
    return updatedRooms;
  },

  /**
   * Simulate New Booking Creation (Backend DB + HTTP POST + Storage Event Dispatch)
   */
  async simulateNewBooking(customBooking = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customBooking || {}),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        const newBooking = {
          id: data.booking.booking_code,
          bookingId: data.booking.booking_code,
          otaChannel: data.booking.channel_id,
          otaChannelName: data.booking.channel_name,
          guestName: data.booking.guest_name,
          roomType: data.booking.room_type,
          checkIn: String(data.booking.check_in).slice(0, 10),
          checkOut: String(data.booking.check_out).slice(0, 10),
          guests: Number(data.booking.guests || 2),
          amount: Number(data.booking.amount || 0),
          status: data.booking.status || "CONFIRMED",
          createdAt: data.booking.created_at,
        };

        const bookings = otaStorage.getBookings();
        otaStorage.saveBookings([newBooking, ...bookings]);

        addNotification({
          user: data.booking.channel_name || "OTA Engine",
          action: `created new reservation ${data.booking.booking_code}`,
          message: `🎉 Booking for ${data.booking.guest_name} (${data.booking.room_type}) - ₹${Number(data.booking.amount).toLocaleString()}`,
          category: "Alerts",
          type: "alert",
        });

        return newBooking;
      }
    } catch (err) {
      console.warn("⚠️ Create Booking API error, falling back:", err);
    }

    // Local fallback simulation if backend is unavailable
    await delay(600);
    const channelId = customBooking?.otaChannel || "booking";
    const newBooking = {
      id: `OTA-${channelId.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      bookingId: `OTA-${channelId.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      otaChannel: channelId,
      otaChannelName: customBooking?.otaChannelName || "OTA Channel",
      guestName: customBooking?.guestName || "Neha",
      roomType: customBooking?.roomType || "Deluxe Room",
      checkIn: customBooking?.checkIn || new Date().toISOString().slice(0, 10),
      checkOut: customBooking?.checkOut || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      guests: customBooking?.guests || 2,
      amount: customBooking?.amount || 9500,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };

    const bookings = otaStorage.getBookings();
    otaStorage.saveBookings([newBooking, ...bookings]);
    return newBooking;
  },

  /**
   * Cancel an OTA Booking (Backend DB + HTTP POST + Storage Event Dispatch)
   */
  async cancelBooking(bookingId) {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();
      if (data.success) {
        const bookings = otaStorage.getBookings();
        const updatedBookings = bookings.map((b) =>
          b.id === bookingId || b.bookingId === bookingId ? { ...b, status: "CANCELLED" } : b
        );
        otaStorage.saveBookings(updatedBookings);

        addNotification({
          user: "OTA System",
          action: `cancelled booking ${bookingId}`,
          message: `ℹ️ Reservation ${bookingId} cancelled & inventory restored in MySQL DB.`,
          category: "Alerts",
          type: "alert",
        });
        return true;
      }
    } catch (err) {
      console.warn("⚠️ Cancel Booking API error:", err);
    }

    // Fallback
    const bookings = otaStorage.getBookings();
    const updatedBookings = bookings.map((b) =>
      b.id === bookingId || b.bookingId === bookingId ? { ...b, status: "CANCELLED" } : b
    );
    otaStorage.saveBookings(updatedBookings);
    return true;
  },

  /** Reset all OTA demo data */
  resetDemoData() {
    const restored = otaStorage.clearAll();
    addNotification({
      user: "OTA System",
      action: "reset all demo channels & booking data",
      message: "🔄 OTA Channels, Rates & Bookings reset to default seed values.",
      category: "Alerts",
      type: "alert",
    });
    return restored;
  },
};
