import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProfileClientView } from "@/components/ProfileClientView";

export default async function CustomerProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "CUSTOMER") {
    redirect("/login?error=Unauthorized");
  }

  const customerId = (session.user as any).id;

  // Fetch customer profile details
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

  // Fetch subscription audit logs (recent activity timeline)
  const auditLogs = await prisma.subscriptionAuditLog.findMany({
    where: { customerId },
    orderBy: { timestamp: "desc" },
    take: 10,
  });

  return (
    <ProfileClientView
      customer={{
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        address: customer.address || "",
      }}
      auditLogs={auditLogs.map((log) => ({
        id: log.id,
        actionType: log.actionType,
        details: log.details,
        timestamp: log.timestamp.toISOString(),
      }))}
    />
  );
}
