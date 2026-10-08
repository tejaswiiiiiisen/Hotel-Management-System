/**
 * Base OTA Adapter Interface
 */
export class BaseOTAAdapter {
  constructor(channelId, displayName) {
    this.channelId = channelId;
    this.displayName = displayName;
  }

  async testConnection(propertyId, apiKey, apiSecret) {
    throw new Error("testConnection not implemented");
  }

  async syncInventoryAndRates(rooms, options = {}) {
    throw new Error("syncInventoryAndRates not implemented");
  }

  async pushBooking(booking) {
    throw new Error("pushBooking not implemented");
  }

  async cancelBooking(bookingId) {
    throw new Error("cancelBooking not implemented");
  }
}

/**
 * Generic Mock OTA Adapter implementation that simulates network handshakes and payload processing
 */
export class MockOTAAdapter extends BaseOTAAdapter {
  async testConnection(propertyId, apiKey, apiSecret) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (!propertyId || !apiKey) {
      throw new Error("Missing Property ID or Demo API Key");
    }

    return {
      success: true,
      message: `Connection handshake verified with ${this.displayName} server.`,
      channelId: this.channelId,
    };
  }

  async syncInventoryAndRates(rooms, options = {}) {
    const delayMs = options.delayMs || 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Simulate small random variance or exact sync
    const syncedCount = rooms.length;
    return {
      success: true,
      channelId: this.channelId,
      syncedRoomsCount: syncedCount,
      timestamp: new Date().toISOString(),
    };
  }

  async pushBooking(booking) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      bookingId: booking.id,
      channelId: this.channelId,
      status: "CONFIRMED",
    };
  }

  async cancelBooking(bookingId) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return {
      success: true,
      bookingId,
      status: "CANCELLED",
    };
  }
}

// Concrete Mock Adapters for each OTA Channel
export class MockBookingAdapter extends MockOTAAdapter {
  constructor() {
    super("booking_com", "Booking.com");
  }
}

export class MockMakeMyTripAdapter extends MockOTAAdapter {
  constructor() {
    super("makemytrip", "MakeMyTrip");
  }
}

export class MockGoibiboAdapter extends MockOTAAdapter {
  constructor() {
    super("goibibo", "Goibibo");
  }
}

export class MockAgodaAdapter extends MockOTAAdapter {
  constructor() {
    super("agoda", "Agoda");
  }
}

export class MockAirbnbAdapter extends MockOTAAdapter {
  constructor() {
    super("airbnb", "Airbnb");
  }
}

export class MockExpediaAdapter extends MockOTAAdapter {
  constructor() {
    super("expedia", "Expedia Group");
  }
}

// Registry mapping channel IDs to adapter instances
export const otaAdaptersRegistry = {
  booking_com: new MockBookingAdapter(),
  makemytrip: new MockMakeMyTripAdapter(),
  goibibo: new MockGoibiboAdapter(),
  agoda: new MockAgodaAdapter(),
  airbnb: new MockAirbnbAdapter(),
  expedia: new MockExpediaAdapter(),
};

/** Get or instantiate adapter for a channel */
export function getOTAAdapter(channelId, displayName = "OTA Channel") {
  if (otaAdaptersRegistry[channelId]) {
    return otaAdaptersRegistry[channelId];
  }
  const adapter = new MockOTAAdapter(channelId, displayName);
  otaAdaptersRegistry[channelId] = adapter;
  return adapter;
}
