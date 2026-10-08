import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { cacheManager } from "./redis.js";

let wss: WebSocketServer | null = null;


export interface RoomEventPayload {
  event: "ROOM_LOCKED" | "ROOM_BOOKED" | "ROOM_UPDATED" | "WS_CONNECTED" | "PING";
  roomId?: number | string;
  roomUid?: string;
  roomName?: string;
  roomNumber?: string;
  guestName?: string;
  orgId?: string;
  status?: string;
  available?: boolean;
  timestamp?: number;
  [key: string]: any;
}

/**
 * Initialize WebSockets Server attached to the Express HTTP Server
 */
export function initWebSocketServer(server: HttpServer): WebSocketServer {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    console.log("⚡ [WebSocket Server] Live client connected for instant room lock & sync.");

    // Send connection acknowledgement payload
    ws.send(
      JSON.stringify({
        event: "WS_CONNECTED",
        message: "Live room lock & real-time sync connected.",
        timestamp: Date.now(),
      })
    );

    ws.on("message", (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.event === "PING") {
          ws.send(JSON.stringify({ event: "PONG", timestamp: Date.now() }));
        }
      } catch {}
    });

    ws.on("close", () => {
      console.log("⚡ [WebSocket Server] Client connection closed.");
    });

    ws.on("error", (err) => {
      console.warn("⚡ [WebSocket Server] Client connection notice:", err?.message || err);
    });
  });

  return wss;
}

/**
 * Broadcast live room lock / room update events to all connected clients
 */
export function broadcastRoomEvent(payload: RoomEventPayload): void {
  // Clear room cache so HTTP queries also get fresh database data
  cacheManager.delPattern("rooms:").catch(() => {});

  if (!wss) return;

  const dataStr = JSON.stringify({
    ...payload,
    timestamp: payload.timestamp || Date.now(),
  });

  console.log(`⚡ [WebSocket Broadcast] Broadcasting ${payload.event} for Room #${payload.roomId || payload.roomNumber || payload.roomName || "N/A"}`);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(dataStr);
    }
  });
}
