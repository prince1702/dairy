import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  // Clear existing data
  await prisma.paymentRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dailyDemandForecast.deleteMany();
  await prisma.routeAssignment.deleteMany();
  await prisma.route.deleteMany();
  await prisma.subscriptionItem.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const deliveryPassword = await bcrypt.hash("delivery123", 10);
  const customerPassword = await bcrypt.hash("customer123", 10);
  const subAdminPassword = await bcrypt.hash("subadmin123", 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@bhagwati.com",
      password: adminPassword,
      name: "Harsh Bhai (Admin)",
      phone: "+91 9999999999",
      address: "Bhagwati Enterprise HQ",
      role: "ADMIN",
    },
  });

  const subAdmin = await prisma.user.create({
    data: {
      email: "subadmin@bhagwati.com",
      password: subAdminPassword,
      name: "Vendor Owner",
      phone: "+91 8888888888",
      address: "Vendor Shop No. 1",
      role: "SUB_ADMIN",
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@bhagwati.com",
      password: managerPassword,
      name: "Ramesh Kumar (Manager)",
      phone: "+91 7777777777",
      address: "Operational Hub 1",
      role: "MANAGER",
    },
  });

  const delivery = await prisma.user.create({
    data: {
      email: "delivery@bhagwati.com",
      password: deliveryPassword,
      name: "Suresh Patil (Delivery)",
      phone: "+91 6666666666",
      address: "Delivery Hub A",
      role: "DELIVERY_PERSON",
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: "customer@bhagwati.com",
      password: customerPassword,
      name: "Amit Patel (Customer)",
      phone: "+91 9876543210",
      address: "Flat 402, Sunshine Apartments, Ahmedabad",
      role: "CUSTOMER",
    },
  });

  console.log("Users created successfully.");

  // 2. Create Wallet for Customer with initial balance of ₹500
  const wallet = await prisma.wallet.create({
    data: {
      userId: customer.id,
      balance: 500.0,
    },
  });

  // Create initial transaction audit log
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      beforeBalance: 0.0,
      afterBalance: 500.0,
      changeAmount: 500.0,
      source: "RECHARGE",
      description: "Initial wallet setup balance",
    },
  });

  console.log("Wallet and initial transaction log created for Customer.");

  // 3. Create Products
  const p1 = await prisma.product.create({
    data: {
      name: "Bhagwati Milk (Standard)",
      emoji: "🥛",
      category: "Milk",
      price: 30.0,
      size: "500ml",
      description: "Fresh farm-sourced cow milk, pasteurized and standardized.",
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Bhagwati Milk (Full Cream)",
      emoji: "🥛",
      category: "Milk",
      price: 58.0,
      size: "1L",
      description: "Rich full-cream milk, ideal for families and making sweets.",
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: "Bhagwati Dahi (Fresh Curd)",
      emoji: "🥣",
      category: "Curd",
      price: 40.0,
      size: "250g",
      description: "Thick, creamy, and delicious curd made from pure milk.",
    },
  });

  const p4 = await prisma.product.create({
    data: {
      name: "Bhagwati Paneer (Fresh Cottage Cheese)",
      emoji: "🧀",
      category: "Paneer",
      price: 90.0,
      size: "200g",
      description: "Soft and fresh paneer, rich in protein.",
    },
  });

  console.log("Products created successfully.");

  // 4. Create a default Route & RouteAssignment
  const route = await prisma.route.create({
    data: {
      name: "Route A - Satellite & Vasna Area",
      description: "Main early morning delivery route cover Vasna, Satellite and nearby zones.",
      managerId: manager.id,
    },
  });

  await prisma.routeAssignment.create({
    data: {
      routeId: route.id,
      deliveryPersonId: delivery.id,
      customerId: customer.id,
      sequence: 1,
    },
  });

  console.log("Route & RouteAssignment created successfully.");

  // 5. Create a default Subscription for Customer
  const subscription = await prisma.subscription.create({
    data: {
      customerId: customer.id,
      status: "ACTIVE",
    },
  });

  await prisma.subscriptionItem.create({
    data: {
      subscriptionId: subscription.id,
      productId: p1.id,
      quantity: 2, // 2 packets of 500ml milk
    },
  });

  await prisma.subscriptionItem.create({
    data: {
      subscriptionId: subscription.id,
      productId: p3.id,
      quantity: 1, // 1 pack of curd
    },
  });

  console.log("Default Subscription created for Customer.");
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
