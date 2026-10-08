import { useEffect } from "react";
import { otaStorage } from "../services/ota/otaStorage.js";
import { otaService } from "../services/ota/otaService.js";

/**
 * Custom hook to run auto-sync simulation background timer
 */
export function useOTASync(enabled = true, demoIntervalSeconds = 30) {
  useEffect(() => {
    if (!enabled) return;

    // Background interval timer to simulate periodic 2-way sync
    const timer = setInterval(async () => {
      const connections = otaStorage.getConnections();
      const connectedChannels = connections.filter(
        (c) => c.status === "CONNECTED" && c.autoSyncEnabled
      );

      if (connectedChannels.length === 0) return;

      // Pick one connected channel to auto-sync periodically
      const channelToSync =
        connectedChannels[Math.floor(Math.random() * connectedChannels.length)];

      try {
        await otaService.syncChannel(channelToSync.id, false);
      } catch (err) {
        console.warn(`[AutoSync] Background sync failed for ${channelToSync.name}`, err);
      }
    }, demoIntervalSeconds * 1000);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, demoIntervalSeconds]);
}
