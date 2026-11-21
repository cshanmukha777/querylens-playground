export interface ProfileSample {
  id: string;
  name: string;
  description: string;
  sql: string;
  parameters: readonly unknown[];
}

export const profileSamples: ProfileSample[] = [
  {
    id: "customers-by-city", name: "Customers by city", description: "Filter and sort a small customer set.",
    sql: "SELECT id, name, email, created_at FROM customers WHERE city = ? ORDER BY created_at DESC LIMIT 10",
    parameters: ["Bengaluru"],
  },
  {
    id: "order-details", name: "Order details", description: "Join orders to customers and line items.",
    sql: "SELECT o.id, c.name, oi.quantity, p.name AS product FROM orders o JOIN customers c ON c.id = o.customer_id JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE o.status = ? ORDER BY o.created_at DESC",
    parameters: ["paid"],
  },
  {
    id: "date-filter", name: "Date function filter", description: "A static-analysis example that wraps a filtered column.",
    sql: "SELECT id, created_at FROM orders WHERE date(created_at) = ?",
    parameters: ["2026-11-21"],
  },
];

export function findProfileSample(id: string): ProfileSample | undefined {
  return profileSamples.find((sample) => sample.id === id);
}
