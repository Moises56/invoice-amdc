# Technology Stack & Build System

## Core Technologies
- **Frontend Framework**: Angular 19 with standalone components
- **Mobile Framework**: Ionic 8 for hybrid mobile development
- **Native Bridge**: Capacitor 7 for native device access
- **Styling**: TailwindCSS 4 + SCSS for component styling
- **State Management**: Angular Signals (modern reactive approach)
- **Authentication**: JWT tokens with HTTP-only cookies

## Key Libraries & Dependencies
- **UI Components**: Ionic Angular components + Ionicons
- **Charts**: Chart.js for dashboard analytics
- **PDF Generation**: jsPDF + jsPDF-AutoTable for reports
- **Excel Export**: XLSX for spreadsheet generation
- **Bluetooth**: @capacitor-community/bluetooth-le + cordova plugins
- **HTTP Client**: Angular HttpClient with custom interceptors

## Development Tools
- **Build System**: Angular CLI with Webpack
- **Code Quality**: ESLint with TypeScript rules
- **Testing**: Jasmine + Karma (configured but minimal coverage)
- **Mobile Build**: Capacitor CLI for Android builds

## Common Commands

### Development
```bash
npm start                    # Start dev server (ng serve)
npm run build               # Production build
npm run watch               # Development build with watch mode
npm test                    # Run unit tests
npm run lint                # Run ESLint
```

### Mobile Development
```bash
npx cap add android         # Add Android platform
npx cap sync                # Sync web assets to native
npx cap run android         # Build and run on Android
npx cap open android        # Open in Android Studio
```

### Build Configurations
- **Development**: Source maps, no optimization
- **Production**: Optimized, hashed assets, environment replacement
- **CI**: No progress output for automated builds

## Environment Configuration
- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`
- Build target switching handled automatically

## Native Capabilities
- Bluetooth connectivity for thermal printers
- Android permissions management
- Status bar customization
- HTTPS scheme for Android WebView