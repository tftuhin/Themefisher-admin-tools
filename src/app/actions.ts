"use server";

import { db } from "@/db";
import { eq, desc, asc, and } from "drizzle-orm";
import {
  clients,
  invoices,
  paymentAccounts,
  vendors,
  debitAccounts,
  bankBranches,
} from "@/db/schema";
import type { Client, Invoice, PaymentAccount, Vendor, DebitAccount } from "@/types";

// -- CLIENTS --
export async function getClients() {
  const data = await db.select().from(clients).orderBy(asc(clients.name));
  return data as unknown as Client[];
}

export async function createClient(data: Partial<Client>) {
  const [result] = await db.insert(clients).values(data as any).returning();
  return result;
}

export async function updateClient(id: string, data: Partial<Client>) {
  const [result] = await db
    .update(clients)
    .set({ ...data, createdAt: undefined } as any)
    .where(eq(clients.id, id))
    .returning();
  return result;
}

export async function deleteClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id));
}

// -- INVOICES --
export async function getInvoices() {
  const data = await db
    .select()
    .from(invoices)
    .orderBy(desc(invoices.createdAt));
  return data as unknown as Invoice[];
}

export async function createInvoice(data: Partial<Invoice>) {
  const [result] = await db.insert(invoices).values(data as any).returning();
  return result;
}

export async function updateInvoice(id: string, data: Partial<Invoice>) {
  const [result] = await db
    .update(invoices)
    .set({ ...data, createdAt: undefined } as any)
    .where(eq(invoices.id, id))
    .returning();
  return result;
}

export async function deleteInvoice(id: string) {
  await db.delete(invoices).where(eq(invoices.id, id));
}

// -- PAYMENT ACCOUNTS --
export async function getPaymentAccounts() {
  const data = await db.select().from(paymentAccounts);
  return data as unknown as PaymentAccount[];
}

export async function createPaymentAccount(data: Partial<PaymentAccount>) {
  const [result] = await db
    .insert(paymentAccounts)
    .values(data as any)
    .returning();
  return result;
}


export async function deletePaymentAccount(id: string) {
  await db.delete(paymentAccounts).where(eq(paymentAccounts.id, id));
}

// -- VENDORS --
export async function getVendors() {
  const data = await db.select().from(vendors);
  return data as unknown as Vendor[];
}

export async function createVendor(data: Partial<Vendor>) {
  const [result] = await db.insert(vendors).values(data as any).returning();
  return result;
}

export async function updateVendor(id: string, data: Partial<Vendor>) {
  const [result] = await db
    .update(vendors)
    .set({ ...data, createdAt: undefined } as any)
    .where(eq(vendors.id, id))
    .returning();
  return result;
}

export async function deleteVendor(id: string) {
  await db.delete(vendors).where(eq(vendors.id, id));
}

// -- DEBIT ACCOUNTS --
export async function getDebitAccounts() {
  const data = await db.select().from(debitAccounts);
  return data as unknown as DebitAccount[];
}

export async function createDebitAccount(data: Partial<DebitAccount>) {
  const [result] = await db
    .insert(debitAccounts)
    .values(data as any)
    .returning();
  return result;
}

export async function updateDebitAccount(id: string, data: Partial<DebitAccount>) {
  const [result] = await db
    .update(debitAccounts)
    .set({ ...data, createdAt: undefined } as any)
    .where(eq(debitAccounts.id, id))
    .returning();
  return result;
}

export async function deleteDebitAccount(id: string) {
  await db.delete(debitAccounts).where(eq(debitAccounts.id, id));
}

export async function unsetAllDefaultDebitAccounts() {
  await db.update(debitAccounts).set({ is_default: false });
}

export async function setDefaultDebitAccount(id: string) {
  await unsetAllDefaultDebitAccounts();
  await db.update(debitAccounts).set({ is_default: true }).where(eq(debitAccounts.id, id));
}

// -- BANK BRANCHES --

export async function getBankNames() {
  const data = await db.selectDistinct({ bankName: bankBranches.bank_name }).from(bankBranches).orderBy(asc(bankBranches.bank_name));
  return data.map(d => d.bankName);
}

export async function getBranchesByBank(bankName: string) {
  const data = await db.select({ branchName: bankBranches.branch_name, districtName: bankBranches.district_name })
    .from(bankBranches)
    .where(eq(bankBranches.bank_name, bankName))
    .orderBy(asc(bankBranches.branch_name));
  return data;
}

export async function getRoutingNumber(bankName: string, branchName: string) {
  const data = await db.select({ routingNumber: bankBranches.routing_number })
    .from(bankBranches)
    .where(and(eq(bankBranches.bank_name, bankName), eq(bankBranches.branch_name, branchName)))
    .limit(1);
  return data[0]?.routingNumber;
}

export async function lookupSwiftCode(swiftCode: string) {
  try {
    if (!swiftCode || swiftCode.length < 8) return null;
    const countryCode = swiftCode.substring(4, 6).toUpperCase();
    
    const response = await fetch(`https://raw.githubusercontent.com/PeterNotenboom/SwiftCodes/master/AllCountries/${countryCode}.json`);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const list = Array.isArray(data) ? data : data.list;
    if (!list || !Array.isArray(list)) return null;

    let matched = list.find((b: any) => b.swift_code === swiftCode);
    if (!matched) {
      matched = list.find((b: any) => b.swift_code.startsWith(swiftCode) || swiftCode.startsWith(b.swift_code));
    }

    if (matched) {
      return {
        bank_name: matched.bank,
        branch: matched.branch,
        city: matched.city,
        country: countryCode,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to lookup SWIFT code:", error);
    return null;
  }
}

