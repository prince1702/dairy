"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 1. Customer creates a wallet recharge request
export async function createPaymentRequest(
  customerId: string,
  amount: number,
  screenshotUrl: string
) {
  try {
    const request = await prisma.paymentRequest.create({
      data: {
        customerId,
        amount,
        screenshotUrl,
        status: "PENDING",
      },
    });

    revalidatePath("/customer");
    return { success: true, request };
  } catch (err: any) {
    console.error("createPaymentRequest error:", err);
    return { success: false, error: err.message };
  }
}

// 2. Manager approves wallet recharge request (Transaction Safe)
export async function approvePaymentRequest(
  requestId: string,
  managerId: string
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Fetch request details
      const request = await tx.paymentRequest.findUnique({
        where: { id: requestId },
        include: { customer: { include: { wallet: true } } },
      });

      if (!request) throw new Error("Payment request not found");
      if (request.status !== "PENDING") throw new Error("Request already processed");

      const customerWallet = request.customer.wallet;
      if (!customerWallet) throw new Error("Customer does not have a wallet");

      const beforeBalance = customerWallet.balance;
      const afterBalance = beforeBalance + request.amount;

      // Update wallet balance
      await tx.wallet.update({
        where: { id: customerWallet.id },
        data: { balance: afterBalance },
      });

      // Log wallet transaction audit trail
      await tx.walletTransaction.create({
        data: {
          walletId: customerWallet.id,
          beforeBalance,
          afterBalance,
          changeAmount: request.amount,
          source: "RECHARGE",
          description: `Approved payment receipt request #${requestId}`,
        },
      });

      // Update payment request status
      const updatedRequest = await tx.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedById: managerId,
        },
      });

      // Send simulated in-app notification
      await tx.notification.create({
        data: {
          recipientId: request.customerId,
          title: "Wallet Recharged ✅",
          message: `Your payment recharge of ₹${request.amount} has been verified and credited to your wallet.`,
          type: "WALLET",
        },
      });

      return updatedRequest;
    });

    revalidatePath("/manager");
    revalidatePath("/customer");
    return { success: true, request: result };
  } catch (err: any) {
    console.error("approvePaymentRequest error:", err);
    return { success: false, error: err.message };
  }
}

// 3. Manager rejects payment request
export async function rejectPaymentRequest(
  requestId: string,
  managerId: string
) {
  try {
    const request = await prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedById: managerId,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        recipientId: request.customerId,
        title: "Recharge Request Rejected ❌",
        message: `Your recharge request of ₹${request.amount} was rejected. Please verify your payment screenshot.`,
        type: "WALLET",
      },
    });

    revalidatePath("/manager");
    revalidatePath("/customer");
    return { success: true, request };
  } catch (err: any) {
    console.error("rejectPaymentRequest error:", err);
    return { success: false, error: err.message };
  }
}

// 4. Update Customer Subscriptions
export async function updateSubscription(
  customerId: string,
  items: { productId: string; quantity: number }[]
) {
  try {
    const activeSubscription = await prisma.subscription.findFirst({
      where: { customerId, status: "ACTIVE" },
    });

    if (activeSubscription) {
      // Clear existing items and create new ones
      await prisma.subscriptionItem.deleteMany({
        where: { subscriptionId: activeSubscription.id },
      });

      await prisma.subscriptionItem.createMany({
        data: items.map((item) => ({
          subscriptionId: activeSubscription.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    } else {
      // Create new subscription
      const newSub = await prisma.subscription.create({
        data: {
          customerId,
          status: "ACTIVE",
        },
      });

      await prisma.subscriptionItem.createMany({
        data: items.map((item) => ({
          subscriptionId: newSub.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    }

    revalidatePath("/customer");
    return { success: true };
  } catch (err: any) {
    console.error("updateSubscription error:", err);
    return { success: false, error: err.message };
  }
}

// 5. Complete Delivery: Transaction Safe Wallet Deduction + Silent Delivery Notification
export async function completeDelivery(
  deliveryPersonId: string,
  customerId: string
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get the customer's active subscription and items
      const subscription = await tx.subscription.findFirst({
        where: { customerId, status: "ACTIVE" },
        include: { items: { include: { product: true } } },
      });

      if (!subscription || subscription.items.length === 0) {
        throw new Error("No active subscription found for customer");
      }

      // Calculate total cost
      let totalCost = 0;
      const itemsList: string[] = [];
      for (const item of subscription.items) {
        totalCost += item.product.price * item.quantity;
        itemsList.push(`${item.quantity}x ${item.product.name} (${item.product.size})`);
      }

      // Fetch customer wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: customerId },
      });

      if (!wallet) throw new Error("Customer wallet not found");

      const beforeBalance = wallet.balance;
      const afterBalance = beforeBalance - totalCost;

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: afterBalance },
      });

      // Log wallet transaction audit trail
      const auditLog = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          beforeBalance,
          afterBalance,
          changeAmount: -totalCost,
          source: "DELIVERY_DEDUCTION",
          description: `Daily delivery deduction for: ${itemsList.join(", ")}`,
        },
      });

      // Send silent delivery notification
      const deliveryTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      await tx.notification.create({
        data: {
          recipientId: customerId,
          title: "✅ Silent Delivery Complete!",
          message: `Your order [${itemsList.join(", ")}] was delivered at ${deliveryTime}. ₹${totalCost.toFixed(
            2
          )} was deducted.`,
          type: "DELIVERY",
        },
      });

      // Create permanent Delivery record
      const snapshotItems = subscription.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        size: item.product.size,
        price: item.product.price,
      }));

      await tx.delivery.create({
        data: {
          customerId,
          deliveryPersonId,
          itemsSnapshot: JSON.stringify(snapshotItems),
          totalCost,
          walletTransactionId: auditLog.id,
          status: "DELIVERED",
        },
      });

      return { totalCost, auditLog };
    });

    revalidatePath("/delivery");
    revalidatePath("/customer");
    return { success: true, details: result };
  } catch (err: any) {
    console.error("completeDelivery error:", err);
    return { success: false, error: err.message };
  }
}

