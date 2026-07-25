import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { NotificationsClientView } from "@/components/NotificationsClientView";

export default async function CustomerNotificationsPage() {
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

  // 2. Fetch notifications
  const notifications = await prisma.notification.findMany({
    where: { recipientId: customerId },
    orderBy: { timestamp: "desc" },
  });

  return (
    <NotificationsClientView
      customer={customer}
      notifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        timestamp: n.timestamp.toISOString(),
      }))}
    />
  );
}
