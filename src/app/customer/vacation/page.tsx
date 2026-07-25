import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { VacationModeClientView } from "@/components/VacationModeClientView";

export default async function CustomerVacationPage() {
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

  // 2. Fetch vacation records
  const vacations = await prisma.vacation.findMany({
    where: { customerId },
    orderBy: { startDate: "asc" },
  });

  return (
    <VacationModeClientView
      customer={customer}
      vacations={vacations.map(v => ({
        id: v.id,
        startDate: v.startDate.toISOString(),
        endDate: v.endDate.toISOString(),
      }))}
    />
  );
}
