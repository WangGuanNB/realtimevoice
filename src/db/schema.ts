import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Users table
export const users = sqliteTable(
  "users_shipfire",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    uuid: text().notNull().unique(),
    email: text().notNull(),
    created_at: integer({ mode: "timestamp" }),
    nickname: text(),
    avatar_url: text(),
    locale: text(),
    signin_type: text(),
    signin_ip: text(),
    signin_provider: text(),
    signin_openid: text(),
    invite_code: text().notNull().default(""),
    updated_at: integer({ mode: "timestamp" }),
    invited_by: text().notNull().default(""),
    is_affiliate: integer({ mode: "boolean" }).notNull().default(false),
  },
  (table) => [
    uniqueIndex("email_shipfire_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

// Orders table
export const orders = sqliteTable("orders_shipfire", {
  id: integer().primaryKey({ autoIncrement: true }),
  order_no: text().notNull().unique(),
  created_at: integer({ mode: "timestamp" }),
  user_uuid: text().notNull().default(""),
  user_email: text().notNull().default(""),
  amount: integer().notNull(),
  interval: text(),
  expired_at: integer({ mode: "timestamp" }),
  status: text().notNull(),
  stripe_session_id: text(),
  credits: integer().notNull(),
  currency: text(),
  sub_id: text(),
  sub_interval_count: integer(),
  sub_cycle_anchor: integer(),
  sub_period_end: integer(),
  sub_period_start: integer(),
  sub_times: integer(),
  product_id: text(),
  product_name: text(),
  valid_months: integer(),
  order_detail: text(),
  paid_at: integer({ mode: "timestamp" }),
  paid_email: text(),
  paid_detail: text(),
  pay_type: text(),
});

// API Keys table
export const apikeys = sqliteTable("apikeys_shipfire", {
  id: integer().primaryKey({ autoIncrement: true }),
  api_key: text().notNull().unique(),
  title: text(),
  user_uuid: text().notNull(),
  created_at: integer({ mode: "timestamp" }),
  status: text(),
});

// Credits table
export const credits = sqliteTable("credits_shipfire", {
  id: integer().primaryKey({ autoIncrement: true }),
  trans_no: text().notNull().unique(),
  created_at: integer({ mode: "timestamp" }),
  user_uuid: text().notNull(),
  trans_type: text().notNull(),
  credits: integer().notNull(),
  order_no: text(),
  expired_at: integer({ mode: "timestamp" }),
});

// Posts table
export const posts = sqliteTable("posts_shipfire", {
  id: integer().primaryKey({ autoIncrement: true }),
  uuid: text().notNull().unique(),
  slug: text(),
  title: text(),
  description: text(),
  content: text(),
  created_at: integer({ mode: "timestamp" }),
  updated_at: integer({ mode: "timestamp" }),
  status: text(),
  cover_url: text(),
  author_name: text(),
  author_avatar_url: text(),
  locale: text(),
});

// Affiliates table
export const affiliates = sqliteTable("affiliates_shipfire", {
  id: integer().primaryKey({ autoIncrement: true }),
  user_uuid: text().notNull(),
  created_at: integer({ mode: "timestamp" }),
  status: text().notNull().default(""),
  invited_by: text().notNull(),
  paid_order_no: text().notNull().default(""),
  paid_amount: integer().notNull().default(0),
  reward_percent: integer().notNull().default(0),
  reward_amount: integer().notNull().default(0),
});

// Feedbacks table
export const feedbacks = sqliteTable("feedbacks_shipfire", {
  id: integer().primaryKey({ autoIncrement: true }),
  created_at: integer({ mode: "timestamp" }),
  status: text(),
  user_uuid: text(),
  content: text(),
  rating: integer(),
});
