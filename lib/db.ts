import { Database } from 'node-sqlite3-wasm';
import path from 'path';
import fs from 'fs';

// Every customer gets a row here, every generated mockup gets a row that
// points back to its customer. That's the whole "client database" requirement:
// one table for customers, one table for their mockups, linked by customer_id.

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

db.run(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS mockups (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    house_image_path TEXT NOT NULL,
    reference_image_path TEXT,
    mockup_image_path TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  );
`);

export interface Customer {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Mockup {
  id: string;
  customer_id: string;
  house_image_path: string;
  reference_image_path: string | null;
  mockup_image_path: string;
  notes: string | null;
  created_at: string;
}

export function createCustomer(customer: Customer) {
  db.run(
    `INSERT INTO customers (id, name, address, created_at) VALUES (?, ?, ?, ?)`,
    [customer.id, customer.name, customer.address, customer.created_at]
  );
}

export function getCustomers(): Customer[] {
  return db.all(`SELECT * FROM customers ORDER BY created_at DESC`) as unknown as Customer[];
}

export function getCustomer(id: string): Customer | undefined {
  const rows = db.all(`SELECT * FROM customers WHERE id = ?`, [id]) as unknown as Customer[];
  return rows[0];
}

export function createMockup(mockup: Mockup) {
  db.run(
    `INSERT INTO mockups (id, customer_id, house_image_path, reference_image_path, mockup_image_path, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      mockup.id,
      mockup.customer_id,
      mockup.house_image_path,
      mockup.reference_image_path,
      mockup.mockup_image_path,
      mockup.notes,
      mockup.created_at,
    ]
  );
}

export function getMockupsForCustomer(customerId: string): Mockup[] {
  return db.all(
    `SELECT * FROM mockups WHERE customer_id = ? ORDER BY created_at DESC`,
    [customerId]
  ) as unknown as Mockup[];
}

export default db;
