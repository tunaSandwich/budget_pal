# Budget Pal - Claude Code Implementation Guide

## Project Overview
Budget Pal is a personal finance automation platform that connects to bank accounts via Plaid, tracks spending, and sends automated SMS notifications to help users stay on budget.

## Architecture Overview
- **Frontend**: React 18+ with TypeScript, Tailwind CSS, and modern state management
- **Backend**: Node.js with Express, PostgreSQL, Redis for caching
- **External APIs**: Plaid for banking, Twilio for SMS
- **Deployment**: Docker containers, AWS/Vercel for hosting

## Claude Code Development Workflow

### Phase 1: Project Setup & Landing Page
**Prompt for Claude Code:**
```
Create a new React TypeScript project for Budget Pal with the following setup:
- Vite as build tool for fast development
- TypeScript with strict configuration
- Tailwind CSS for styling
- React Router for navigation
- Zustand for state management
- React Hook Form for form handling
- Zod for validation schemas
- ESLint + Prettier for code quality

Project structure:
src/
  components/
    ui/           # Reusable UI components
    layout/       # Layout components
    forms/        # Form components
  pages/          # Page components
  hooks/          # Custom hooks
  stores/         # Zustand stores
  utils/          # Utility functions
  types/          # TypeScript types
  constants/      # App constants

After setup, implement the landing page component following the design specification:
- Hero section with compelling headline and CTA
- Trust & security section with Plaid badges
- How it works section (3 steps)
- Sample SMS messages preview
- Responsive design with mobile-first approach
- Use the exact color palette from design spec (#0698FE primary)
- Implement smooth scroll animations
- SEO-optimized with proper meta tags
```

### Phase 2: Onboarding Flow Components
**Prompt for Claude Code:**
```
Implement the complete onboarding flow with the following components:

1. **GoalSetting Component (/onboarding/goal)**
   - Currency input with real-time formatting
   - Preset amount buttons ($500, $1000, $2000, $5000)
   - Input validation (min: $50, max: $50000)
   - Progress indicator (Step 1 of 4)
   - Form state management with Zustand
   - Error handling and success states

2. **BankConnection Component (/onboarding/bank)**
   - Mock Plaid Link integration
   - Security trust indicators
   - Bank logo grid display
   - Error handling for connection failures
   - Loading states during connection
   - Progress indicator (Step 2 of 4)

3. **SMSConsent Component (/onboarding/sms)**
   - Phone number input with international formatting
   - A2P compliant consent checkbox (never pre-checked)
   - Required legal disclosures
   - Message preview section
   - Form validation ensuring compliance
   - Progress indicator (Step 3 of 4)

4. **Confirmation Component (/onboarding/complete)**
   - Success animation/confetti effect
   - Setup summary card
   - Timeline of what happens next
   - Quick action buttons
   - Support information
   - Celebration UX elements

Use React Hook Form with Zod schemas for validation. Implement proper TypeScript types for all form data. Add loading states and error boundaries.
```

### Phase 3: Shared Components & Design System
**Prompt for Claude Code:**
```
Create a comprehensive design system implementation with these reusable components:

**UI Components in src/components/ui/:**
1. **Button Component**
   - Variants: primary, secondary, ghost, danger
   - Sizes: sm, md, lg, xl
   - States: default, hover, active, disabled, loading
   - TypeScript props with proper typing
   - Tailwind CSS classes matching design spec

2. **Input Component**
   - Types: text, email, tel, number, password
   - States: default, focused, error, disabled
   - Support for icons and labels
   - Validation error display
   - Currency formatting for money inputs

3. **Card Component**
   - Variants: default, elevated, outlined
   - Configurable padding and spacing
   - Hover effects and transitions

4. **ProgressIndicator Component**
   - Step-based progress visualization
   - Current, completed, and upcoming states
   - Mobile-responsive design

5. **Modal Component**
   - Accessible overlay implementation
   - Focus management and escape key handling
   - Animation enter/exit transitions
   - Backdrop click to close

**Form Components in src/components/forms/:**
1. **CurrencyInput** - Specialized money input with formatting
2. **PhoneInput** - International phone number input
3. **ConsentCheckbox** - Legal compliance checkbox component

**Layout Components in src/components/layout/:**
1. **Header** - Navigation with logo and menu
2. **Footer** - Links and legal information
3. **PageLayout** - Consistent page wrapper
4. **OnboardingLayout** - Specialized layout for onboarding flow

Implement all components with:
- Proper TypeScript interfaces
- Accessibility features (ARIA labels, keyboard navigation)
- Error boundaries for graceful error handling
- Storybook stories for component documentation
- Unit tests with React Testing Library
```

