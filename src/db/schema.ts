import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  mode: text("mode").notNull().default("image-to-prompt"),
  aspectRatio: text("aspect_ratio").notNull(),
  thumbnail: text("thumbnail"),
  mainSubject: text("main_subject").notNull(),
  secondaryElements: text("secondary_elements").notNull(),
  environment: text("environment").notNull(),
  lighting: text("lighting").notNull(),
  cameraAngle: text("camera_angle").notNull(),
  depthOfField: text("depth_of_field").notNull(),
  textureDetails: text("texture_details").notNull(),
  mood: text("mood").notNull(),
  colorGrading: text("color_grading").notNull(),
  styleReference: text("style_reference").notNull(),
  fullPrompt: text("full_prompt").notNull(),
  qualityTags: text("quality_tags").notNull(),
  jsonOutput: jsonb("json_output").notNull(),
});

export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;