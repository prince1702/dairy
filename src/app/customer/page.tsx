import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CustomerDashboardClient } from "@/components/CustomerDashboardClient";

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

  // 2. Fetch customer wallet and transactions
  const wallet = await prisma.wallet.findUnique({
    where: { userId: customerId },
    include: {
      transactions: {
        orderBy: { timestamp: "desc" },
      },
    },
  });

  // 3. Fetch active subscription items
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

  // 4. Fetch available products
  const products = await prisma.product.findMany({
    where: { available: true },
    select: { id: true, name: true, emoji: true, category: true, price: true, size: true },
  });

  // 5. Fetch payment requests
  const paymentRequests = await prisma.paymentRequest.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });

  // 6. Fetch notifications
  const notifications = await prisma.notification.findMany({
    where: { recipientId: customerId },
    orderBy: { timestamp: "desc" },
  });

  // 7. Fetch delivery history
  const deliveries = await prisma.delivery.findMany({
    where: { customerId },
    orderBy: { deliveredAt: "desc" },
  });

  return (
    <>
      <DashboardHeader role="Customer" />
      <CustomerDashboardClient
        customer={customer}
        wallet={wallet}
        subscriptionItems={subscriptionItems}
        products={products}
        paymentRequests={paymentRequests}
        notifications={notifications}
        deliveries={deliveries}
      />
    </>
  );
}