// 6. Public Customer Registration
export async function registerCustomer(
  name: string,
  email: string,
  phone: string,
  address: string,
  password: string
) {
  try {
    const bcrypt = await import("bcryptjs");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          address: address || null,
          password: hashedPassword,
          role: "CUSTOMER",
          status: "ACTIVE",
        },
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
        },
      });
    });

    return { success: true };
  } catch (err: any) {
    console.error("registerCustomer error:", err);
    return { success: false, error: err.message };
  }
}

// 7. Admin creates a staff user (MANAGER, DELIVERY_PERSON, or SUB_ADMIN only)
export async function createStaffUser(
  name: string,
  email: string,
  password: string,
  role: string,
  phone: string
) {
  try {
    const allowedRoles = ["MANAGER", "DELIVERY_PERSON", "SUB_ADMIN"];
    if (!allowedRoles.includes(role)) {
      return { success: false, error: "Invalid role. Only MANAGER, DELIVERY_PERSON, and SUB_ADMIN can be created from this panel." };
    }

    const bcrypt = await import("bcryptjs");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role,
        status: "ACTIVE",
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("createStaffUser error:", err);
    return { success: false, error: err.message };
  }
}

// 8. Admin toggles user active/inactive status (soft disable — preserves referential integrity)
export async function toggleUserStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User not found." };

    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    revalidatePath("/admin");
    return { success: true, newStatus };
  } catch (err: any) {
    console.error("toggleUserStatus error:", err);
    return { success: false, error: err.message };
  }
}

// 9. Delivery person reports a delivery issue (does not deduct wallet balance)
export async function reportDeliveryIssue(
  deliveryPersonId: string,
  customerId: string,
  issueNote: string
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const deliveryRecord = await tx.delivery.create({
        data: {
          customerId,
          deliveryPersonId,
          itemsSnapshot: "[]",
          totalCost: 0,
          status: "ISSUE_REPORTED",
          issueNote,
        },
      });

      // Find customer's route manager to notify
      const assignment = await tx.routeAssignment.findFirst({
        where: { customerId },
        include: { route: true },
      });

      const managerId = assignment?.route?.managerId;
      if (managerId) {
        const customerUser = await tx.user.findUnique({ where: { id: customerId } });
        await tx.notification.create({
          data: {
            recipientId: managerId,
            title: "Delivery Issue Reported",
            message: `Issue reported for ${customerUser?.name || "customer"}: ${issueNote}`,
            type: "SYSTEM",
          },
        });
      }

      return deliveryRecord;
    });

    revalidatePath("/delivery");
    revalidatePath("/manager");
    return { success: true, details: result };
  } catch (err: any) {
    console.error("reportDeliveryIssue error:", err);
    return { success: false, error: err.message };
  }
}

// 10. Manager creates a new delivery route
export async function createRoute(name: string, description?: string) {
  try {
    const existing = await prisma.route.findUnique({ where: { name } });
    if (existing) return { success: false, error: "A route with this name already exists." };

    const route = await prisma.route.create({
      data: { name, description: description || null },
    });

    revalidatePath("/manager");
    return { success: true, route };
  } catch (err: any) {
    console.error("createRoute error:", err);
    return { success: false, error: err.message };
  }
}

// 11. Manager assigns customer and delivery person to a route
export async function assignCustomerToRoute(
  routeId: string,
  customerId: string,
  deliveryPersonId: string,
  sequence: number
) {
  try {
    // Check if customer already has a route assignment and remove it or update
    await prisma.routeAssignment.deleteMany({
      where: { customerId },
    });

    const assignment = await prisma.routeAssignment.create({
      data: {
        routeId,
        customerId,
        deliveryPersonId,
        sequence: Number(sequence) || 0,
      },
    });

    revalidatePath("/manager");
    revalidatePath("/delivery");
    return { success: true, assignment };
  } catch (err: any) {
    console.error("assignCustomerToRoute error:", err);
    return { success: false, error: err.message };
  }
}

// 12. Manager removes a route assignment
export async function removeRouteAssignment(assignmentId: string) {
  try {
    await prisma.routeAssignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath("/manager");
    revalidatePath("/delivery");
    return { success: true };
  } catch (err: any) {
    console.error("removeRouteAssignment error:", err);
    return { success: false, error: err.message };
  }
}


