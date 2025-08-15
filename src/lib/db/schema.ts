import { pgTable, text, timestamp, uuid, integer, boolean, json, decimal, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Role enum
export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER', 
  STAFF: 'STAFF',
  CASHIER: 'CASHIER',
  CUSTOMER: 'CUSTOMER'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().$type<UserRoleType>(),
  branchId: uuid('branch_id').references(() => branches.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Branches table
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  deliveryZones: json('delivery_zones').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pizzas table
export const pizzas = pgTable('pizzas', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true).notNull(),
  branchId: uuid('branch_id').references(() => branches.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Toppings table
export const toppings = pgTable('toppings', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  category: text('category').notNull(), // e.g., 'meat', 'vegetable', 'cheese'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pizza-toppings many-to-many relationship
export const pizzaToppings = pgTable('pizza_toppings', {
  pizzaId: uuid('pizza_id').references(() => pizzas.id).notNull(),
  toppingId: uuid('topping_id').references(() => toppings.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.pizzaId, table.toppingId] }),
}));

// Orders table
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').references(() => users.id).notNull(),
  branchId: uuid('branch_id').references(() => branches.id).notNull(),
  status: text('status').notNull().default('pending'), // pending, preparing, ready, out_for_delivery, delivered, cancelled
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text('delivery_address'),
  pickupTime: timestamp('pickup_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Order items table
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  pizzaId: uuid('pizza_id').references(() => pizzas.id).notNull(),
  quantity: integer('quantity').notNull(),
  customizations: json('customizations').$type<Record<string, any>>(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Order item toppings table
export const orderItemToppings = pgTable('order_item_toppings', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderItemId: uuid('order_item_id').references(() => orderItems.id).notNull(),
  toppingId: uuid('topping_id').references(() => toppings.id).notNull(),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Offers table
export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  discountType: text('discount_type').notNull(), // percentage, fixed_amount
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  orderId: uuid('order_id').references(() => orders.id),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  branch: one(branches, {
    fields: [users.branchId],
    references: [branches.id],
  }),
  orders: many(orders),
  notifications: many(notifications),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  users: many(users),
  pizzas: many(pizzas),
  orders: many(orders),
}));

export const pizzasRelations = relations(pizzas, ({ one, many }) => ({
  branch: one(branches, {
    fields: [pizzas.branchId],
    references: [branches.id],
  }),
  toppings: many(pizzaToppings),
  orderItems: many(orderItems),
}));

export const toppingsRelations = relations(toppings, ({ many }) => ({
  pizzas: many(pizzaToppings),
  orderItemToppings: many(orderItemToppings),
}));

export const pizzaToppingsRelations = relations(pizzaToppings, ({ one }) => ({
  pizza: one(pizzas, {
    fields: [pizzaToppings.pizzaId],
    references: [pizzas.id],
  }),
  topping: one(toppings, {
    fields: [pizzaToppings.toppingId],
    references: [toppings.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [orders.branchId],
    references: [branches.id],
  }),
  items: many(orderItems),
  notifications: many(notifications),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  pizza: one(pizzas, {
    fields: [orderItems.pizzaId],
    references: [pizzas.id],
  }),
  toppings: many(orderItemToppings),
}));

export const orderItemToppingsRelations = relations(orderItemToppings, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemToppings.orderItemId],
    references: [orderItems.id],
  }),
  topping: one(toppings, {
    fields: [orderItemToppings.toppingId],
    references: [toppings.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [notifications.orderId],
    references: [orders.id],
  }),
}));
