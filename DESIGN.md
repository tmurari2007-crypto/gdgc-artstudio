# DESIGN.md — Art Studio Web Application Architecture

This document answers the four required architectural and design questions from the GDGC Web Development recruitment assessment brief.

---

### Question 1: How do login and the two roles work?

#### User Registration & Login
1. **Public Registration (`POST /api/auth/register`)**:
   - Accepts `name`, `email`, and `password` (minimum 6 characters).
   - Email is normalized to lowercase and checked for uniqueness.
   - Passwords are automatically hashed with `bcryptjs` using a salted hash (`genSalt(10)`) in a Mongoose pre-save hook.
   - **Security Guarantee**: Public registration assigns the role `'customer'` exclusively. Clients cannot specify or escalate to the `'admin'` role through registration payloads.
   - The password hash has `select: false` on the User schema and is stripped by `toJSON()`, ensuring hashes are never exposed in API responses.

2. **Authentication & Session Issuance (`POST /api/auth/login`)**:
   - Compares the submitted plaintext password against the stored bcrypt hash using `user.comparePassword()`.
   - On success, issues a cryptographically signed JSON Web Token (JWT) containing `{ id: user._id, role: user.role }`.
   - The JWT is stored in a secure, HTTP-only cookie (`token`) with `sameSite: 'lax'` (or `'none'` in cross-site production) and a 7-day expiration. This prevents client-side JavaScript access and protects against XSS token harvesting.

3. **Session Verification & Current User (`GET /api/auth/me`)**:
   - The `requireAuth` middleware extracts the JWT from the incoming HTTP-only cookie (or `Authorization: Bearer <token>` fallback) and verifies it against `JWT_SECRET`.
   - The user record is retrieved from MongoDB (excluding password) and attached to `req.user`.

#### Role-Based Access Control (RBAC) Matrix
The application supports exactly two roles: `customer` and `admin`.

| Endpoint & Action | Customer Permission | Admin Permission | Server Enforcement |
| :--- | :--- | :--- | :--- |
| **Browse Paintings** (`GET /api/paintings`) | Allowed | Allowed | Public access |
| **Add / Edit Paintings** (`POST, PUT /api/paintings`) | Denied (HTTP 403) | Allowed | `requireRole('admin')` |
| **Purchase Painting** (`POST /api/orders/purchase`) | Allowed | Denied (HTTP 403) | `requireRole('customer')` |
| **View Orders** | Own orders only (`GET /api/orders/my`) | All orders (`GET /api/orders/all`) | Ownership filter vs `requireRole('admin')` |
| **Cancel Order** (`PUT /api/orders/:id/cancel`) | Allowed for owned orders | Denied (HTTP 403) | Ownership query: `findOne({ _id, customer: req.user._id })` |
| **Book Wall Painting** (`POST /api/bookings`) | Allowed | Denied (HTTP 403) | `requireRole('customer')` |
| **Confirm / Decline Booking** | Denied (HTTP 403) | Allowed (`PUT /api/bookings/:id/confirm`) | `requireRole('admin')` |
| **Cancel Booking** (`PUT /api/bookings/:id/cancel`) | Allowed for owned bookings (≥3 days before date) | Denied (HTTP 403) | Ownership query + 3-day cutoff check |
| **Request Pottery** (`POST /api/pottery`) | Allowed | Denied (HTTP 403) | `requireRole('customer')` |
| **Edit / Cancel Pottery** (`PUT /api/pottery/:id`) | Allowed only while `requested` | Denied (HTTP 403) | Ownership + status validation |
| **Accept / Decline Pottery** | Denied (HTTP 403) | Allowed (`PUT /api/pottery/:id/accept`) | `requireRole('admin')` |

**Error Behavior**:
- Unauthenticated requests return **HTTP 401**.
- Logged-in users attempting actions reserved for the other role return **HTTP 403**.
- A customer attempting to access, edit, or cancel another customer's order, booking, or pottery request returns **HTTP 404** (Not Found), as mandated by the brief, preventing unauthorized discovery of records.
- First administrator provisioning is handled via a dedicated, secure script (`npm run create-admin`), preventing public role injection.

---

### Question 2: Which database did you choose, and why?

#### Database Choice: MongoDB Atlas & Mongoose ODM
We selected **MongoDB Atlas** with **Mongoose ODM**.

1. **Document Modeling for Semi-Structured Studio Records**:
   - Art studio operations revolve around distinct aggregate entities: unique physical paintings, calendar-bound wall painting reservations, and multi-field custom pottery requests.
   - MongoDB documents provide an intuitive, high-performance representation for these entities without unnecessary table joins.

