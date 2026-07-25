import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrderHistoryClientView } from "@/components/OrderHistoryClientView";

export default async function CustomerOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "CUSTOMER") {
    redirect("/login?error=Unauthorized");
  }

  const customerId = (session.user as any).id;

  // 1. Fetch customer details
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true },
  });

  if (!customer) {
    redirect("/login?error=Unauthorized");
  }

  // 2. Fetch baseline subscription
  const activeSub = await prisma.subscription.findFirst({
    where: { customerId, status: "ACTIVE" },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  const subscriptionItems = activeSub
    ? activeSub.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        productName: item.product.name,
        productEmoji: item.product.emoji,
        productSize: item.product.size,
        productPrice: item.product.price,
      }))
    : [];

  // 3. Fetch tomorrow's overrides
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowOverrides = await prisma.orderOverride.findMany({
    where: { customerId, targetDate: tomorrow },
    include: { product: true },
  });

  const tomorrowPause = await prisma.dailyPause.findUnique({
    where: { customerId_pauseDate: { customerId, pauseDate: tomorrow } },
  });

  // 4. Fetch vacations & pauses history
  const vacations = await prisma.vacation.findMany({
    where: { customerId },
    orderBy: { startDate: "desc" },
  });

  const pauses = await prisma.dailyPause.findMany({
    where: { customerId },
    orderBy: { pauseDate: "desc" },
  });

  // 5. Fetch past deliveries (completed orders)
  const deliveries = await prisma.delivery.findMany({
    where: { customerId },
    orderBy: { deliveredAt: "desc" },
  });

  // Fetch available products
  const products = await prisma.product.findMany({
    where: { available: true },
    select: { id: true, name: true, emoji: true, category: true, price: true, size: true },
  });

  return (
    <OrderHistoryClientView
      customer={customer}
      subscriptionItems={subscriptionItems}
      tomorrowOverrides={tomorrowOverrides.map(o => ({
        productId: o.productId,
        quantity: o.quantity,
        productName: o.product.name,
        productEmoji: o.product.emoji,
        productSize: o.product.size,
        productPrice: o.product.price,
      }))}
      isTomorrowPaused={!!tomorrowPause}
      vacations={vacations.map(v => ({
        id: v.id,
        startDate: v.startDate.toISOString(),
        endDate: v.endDate.toISOString(),
      }))}
      pauses={pauses.map(p => ({
        id: p.id,
        pauseDate: p.pauseDate.toISOString(),
      }))}
      deliveries={deliveries}
      products={products}
    />
  );
}