### Phase 4: State Management & API Integration
**Prompt for Claude Code:**
```
Implement application state management and API integration:

**Zustand Stores in src/stores/:**
1. **onboardingStore.ts**
   ```typescript
   interface OnboardingState {
     currentStep: number;
     goalAmount: number;
     bankConnection: BankConnection | null;
     phoneNumber: string;
     smsConsent: boolean;
     isComplete: boolean;
     
     // Actions
     setGoalAmount: (amount: number) => void;
     setBankConnection: (connection: BankConnection) => void;
     setPhoneNumber: (phone: string) => void;
     setSMSConsent: (consent: boolean) => void;
     nextStep: () => void;
     previousStep: () => void;
     resetOnboarding: () => void;
   }
   ```

2. **userStore.ts** - User authentication and profile data
3. **notificationStore.ts** - Toast notifications and alerts

**API Integration in src/services/:**
1. **api.ts** - Axios instance with interceptors
2. **onboarding.ts** - Onboarding API calls
3. **plaid.ts** - Mock Plaid integration
4. **sms.ts** - SMS consent and management

**Custom Hooks in src/hooks/:**
1. **useOnboarding** - Onboarding flow logic
2. **useFormValidation** - Form validation with Zod
3. **useLocalStorage** - Persistent state management
4. **useMediaQuery** - Responsive design helper

Implement proper error handling, loading states, and TypeScript typing throughout.
```

### Phase 5: Routing & Navigation
**Prompt for Claude Code:**
```
Implement routing and navigation with React Router v6:

**Router Configuration in src/App.tsx:**
```typescript
const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/onboarding",
    element: <OnboardingLayout />,
    children: [
      { path: "goal", element: <GoalSetting /> },
      { path: "bank", element: <BankConnection /> },
      { path: "sms", element: <SMSConsent /> },
      { path: "complete", element: <Confirmation /> },
    ],
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
```

**Navigation Features:**
- Protected routes for authenticated users
- Onboarding flow step validation
- Smooth transitions between pages
- URL state synchronization
- Back/forward browser navigation handling
- Deep linking support

**URL Structure:**
- `/` - Landing page
- `/onboarding/goal` - Goal setting (Step 1)
- `/onboarding/bank` - Bank connection (Step 2)
- `/onboarding/sms` - SMS consent (Step 3)
- `/onboarding/complete` - Confirmation (Step 4)
- `/dashboard` - User dashboard (future)

Implement route guards to prevent users from skipping onboarding steps.
```

### Phase 6: Testing & Quality Assurance
**Prompt for Claude Code:**
```
Implement comprehensive testing suite:

**Unit Tests with Vitest and React Testing Library:**
1. Component tests for all UI components
2. Hook tests for custom hooks
3. Store tests for Zustand state management
4. Utility function tests

**Integration Tests:**
1. Onboarding flow end-to-end testing
2. Form validation testing
3. API integration testing with MSW (Mock Service Worker)

**Test Configuration:**
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

**Accessibility Testing:**
- axe-core integration for automated a11y testing
- Screen reader compatibility testing
- Keyboard navigation testing

**Performance Testing:**
- Lighthouse CI integration
- Bundle size analysis
- Core Web Vitals monitoring

**Code Quality:**
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

Set up pre-commit hooks with Husky for automated linting and testing.
```

### Phase 7: Performance & Optimization
**Prompt for Claude Code:**
```
Implement performance optimizations:

**Code Splitting:**
- Route-based code splitting with React.lazy()
- Component lazy loading for non-critical components
- Dynamic imports for large libraries

**Bundle Optimization:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-checkbox'],
        },
      },
    },
  },
});
```

**Image Optimization:**
- WebP format with fallbacks
- Responsive images with srcset
- Lazy loading for below-fold images

**Caching Strategy:**
- Service worker for static asset caching
- API response caching with React Query
- Local storage for form data persistence

**Performance Monitoring:**
- Web Vitals tracking
- Error boundary implementation
- Performance budget enforcement

**SEO Optimization:**
- Meta tag management with React Helmet
- Structured data implementation
- Sitemap generation
- Open Graph tags for social sharing
```

### Phase 8: Deployment & DevOps
**Prompt for Claude Code:**
```
Set up deployment pipeline and DevOps:

**Docker Configuration:**
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Environment Configuration:**
```typescript
// src/config/env.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  plaidEnv: import.meta.env.VITE_PLAID_ENV,
  twilioAccountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
} as const;
```

**CI/CD Pipeline (GitHub Actions):**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

**Security Headers:**
```typescript
// Security headers configuration
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
```
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check

# Build Storybook
npm run storybook:build
```

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types allowed
- Proper interface definitions
- Generic type usage where appropriate

### React Best Practices
- Functional components with hooks
- Proper key props for lists
- Memoization with useMemo/useCallback when needed
- Error boundaries for graceful error handling

### Accessibility
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance (4.5:1 minimum)
- Screen reader optimization

### Performance
- Bundle size monitoring (< 250kb gzipped)
- Lighthouse score > 90
- Core Web Vitals optimization
- Progressive enhancement

## Documentation Requirements
- Component documentation with Storybook
- API documentation with TypeScript interfaces
- README with setup instructions
- Architecture decision records (ADRs)

## Security Considerations
- Input validation and sanitization
- XSS prevention
- HTTPS enforcement
- Secure cookie handling
- Content Security Policy implementation

This guide provides Claude Code with comprehensive instructions for building a production-ready Budget Pal frontend following industry best practices and scalable architecture patterns.
