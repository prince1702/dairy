import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { WalletClientView } from "@/components/WalletClientView";

export default async function CustomerWalletPage() {
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

  // 2. Fetch customer wallet and transactions
  const wallet = await prisma.wallet.findUnique({
    where: { userId: customerId },
    include: {
      transactions: {
        orderBy: { timestamp: "desc" },
      },
    },
  });

  // 3. Fetch payment (recharge) requests
  const paymentRequests = await prisma.paymentRequest.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <WalletClientView
      customer={customer}
      wallet={wallet}
      paymentRequests={paymentRequests}
    />
  );
}
