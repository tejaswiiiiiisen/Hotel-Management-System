-- =============================================================================
-- HOTEL MANAGEMENT SUITE — FULL DATABASE SCHEMA & SEED DATA
-- Database: MySQL (5.7+ / 8.0+)
-- Target: hotel-back & multi-tenant hotel system
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `hotel_management` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hotel_management`;

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATIONS (HOTEL BRANCHES)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `description` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `logo` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. USERS & STAFF ACCOUNTS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `staff_id` VARCHAR(50) DEFAULT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `org_id` VARCHAR(50) DEFAULT NULL,
  `org_name` VARCHAR(255) DEFAULT NULL,
  `avatar` LONGTEXT DEFAULT NULL,
  `dob` VARCHAR(50) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT 'India',
  `address` TEXT DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT 'Management',
  `reset_token_hash` VARCHAR(255) DEFAULT NULL,
  `reset_token_expiry` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_org` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. RBAC (ROLES, PERMISSIONS & MAPPINGS)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_key` VARCHAR(50) NOT NULL UNIQUE,
  `role_name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `module_key` VARCHAR(100) NOT NULL,
  `action` VARCHAR(50) NOT NULL DEFAULT 'view',
  `permission_key` VARCHAR(150) NOT NULL UNIQUE,
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role_key` VARCHAR(50) NOT NULL,
  `module_key` VARCHAR(100) NOT NULL,
  `access_level` ENUM('No Access', 'View Only', 'Read & Write') NOT NULL DEFAULT 'View Only',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_key`, `module_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. BRANCH FLOORS & ROOM NUMBERS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `branch_floors`;
CREATE TABLE `branch_floors` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `floor_name` VARCHAR(100) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_org_floor` (`org_id`, `floor_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `floor_room_numbers`;
CREATE TABLE `floor_room_numbers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `floor_name` VARCHAR(100) NOT NULL,
  `room_number` VARCHAR(50) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_org_floor_room` (`org_id`, `floor_name`, `room_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. ROOMS & ACCOMMODATIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `type` VARCHAR(100) NOT NULL DEFAULT 'Standard',
  `price_per_night` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `capacity` INT NOT NULL DEFAULT 2,
  `size_sqm` INT DEFAULT 25,
  `beds` VARCHAR(100) DEFAULT '1 Double Bed',
  `description` TEXT,
  `short_description` VARCHAR(255) DEFAULT NULL,
  `images` LONGTEXT,
  `amenities` LONGTEXT,
  `policies` LONGTEXT,
  `room_number` VARCHAR(50) DEFAULT NULL,
  `room_uid` VARCHAR(100) DEFAULT NULL,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `org_name` VARCHAR(255) DEFAULT 'Matcha Tea',
  `floor` VARCHAR(100) DEFAULT '1st Floor',
  `room_view` VARCHAR(255) DEFAULT 'City View',
  `badge` VARCHAR(100) DEFAULT NULL,
  `is_popular` BOOLEAN NOT NULL DEFAULT FALSE,
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 4.80,
  `reviews_count` INT NOT NULL DEFAULT 12,
  `available` BOOLEAN NOT NULL DEFAULT TRUE,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Available',
  `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rooms_room_uid` (`room_uid`),
  INDEX `idx_rooms_org_id` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. BOOKINGS & RESERVATIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_code` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `room_id` INT UNSIGNED NOT NULL,
  `room_name` VARCHAR(255) DEFAULT NULL,
  `room_number` VARCHAR(50) DEFAULT NULL,
  `floor` VARCHAR(50) DEFAULT NULL,
  `room_view` VARCHAR(100) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `type` VARCHAR(100) DEFAULT 'Standard',
  `status` VARCHAR(50) NOT NULL DEFAULT 'confirmed',
  `check_in_date` VARCHAR(50) DEFAULT NULL,
  `check_in_time` VARCHAR(50) DEFAULT '14:00',
  `check_out_date` VARCHAR(50) DEFAULT NULL,
  `check_out_time` VARCHAR(50) DEFAULT '11:00',
  `check_in` DATE DEFAULT NULL,
  `check_out` DATE DEFAULT NULL,
  `nights` INT NOT NULL DEFAULT 1,
  `days` INT NOT NULL DEFAULT 1,
  `guests` INT NOT NULL DEFAULT 1,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `amount_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `nightly_rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) DEFAULT 'pay_at_hotel',
  `payment_status` VARCHAR(50) DEFAULT 'Pending',
  `image` LONGTEXT DEFAULT NULL,
  `amenities` LONGTEXT DEFAULT NULL,
  `org_id` VARCHAR(50) DEFAULT 'AS435',
  `guest_name` VARCHAR(255) DEFAULT NULL,
  `guest_phone` VARCHAR(50) DEFAULT NULL,
  `guest_email` VARCHAR(255) DEFAULT NULL,
  `source` VARCHAR(50) NOT NULL DEFAULT 'website',
  `booked_by` VARCHAR(255) DEFAULT NULL,
  `document_name` VARCHAR(255) DEFAULT NULL,
  `document_type` VARCHAR(255) DEFAULT NULL,
  `document_status` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_bookings_org` (`org_id`),
  INDEX `idx_bookings_code` (`booking_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. CUSTOMERS & GUEST PROFILES
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT 'CH560',
  `org_name` VARCHAR(255) DEFAULT 'Cheery Clothing',
  `customer_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) DEFAULT NULL,
  `gender` VARCHAR(50) DEFAULT 'Male',
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `bookings` INT DEFAULT 1,
  `tier` VARCHAR(50) DEFAULT 'Daily Guest',
  `tier_color` VARCHAR(50) DEFAULT '#64748b',
  `tier_bg` VARCHAR(50) DEFAULT '#f1f5f9',
  `tier_icon` VARCHAR(50) DEFAULT '👤',
  `points` VARCHAR(50) DEFAULT '0',
  `stays` INT DEFAULT 1,
  `last_visit` VARCHAR(50) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `image` LONGTEXT DEFAULT NULL,
  `room_booked` VARCHAR(100) DEFAULT 'Room 101',
  `check_in` VARCHAR(50) DEFAULT NULL,
  `check_out` VARCHAR(50) DEFAULT NULL,
  `stay_days` INT DEFAULT 2,
  `guests_count` INT DEFAULT 1,
  `total_bill` DECIMAL(10,2) DEFAULT 2500.00,
  `paid_amount` DECIMAL(10,2) DEFAULT 2500.00,
  `payment_status` VARCHAR(50) DEFAULT 'Paid',
  `invoice_id` VARCHAR(100) DEFAULT NULL,
  `document_name` VARCHAR(255) DEFAULT NULL,
  `document_type` VARCHAR(100) DEFAULT 'Aadhaar Card',
  `document_status` VARCHAR(100) DEFAULT 'Pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_customers_org` (`org_id`),
  INDEX `idx_customers_code` (`customer_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. INVENTORY & PROCUREMENT
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) NOT NULL DEFAULT 'units',
  `min_threshold` INT NOT NULL DEFAULT 5,
  `cost_per_unit` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `supplier` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'In Stock',
  `last_restocked` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_inventory_org` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `po_number` VARCHAR(50) NOT NULL UNIQUE,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `supplier` VARCHAR(255) NOT NULL,
  `items` LONGTEXT,
  `total_cost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `expected_delivery` VARCHAR(50) DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. HOUSEKEEPING & MAINTENANCE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `housekeeping`;
CREATE TABLE `housekeeping` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `room_number` VARCHAR(50) NOT NULL,
  `room_type` VARCHAR(100) DEFAULT 'Standard',
  `floor` VARCHAR(50) DEFAULT '1st Floor',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Clean',
  `priority` VARCHAR(50) NOT NULL DEFAULT 'Medium',
  `assigned_to` VARCHAR(255) DEFAULT 'Unassigned',
  `last_cleaned` VARCHAR(50) DEFAULT NULL,
  `notes` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_hk_org` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `maintenance`;
CREATE TABLE `maintenance` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `issue_title` VARCHAR(255) NOT NULL,
  `room_number` VARCHAR(50) DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'General',
  `priority` VARCHAR(50) NOT NULL DEFAULT 'Medium',
  `status` VARCHAR(50) NOT NULL DEFAULT 'Open',
  `assigned_to` VARCHAR(255) DEFAULT 'Unassigned',
  `reported_by` VARCHAR(255) DEFAULT NULL,
  `cost` DECIMAL(10,2) DEFAULT 0.00,
  `description` TEXT,
  `resolved_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. PAYROLL & OFFERS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payroll`;
CREATE TABLE `payroll` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `staff_id` VARCHAR(50) NOT NULL,
  `staff_name` VARCHAR(255) NOT NULL,
  `month` VARCHAR(50) NOT NULL,
  `base_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `bonus` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `deductions` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `net_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Paid',
  `payment_date` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `offers`;
CREATE TABLE `offers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `discount_percentage` INT DEFAULT 10,
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00,
  `valid_until` DATE DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Active',
  `description` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. REVIEWS, AUDIT LOGS & SITE SETTINGS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `room_id` INT UNSIGNED DEFAULT NULL,
  `guest_name` VARCHAR(255) NOT NULL,
  `rating` INT NOT NULL DEFAULT 5,
  `comment` TEXT,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Approved',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) DEFAULT NULL,
  `action` VARCHAR(255) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `performed_by` VARCHAR(255) NOT NULL DEFAULT 'Admin',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `org_id` VARCHAR(50) NOT NULL UNIQUE,
  `hotel_name` VARCHAR(255) NOT NULL DEFAULT 'Grand Horizon Hotel',
  `logo` LONGTEXT,
  `primary_color` VARCHAR(50) DEFAULT '#667eea',
  `contact_phone` VARCHAR(50) DEFAULT '+91 98765 43210',
  `contact_email` VARCHAR(255) DEFAULT 'contact@hotel.com',
  `address` TEXT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- 1. SEED ORGANIZATIONS (BRANCHES)
INSERT INTO `organizations` (`org_id`, `name`, `location`, `description`, `status`) VALUES
('AJ01', 'Ajmer Branch', 'Ajmer, Rajasthan', 'Ajmer prime heritage hotel near Ana Sagar Lake', 'Active'),
('JP01', 'Jaipur Branch', 'Jaipur, Rajasthan', 'Jaipur pink city royal boutique resort', 'Active'),
('MA330', 'Matcha Tea', 'Udaipur, Rajasthan', 'Premium hospitality & lakeside resort franchise', 'Active'),
('CH560', 'Cheery Clothing', 'Jodhpur, Rajasthan', 'Boutique hotel & apparel experience centre', 'Active'),
('AS435', 'Ashirwad', 'Mount Abu, Rajasthan', 'Luxury hill station resort & royal suites', 'Active')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. SEED DEFAULT RBAC ROLES
INSERT INTO `roles` (`role_key`, `role_name`, `description`) VALUES
('super_admin', 'Super Administrator', 'Full system access across all multi-tenant branches'),
('admin', 'Hotel Administrator', 'Full management access for assigned branch'),
('manager', 'Branch Manager', 'Operational and reporting access for branch'),
('receptionist', 'Front Desk Receptionist', 'Check-in/out, bookings and billing management'),
('staff', 'Hotel Staff', 'Housekeeping, room service and inventory view'),
('guest', 'Registered Guest', 'Public portal booking and reservation history view')
ON DUPLICATE KEY UPDATE `role_name`=VALUES(`role_name`);

-- 3. SEED DEFAULT BRANCH FLOORS
INSERT IGNORE INTO `branch_floors` (`org_id`, `floor_name`) VALUES
('AJ01', '1st Floor'),
('AJ01', '2nd Floor'),
('JP01', '1st Floor'),
('JP01', '2nd Floor'),
('JP01', '3rd Floor'),
('MA330', '1st Floor'),
('MA330', '2nd Floor'),
('MA330', '3rd Floor'),
('CH560', '1st Floor'),
('CH560', '2nd Floor'),
('AS435', '1st Floor'),
('AS435', '2nd Floor');

-- 4. SEED DEFAULT ROOM NUMBERS PER FLOOR
INSERT IGNORE INTO `floor_room_numbers` (`org_id`, `floor_name`, `room_number`) VALUES
('AJ01', '1st Floor', '101'),
('AJ01', '1st Floor', '102'),
('AJ01', '2nd Floor', '201'),
('AJ01', '2nd Floor', '202'),
('JP01', '1st Floor', '101'),
('JP01', '2nd Floor', '201'),
('JP01', '2nd Floor', '202'),
('MA330', '1st Floor', '101'),
('MA330', '1st Floor', '102'),
('MA330', '2nd Floor', '201'),
('MA330', '2nd Floor', '202'),
('CH560', '1st Floor', '101'),
('CH560', '1st Floor', '102'),
('AS435', '1st Floor', '101'),
('AS435', '1st Floor', '102');

-- 5. SEED ROOMS
INSERT INTO `rooms` (`room_uid`, `org_id`, `org_name`, `name`, `slug`, `type`, `room_number`, `floor`, `room_view`, `price_per_night`, `capacity`, `size_sqm`, `beds`, `status`, `is_popular`, `images`, `amenities`) VALUES
('AJ01-R101', 'AJ01', 'Ajmer Branch', 'Ajmer Deluxe King', 'ajmer-deluxe-king-101', 'Deluxe', '101', '1st Floor', 'Mountain View', 3500.00, 2, 32, '1 King Bed', 'Available', 1, '["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"]', '["Free Wi-Fi", "Air Conditioning", "TV", "Room Service", "Private Bathroom"]'),
('AJ01-R102', 'AJ01', 'Ajmer Branch', 'Ajmer Executive Suite', 'ajmer-executive-suite-102', 'Suite', '102', '1st Floor', 'Lake View', 5500.00, 3, 48, '1 King Bed + Lounge', 'Available', 1, '["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"]', '["Free Wi-Fi", "Mini Bar", "Bathtub", "Lake View Balcony"]'),
('JP01-R201', 'JP01', 'Jaipur Branch', 'Jaipur Royal Heritage Suite', 'jaipur-royal-heritage-201', 'Presidential Suite', '201', '2nd Floor', 'Palace View', 8500.00, 4, 65, '2 Royal King Beds', 'Available', 1, '["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"]', '["Jacuzzi", "Heritage Decor", "Free Breakfast", "Butler Service"]'),
('MA330-R101', 'MA330', 'Matcha Tea', 'Lakeside Premium Double', 'lakeside-premium-double-101', 'Deluxe', '101', '1st Floor', 'Lake View', 4200.00, 2, 35, '1 Double Bed', 'Available', 1, '["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"]', '["Free Wi-Fi", "Tea Maker", "Balcony", "AC"]'),
('AS435-R101', 'AS435', 'Ashirwad', 'Mount Abu Luxury Villa', 'mount-abu-luxury-villa-101', 'Luxury Villa', '101', '1st Floor', 'Valley View', 9200.00, 4, 75, '2 King Beds', 'Available', 1, '["https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80"]', '["Private Garden", "Heated Pool Access", "Fireplace", "Breakfast Included"]')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 6. SEED SAMPLE CUSTOMERS
INSERT INTO `customers` (`org_id`, `org_name`, `customer_code`, `name`, `username`, `gender`, `phone`, `email`, `tier`, `tier_color`, `tier_bg`, `tier_icon`, `room_booked`, `check_in`, `check_out`, `stay_days`, `guests_count`, `total_bill`, `paid_amount`, `payment_status`, `invoice_id`, `status`) VALUES
('AJ01', 'Ajmer Branch', 'CUS-219739', 'Vikramaditya Rathore', '@vikram', 'Male', '+91 98765 11223', 'vikram@mail.com', 'Platinum', '#7c3aed', '#f3e8ff', '👑', '1st Floor - Room 101', '14 Sept 2026', '16 Sept 2026', 2, 2, 7000.00, 7000.00, 'Paid', 'INV-2026-6509', 'Checked In'),
('JP01', 'Jaipur Branch', 'CUS-541298', 'Ananya Sharma', '@ananya', 'Female', '+91 98234 55678', 'ananya@mail.com', 'Gold', '#d97706', '#fef3c7', '⭐', '2nd Floor - Room 201', '15 Sept 2026', '18 Sept 2026', 3, 2, 25500.00, 25500.00, 'Paid', 'INV-2026-8812', 'Active'),
('MA330', 'Matcha Tea', 'CUS-832104', 'Rohan Verma', '@rohan', 'Male', '+91 97112 33445', 'rohan@mail.com', 'Silver', '#475569', '#f1f5f9', '🥈', '1st Floor - Room 101', '12 Sept 2026', '14 Sept 2026', 2, 1, 8400.00, 8400.00, 'Paid', 'INV-2026-3401', 'Checked Out')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- -----------------------------------------------------------------------------
-- END OF SCHEMA SCRIPT
-- -----------------------------------------------------------------------------
