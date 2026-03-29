import type { CartItem } from "@/types";
import { generateOrderNumber } from "@/lib/utils";

export async function submitMockOrder(items: CartItem[]) {
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error(`orders ${response.status}`);
    }

    const data = (await response.json()) as { orderNumber?: string };
    return data.orderNumber ?? generateOrderNumber();
  } catch {
    return generateOrderNumber();
  }
}
