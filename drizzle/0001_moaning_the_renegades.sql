CREATE TABLE `ai_provider_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'rules' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
