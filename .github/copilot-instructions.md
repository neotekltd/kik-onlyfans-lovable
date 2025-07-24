# Fanixora - AI Agent Instructions

## Project Overview
Fanixora is a full-stack adult content platform similar to OnlyFans, built with React, TypeScript, and PostgreSQL. The platform enables content creators to monetize their content through subscriptions, PPV content, and live streaming.

## Architecture & Technology Stack

### Frontend
- React 18 with TypeScript and Vite
- TanStack Query for server state
- Radix UI components with shadcn/ui styling
- Tailwind CSS with custom design system
- React Hook Form with Zod validation

### Backend
- PostgreSQL with Drizzle ORM
- Session-based authentication
- WebSocket support for real-time features

## Key Components & Data Flow

### Core Features
1. **Authentication System**
   - User/Creator profiles in `profiles` table
   - Age verification system in `age_verification_documents`
   - Role-based access control via `is_creator` flag

2. **Content Management**
   - Posts (`posts` table) support photos, videos, audio
   - Premium content gating via `is_premium` and `is_ppv` flags
   - Collections system for organizing content

3. **Monetization**
   - Subscriptions tracked in `user_subscriptions`
   - PPV content purchases in `ppv_purchases`
   - Tips system in `tips` table
   - Payouts handled through `payouts` table

4. **Analytics & Tracking**
   - Content metrics in `content_analytics`
   - Revenue tracking in `revenue_records`
   - User activity logging in `user_activity`

## Development Workflows

### Local Development
```bash
npm install     # Install dependencies
npm run dev     # Start dev server
```

### Key Directories
- `/src` - React application code
- `/src/components` - Reusable UI components
- `/src/pages` - Route components
- `/src/hooks` - Custom React hooks
- `/src/utils` - Helper functions
- `/shared` - Shared types and database schema

### Common Patterns

1. **Data Fetching**
   - Use TanStack Query hooks for server state
   - Handle loading/error states consistently
   - Cache responses appropriately

2. **Component Structure**
   - Follow shadcn/ui component patterns
   - Use Tailwind for styling
   - Implement responsive design

3. **Form Handling**
   - Use React Hook Form with Zod schemas
   - Handle validation consistently
   - Show appropriate error messages

4. **Authentication**
   - Check `useAuth()` hook for user context
   - Use `ProtectedRoute` component for private routes
   - Handle role-based access control

## Best Practices

1. **State Management**
   - Use React Context for global state (auth)
   - TanStack Query for server state
   - Local state for component-specific data

2. **Performance**
   - Implement proper loading states
   - Use proper caching strategies
   - Optimize images and media

3. **Security**
   - Validate all user input
   - Check permissions before sensitive operations
   - Use proper content moderation
