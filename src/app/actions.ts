"use server";

import { prisma } from "@/lib/db";
import { revalidatePath as nextRevalidatePath } from "next/cache";
import { getResolvedOrderForDate } from "@/lib/overrideHelper";

function revalidatePath(path: string) {
  try {
    nextRevalidatePath(path);
  } catch (err) {
    // Ignore static generation store errors when run outside Next.js runtime
  }
}

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
      // 1. Security check: Ensure customer is assigned to this delivery person
      const assignment = await tx.routeAssignment.findFirst({
        where: { customerId, deliveryPersonId },
      });
      if (!assignment) {
        throw new Error("Unauthorized: Customer is not assigned to your route.");
      }

      // 2. Duplicate delivery check for today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const existingDelivery = await tx.delivery.findFirst({
        where: {
          customerId,
          deliveryPersonId,
          deliveredAt: { gte: todayStart },
          status: "DELIVERED",
        },
      });
      if (existingDelivery) {
        throw new Error("Delivery has already been marked complete for this customer today.");
      }

      // 3. Get the resolved items for today's delivery (taking overrides, pauses, vacations into account)
      const today = new Date();
      const resolvedItems = await getResolvedOrderForDate(customerId, today, tx);

      if (resolvedItems.length === 0) {
        throw new Error("Customer has no active items for today (paused or on vacation)");
      }

      // Calculate total cost
      let totalCost = 0;
      const itemsList: string[] = [];
      for (const item of resolvedItems) {
        totalCost += item.price * item.quantity;
        itemsList.push(`${item.quantity}x ${item.name} (${item.size})`);
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
      const snapshotItems = resolvedItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
      }));

      const deliveryRecord = await tx.delivery.create({
        data: {
          customerId,
          deliveryPersonId,
          itemsSnapshot: JSON.stringify(snapshotItems),
          totalCost,
          walletTransactionId: auditLog.id,
          status: "DELIVERED",
        },
      });

      return { totalCost, auditLog, deliveryId: deliveryRecord.id };
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

