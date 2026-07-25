import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardClientView } from "@/components/DashboardClientView";

export default async function CustomerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "CUSTOMER") {
    redirect("/login?error=Unauthorized");
  }

  const customerId = (session.user as any).id;

  // 1. Fetch customer details
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true, address: true },
  });

  if (!customer) {
    redirect("/login?error=Unauthorized");
  }

  // 2. Fetch customer wallet balance & pending recharge requests count/sum
  const wallet = await prisma.wallet.findUnique({
    where: { userId: customerId },
    select: { balance: true },
  });

  const pendingRecharges = await prisma.paymentRequest.findMany({
    where: { customerId, status: "PENDING" },
    select: { amount: true },
  });

  const pendingRechargeCount = pendingRecharges.length;
  const pendingRechargeSum = pendingRecharges.reduce((sum, req) => sum + req.amount, 0);

  // 3. Fetch active subscription baseline items
  const activeSub = await prisma.subscription.findFirst({
    where: { customerId, status: "ACTIVE" },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  const baselineItemsCount = activeSub ? activeSub.items.length : 0;
  const subscriptionItems = activeSub
    ? activeSub.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        productName: item.product.name,
        productEmoji: item.product.emoji,
        productSize: item.product.size,
      }))
    : [];

  // 4. Fetch tomorrow's data (date check)
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

  const vacations = await prisma.vacation.findMany({
    where: { customerId },
    orderBy: { startDate: "asc" },
  });

  const isTomorrowPaused = !!tomorrowPause;
  
  const isTomorrowOnVacation = vacations.some((v) => {
    const start = new Date(v.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(v.endDate);
    end.setHours(0, 0, 0, 0);
    return tomorrow >= start && tomorrow <= end;
  });

  // 5. Calculate monthly spending (deliveries in current calendar month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyDeliveries = await prisma.delivery.findMany({
    where: {
      customerId,
      deliveredAt: { gte: startOfMonth },
      status: "DELIVERED",
    },
    select: { totalCost: true },
  });

  const monthlySpending = monthlyDeliveries.reduce((sum, d) => sum + d.totalCost, 0);

  // 6. Today's Delivery Status
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayDelivery = await prisma.delivery.findFirst({
    where: {
      customerId,
      deliveredAt: { gte: todayStart },
    },
    orderBy: { deliveredAt: "desc" },
    select: { status: true, deliveredAt: true },
  });

  const todayDeliveryStatus = todayDelivery
    ? todayDelivery.status === "DELIVERED"
      ? "Delivered ✅"
      : "Issue Reported ⚠️"
    : "Pending Delivery 🕒";

  // 7. Active Products Count
  const activeProductsCount = await prisma.product.count({
    where: { available: true },
  });

  // 8. Recent 5 Notifications
  const notifications = await prisma.notification.findMany({
    where: { recipientId: customerId },
    orderBy: { timestamp: "desc" },
    take: 5,
  });

  // 9. Recent 5 Deliveries
  const deliveries = await prisma.delivery.findMany({
    where: { customerId },
    orderBy: { deliveredAt: "desc" },
    take: 5,
  });

  // Fetch all product details for mapping
  const products = await prisma.product.findMany({
    where: { available: true },
    select: { id: true, name: true, emoji: true, category: true, price: true, size: true },
  });

  return (
    <DashboardClientView
      customer={customer}
      walletBalance={wallet?.balance || 0}
      pendingRechargeCount={pendingRechargeCount}
      pendingRechargeSum={pendingRechargeSum}
      baselineItemsCount={baselineItemsCount}
      subscriptionItems={subscriptionItems}
      tomorrowOverrides={tomorrowOverrides.map(o => ({
        productId: o.productId,
        quantity: o.quantity,
        productName: o.product.name,
        productEmoji: o.product.emoji,
      }))}
      isTomorrowPaused={isTomorrowPaused}
      isTomorrowOnVacation={isTomorrowOnVacation}
      monthlySpending={monthlySpending}
      todayDeliveryStatus={todayDeliveryStatus}
      activeProductsCount={activeProductsCount}
      notifications={notifications}
      deliveries={deliveries}
      products={products}
    />
  );
}