2. **Atomic Operations & Partial Unique Indexing**:
   - MongoDB natively supports atomic conditional updates (`findOneAndUpdate`), which are essential for solving the single-quantity painting purchase concurrency problem without distributed locking overhead.
   - MongoDB allows **partial unique indexes** (e.g., `{ bookingDate: 1 }` with `{ status: { $in: ['requested', 'confirmed'] } }`). This directly enforces calendar exclusivity at the database engine level while allowing cancelled or declined bookings to cleanly release the date.

3. **Mongoose Schema Validation**:
   - Enforces strict data types, required fields, custom regex validations (date formats `YYYY-MM-DD`, email formats), min/max value bounds (e.g. wall size 10–500 sq ft, quantity 1–12), and strict enum whitelists (`placed`, `cancelled`, `requested`, `confirmed`, `declined`, `accepted`).

#### Schema Design Overview
- **`User`**: Stores name, unique lowercase email, bcrypt-hashed password (excluded by default), and role enum (`customer` | `admin`).
- **`Painting`**: Stores artwork metadata (`title`, `description`, `price`, `medium`, `dimensions`, `imageUrl`), availability flag `isAvailable` (indexed), and optional `createdBy` reference.
- **`Order`**: References `customer` (ObjectId -> User), `painting` (ObjectId -> Painting), locked `purchasePrice` (Number, preserving historical transaction values even if catalogue prices change later), status (`placed` | `cancelled`), and timestamps.
- **`WallBooking`**: References `customer`, normalized `bookingDate` (string `YYYY-MM-DD`), `wallSize` (10–500 sq ft), `address`, locked `ratePerSqFt` (authoritative studio rate), locked `totalPrice`, and status (`requested` | `confirmed` | `declined` | `cancelled`). Includes a partial unique index on `bookingDate`.
- **`PotteryRequest`**: References `customer`, `item` (validated against official catalogue), `glaze` (validated against official options), `quantity` (1–12), `neededBy` (normalized date ≥ 14 days in future), `specialNotes`, and status (`requested` | `accepted` | `declined` | `cancelled`).

---

### Question 3: How do you stop two people from taking the same painting or date?

Handling race conditions and simultaneous submissions is implemented using **database-level concurrency controls**, rather than relying on frontend button disabling.

#### 1. Painting Purchase Concurrency
- **The Challenge**: Each original painting is one-of-a-kind and can be purchased only once. Two collectors clicking "Purchase" at the exact same millisecond could both read `isAvailable: true` if an application relies on a naïve "check-then-set" pattern.
- **Implementation (`server/controllers/orderController.js`)**:
  ```javascript
  const claimedPainting = await Painting.findOneAndUpdate(
    { _id: paintingId, isAvailable: true },
    { $set: { isAvailable: false } },
    { returnDocument: 'before' }
  );
  ```
  - This atomic find-and-modify operation executes in a single write operation inside the MongoDB engine.
  - The first request atomically finds the painting with `isAvailable: true` and flips it to `false`.
  - The second simultaneous request searches for `{ _id: paintingId, isAvailable: true }`, finds nothing matching the predicate, and immediately returns `null`.
  - When `null` is returned, the backend responds with **HTTP 409 Conflict**:
    ```json
    {
      "success": false,
      "message": "This painting is no longer available. It was just purchased by another collector."
    }
    ```
- **Integrity & Rollback**:
  - In replica set deployments (such as MongoDB Atlas clusters), order creation is wrapped in a multi-document MongoDB transaction session.
  - In standalone environments, an explicit rollback catch-block restores `isAvailable: true` if order insertion ever fails, preventing orphaned unavailable paintings.
- **Cancellation**:
  - When an order is cancelled, the server atomically updates the order status to `cancelled` and sets the painting's `isAvailable: true`.

