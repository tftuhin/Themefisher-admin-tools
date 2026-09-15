import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  numeric,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  tax_id: text("tax_id"),
  bank_name: text("bank_name"),
  bank_address: text("bank_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const paymentAccounts = pgTable("payment_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  bank_name: text("bank_name").notNull(),
  bank_address: text("bank_address"),
  name_on_account: text("name_on_account").notNull(),
  bic_swift: text("bic_swift"),
  account_number: text("account_number").notNull(),
  account_name: text("account_name"),
  account_details: text("account_details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    client_id: uuid("client_id")
      .references(() => clients.id, { onDelete: "cascade" }),
    invoice_number: text("invoice_number").notNull().unique(),
    invoice_date: date("invoice_date"),
    currency: text("currency").default("USD"),
    amount: numeric("amount"),
    description: text("description"),
    received_amount: numeric("received_amount"),
    payment_methods: jsonb("payment_methods"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    clientIdx: index("idx_invoices_client_id").on(table.client_id),
    dateIdx: index("idx_invoices_invoice_date").on(table.invoice_date),
  })
);

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    receiver_name: text("receiver_name").notNull(),
    account_number: text("account_number").notNull(),
    bank_name: text("bank_name").notNull(),
    branch_name: text("branch_name").notNull(),
    routing_number: text("routing_number").notNull(),
    is_employee: boolean("is_employee").default(false),
    is_hidden: boolean("is_hidden").default(false),
    salary: numeric("salary").default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    nameIdx: index("idx_vendors_receiver_name").on(table.receiver_name),
  })
);

export const debitAccounts = pgTable("debit_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  account_number: text("account_number").notNull(),
  account_label: text("account_label").default("Main SCB Account"),
  bank_name: text("bank_name").default("Standard Chartered Bank"),
  is_default: boolean("is_default").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const bankBranches = pgTable("bank_branches", {
  id: uuid("id").defaultRandom().primaryKey(),
  bank_code: text("bank_code"),
  bank_name: text("bank_name").notNull(),
  district_code: text("district_code"),
  district_name: text("district_name"),
  branch_code: text("branch_code"),
  branch_name: text("branch_name").notNull(),
  routing_number: text("routing_number").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
