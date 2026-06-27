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
