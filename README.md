# Atelier Art Studio — Full-Stack Web Application

A full-stack, production-conscious web application for a boutique art studio, built for the **GDGC Web Development Volunteer Recruitment** assessment.

The application supports three core studio offerings:
1. **Original One-of-a-Kind Paintings**: Real-time acquisition with concurrency-safe atomic inventory claims.
2. **Custom Wall Painting & Murals**: Calendar-based booking with server-calculated pricing, 7–90 day scheduling, and database-level date exclusivity.
3. **Handcrafted Studio Pottery**: Bespoke ceramic requests with item/glaze selection, 1–12 quantity limits, and strict status workflows.

---

## Technology Stack

- **Frontend**: React 18, Vite, React Router 7, Lucide React icons, Vanilla CSS3 (custom design system with CSS custom properties).
- **Backend**: Node.js (v24), Express.js (ES Modules), Mongoose ODM, JWT, bcryptjs, cookie-parser, cors.
- **Database**: MongoDB Atlas / MongoDB with atomic updates and partial unique indexes.
- **Testing & QA**: Vitest, Supertest, MongoMemoryServer for isolated automated integration testing.

---

## Project Structure

```
gdgcweb/
├── frontend/                   # Frontend React + Vite application
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI states & ProtectedRoutes
│   │   ├── context/            # Centralized AuthContext (JWT session management)
│   │   ├── layouts/            # Boutique Navbar and Footer
│   │   ├── pages/              # Home, Paintings, WallPainting, CustomPottery, Auth, Dashboards
│   │   ├── services/           # Dedicated API service client with cookie credentials
│   │   ├── styles/             # Studio Design System (warm ivory, terracotta, sage green)
│   │   ├── App.jsx             # React Router route registry
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── backend/                    # Backend Node.js + Express REST API
│   ├── config/
│   │   └── db.js               # MongoDB connection with graceful lifecycle handlers
│   ├── controllers/            # Auth, Painting, Order, WallBooking, Pottery, Admin controllers
│   ├── middleware/             # requireAuth, requireRole, errorHandler, notFoundHandler
│   ├── models/                 # User, Painting, Order, WallBooking, PotteryRequest schemas
│   ├── routes/                 # Express RESTful route definitions
│   ├── scripts/                # Database seed script & first-admin provisioning script
│   ├── tests/                  # Automated integration tests (Vitest + Supertest)
│   ├── app.js                  # Express middleware setup & route mounting
│   ├── server.js               # HTTP listener initialization
│   ├── package.json
│   ├── vitest.config.js
│   └── .env.example
├── README.md
├── DESIGN.md                   # Answers to the 4 recruitment brief questions
├── .gitignore
└── package.json                # Root orchestration scripts
```

---

## Key Features & Business Rules Implemented

### 1. Authentication & Role-Based Access Control (RBAC)
- Exactly two application roles: `customer` and `admin`.
- Passwords securely hashed with `bcryptjs` (salt rounds: 10).
- JWT issued and stored in secure, **HTTP-only cookies** (`SameSite: Lax`, `Secure` in production).
- Public registration creates **customer** accounts exclusively; admins are provisioned via `npm run create-admin`.
- Server-side permission middleware:
  - Unauthenticated access returns `HTTP 401`.
  - Wrong role returns `HTTP 403`.
  - Customer accessing another customer's record returns `HTTP 404` (per recruitment brief).

### 2. Original Paintings & Concurrency Protection
- Each painting is unique and can be purchased only once.
- **Concurrency Safety**: Atomic conditional query `findOneAndUpdate({ _id, isAvailable: true }, { $set: { isAvailable: false } })`. If two users submit simultaneously, only one succeeds; the second receives `HTTP 409 Conflict`.
- Transaction support on replica sets with fallback rollback logic.
- Order cancellation atomically returns the artwork to available inventory.
- Admins can edit paintings **only while they are available**.

### 3. Wall-Painting Bookings
- Date must be between **7 and 90 days** in the future.
- Wall size must be between **10 and 500 square feet**.
- Full street address required.
- Total price is calculated exclusively by the server: `wallSize * ratePerSqFt` (defaults to $25/sq ft).
- **Date Uniqueness**: Enforced via a **partial unique index** on `bookingDate` for active statuses (`requested`, `confirmed`). Duplicate booking attempts are rejected with `HTTP 409 Conflict`.
- **Cancellation Cutoff**: Customers can cancel only until **3 days before** the booked date.
- Cancelled or declined bookings automatically release the calendar date.

### 4. Custom Handcrafted Pottery
- Choose from studio catalogue items (*Ceramic Mug, Artisan Vase, Serving Bowl, Decorative Plate, Planter Pot, Tea Set Pot*).
- Choose from mineral glazes (*Matte Terracotta, Earthy Sage Green, Speckled Sand, Ocean Cobalt Blue, Rustic Charcoal, Warm Ivory Glaze*).
- Quantity: integer between **1 and 12 pieces**.
- Needed-by date: at least **14 days** in the future (minimum studio throwing, drying, and kiln-firing window).
- Initial status: `requested`.
- Customers can edit or cancel **only while in `requested` status**. Accepted or declined requests cannot be modified.
- Admins can accept or decline requests.

