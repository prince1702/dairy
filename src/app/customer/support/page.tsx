import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SupportClientView } from "@/components/SupportClientView";

export default async function CustomerSupportPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "CUSTOMER") {
    redirect("/login?error=Unauthorized");
  }

  const customerId = (session.user as any).id;

  // Fetch basic customer details
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true },
  });

  if (!customer) {
    redirect("/login?error=Unauthorized");
  }

  return (
    <SupportClientView customer={customer} />
  );
}
