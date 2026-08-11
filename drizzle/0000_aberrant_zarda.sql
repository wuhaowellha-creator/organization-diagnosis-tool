CREATE TABLE `ai_diagnoses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`work_record_id` text NOT NULL,
	`risk_level` text DEFAULT 'medium' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`reasoning` text DEFAULT '' NOT NULL,
	`suggested_actions` text DEFAULT '' NOT NULL,
	`structured_result` text NOT NULL,
	`confirmed_by_user` integer DEFAULT false NOT NULL,
	`confirmed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_record_id`) REFERENCES `work_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_diagnoses_user_record_unique` ON `ai_diagnoses` (`user_id`,`work_record_id`);--> statement-breakpoint
CREATE INDEX `ai_diagnoses_user_confirmed_idx` ON `ai_diagnoses` (`user_id`,`confirmed_by_user`,`confirmed_at`);--> statement-breakpoint
CREATE TABLE `follow_up_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`work_record_id` text NOT NULL,
	`ai_diagnosis_id` text NOT NULL,
	`subject_name` text DEFAULT '' NOT NULL,
	`team_name` text DEFAULT '' NOT NULL,
	`risk_types` text NOT NULL,
	`risk_level` text NOT NULL,
	`title` text NOT NULL,
	`problem_description` text DEFAULT '' NOT NULL,
	`suggested_actions` text DEFAULT '' NOT NULL,
	`review_result` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`work_record_id`) REFERENCES `work_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ai_diagnosis_id`) REFERENCES `ai_diagnoses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `follow_ups_user_diagnosis_unique` ON `follow_up_items` (`user_id`,`ai_diagnosis_id`);--> statement-breakpoint
CREATE INDEX `follow_ups_user_status_idx` ON `follow_up_items` (`user_id`,`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `report_outputs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`report_type` text DEFAULT 'diagnosis_summary' NOT NULL,
	`content` text NOT NULL,
	`source_start_date` text,
	`source_end_date` text,
	`metadata` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `report_outputs_user_created_idx` ON `report_outputs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `work_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`record_type` text NOT NULL,
	`subject_name` text NOT NULL,
	`team_name` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `work_records_user_created_idx` ON `work_records` (`user_id`,`created_at`);