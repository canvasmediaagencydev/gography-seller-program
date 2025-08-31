# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Development
- **Start dev server**: `npm run dev` (uses Next.js with Turbopack)
- **Build project**: `npm run build`
- **Start production**: `npm start`
- **Lint code**: `npm run lint`

### Testing
No test framework is currently configured. Check with user for testing requirements.

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
│   ├── (auth)/              # Auth pages (login)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── admin/           # Admin-only pages (trips, bookings, sellers, customers)
│   │   ├── trips/           # Seller trip management
│   │   └── reports/         # Seller reports
│   ├── api/                 # API routes
│   │   ├── trips/           # Trips API with caching
│   │   ├── admin/           # Admin APIs (bookings, trips)
│   │   └── upload/          # File upload endpoints
│   └── book/                # Public booking pages
├── components/              # Reusable UI components
│   ├── ui/                  # Basic UI components
│   ├── admin/               # Admin-specific components
│   ├── booking/             # Booking form components
│   └── trips/               # Trip display components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and configurations
│   ├── supabase/            # Database clients (client, server, admin)
│   ├── cache.ts             # In-memory caching system
│   └── storage.ts           # File storage utilities
├── types/                   # TypeScript definitions
└── utils/                   # Helper functions
```

### Database Architecture
- **User Profiles**: Role-based (seller, admin) with referral system
- **Trips**: Travel packages with schedules and pricing
- **Bookings**: Customer bookings with status tracking
- **Customers**: Customer data with referral tracking
- **Commission System**: Seller commission tracking and payments

### Key Features
1. **Role-based Access**: Admin and Seller roles with different permissions
2. **Trip Management**: Full CRUD for trips with schedules
3. **Booking System**: Complete booking workflow with status management
4. **Commission Tracking**: Automated commission calculation and payment tracking
5. **Referral System**: Seller referral tracking and commission attribution
6. **Performance Optimizations**: API caching, database indexes, batch queries

## Development Guidelines

### Database Access
- **Client-side**: Use `createClient()` from `@/lib/supabase/client`
- **Server-side**: Use `createClient()` from `@/lib/supabase/server`
- **Admin operations**: Use `createAdminClient()` from `@/lib/supabase/admin`

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

### Cache System
The project uses an in-memory cache (`@/lib/cache.ts`) for API performance. Cache keys include user ID to prevent data leaks between users.

### Commission System
Complex commission calculations are handled server-side with proper tracking of seller attributions and referral bonuses.