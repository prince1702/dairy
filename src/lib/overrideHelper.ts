import { prisma } from "@/lib/db";

export interface ResolvedOrderItem {
  productId: string;
  name: string;
  emoji: string;
  size: string;
  price: number;
  quantity: number;
  isOverride: boolean;
}

/**
 * Resolves the final list of items to deliver to a customer on a given date.
 * Takes into account:
 * 1. Daily pauses
 * 2. Vacation ranges (inclusive of start and end dates)
 * 3. Specific product overrides (added, modified, or set to 0 to remove)
 * 4. Fallback to active recurring subscription items
 */
export async function getResolvedOrderForDate(
  customerId: string,
  date: Date,
  txClient?: any
): Promise<ResolvedOrderItem[]> {
  const db = txClient || prisma;
  
  // Normalize date to midnight in local time
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  // 1. Check if the customer has paused today's delivery
  const isPaused = await db.dailyPause.findUnique({
    where: {
      customerId_pauseDate: {
        customerId,
        pauseDate: targetDate,
      },
    },
  });

  if (isPaused) {
    return []; // No items delivered when paused
  }

  // 2. Check if customer is currently on vacation
  const activeVacation = await db.vacation.findFirst({
    where: {
      customerId,
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
    },
  });

  if (activeVacation) {
    return []; // No items delivered during vacation
  }

  // 3. Fetch customer's active recurring subscription
  const subscription = await db.subscription.findFirst({
    where: { customerId, status: "ACTIVE" },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  // 4. Fetch overrides for the specific target date
  const overrides = await db.orderOverride.findMany({
    where: {
      customerId,
      targetDate: targetDate,
    },
    include: { product: true },
  });

  const overrideMap = new Map<string, any>(overrides.map((o: any) => [o.productId, o]));
  const resolvedItems: ResolvedOrderItem[] = [];

  // 5. Merge recurring items with overrides
  if (subscription) {
    for (const item of subscription.items) {
      if (overrideMap.has(item.productId)) {
        const override = overrideMap.get(item.productId)!;
        // If override quantity > 0, include it with the overridden quantity
        if (override.quantity > 0) {
          resolvedItems.push({
            productId: item.productId,
            name: item.product.name,
            emoji: item.product.emoji,
            size: item.product.size,
            price: item.product.price,
            quantity: override.quantity,
            isOverride: true,
          });
        }
        // If override quantity is 0, it means "Remove Product for tomorrow", so we do not include it
        overrideMap.delete(item.productId); // Handled
      } else {
        resolvedItems.push({
          productId: item.productId,
          name: item.product.name,
          emoji: item.product.emoji,
          size: item.product.size,
          price: item.product.price,
          quantity: item.quantity,
          isOverride: false,
        });
      }
    }
  }

  // 6. Handle any newly added products (overrides that aren't in the recurring subscription)
  for (const override of overrideMap.values()) {
    if (override.quantity > 0) {
      resolvedItems.push({
        productId: override.productId,
        name: override.product.name,
        emoji: override.product.emoji,
        size: override.product.size,
        price: override.product.price,
        quantity: override.quantity,
        isOverride: true,
      });
    }
  }

  return resolvedItems;
}
