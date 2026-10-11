CREATE TABLE `diagram_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`diagram_id` text NOT NULL,
	`account_id` text NOT NULL,
	`element_id` text,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`diagram_id`) REFERENCES `diagrams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `diagram_comment_time` ON `diagram_comments` (`diagram_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `diagram_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`diagram_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`diagram_id`) REFERENCES `diagrams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `diagram_invite_token` ON `diagram_invites` (`token_hash`);--> statement-breakpoint
CREATE INDEX `diagram_invite_diagram` ON `diagram_invites` (`diagram_id`);--> statement-breakpoint
CREATE TABLE `diagram_members` (
	`diagram_id` text NOT NULL,
	`account_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`diagram_id`, `account_id`),
	FOREIGN KEY (`diagram_id`) REFERENCES `diagrams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `diagram_member_account` ON `diagram_members` (`account_id`);--> statement-breakpoint
CREATE TABLE `diagram_presence` (
	`diagram_id` text NOT NULL,
	`account_id` text NOT NULL,
	`x` integer,
	`y` integer,
	`selected_id` text,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`diagram_id`, `account_id`),
	FOREIGN KEY (`diagram_id`) REFERENCES `diagrams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
