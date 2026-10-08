import { useState, useEffect, useCallback } from "react";
import { otaStorage } from "../services/ota/otaStorage.js";
import { otaService } from "../services/ota/otaService.js";

const API_BASE_URL = "http://localhost:4000/api/ota";

export function useOTAChannels() {
  const [connections, setConnections] = useState(() => otaStorage.getConnections());
  const [rooms, setRooms] = useState(() => otaStorage.getRooms());
  const [bookings, setBookings] = useState(() => otaStorage.getBookings());
  const [roomMappings, setRoomMappings] = useState(() => otaStorage.getRoomMappings());
  const [rateMappings, setRateMappings] = useState(() => otaStorage.getRateMappings());
  const [syncHistory, setSyncHistory] = useState(() => otaStorage.getSyncHistory());
  const [stats, setStats] = useState(() => otaService.getDashboardStats());
  const [loading, setLoading] = useState(false);

  // Fetch live OTA data from MySQL Backend API
  const fetchLiveBackendData = useCallback(async () => {
    setLoading(true);
    try {
      const [chanRes, bookRes, histRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/channels`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/bookings`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/history`).then((r) => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/stats`).then((r) => r.json()).catch(() => null),
      ]);

      if (chanRes?.success && chanRes.connections?.length > 0) {
        setConnections(chanRes.connections);
        otaStorage.saveConnections(chanRes.connections);
      }

      if (bookRes?.success && bookRes.bookings) {
        setBookings(bookRes.bookings);
        otaStorage.saveBookings(bookRes.bookings);
      }

      if (histRes?.success && histRes.syncHistory) {
        setSyncHistory(histRes.syncHistory);
        otaStorage.saveSyncHistory(histRes.syncHistory);
      }

      if (statsRes?.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (e) {
      console.warn("⚠️ Backend API fetch fallback to local storage:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveBackendData();

    const handleConnectionsChange = () => fetchLiveBackendData();
    const handleRoomsChange = () => setRooms(otaStorage.getRooms());
    const handleBookingsChange = () => fetchLiveBackendData();
    const handleRoomMapsChange = () => setRoomMappings(otaStorage.getRoomMappings());
    const handleRateMapsChange = () => setRateMappings(otaStorage.getRateMappings());
    const handleSyncHistoryChange = () => fetchLiveBackendData();
    const handleReset = () => fetchLiveBackendData();

    window.addEventListener("ota_connections_changed", handleConnectionsChange);
    window.addEventListener("ota_rooms_changed", handleRoomsChange);
    window.addEventListener("ota_bookings_changed", handleBookingsChange);
    window.addEventListener("ota_room_mappings_changed", handleRoomMapsChange);
    window.addEventListener("ota_rate_mappings_changed", handleRateMapsChange);
    window.addEventListener("ota_sync_history_changed", handleSyncHistoryChange);
    window.addEventListener("ota_data_reset", handleReset);
    window.addEventListener("storage", handleReset);

    return () => {
      window.removeEventListener("ota_connections_changed", handleConnectionsChange);
      window.removeEventListener("ota_rooms_changed", handleRoomsChange);
      window.removeEventListener("ota_bookings_changed", handleBookingsChange);
      window.removeEventListener("ota_room_mappings_changed", handleRoomMapsChange);
      window.removeEventListener("ota_rate_mappings_changed", handleRateMapsChange);
      window.removeEventListener("ota_sync_history_changed", handleSyncHistoryChange);
      window.removeEventListener("ota_data_reset", handleReset);
      window.removeEventListener("storage", handleReset);
    };
  }, [fetchLiveBackendData]);

  return {
    connections,
    rooms,
    bookings,
    roomMappings,
    rateMappings,
    syncHistory,
    stats,
    loading,
    refreshData: fetchLiveBackendData,
  };
}
