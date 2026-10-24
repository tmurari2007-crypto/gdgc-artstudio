import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import { User } from '../models/User.js';
import { Painting } from '../models/Painting.js';
import { Order } from '../models/Order.js';
import { WallBooking } from '../models/WallBooking.js';
import { PotteryRequest } from '../models/PotteryRequest.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear collections between tests for isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

describe('Art Studio Backend API Suite', () => {
  // Helper to register and get cookie
  const registerCustomer = async (name = 'Jane Doe', email = 'jane@example.com', password = 'password123') => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password });
    const cookie = res.headers['set-cookie'];
    return { user: res.body.user, cookie, token: res.body.token };
  };

  const createAdmin = async (name = 'Admin User', email = 'admin@studio.com', password = 'adminPassword123') => {
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    return { user: admin, cookie: loginRes.headers['set-cookie'], token: loginRes.body.token };
  };

  describe('1. Authentication and RBAC', () => {
    it('registers a customer successfully with customer role', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Alice Cooper',
        email: 'alice@art.com',
        password: 'securePassword123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user.password).toBeUndefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('logs in successfully and rejects invalid login', async () => {
      await registerCustomer('Bob', 'bob@art.com', 'mypassword123');

      // Valid login
      const validRes = await request(app).post('/api/auth/login').send({
        email: 'bob@art.com',
        password: 'mypassword123',
      });
      expect(validRes.status).toBe(200);
      expect(validRes.body.success).toBe(true);

      // Invalid login
      const invalidRes = await request(app).post('/api/auth/login').send({
        email: 'bob@art.com',
        password: 'wrongPassword',
      });
      expect(invalidRes.status).toBe(401);
      expect(invalidRes.body.success).toBe(false);
    });

    it('returns HTTP 401 for unauthenticated requests to protected routes', async () => {
      const res = await request(app).get('/api/orders/my');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns HTTP 403 when customer tries to access admin-only route', async () => {
      const customer = await registerCustomer();
      const res = await request(app)
        .post('/api/paintings')
        .set('Cookie', customer.cookie)
        .send({
          title: 'Unauthorized Painting',
          description: 'Test',
          price: 500,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Painting Purchases and Concurrency Protection', () => {
    it('customer purchases an available painting successfully', async () => {
      const customer = await registerCustomer();
      const painting = await Painting.create({
        title: 'Sunset over Sea',
        description: 'Oil on canvas',
        price: 750,
        isAvailable: true,
      });

      const res = await request(app)
        .post('/api/orders/purchase')
        .set('Cookie', customer.cookie)
        .send({ paintingId: painting._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order.status).toBe('placed');
      expect(res.body.order.purchasePrice).toBe(750);

      // Verify painting is marked unavailable
      const updatedPainting = await Painting.findById(painting._id);
      expect(updatedPainting.isAvailable).toBe(false);
    });

    it('rejects a second purchase of the same painting with HTTP 409', async () => {
      const customer1 = await registerCustomer('Customer One', 'c1@test.com', 'password123');
      const customer2 = await registerCustomer('Customer Two', 'c2@test.com', 'password123');

      const painting = await Painting.create({
        title: 'Unique Masterpiece',
        description: 'Acrylic',
        price: 1200,
        isAvailable: true,
      });

      // Customer 1 buys it
      const res1 = await request(app)
        .post('/api/orders/purchase')
        .set('Cookie', customer1.cookie)
        .send({ paintingId: painting._id.toString() });
      expect(res1.status).toBe(201);

      // Customer 2 tries to buy the same painting
      const res2 = await request(app)
        .post('/api/orders/purchase')
        .set('Cookie', customer2.cookie)
        .send({ paintingId: painting._id.toString() });
      expect(res2.status).toBe(409);
      expect(res2.body.message).toContain('no longer available');
    });

    it('concurrent purchases result in at most one successful order', async () => {
      const customerA = await registerCustomer('Buyer A', 'a@test.com', 'pass1234');
      const customerB = await registerCustomer('Buyer B', 'b@test.com', 'pass1234');

      const painting = await Painting.create({
        title: 'Rare Impasto',
        description: 'Oil',
        price: 900,
        isAvailable: true,
      });

      // Fire both purchase requests simultaneously
      const [resA, resB] = await Promise.all([
        request(app)
          .post('/api/orders/purchase')
          .set('Cookie', customerA.cookie)
          .send({ paintingId: painting._id.toString() }),
        request(app)
          .post('/api/orders/purchase')
          .set('Cookie', customerB.cookie)
          .send({ paintingId: painting._id.toString() }),
      ]);

      const statuses = [resA.status, resB.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);

      // Exactly one order exists in DB
      const orders = await Order.find({ painting: painting._id });
      expect(orders.length).toBe(1);
    });

    it('cancelling an eligible order releases the painting back to available', async () => {
      const customer = await registerCustomer();
      const painting = await Painting.create({
        title: 'Reversible Horizon',
        description: 'Oil',
        price: 550,
        isAvailable: false,
      });

      const order = await Order.create({
        customer: customer.user.id,
        painting: painting._id,
        purchasePrice: 550,
        status: 'placed',
      });

      const cancelRes = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Cookie', customer.cookie);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.order.status).toBe('cancelled');

      const releasedPainting = await Painting.findById(painting._id);
      expect(releasedPainting.isAvailable).toBe(true);
    });

    it('returns HTTP 404 when customer attempts to cancel another customer order', async () => {
      const customer1 = await registerCustomer('C1', 'c11@test.com', 'pass1234');
      const customer2 = await registerCustomer('C2', 'c22@test.com', 'pass1234');

      const painting = await Painting.create({
        title: 'Other Art',
        description: 'Art',
        price: 300,
        isAvailable: false,
      });

      const order1 = await Order.create({
        customer: customer1.user.id,
        painting: painting._id,
        purchasePrice: 300,
        status: 'placed',
      });

      // Customer 2 tries to cancel Customer 1's order
      const res = await request(app)
        .put(`/api/orders/${order1._id}/cancel`)
        .set('Cookie', customer2.cookie);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('3. Wall-Painting Bookings and Date Uniqueness', () => {
    // Generate valid future date helper (e.g. +14 days)
    const getFutureDateStr = (daysAhead) => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    it('rejects booking date outside 7 to 90 days range', async () => {
      const customer = await registerCustomer();

      // Too soon (3 days)
      const resTooSoon = await request(app)
        .post('/api/bookings')
        .set('Cookie', customer.cookie)
        .send({
          bookingDate: getFutureDateStr(3),
          wallSize: 100,
          address: '123 Studio Way',
        });
      expect(resTooSoon.status).toBe(400);
      expect(resTooSoon.body.message).toContain('between 7 and 90 days');

      // Too far (100 days)
      const resTooFar = await request(app)
        .post('/api/bookings')
        .set('Cookie', customer.cookie)
        .send({
          bookingDate: getFutureDateStr(100),
          wallSize: 100,
          address: '123 Studio Way',
        });
      expect(resTooFar.status).toBe(400);
      expect(resTooFar.body.message).toContain('between 7 and 90 days');
    });

    it('rejects invalid wall sizes (<10 or >500)', async () => {
      const customer = await registerCustomer();
      const validDate = getFutureDateStr(15);

      const resSmall = await request(app)
        .post('/api/bookings')
        .set('Cookie', customer.cookie)
        .send({
          bookingDate: validDate,
          wallSize: 5,
          address: '123 Studio Way',
        });
      expect(resSmall.status).toBe(400);
      expect(resSmall.body.message).toContain('between 10 and 500');

      const resLarge = await request(app)
        .post('/api/bookings')
        .set('Cookie', customer.cookie)
        .send({
          bookingDate: validDate,
          wallSize: 600,
          address: '123 Studio Way',
        });
      expect(resLarge.status).toBe(400);
      expect(resLarge.body.message).toContain('between 10 and 500');
    });

    it('enforces one active booking per date and rejects duplicate bookings', async () => {
      const customer1 = await registerCustomer('Client 1', 'client1@test.com', 'pass1234');
      const customer2 = await registerCustomer('Client 2', 'client2@test.com', 'pass1234');
      const bookingDate = getFutureDateStr(20);

      // Client 1 books date
      const res1 = await request(app)
        .post('/api/bookings')
        .set('Cookie', customer1.cookie)
        .send({
          bookingDate,
          wallSize: 50,
          address: '456 Art Blvd',
        });
      expect(res1.status).toBe(201);
      expect(res1.body.booking.totalPrice).toBe(50 * 25); // wallSize * 25

      // Client 2 attempts to book the same date -> HTTP 409
      const res2 = await request(app)
        .post('/api/bookings')
        .set('Cookie', customer2.cookie)
        .send({
          bookingDate,
          wallSize: 80,
          address: '789 Mural Lane',
        });
      expect(res2.status).toBe(409);
      expect(res2.body.message).toContain('already been booked');
    });

    it('enforces 3-day cancellation cutoff rule', async () => {
      const customer = await registerCustomer();

      // Create a booking only 2 days away directly in DB (simulating time passing)
      const nearDate = getFutureDateStr(2);
      const booking = await WallBooking.create({
        customer: customer.user.id,
        bookingDate: nearDate,
        wallSize: 100,
        address: 'Downtown Studio',
        ratePerSqFt: 25,
        totalPrice: 2500,
        status: 'requested',
      });

      const cancelRes = await request(app)
        .put(`/api/bookings/${booking._id}/cancel`)
        .set('Cookie', customer.cookie);

      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.message).toContain('3 days before');
    });
  });

  describe('4. Custom Pottery Requests and Constraints', () => {
    const getFutureDateStr = (daysAhead) => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    it('rejects invalid pottery quantity or date less than 14 days away', async () => {
      const customer = await registerCustomer();

      // Quantity > 12
      const resQty = await request(app)
        .post('/api/pottery')
        .set('Cookie', customer.cookie)
        .send({
          item: 'Ceramic Mug',
          glaze: 'Matte Terracotta',
          quantity: 15,
          neededBy: getFutureDateStr(20),
        });
      expect(resQty.status).toBe(400);
      expect(resQty.body.message).toContain('between 1 and 12');

      // Date < 14 days away
      const resDate = await request(app)
        .post('/api/pottery')
        .set('Cookie', customer.cookie)
        .send({
          item: 'Ceramic Mug',
          glaze: 'Matte Terracotta',
          quantity: 4,
          neededBy: getFutureDateStr(7),
        });
      expect(resDate.status).toBe(400);
      expect(resDate.body.message).toContain('at least 14 days');
    });

    it('customers cannot edit or cancel accepted or declined requests', async () => {
      const customer = await registerCustomer();
      const admin = await createAdmin();

      const potteryReq = await PotteryRequest.create({
        customer: customer.user.id,
        item: 'Artisan Vase',
        glaze: 'Earthy Sage Green',
        quantity: 2,
        neededBy: getFutureDateStr(25),
        status: 'accepted', // Studio accepted it
      });

      // Customer tries to edit
      const editRes = await request(app)
        .put(`/api/pottery/${potteryReq._id}`)
        .set('Cookie', customer.cookie)
        .send({ quantity: 5 });
      expect(editRes.status).toBe(400);
      expect(editRes.body.message).toContain('cannot be edited');

      // Customer tries to cancel
      const cancelRes = await request(app)
        .put(`/api/pottery/${potteryReq._id}/cancel`)
        .set('Cookie', customer.cookie);
      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.message).toContain('Cannot cancel');
    });

    it('only admins can accept or decline pottery requests', async () => {
      const customer = await registerCustomer();
      const admin = await createAdmin();

      const potteryReq = await PotteryRequest.create({
        customer: customer.user.id,
        item: 'Decorative Plate',
        glaze: 'Warm Ivory Glaze',
        quantity: 3,
        neededBy: getFutureDateStr(30),
        status: 'requested',
      });

      // Customer tries to accept -> HTTP 403 Forbidden
      const custRes = await request(app)
        .put(`/api/pottery/${potteryReq._id}/accept`)
        .set('Cookie', customer.cookie);
      expect(custRes.status).toBe(403);

      // Admin accepts -> HTTP 200 Success
      const adminRes = await request(app)
        .put(`/api/pottery/${potteryReq._id}/accept`)
        .set('Cookie', admin.cookie);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.request.status).toBe('accepted');
    });
  });
});
