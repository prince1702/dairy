import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SubscriptionClientView } from "@/components/SubscriptionClientView";

export default async function CustomerSubscriptionPage() {
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

  // 2. Fetch active subscription items
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

  // 3. Fetch available products
  const products = await prisma.product.findMany({
    where: { available: true },
    select: { id: true, name: true, emoji: true, category: true, price: true, size: true },
  });

  return (
    <SubscriptionClientView
      customer={customer}
      subscriptionItems={subscriptionItems}
      products={products}
    />
  );
}