#### 2. Wall-Painting Date Exclusivity
- **The Challenge**: The studio can only paint one client's wall on any given date. Two clients submitting reservations for the same calendar date must not both succeed.
- **Implementation (`server/models/WallBooking.js` & `server/controllers/wallBookingController.js`)**:
  - We define a **partial unique index** in Mongoose:
    ```javascript
    wallBookingSchema.index(
      { bookingDate: 1 },
      {
        unique: true,
        partialFilterExpression: {
          status: { $in: ['requested', 'confirmed'] }
        }
      }
    );
    ```
  - Dates are normalized to standard `YYYY-MM-DD` strings before insertion to eliminate UTC vs. local timezone offsets.
  - If two clients submit a booking for `2026-11-15` simultaneously, MongoDB's index uniqueness constraint allows only the first insert to succeed. The second insert raises a Duplicate Key Error (`code: 11000`).
  - The controller intercepts error `11000` and returns **HTTP 409 Conflict** with an informative message: *"This date has already been booked by another client. Please select another date."*
  - **Automatic Date Release**: Because the index filter only includes active statuses (`requested` and `confirmed`), when a booking is `declined` by an admin or `cancelled` by the client, it is automatically excluded from the unique constraint, instantly freeing the calendar date for other clients.

---

### Question 4: What did you finish, what did you leave out, and what would you do next?

#### What Was Finished
1. **Full-Stack Architecture**:
   - Clean client/server separation with React + Vite frontend and Node.js + Express + Mongoose backend.
   - ES Modules throughout, centralized environment variables (`.env` / `.env.example`), and `.gitignore`.
2. **Authentication & Authorization**:
   - Customer registration, login, logout, and session check (`/api/auth/me`).
   - Secure HTTP-only cookie-based JWT storage.
   - Role-based authorization middleware rejecting unauthorized roles with HTTP 403 and unauthenticated requests with HTTP 401.
   - Customer ownership isolation returning HTTP 404 for unauthorized record access.
   - Dedicated admin provisioning script (`npm run create-admin`).
3. **Paintings Workflow**:
   - Browse gallery with available/sold badges and filter toggle.
   - Atomic conditional purchase with HTTP 409 conflict detection.
   - Customer order cancellation returning the painting to available inventory.
   - Admin painting creation and editing restricted strictly to available paintings.
4. **Wall-Painting Bookings**:
   - Date range validation (strictly between 7 and 90 days away).
   - Wall size validation (10 to 500 sq ft).
   - Server-side authoritative pricing (`wallSize * ratePerSqFt`).
   - Database-level partial unique index preventing duplicate active dates.
   - Admin confirmation and decline actions releasing calendar dates.
   - Customer cancellation cutoff enforced strictly on the backend (≥ 3 days before date).
5. **Custom Pottery Commissions**:
   - Official studio catalogue items and glaze selections.
   - Quantity validation (1 to 12 pieces).
   - Lead time validation (needed-by date ≥ 14 days in the future).
   - Customer edit and cancel actions permitted only while in `requested` status.
   - Admin accept and decline workflows.
6. **Studio Admin Dashboard**:
   - Real-time aggregate statistics (artwork inventory, active orders, sales revenue, booking counts, pottery requests).
   - Dedicated management panels for paintings, orders, wall bookings, and pottery requests.
7. **Design System & UI States**:
   - Boutique art gallery aesthetic: warm ivory backgrounds, charcoal typography, terracotta primary accents, and sage-green secondary accents.
   - Complete loading skeletons, empty state illustrations, error alerts, and success confirmations.
8. **Automated Testing Suite**:
   - 16 automated Vitest + Supertest integration tests covering authentication, RBAC, atomic purchases, wall booking date collisions, cancellation cutoffs, and pottery status constraints. All 16 tests passing.

#### What Was Left Out (Per Explicit Recruitment Scope Exclusions)
In accordance with Section 06 / 19 ("What you do not need to build") of the recruitment brief, the following were intentionally excluded to focus on rock-solid core business logic and data integrity:
- Real payment processing (orders transition directly to `placed`).
- Password reset, email verification, and social OAuth login.
- Customer reviews, rating systems, and promotional discount coupons.
- Delivery shipping trackers, automated SMS, and SMTP email services.
- Multipart file/image upload cloud infrastructure (paintings use high-resolution catalogue URLs).
- Docker containers and complex CI/CD orchestration.

#### What I Would Do Next
1. **Interactive Calendar UI**: Integrate a calendar visualizer (e.g. FullCalendar) directly on the wall-painting screen to grey out booked dates dynamically.
2. **Stripe Payment Gateway**: Integrate Stripe PaymentIntents or webhooks so painting purchases reserve inventory during checkout and confirm upon payment success.
3. **Real-Time WebSockets**: Implement Socket.io or Server-Sent Events to push instant gallery inventory updates and admin notifications without requiring page refreshes.
4. **Cloudinary / AWS S3 Uploads**: Implement secure pre-signed S3 URL uploads for admin artwork photography and customer reference photos for wall mural spaces.
