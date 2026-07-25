import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { TomorrowChangesClientView } from "@/components/TomorrowChangesClientView";

export default async function CustomerTomorrowPage() {
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

  // 2. Fetch baseline subscription items
  const activeSub = await prisma.subscription.findFirst({
    where: { customerId, status: "ACTIVE" },
    include: {
      items: true,
    },
  });

  const subscriptionItems = activeSub
    ? activeSub.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    : [];

  // 3. Fetch products
  const products = await prisma.product.findMany({
    where: { available: true },
    select: { id: true, name: true, emoji: true, category: true, price: true, size: true },
  });

  // 4. Fetch tomorrow's Daily Modifications (overrides, pauses, vacations)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const overrides = await prisma.orderOverride.findMany({
    where: { customerId, targetDate: tomorrow },
  });

  const tomorrowOverrides = overrides.map(o => ({
    productId: o.productId,
    quantity: o.quantity,
  }));

  const tomorrowPause = await prisma.dailyPause.findUnique({
    where: { customerId_pauseDate: { customerId, pauseDate: tomorrow } },
  });

  const vacations = await prisma.vacation.findMany({
    where: { customerId },
    orderBy: { startDate: "asc" },
  });

  return (
    <TomorrowChangesClientView
      customer={customer}
      products={products}
      subscriptionItems={subscriptionItems}
      tomorrowOverrides={tomorrowOverrides}
      isTomorrowPaused={!!tomorrowPause}
      vacations={vacations.map(v => ({
        id: v.id,
        startDate: v.startDate.toISOString(),
        endDate: v.endDate.toISOString(),
      }))}
    />
  );
}
