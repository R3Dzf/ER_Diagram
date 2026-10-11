CREATE TABLE `diagram_shares` (
	`diagram_id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`token` text,
	`token_hash` text,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`diagram_id`) REFERENCES `diagrams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `diagram_share_token` ON `diagram_shares` (`token_hash`);