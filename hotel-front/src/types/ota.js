/**
 * @typedef {'CONNECTED' | 'PENDING' | 'DISCONNECTED' | 'SYNCING' | 'ERROR'} OTAConnectionStatus
 */

/**
 * @typedef {Object} OTAConnection
 * @property {string} id
 * @property {string} name
 * @property {string} displayName
 * @property {string} logo
 * @property {string} iconBg
 * @property {OTAConnectionStatus} status
 * @property {string} propertyId
 * @property {number} syncedRooms
 * @property {number} totalRooms
 * @property {number} liveRate
 * @property {number} bookings30Days
 * @property {number} revenue30Days
 * @property {string} lastSyncedAt
 * @property {boolean} autoSyncEnabled
 * @property {number} syncInterval - In minutes
 * @property {boolean} credentialsConfigured
 * @property {string|null} syncError
 * @property {boolean} active
 */

/**
 * @typedef {Object} OTARoom
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} baseRate
 * @property {Record<string, number>} otaRates
 * @property {number} totalInventory
 * @property {number} availableInventory
 * @property {number} minStay
 * @property {number} maxStay
 * @property {boolean} stopSell
 */

/**
 * @typedef {Object} OTABooking
 * @property {string} id
 * @property {string} bookingId
 * @property {string} otaChannel
 * @property {string} otaChannelName
 * @property {string} guestName
 * @property {string} roomType
 * @property {string} checkIn
 * @property {string} checkOut
 * @property {number} guests
 * @property {number} amount
 * @property {'CONFIRMED' | 'MODIFIED' | 'CANCELLED'} status
 * @property {string} createdAt
 */

/**
 * @typedef {Object} OTASyncLog
 * @property {string} id
 * @property {string} otaChannelId
 * @property {string} otaChannelName
 * @property {string} type
 * @property {'SUCCESS' | 'FAILED'} status
 * @property {number} roomsUpdated
 * @property {number} ratesUpdated
 * @property {number} durationMs
 * @property {string} timestamp
 * @property {string} message
 */

export {};
