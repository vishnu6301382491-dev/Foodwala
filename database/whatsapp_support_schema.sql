-- =======================================================================
-- FoodWala AI-Powered WhatsApp Customer Support Database Migration
-- Adds tables for:
-- 1. whatsapp_conversations: Session tracking by WhatsApp ID
-- 2. whatsapp_messages: Complete message history (inbound & outbound)
-- 3. support_tickets: Human escalation & customer issue tracking
-- =======================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- Table: whatsapp_conversations
CREATE TABLE IF NOT EXISTS `whatsapp_conversations` (
  `conversation_id` INT NOT NULL AUTO_INCREMENT,
  `wa_id` VARCHAR(50) NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `user_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(150) DEFAULT NULL,
  `session_status` VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  `last_message_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`),
  UNIQUE KEY `uq_wa_id` (`wa_id`),
  KEY `idx_phone_number` (`phone_number`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_wa_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: whatsapp_messages
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
  `message_id` INT NOT NULL AUTO_INCREMENT,
  `conversation_id` INT NOT NULL,
  `wa_message_id` VARCHAR(100) DEFAULT NULL,
  `direction` ENUM('INBOUND', 'OUTBOUND') NOT NULL,
  `sender_type` ENUM('USER', 'AI_BOT', 'HUMAN_AGENT') NOT NULL,
  `message_text` TEXT NOT NULL,
  `message_type` VARCHAR(50) NOT NULL DEFAULT 'text',
  `raw_payload` JSON DEFAULT NULL,
  `delivery_status` VARCHAR(50) DEFAULT 'sent',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `idx_conv_id` (`conversation_id`),
  KEY `idx_wa_msg_id` (`wa_message_id`),
  CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `whatsapp_conversations` (`conversation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: support_tickets
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `ticket_id` INT NOT NULL AUTO_INCREMENT,
  `ticket_number` VARCHAR(50) NOT NULL,
  `conversation_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `order_id` INT DEFAULT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `customer_name` VARCHAR(150) DEFAULT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  `priority` VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  `status` VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  `subject` VARCHAR(255) NOT NULL,
  `issue_description` TEXT NOT NULL,
  `resolution_notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ticket_id`),
  UNIQUE KEY `uq_ticket_number` (`ticket_number`),
  KEY `idx_ticket_phone` (`customer_phone`),
  KEY `idx_ticket_order` (`order_id`),
  CONSTRAINT `fk_ticket_conv` FOREIGN KEY (`conversation_id`) REFERENCES `whatsapp_conversations` (`conversation_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ticket_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ticket_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
