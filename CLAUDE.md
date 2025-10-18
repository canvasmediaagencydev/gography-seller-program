# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Development
- **Start dev server**: `npm run dev` (uses Next.js with Turbopack)
- **Build project**: `npm run build`
- **Start production**: `npm start`
- **Lint code**: `npm run lint`
- **Type check**: `npx tsc --noEmit` (manual type checking)

### Testing
No test framework is currently configured. Check with user for testing requirements.

### Local Development with Supabase
- **Start local Supabase**: `npx supabase start` (requires Docker)
- **Stop local Supabase**: `npx supabase stop`
- **Generate types**: `npx supabase gen types typescript --project-id <project-id> > database.types.ts`
- **Database migrations**: `npx supabase db push` (apply local changes to remote)
- **Supabase Studio**: Available at `http://127.0.0.1:54323` when running locally

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **Authentication**: Supabase Auth
- **Language**: TypeScript
- **State Management**: React hooks with custom caching system

### Project Structure
This is a seller dashboard for a trip booking platform with role-based access:

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/              # Auth pages (login, register)
│   ├── dashboard/           # Protected dashboard routes
│   │   ├── admin/           # Admin-only pages (trips, bookings, sellers, customers)
│   │   ├── trips/           # Seller trip management page
│   │   ├── profile/         # User profile pages
│   │   └── reports/         # Seller reports
│   ├── api/                 # API routes
│   │   ├── trips/           # Trips API with caching
│   │   ├── admin/           # Admin APIs (bookings, trips, sellers)
│   │   ├── upload/          # File upload endpoints (image, file, seller)
│   │   ├── countries/       # Countries lookup API
│   │   └── storage/         # Storage management API
│   ├── book/                # Public booking pages
│   │   └── [tripId]/[scheduleId]/ # Dynamic booking routes
│   └── api-docs/            # API documentation page
├── components/              # Reusable UI components
│   ├── ui/                  # Basic UI components (shadcn/ui based)
│   ├── admin/               # Admin-specific components
│   ├── auth/                # Authentication components
│   ├── booking/             # Booking form components
│   ├── reports/             # Report components
│   └── trips/               # Trip display components
├── constants/               # Application constants
├── hooks/                   # Custom React hooks (currently empty)
├── lib/                     # Utilities and configurations
│   ├── supabase/            # Database clients (client, server, admin)
│   ├── auth/                # Auth utilities and helpers
│   ├── cache.ts             # In-memory caching system
│   ├── storage.ts           # File storage utilities
│   ├── utils.ts             # General utility functions
│   └── performance.ts       # Performance monitoring utilities
├── types/                   # TypeScript definitions (currently empty)
└── middleware.ts            # Next.js middleware for auth & route protection
```

### Database Architecture
- **User Profiles**: Role-based (seller, admin) with referral system
- **Trips**: Travel packages with schedules and pricing
- **Bookings**: Customer bookings with status tracking
- **Customers**: Customer data with referral tracking
- **Commission System**: Seller commission tracking and payments
- **Coin System**: Virtual currency reward system for sellers (NEW!)
  - **seller_coins**: Tracks coin balances per seller
  - **coin_transactions**: Immutable log of all coin movements
  - **coin_bonus_campaigns**: Admin-created bonus campaigns
  - **coin_redemptions**: Cash redemption requests
  - **coin_earning_rules**: Configurable earning rules

### Key Features
1. **Role-based Access**: Admin and Seller roles with different permissions
2. **Trip Management**: Full CRUD for trips with schedules
3. **Booking System**: Complete booking workflow with status management
4. **Commission Tracking**: Automated commission calculation and payment tracking
5. **Referral System**: Seller referral tracking and commission attribution
6. **Coin & Reward System**: Virtual currency for seller incentives (NEW!)
   - Earn coins from bookings, campaigns, and referrals
   - Real-time balance updates across all devices
   - Campaign badges on trip cards
   - Cash redemption workflow
   - Admin management dashboard
7. **Performance Optimizations**: API caching, database indexes, batch queries

## Development Guidelines

### Database Access
- **Client-side**: Use `createClient()` from `@/lib/supabase/client`
- **Server-side**: Use `createClient()` from `@/lib/supabase/server`
- **Admin operations**: Use `createAdminClient()` from `@/lib/supabase/admin`

### Route Protection & Middleware
- **Middleware**: Located at `src/middleware.ts` - handles authentication and role-based route protection
- **Public routes**: `/auth/*`, `/book/*`, `/api/docs`, `/api-docs`, and root `/`
- **Role-based access**: Admin users get redirected to `/dashboard/admin/sellers`, sellers to `/dashboard/trips`
- **Status-based access**: Rejected users are signed out automatically, unapproved sellers cannot access reports
- **Authentication flow**: Unauthenticated users are redirected to `/auth/login`

### API Routes
- All API routes include caching via `@/lib/cache`
- User authentication required for protected endpoints
- Role-based authorization implemented
- Optimized queries to prevent N+1 problems

### Performance Considerations
- **Caching**: API responses cached for 30 seconds, static data (countries) for 5 minutes
- **Database**: Optimized indexes exist for common queries (see TRIPS_API_OPTIMIZATION_GUIDE.md)
- **Batch Processing**: Avoid N+1 queries by fetching related data in single queries
- **Pagination**: Implemented for all list views

### File Upload
- Images stored in Supabase Storage
- Upload endpoints: `/api/upload/image`, `/api/upload/file`, `/api/upload/seller`
- File validation and size limits implemented

### Authentication
- Supabase Auth with OAuth providers
- Role-based middleware protection
- Session management with SSR support

## Important Notes

### Database Performance
Critical database indexes are documented in `TRIPS_API_OPTIMIZATION_GUIDE.md`. These must be created in Supabase SQL Editor for optimal performance.

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
- `NEXT_PUBLIC_SITE_URL` (for production deployment)

**Note**: No `.env.example` file exists in the project. Create `.env.local` with the above variables and fill in your Supabase project credentials.

### Cache System
The project uses an in-memory cache (`@/lib/cache.ts`) for API performance. Cache keys include user ID to prevent data leaks between users.

### Commission System
Complex commission calculations are handled server-side with proper tracking of seller attributions and referral bonuses.

### Coin System (NEW!)
A comprehensive virtual currency and reward system for sellers. See `COIN_SYSTEM_GUIDE.md` for complete documentation.

**Key Routes**:
- **Seller**: `/dashboard/coins` - View balance, transactions, and redeem coins
- **Admin**: `/dashboard/admin/coins` - Manage campaigns, redemptions, and rules

**API Endpoints**:
- `/api/coins` - Get balance and transactions
- `/api/coins/redeem` - Request cash redemption
- `/api/coins/campaigns` - View active campaigns
- `/api/admin/coins/*` - Admin management endpoints

**Components**:
- `CoinBalanceIndicator` - Real-time balance display in nav
- `CampaignBadge` - Animated badges on trip cards
- Full admin dashboard with 5 tabs (Overview, Campaigns, Redemptions, Rules, Manual Adjust)

**Conversion Rate**: 1 coin = 1 THB (configurable)

**Security**: Database triggers handle all coin operations. RLS policies prevent client manipulation.

## Additional Development Notes

### UI Components
- **Component Library**: Uses shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom design system
- **Icons**: Multiple icon libraries including Heroicons, Lucide React, and React Icons
- **Fonts**: Noto Sans Thai for Thai language support (loaded from Google Fonts)

### Performance Optimizations
- **Next.js Features**: Uses Turbopack for fast development builds
- **Bundle Optimization**: Package imports are optimized for react-icons
- **Image Optimization**: Configured for WebP and AVIF formats with remote patterns allowed
- **Caching Strategy**: API responses cached with stale-while-revalidate pattern
- **Static Assets**: Long-term caching (1 year) for static assets

### Key Configuration Files
- **Next.js Config**: `next.config.ts` - includes performance optimizations and headers
- **TypeScript**: `tsconfig.json` - strict mode enabled with path mapping (`@/*` → `./src/*`)
- **Database Types**: `database.types.ts` - auto-generated Supabase types
- **Components Config**: `components.json` - shadcn/ui configuration