# Project Structure & Organization

## Root Directory Layout
```
src/app/
├── core/           # Core application services, guards, interceptors
├── features/       # Feature modules organized by business domain
├── shared/         # Reusable components, services, and utilities
├── components/     # Global reusable UI components
├── interfaces/     # Global TypeScript interfaces
├── services/       # Global application services
└── tabs/          # Main tab navigation structure
```

## Core Architecture (`src/app/core/`)
- **constants/**: Application-wide constants and configuration
- **guards/**: Route guards for authentication and authorization
- **interceptors/**: HTTP interceptors for token management and error handling
- **interfaces/**: Core TypeScript type definitions
- **services/**: Fundamental services (auth, API client, etc.)

## Feature Modules (`src/app/features/`)
Each feature follows a consistent structure:
- **auth/**: Authentication and login functionality
- **dashboard/**: Main dashboard with analytics and KPIs
- **mercados/**: Market management CRUD operations
- **locales/**: Location/vendor space management
- **usuarios/**: User management and role assignment
- **facturas/**: Invoice generation and management
- **consulta-ics/**: ICS consultation with printing capabilities
- **estado-cuenta/**: Account statement queries (regular and amnesty)
- **reportes/**: Report generation and export functionality
- **bluetooth/**: Bluetooth printer management
- **auditoria/**: Audit trail and activity logging

## Shared Resources (`src/app/shared/`)
- **components/**: Reusable UI components across features
- **constants/**: Shared constants and enums
- **enums/**: TypeScript enums for consistent value sets
- **interfaces/**: Shared TypeScript interfaces
- **services/**: Utility services used across multiple features

## Styling Organization
- **Global styles**: `src/global.scss` for app-wide styles
- **Theme variables**: `src/theme/variables.scss` for Ionic theming
- **Component styles**: Co-located `.scss` files with components
- **TailwindCSS**: Utility-first classes for rapid styling

## Naming Conventions
- **Files**: kebab-case (e.g., `user-management.service.ts`)
- **Components**: PascalCase classes with descriptive names
- **Services**: Suffix with `Service` (e.g., `AuthService`)
- **Interfaces**: Prefix with `I` or descriptive names (e.g., `User`, `Invoice`)
- **Pages**: Suffix with `Page` for Ionic pages

## Route Organization
- **Main routes**: Defined in `app.routes.ts`
- **Tab routes**: Organized in `tabs/tabs.routes.ts`
- **Feature routes**: Each feature module manages its own routing
- **Guards**: Applied at route level for role-based access control

## Asset Management
- **Images**: `src/assets/` for static images and icons
- **Resources**: `resources/` for app icons and splash screens
- **Build output**: `www/` directory (excluded from version control)

## Configuration Files
- **Angular**: `angular.json` for build and development configuration
- **Capacitor**: `capacitor.config.ts` for native app settings
- **Ionic**: `ionic.config.json` for Ionic CLI configuration
- **TypeScript**: Multiple `tsconfig.*.json` files for different build targets