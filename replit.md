# I Think Too Much

## Overview

"I Think Too Much" is a modern web application that allows users to share thoughts and discover connections between ideas using AI. The platform creates an intelligent network of thoughts where AI automatically finds relationships between user-submitted content, building a connected knowledge graph of ideas. Users can share short thoughts (up to 280 characters), search through existing thoughts, and explore how their ideas connect to others through AI-powered analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with **React + TypeScript** using Vite as the build tool. The application follows a component-based architecture with:

- **UI Framework**: Radix UI primitives with shadcn/ui components for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Mobile-First Design**: Responsive components with dedicated mobile modals and layouts

The frontend is organized into logical directories (`components/`, `pages/`, `hooks/`, `lib/`) with TypeScript path aliases for clean imports. The design system uses a neutral color palette with CSS custom properties for easy theming.

### Backend Architecture
The server is built with **Express.js + TypeScript** in ESM format:

- **API Layer**: RESTful endpoints for CRUD operations on thoughts
- **Storage**: Modular storage interface with in-memory implementation (designed for easy database migration)
- **AI Integration**: Google Gemini AI for thought analysis and connection discovery
- **Development**: Hot reloading with Vite middleware integration
- **Validation**: Shared Zod schemas between client and server for consistent validation

The backend uses a clean separation between routes, storage, and services, making it easy to swap implementations (e.g., moving from in-memory to database storage).

### Data Storage Strategy
Currently uses **in-memory storage** with a well-defined interface (`IStorage`) that abstracts storage operations. The system is designed for easy migration to PostgreSQL:

- **Database Config**: Drizzle ORM configuration already set up for PostgreSQL
- **Schema Definition**: Complete database schema defined in `shared/schema.ts`
- **Migration Ready**: Storage interface allows switching from memory to database without changing business logic

The schema includes thoughts with connections, tags, likes, and metadata, designed to support the AI-powered relationship mapping.

### AI-Powered Connection Discovery
Integration with **Google Gemini AI** provides intelligent features:

- **Thought Analysis**: Automatic extraction of themes, keywords, sentiment, and categorization
- **Connection Finding**: AI analyzes new thoughts against existing ones to find relationships
- **Bidirectional Connections**: Creates two-way relationships between related thoughts
- **Background Processing**: AI analysis runs asynchronously to avoid blocking user interactions
- **Tag Suggestions**: AI suggests relevant tags based on thought content and connections

### Authentication & Session Management
The application includes session management infrastructure using `connect-pg-simple` for PostgreSQL-based sessions, though authentication is not currently implemented. The system defaults to "Anonymous Thinker" for all users.

## External Dependencies

### Core Framework Dependencies
- **@google/genai**: Google Gemini AI API for thought analysis and connection discovery
- **express**: Web framework for the Node.js backend
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL support
- **@neondatabase/serverless**: PostgreSQL driver optimized for serverless environments

### UI and Styling Dependencies
- **@radix-ui/***: Comprehensive set of accessible, unstyled UI primitives
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Utility for managing component variants
- **lucide-react**: Icon library with React components

### Development and Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Performant form handling with minimal re-renders
- **zod**: Schema validation for type-safe data handling

### Development Environment Integration
- **@replit/vite-plugin-***: Replit-specific plugins for development banner, error overlay, and cartographer integration

The application is structured for easy deployment and scaling, with clear separation between development and production concerns.