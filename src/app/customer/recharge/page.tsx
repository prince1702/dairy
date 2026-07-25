import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { RechargeWalletClientView } from "@/components/RechargeWalletClientView";

export default async function CustomerRechargePage() {
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

  // 2. Fetch payment requests (recharge requests)
  const paymentRequests = await prisma.paymentRequest.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <RechargeWalletClientView
      customer={customer}
      paymentRequests={paymentRequests.map((req) => ({
        id: req.id,
        amount: req.amount,
        screenshotUrl: req.screenshotUrl,
        status: req.status,
        createdAt: req.createdAt.toISOString(),
      }))}
    />
  );
}
