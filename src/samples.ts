import type { SqlDialect } from "@shanmukha_npm/querylens";

export interface PlaygroundSample {
  id: string;
  name: string;
  description: string;
  dialect: SqlDialect;
  sql: string;
  profileSampleId?: string;
}

export const playgroundSamples: PlaygroundSample[] = [
  {
    id: "order-details",
    profileSampleId: "order-details",
    name: "Order details",
    description: "Join orders to customers and line items.",
    dialect: "sqlite",
    sql: `SELECT o.id, c.name, oi.quantity, p.name AS product
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.status = 'paid'
ORDER BY o.created_at DESC;`,
  },
  {
    id: "customers-by-city",
    profileSampleId: "customers-by-city",
    name: "Customers by city",
    description: "Filter and sort a small customer set.",
    dialect: "sqlite",
    sql: `SELECT id, name, email, created_at
FROM customers
WHERE city = 'Bengaluru'
ORDER BY created_at DESC
LIMIT 10;`,
  },
  {
    id: "date-filter",
    profileSampleId: "date-filter",
    name: "Date function filter",
    description: "Inspect a function applied to a filtered column.",
    dialect: "sqlite",
    sql: `SELECT id, created_at
FROM orders
WHERE date(created_at) = '2026-11-21';`,
  },
  {
    id: "postgres-customer-orders",
    name: "PostgreSQL customer orders",
    description: "Aggregate orders with a date cast and HAVING filter.",
    dialect: "postgresql",
    sql: `SELECT c.id, c.name, COUNT(o.id) AS order_count
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE c.created_at >= '2026-01-01'::date
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 1
ORDER BY order_count DESC
LIMIT 20;`,
  },
  {
    id: "mysql-city-orders",
    name: "MySQL city orders",
    description: "Group and rank orders by city for the current year.",
    dialect: "mysql",
    sql: `SELECT c.city, COUNT(o.id) AS order_count
FROM customers AS c
LEFT JOIN orders AS o ON o.customer_id = c.id
WHERE YEAR(o.created_at) = 2026
GROUP BY c.city
HAVING COUNT(o.id) > 1
ORDER BY order_count DESC
LIMIT 10;`,
  },
];
