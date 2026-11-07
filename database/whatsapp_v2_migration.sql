-- =======================================================================
-- FoodWala WhatsApp Assistant V2 Migration
-- Tables:
-- 1. whatsapp_users
-- 2. whatsapp_sessions
-- 3. faq
-- Updates:
-- 4. Alter whatsapp_messages to add latency_ms, user_id, ensure wa_message_id unique index
-- 5. Add helpful indexes on orders and menu
-- =======================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `whatsapp_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `phone_e164` VARCHAR(25) NOT NULL,
  `user_id` INT DEFAULT NULL,
  `name` VARCHAR(150) DEFAULT 'Customer',
  `language` VARCHAR(10) NOT NULL DEFAULT 'en',
  `default_address_id` INT DEFAULT NULL,
  `opted_in` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_phone_e164` (`phone_e164`),
  KEY `idx_wa_user_id` (`user_id`),
  CONSTRAINT `fk_wa_users_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `whatsapp_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `phone_e164` VARCHAR(25) NOT NULL,
  `user_id` INT DEFAULT NULL,
  `state` VARCHAR(50) NOT NULL DEFAULT 'IDLE',
  `cart_json` JSON DEFAULT NULL,
  `context_json` JSON DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expires_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_session_phone` (`phone_e164`),
  KEY `idx_session_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `faq` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `intent` VARCHAR(60) NOT NULL,
  `question_variants_json` JSON NOT NULL,
  `answer_en` TEXT NOT NULL,
  `answer_hi` TEXT DEFAULT NULL,
  `answer_te` TEXT DEFAULT NULL,
  `answer_ta` TEXT DEFAULT NULL,
  `answer_kn` TEXT DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_faq_intent` (`intent`),
  KEY `idx_faq_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fix data integrity for non-veg items accidentally marked as veg
UPDATE menu SET is_veg = 0 WHERE is_veg = 1 AND (item_name LIKE '%chicken%' OR item_name LIKE '%mutton%' OR item_name LIKE '%fish%' OR item_name LIKE '%prawn%' OR item_name LIKE '%egg%');

SET FOREIGN_KEY_CHECKS = 1;
