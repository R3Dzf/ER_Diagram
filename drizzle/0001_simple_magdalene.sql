CREATE TABLE `google_identities` (
	`subject` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `google_identity_account` ON `google_identities` (`account_id`);--> statement-breakpoint
CREATE TABLE `google_nonces` (
	`nonce_hash` text PRIMARY KEY NOT NULL,
	`link_account_id` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`link_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `google_nonce_expiry` ON `google_nonces` (`expires_at`);--> statement-breakpoint
CREATE TABLE `google_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`google_subject` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`google_subject`) REFERENCES `google_identities`(`subject`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `google_session_account` ON `google_sessions` (`account_id`);--> statement-breakpoint
CREATE INDEX `google_session_expiry` ON `google_sessions` (`expires_at`);