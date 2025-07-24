# replit.md

## Overview

**Fanixora** is a full-stack adult content platform built with React, Express.js, and PostgreSQL. The application uses a monorepo structure with separate client and server directories, implementing a modern web application with real-time features, content management, and subscription-based monetization. The platform features a modern OnlyFans-inspired UI with dark theme, gradient design, and professional styling.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Context for authentication, TanStack Query for server state
- **Routing**: React Router DOM for client-side navigation
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Built-in auth system with session management
- **API Pattern**: RESTful API with `/api` prefix
- **Real-time**: WebSocket support for live features
- **Development**: Hot module replacement via Vite middleware

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared types and schemas
├── migrations/      # Database migration files
└── dist/           # Production build output
```

## Key Components

### Authentication System
- User registration and login with email/password
- Profile management with creator/user roles
- Age verification system for adult content
- Session-based authentication using PostgreSQL sessions

### Content Management
- Post creation with media upload support
- Premium content with subscription gating
- Pay-per-view (PPV) content system
- Content collections and categorization
- Real-time content analytics

### Creator Features
- Creator profile management
- Subscription pricing and tiers
- Live streaming capabilities
- Revenue tracking and analytics
- Content moderation tools

### User Features
- Content discovery and browsing
- Subscription management
- Direct messaging with creators
- Content collections (likes, purchases)
- Notification system

### Admin Features
- Age verification review system
- Content moderation panel
- Platform analytics dashboard
- User management capabilities

## Data Flow

### User Authentication Flow
1. User registers/logs in through React forms
2. Credentials validated on Express server
3. Session created and stored in PostgreSQL
4. User profile fetched and stored in React Context
5. Protected routes check authentication status

### Content Creation Flow
1. Creator uploads content through React form
2. Media files processed and stored
3. Content metadata saved to PostgreSQL
4. Real-time updates sent to subscribers
5. Analytics events tracked

### Subscription Flow
1. User subscribes to creator through UI
2. Payment processing (simulated)
3. Subscription record created in database
4. Access permissions updated
5. Creator notifications sent

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Database ORM and query builder
- **@radix-ui/react-***: UI component primitives
- **@tanstack/react-query**: Server state management
- **express**: Web application framework
- **react-router-dom**: Client-side routing

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **tailwindcss**: Utility-first CSS framework
- **zod**: Schema validation library
- **react-hook-form**: Form handling and validation

### Real-time Features
- **ws**: WebSocket library for real-time communication
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Mode
- Vite development server for frontend
- Express server with hot reload via tsx
- Database migrations handled by Drizzle Kit
- Real-time error overlay for debugging

### Production Build
- Frontend built with Vite to `dist/public`
- Backend bundled with esbuild to `dist/index.js`
- Static file serving from Express server
- Database schema pushed via Drizzle Kit

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit-specific configuration

### Build Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes

The application is designed to be deployed on Replit with automatic environment provisioning and includes development-specific plugins for enhanced debugging and development experience.

## Recent Changes (December 2024)

### Version 1.0.0 - Platform Foundation
- **Platform Rebranding**: Renamed to "Fanixora" with updated branding throughout
- **Database Migration**: Successfully migrated from Supabase to Neon PostgreSQL with Drizzle ORM
- **Modern UI/UX**: Implemented OnlyFans-inspired design with dark theme and gradient styling
- **Component System**: Created ModernHeader, ModernSidebar, and ModernPostCard components
- **API Architecture**: Built comprehensive RESTful API with authentication, content, and creator management
- **Security**: Implemented secure authentication and database access patterns
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Performance**: Optimized for fast loading with proper caching and state management

### Key Features Implemented
- User authentication and profile management
- Creator onboarding and profile creation
- Content creation and publishing system
- Subscription and monetization framework
- Real-time messaging system
- Live streaming infrastructure
- Content moderation and age verification
- Analytics and reporting foundation

### Technical Achievements
- Type-safe database operations with Drizzle ORM
- Modern React components with TypeScript
- Tailwind CSS with custom design system
- Comprehensive API endpoints
- Database schema with 15+ tables
- Security-first architecture