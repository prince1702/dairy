"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Helper to update customer profile fields
export async function updateCustomerProfile(
  customerId: string,
  data: { name: string; phone: string; address: string }
) {
  try {
    const updated = await prisma.user.update({
      where: { id: customerId },
      data: {
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
      },
    });

    revalidatePath("/customer");
    return { success: true, user: updated };
  } catch (err: any) {
    console.error("updateCustomerProfile error:", err);
    return { success: false, error: err.message || "Failed to update profile." };
  }
}

// Helper to change customer password
export async function changeCustomerPassword(
  customerId: string,
  currentPass: string,
  newPass: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) {
      return { success: false, error: "Incorrect current password." };
    }

    if (newPass.length < 8) {
      return { success: false, error: "New password must be at least 8 characters." };
    }

    const hashed = await bcrypt.hash(newPass, 10);

    await prisma.user.update({
      where: { id: customerId },
      data: { password: hashed },
    });

    return { success: true };
  } catch (err: any) {
    console.error("changeCustomerPassword error:", err);
    return { success: false, error: err.message || "Failed to change password." };
  }
}

// Mark all notifications as read for a customer
export async function markNotificationsRead(customerId: string) {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: customerId, isRead: false },
      data: { isRead: true },
    });

    revalidatePath("/customer");
    return { success: true };
  } catch (err: any) {
    console.error("markNotificationsRead error:", err);
    return { success: false, error: err.message || "Failed to mark notifications as read." };
  }
}

// Delete a notification
export async function deleteNotification(customerId: string, notificationId: string) {
  try {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        recipientId: customerId,
      },
    });

    revalidatePath("/customer");
    return { success: true };
  } catch (err: any) {
    console.error("deleteNotification error:", err);
    return { success: false, error: err.message || "Failed to delete notification." };
  }
}

// Submit a support ticket (Simulated via System Notification to Manager/Admin)
export async function submitSupportTicket(
  customerId: string,
  subject: string,
  message: string
) {
  try {
    // Find customer details
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { name: true, email: true },
    });

    if (!customer) {
      return { success: false, error: "Customer not found." };
    }

    // Find any active MANAGER or ADMIN user
    const recipient = await prisma.user.findFirst({
      where: {
        role: { in: ["MANAGER", "ADMIN"] },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (recipient) {
      // Send a system notification to the manager or admin
      await prisma.notification.create({
        data: {
          recipientId: recipient.id,
          title: `Support Ticket: ${subject}`,
          message: `Raised by ${customer.name} (${customer.email}): ${message}`,
          type: "SYSTEM",
        },
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("submitSupportTicket error:", err);
    return { success: false, error: err.message || "Failed to submit support ticket." };
  }
}
