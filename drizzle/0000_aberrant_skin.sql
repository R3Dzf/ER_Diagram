CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `diagrams` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`model` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `diagrams_owner_updated` ON `diagrams` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `diagram_versions` (
	`diagram_id` text NOT NULL,
	`revision` integer NOT NULL,
	`model` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`diagram_id`, `revision`),
	FOREIGN KEY (`diagram_id`) REFERENCES `diagrams`(`id`) ON UPDATE no action ON DELETE no action
);
