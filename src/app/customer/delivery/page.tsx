import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DeliveryHistoryClientView } from "@/components/DeliveryHistoryClientView";

export default async function CustomerDeliveryPage() {
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

  // 2. Fetch delivery records with deliveryPerson details
  const deliveries = await prisma.delivery.findMany({
    where: { customerId },
    include: {
      deliveryPerson: {
        select: { name: true, phone: true },
      },
    },
    orderBy: { deliveredAt: "desc" },
  });

  return (
    <DeliveryHistoryClientView
      customer={customer}
      deliveries={deliveries.map((del) => ({
        id: del.id,
        deliveredAt: del.deliveredAt.toISOString(),
        itemsSnapshot: del.itemsSnapshot,
        totalCost: del.totalCost,
        status: del.status,
        issueNote: del.issueNote,
        deliveryPersonName: del.deliveryPerson.name,
        deliveryPersonPhone: del.deliveryPerson.phone || "",
      }))}
    />
  );
}
