# 🎮 DARK SYNDICATE GAMING WORLD

**Full-Stack Gaming Zone Management System**

Premium gaming venue website, customer booking system, staff dashboard, and comprehensive admin panel built with Next.js, TypeScript, Prisma, and MySQL.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | MySQL / MariaDB via Prisma ORM |
| **Auth** | bcrypt + JWT (HttpOnly cookies) |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Deployment** | Hostinger Node.js Hosting |

---

## 📋 Prerequisites

- **Node.js** 18.x or later
- **MySQL** 8.0+ or **MariaDB** 10.6+ (Hostinger uses MariaDB)
- **npm** 9+

---

## 🛠️ Setup & Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd dark-syndicate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials and secrets:

```env
DATABASE_URL="mysql://username:password@localhost:3306/dark_syndicate"
JWT_SECRET="generate-a-secure-64-char-random-string"
```

> ⚠️ **Never commit `.env.local` to version control.**

### 4. Set up the database

```bash
# Create tables (development)
npm run db:push

# Or use migrations (production)
npm run db:migrate

# Seed with default data
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | admin@darksyndicate.com | Admin@123456 |
| **Staff** | staff@darksyndicate.com | Staff@123456 |
| **Customer** | player@example.com | Customer@123 |

> ⚠️ **Change these immediately in production!**

---

## 📂 Project Structure

```
dark-syndicate/
├── prisma/              # Database schema, migrations, seed
├── public/              # Static assets (logo, fonts, images)
├── src/
│   ├── app/             # Next.js App Router pages & API routes
│   │   ├── (auth)/      # Authentication pages (login, register)
│   │   ├── (public)/    # Public website (facilities, pricing)
│   │   ├── (customer)/  # Customer portal
│   │   ├── admin/       # Admin panel
│   │   ├── staff/       # Staff panel
│   │   └── api/         # REST API endpoints
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Design system primitives
│   │   ├── layout/      # Layout components
│   │   └── shared/      # Domain-specific shared components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Core utilities (auth, prisma, errors)
│   ├── services/        # Business logic layer
│   ├── types/           # TypeScript type definitions
│   └── validators/      # Zod validation schemas
└── tests/               # Test suites
```

---

## 🗄️ Database Commands

```bash
npm run db:push      # Push schema to database (dev)
npm run db:migrate   # Create and apply migrations
npm run db:seed      # Seed with default data
npm run db:studio    # Open Prisma Studio (GUI)
```

---

## 🏗️ Build & Deploy

### Production Build

```bash
npm run build
npm start
```

### Hostinger Deployment

1. Push to GitHub repository
2. Connect repo in Hostinger hPanel
3. Set environment variables in hPanel
4. Deploy

The app uses `output: 'standalone'` for optimized Hostinger deployment.

---

## 🔒 Security Features

- bcrypt password hashing (cost 12)
- JWT tokens in HttpOnly cookies
- Rate limiting on auth endpoints
- Server-side input validation (Zod)
- CSRF protection
- SQL injection prevention (Prisma ORM)
- Security headers (X-Frame-Options, nosniff, etc.)
- Role-based access control (API-level enforcement)
- Audit logging for sensitive operations

---

## 📊 Phases

- [x] **Phase 1**: Project setup, design system, database schema, authentication
- [ ] **Phase 2**: Public website, facilities, pricing, customer accounts
- [ ] **Phase 3**: Booking system, station availability, payments, QR codes
- [ ] **Phase 4**: Admin panel and staff operations
- [ ] **Phase 5**: Reports, website CMS, notifications, audit logs
- [ ] **Phase 6**: Security testing, load testing, production deployment

---

## 📄 License

Private — All rights reserved.
