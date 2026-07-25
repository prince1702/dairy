import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CustomerLayoutClient } from "@/components/CustomerLayoutClient";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "CUSTOMER") {
    redirect("/login?error=Unauthorized");
  }

  const customerId = (session.user as any).id;

  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  });

  if (!customer) {
    redirect("/login?error=Unauthorized");
  }

  // Fetch unread notification count
  const unreadCount = await prisma.notification.count({
    where: { recipientId: customerId, isRead: false },
  });

  // Fetch current wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { userId: customerId },
    select: { balance: true },
  });

  return (
    <CustomerLayoutClient
      customer={customer}
      walletBalance={wallet?.balance || 0}
      unreadNotifications={unreadCount}
    >
      {children}
    </CustomerLayoutClient>
  );
}