### 5. Studio Admin Dashboard
- Live aggregate statistics: Available/sold artwork counts, active orders, sales revenue, wall booking volume, and pottery requests.
- Add new paintings and edit available paintings.
- Review customer orders.
- Confirm or decline wall painting dates.
- Accept or decline pottery commissions.

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (tested on Node.js v24.14.1)
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas connection string (or local MongoDB daemon)

---

## Environment Configuration

### Server Configuration (`server/.env`)
Create a `server/.env` file (or copy from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/art_studio?retryWrites=true&w=majority
DB_NAME=art_studio
JWT_SECRET=super_secret_jwt_key_art_studio_production_ready_2026
CLIENT_URL=http://localhost:5173
COOKIE_SECRET=art_studio_cookie_secret_key_9988
WALL_PAINTING_RATE_PER_SQFT=25
```

### Client Configuration (`client/.env`)
Create a `client/.env` file (or copy from `client/.env.example`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Installation & Setup

1. **Clone the repository and install dependencies**:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install

   # Return to root
   cd ..
   ```

2. **Seed the database catalogue**:
   ```bash
   cd server
   npm run seed
   ```
   *(Note: seedData.zip was inspected. Because no external zip was provided in the repository root, a documented fallback catalog of original oil & acrylic paintings is imported with idempotency protection).*

3. **Provision the first studio administrator**:
   ```bash
   cd server
   npm run create-admin
   ```
   Default credentials created:
   - **Email**: `admin@artstudio.com`
   - **Password**: `AdminPass123!`

---

## Running the Application

### Option A: Run Both Concurrently from Root
```bash
npm run dev
```

### Option B: Run Services Separately
- **Backend (Port 5000)**:
  ```bash
  cd server
  npm run dev
  ```
- **Frontend (Port 5173)**:
  ```bash
  cd client
  npm run dev
  ```

Open your browser at `http://localhost:5173`.

---

## Running Automated Tests

The backend includes a comprehensive Vitest + Supertest integration test suite with an in-memory MongoDB server:

```bash
cd server
npm test
```

### Verified Test Coverage (16/16 Passing):
- Customer registration with default `customer` role.
- Successful login & invalid password rejection (HTTP 401).
- Unauthenticated access rejection on protected routes (HTTP 401).
- Customer access rejection on admin-only routes (HTTP 403).
- Customer purchasing an available painting successfully.
- Rejection of duplicate painting purchase with HTTP 409 Conflict.
- Concurrent simultaneous purchase attempts resulting in at most one order.
- Order cancellation atomically releasing painting availability.
- Rejection of customer attempting to cancel another customer's order (HTTP 404).
- Rejection of wall booking dates outside 7–90 day range.
- Rejection of invalid wall sizes (<10 or >500 sq ft).
- Enforcement of one active booking per date (HTTP 409 on collision).
- Enforcement of 3-day cancellation cutoff on wall bookings.
- Rejection of pottery quantity >12 and dates <14 days in future.
- Prevention of customer edits/cancellations on accepted/declined pottery requests.
- Enforcement that only admins can accept or decline pottery commissions.

---

## Production Build Verification

Verify that the frontend builds cleanly without warnings or syntax errors:
```bash
cd client
npm run build
```
*(Produces optimized assets in `client/dist`).*

---

## Five-Minute Interview Demo Script

| Timestamp | Phase | Actions to Show |
| :--- | :--- | :--- |
| **0:00–0:30** | **Introduction** | Present the boutique art studio design system (ivory background, terracotta accents, typography). Explain the three core services. |
| **0:30–1:20** | **Painting Purchase** | Register as a new customer (`collector@example.com`). Browse `/paintings`. Buy an available painting. Show the order created in the Customer Dashboard (`/dashboard`) and verify the painting is marked "Sold Out". |
| **1:20–2:10** | **Wall Painting Booking** | Navigate to `/wall-painting`. Pick a date 14 days out. Enter 150 sq ft. Notice live server-rate calculation ($3,750). Submit reservation. Show booking in `/dashboard`. |
| **2:10–2:50** | **Custom Pottery** | Navigate to `/custom-pottery`. Pick *Artisan Vase*, *Earthy Sage Green*, quantity 4, date 20 days out. Submit request. Show the status is `requested` and edit/cancel buttons are available. |
| **2:50–3:40** | **Admin Workflow** | Log out and sign in as `admin@artstudio.com` / `AdminPass123!`. View real-time analytics in `/admin`. Confirm the wall painting booking. Accept the pottery commission. Add a new painting to inventory. |
| **3:40–4:30** | **Technical Deep Dive** | Show `server/controllers/orderController.js` atomic conditional update (`findOneAndUpdate`), `server/models/WallBooking.js` partial unique index, and `server/middleware/auth.js` RBAC rules. |
| **4:30–5:00** | **Wrap-Up** | Summarize clean architecture, all 16 passing Vitest checks, and production build readiness. |
