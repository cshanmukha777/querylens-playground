import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const schemaAndSeed = `
PRAGMA journal_mode = DELETE;
CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, city TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price_cents INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers(id), status TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id), amount_cents INTEGER NOT NULL, status TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
INSERT OR IGNORE INTO customers VALUES (1, 'Ada Lovelace', 'ada@example.test', 'Bengaluru', '2026-11-18T10:00:00Z');
INSERT OR IGNORE INTO customers VALUES (2, 'Grace Hopper', 'grace@example.test', 'Hyderabad', '2026-11-19T10:00:00Z');
INSERT OR IGNORE INTO customers VALUES (3, 'Katherine Johnson', 'kat@example.test', 'Bengaluru', '2026-11-20T10:00:00Z');
INSERT OR IGNORE INTO products VALUES (1, 'Mechanical keyboard', 'Accessories', 8900);
INSERT OR IGNORE INTO products VALUES (2, 'USB-C dock', 'Accessories', 12400);
INSERT OR IGNORE INTO products VALUES (3, '27-inch display', 'Displays', 32900);
INSERT OR IGNORE INTO orders VALUES (101, 1, 'paid', '2026-11-20T13:20:00Z');
INSERT OR IGNORE INTO orders VALUES (102, 2, 'paid', '2026-11-21T08:15:00Z');
INSERT OR IGNORE INTO orders VALUES (103, 3, 'pending', '2026-11-21T10:35:00Z');
INSERT OR IGNORE INTO order_items VALUES (1, 101, 1, 1);
INSERT OR IGNORE INTO order_items VALUES (2, 101, 2, 1);
INSERT OR IGNORE INTO order_items VALUES (3, 102, 3, 1);
INSERT OR IGNORE INTO order_items VALUES (4, 103, 1, 2);
INSERT OR IGNORE INTO payments VALUES (1, 101, 21300, 'settled');
INSERT OR IGNORE INTO payments VALUES (2, 102, 32900, 'settled');
`;

export function openReadonlyDemoDatabase(): Database.Database {
  const path = resolve(process.env.DATABASE_PATH ?? "./server/data/querylens-demo.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const seed = new Database(path);
  seed.pragma("foreign_keys = ON");
  seed.exec(schemaAndSeed);
  seed.close();
  const database = new Database(path, { readonly: true, fileMustExist: true, timeout: 1500 });
  database.pragma("query_only = ON");
  database.pragma("foreign_keys = ON");
  return database;
}