// 10. Manager / SubAdmin creates a new delivery route
export async function createRoute(name: string, description?: string, subAdminId?: string) {
  try {
    const existing = await prisma.route.findUnique({ where: { name } });
    if (existing) return { success: false, error: "A route with this name already exists." };

    const route = await prisma.route.create({
      data: {
        name,
        description: description || null,
        subAdminId: subAdminId || null,
      },
    });

    revalidatePath("/manager");
    revalidatePath("/subadmin");
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

// 12a. Manager updates an existing route (name & description)
export async function updateRoute(routeId: string, name: string, description?: string) {
  try {
    const existing = await prisma.route.findFirst({
      where: {
        name,
        id: { not: routeId },
      },
    });
    if (existing) return { success: false, error: "Another route with this name already exists." };

    const route = await prisma.route.update({
      where: { id: routeId },
      data: {
        name,
        description: description || null,
      },
    });

    revalidatePath("/manager");
    revalidatePath("/subadmin");
    revalidatePath("/delivery");
    return { success: true, route };
  } catch (err: any) {
    console.error("updateRoute error:", err);
    return { success: false, error: err.message };
  }
}

// 12b. Manager deletes a route (cascades assignments)
export async function deleteRoute(routeId: string) {
  try {
    await prisma.route.delete({
      where: { id: routeId },
    });

    revalidatePath("/manager");
    revalidatePath("/subadmin");
    revalidatePath("/delivery");
    return { success: true };
  } catch (err: any) {
    console.error("deleteRoute error:", err);
    return { success: false, error: err.message };
  }
}


// 13. Cutoff Time check helper
function checkCutoff(targetDate: Date) {
  const cutoffDate = new Date(targetDate);
  cutoffDate.setDate(cutoffDate.getDate() - 1);
  cutoffDate.setHours(22, 0, 0, 0); // 10:00 PM local time
  
  const now = new Date();
  if (now.getTime() > cutoffDate.getTime()) {
    throw new Error(
      `Modifications for ${targetDate.toLocaleDateString()} are blocked. The cutoff time was 10:00 PM on ${cutoffDate.toLocaleDateString()}.`
    );
  }
}

// 14. Upsert Tomorrow's Order Override (Single-Day Quantity Modify / Add / Remove)
export async function upsertOrderOverride(
  customerId: string,
  productId: string,
  quantity: number,
  targetDateStr: string
) {
  try {
    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    // Validate cutoff time
    checkCutoff(targetDate);

    // Validate quantity constraints
    if (quantity < 0) {
      throw new Error("Quantity cannot be negative.");
    }
    if (quantity > 100) {
      throw new Error("Quantity cannot exceed 100 packets.");
    }

    const result = await prisma.$transaction(async (tx) => {
      // Upsert override
      const override = await tx.orderOverride.upsert({
        where: {
          customerId_productId_targetDate: {
            customerId,
            productId,
            targetDate,
          },
        },
        create: {
          customerId,
          productId,
          quantity,
          targetDate,
        },
        update: {
          quantity,
        },
      });

      // Audit Log
      await tx.subscriptionAuditLog.create({
        data: {
          customerId,
          actionType: "OVERRIDE_QTY",
          details: JSON.stringify({ productId, quantity, targetDate: targetDateStr }),
        },
      });

      return override;
    });

    revalidatePath("/customer");
    revalidatePath("/admin");
    revalidatePath("/subadmin");
    revalidatePath("/delivery");
    return { success: true, override: result };
  } catch (err: any) {
    console.error("upsertOrderOverride error:", err);
    return { success: false, error: err.message };
  }
}

// 15. Toggle Tomorrow's Pause State
export async function toggleTomorrowPause(
  customerId: string,
  targetDateStr: string,
  shouldPause: boolean
) {
  try {
    const targetDate = new Date(targetDateStr);
    targetDate.setHours(0, 0, 0, 0);

    // Validate cutoff time
    checkCutoff(targetDate);

    const result = await prisma.$transaction(async (tx) => {
      if (shouldPause) {
        const pause = await tx.dailyPause.upsert({
          where: {
            customerId_pauseDate: {
              customerId,
              pauseDate: targetDate,
            },
          },
          create: {
            customerId,
            pauseDate: targetDate,
          },
          update: {},
        });

        // Audit Log
        await tx.subscriptionAuditLog.create({
          data: {
            customerId,
            actionType: "PAUSE",
            details: JSON.stringify({ pauseDate: targetDateStr, action: "PAUSE" }),
          },
        });

        return pause;
      } else {
        await tx.dailyPause.deleteMany({
          where: {
            customerId,
            pauseDate: targetDate,
          },
        });

        // Audit Log
        await tx.subscriptionAuditLog.create({
          data: {
            customerId,
            actionType: "RESUME",
            details: JSON.stringify({ pauseDate: targetDateStr, action: "RESUME" }),
          },
        });

        return null;
      }
    });

    revalidatePath("/customer");
    revalidatePath("/admin");
    revalidatePath("/subadmin");
    revalidatePath("/delivery");
    return { success: true, pause: result };
  } catch (err: any) {
    console.error("toggleTomorrowPause error:", err);
    return { success: false, error: err.message };
  }
}

// 16. Enable Vacation Mode for multiple days
export async function setVacationMode(
  customerId: string,
  startDateStr: string,
  endDateStr: string
) {
  try {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < startDate) {
      throw new Error("Vacation end date cannot be before start date.");
    }

    // Check if start date cutoff has already passed
    checkCutoff(startDate);

    // Check for overlap with existing vacations
    const overlapping = await prisma.vacation.findFirst({
      where: {
        customerId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error("The selected vacation dates overlap with an existing vacation.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const vacation = await tx.vacation.create({
        data: {
          customerId,
          startDate,
          endDate,
        },
      });

      // Audit Log
      await tx.subscriptionAuditLog.create({
        data: {
          customerId,
          actionType: "VACATION_START",
          details: JSON.stringify({ startDate: startDateStr, endDate: endDateStr }),
        },
      });

      return vacation;
    });

    revalidatePath("/customer");
    revalidatePath("/admin");
    revalidatePath("/subadmin");
    revalidatePath("/delivery");
    return { success: true, vacation: result };
  } catch (err: any) {
    console.error("setVacationMode error:", err);
    return { success: false, error: err.message };
  }
}

// 17. Cancel / Resume Subscription before vacation end date
export async function cancelVacation(customerId: string, vacationId: string) {
  try {
    const vacation = await prisma.vacation.findUnique({
      where: { id: vacationId },
    });

    if (!vacation) {
      throw new Error("Vacation record not found.");
    }

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      if (vacation.startDate <= now) {
        // Cutoff validation for tomorrow's resumption:
        checkCutoff(tomorrow);
        
        // Shorten vacation to end today, so deliveries resume tomorrow
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const updated = await tx.vacation.update({
          where: { id: vacationId },
          data: {
            endDate: new Date(today.getTime() - 24 * 60 * 60 * 1000), // set to yesterday
          },
        });

        // Audit Log
        await tx.subscriptionAuditLog.create({
          data: {
            customerId,
            actionType: "VACATION_END",
            details: JSON.stringify({ vacationId, cancelledEarly: true, resumedDate: tomorrow.toISOString() }),
          },
        });

        return updated;
      } else {
        // Vacation hasn't started yet, so we can just delete it
        checkCutoff(vacation.startDate);

        await tx.vacation.delete({
          where: { id: vacationId },
        });

        // Audit Log
        await tx.subscriptionAuditLog.create({
          data: {
            customerId,
            actionType: "VACATION_END",
            details: JSON.stringify({ vacationId, cancelledEarly: true, deleted: true }),
          },
        });

        return null;
      }
    });

    revalidatePath("/customer");
    revalidatePath("/admin");
    revalidatePath("/subadmin");
    revalidatePath("/delivery");
    return { success: true, vacation: result };
  } catch (err: any) {
    console.error("cancelVacation error:", err);
    return { success: false, error: err.message };
  }
}



