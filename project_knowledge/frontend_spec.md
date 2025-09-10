# Budget Pal Frontend Technical Specification

## Technology Stack

### Core Technologies
- **React 18.2+** - UI library with concurrent features
- **TypeScript 5.0+** - Static type checking
- **Vite 4.0+** - Build tool and dev server
- **Tailwind CSS 3.3+** - Utility-first CSS framework

### State Management & Forms
- **Zustand 4.3+** - Lightweight state management
- **React Hook Form 7.45+** - Performant form library
- **Zod 3.21+** - TypeScript-first schema validation

### Routing & Navigation
- **React Router 6.14+** - Client-side routing
- **React Helmet Async** - Document head management

### Development & Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing
- **Storybook** - Component documentation

## Project Architecture

### Folder Structure
```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── ProgressIndicator/
│   ├── forms/                 # Form-specific components
│   │   ├── CurrencyInput/
│   │   ├── PhoneInput/
│   │   └── ConsentCheckbox/
│   ├── layout/                # Layout components
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── PageLayout/
│   │   └── OnboardingLayout/
│   └── sections/              # Page section components
│       ├── Hero/
│       ├── TrustSection/
│       └── HowItWorks/
├── pages/                     # Page components
│   ├── LandingPage/
│   ├── onboarding/
│   │   ├── GoalSetting/
│   │   ├── BankConnection/
│   │   ├── SMSConsent/
│   │   └── Confirmation/
│   └── Dashboard/
├── hooks/                     # Custom React hooks
│   ├── useOnboarding.ts
│   ├── useFormValidation.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
├── stores/                    # Zustand stores
│   ├── onboardingStore.ts
│   ├── userStore.ts
│   └── notificationStore.ts
├── services/                  # API services
│   ├── api.ts
│   ├── onboarding.ts
│   ├── plaid.ts
│   └── sms.ts
├── utils/                     # Utility functions
│   ├── formatters.ts
│   ├── validators.ts
│   ├── constants.ts
│   └── helpers.ts
├── types/                     # TypeScript type definitions
│   ├── api.ts
│   ├── forms.ts
│   └── global.ts
├── styles/                    # Global styles
│   ├── globals.css
│   └── components.css
└── assets/                    # Static assets
    ├── images/
    ├── icons/
    └── fonts/
```

## Component Architecture

### Base Component Pattern
```typescript
// components/ui/Button/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
        secondary: 'bg-white text-primary border border-primary hover:bg-primary-light',
        ghost: 'text-gray-700 hover:bg-gray-100',
        danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        xl: 'h-14 px-8 text-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            {/* Loading spinner SVG */}
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button, buttonVariants };
```

### Form Component with Validation
```typescript
// components/forms/CurrencyInput/CurrencyInput.tsx
import { forwardRef } from 'react';
import { UseControllerProps, useController } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { formatCurrency, parseCurrency } from '@/utils/formatters';

interface CurrencyInputProps extends UseControllerProps {
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ name, control, rules, placeholder, disabled, min = 0, max = 1000000, ...props }, ref) => {
    const {
      field: { onChange, onBlur, value, ref: fieldRef },
      fieldState: { error },
    } = useController({
      name,
      control,
      rules: {
        required: 'Amount is required',
        min: { value: min, message: `Minimum amount is ${formatCurrency(min)}` },
        max: { value: max, message: `Maximum amount is ${formatCurrency(max)}` },
        ...rules,
      },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9.]/g, '');
      const numericValue = parseCurrency(rawValue);
      onChange(numericValue);
    };

    return (
      <Input
        ref={fieldRef}
        type="text"
        placeholder={placeholder}
        value={formatCurrency(value || 0)}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        error={error?.message}
        leftIcon="$"
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
export { CurrencyInput };
```

## State Management

### Zustand Store Pattern
```typescript
// stores/onboardingStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BankConnection } from '@/types/api';

interface OnboardingState {
  // State
  currentStep: number;
  goalAmount: number | null;
  bankConnection: BankConnection | null;
  phoneNumber: string;
  smsConsent: boolean;
  isComplete: boolean;
  
  // Computed
  canProceed: () => boolean;
  completionPercentage: () => number;
  
  // Actions
  setGoalAmount: (amount: number) => void;
  setBankConnection: (connection: BankConnection) => void;
  setPhoneNumber: (phone: string) => void;
  setSMSConsent: (consent: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  resetOnboarding: () => void;
  completeOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 1,
      goalAmount: null,
      bankConnection: null,
      phoneNumber: '',
      smsConsent: false,
      isComplete: false,

      // Computed values
      canProceed: () => {
        const state = get();
        switch (state.currentStep) {
          case 1:
            return state.goalAmount !== null && state.goalAmount >= 50;
          case 2:
            return state.bankConnection !== null;
          case 3:
            return state.phoneNumber !== '' && state.smsConsent;
          default:
            return true;
        }
      },

      completionPercentage: () => {
        const state = get();
        let completed = 0;
        if (state.goalAmount !== null) completed += 25;
        if (state.bankConnection !== null) completed += 25;
        if (state.phoneNumber && state.smsConsent) completed += 50;
        return completed;
      },

      // Actions
      setGoalAmount: (amount) =>
        set((state) => ({ goalAmount: amount })),

      setBankConnection: (connection) =>
        set((state) => ({ bankConnection: connection })),

      setPhoneNumber: (phone) =>
        set((state) => ({ phoneNumber: phone })),

      setSMSConsent: (consent) =>
        set((state) => ({ smsConsent: consent })),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 4),
        })),

      previousStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      goToStep: (step) =>
        set((state) => ({ currentStep: step })),

      resetOnboarding: () =>
        set(() => ({
          currentStep: 1,
          goalAmount: null,
          bankConnection: null,
          phoneNumber: '',
          smsConsent: false,
          isComplete: false,
        })),

      completeOnboarding: () =>
        set((state) => ({ isComplete: true, currentStep: 4 })),
    }),
    {
      name: 'budget-pal-onboarding',
      partialize: (state) => ({
        goalAmount: state.goalAmount,
        bankConnection: state.bankConnection,
        phoneNumber: state.phoneNumber,
        smsConsent: state.smsConsent,
      }),
    }
  )
);
```

### Custom Hook for Onboarding Logic
```typescript
// hooks/useOnboarding.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { submitOnboarding } from '@/services/onboarding';

export const useOnboarding = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    canProceed,
    nextStep,
    previousStep,
    completeOnboarding,
    ...state
  } = useOnboardingStore();

  const handleNext = useCallback(async () => {
    if (!canProceed()) return;

    if (currentStep === 3) {
      // Final step - submit data
      try {
        await submitOnboarding({
          goalAmount: state.goalAmount!,
          bankConnection: state.bankConnection!,
          phoneNumber: state.phoneNumber,
          smsConsent: state.smsConsent,
        });
        completeOnboarding();
        navigate('/onboarding/complete');
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        // Handle error
      }
    } else {
      nextStep();
      navigate(`/onboarding/${getStepPath(currentStep + 1)}`);
    }
  }, [currentStep, canProceed, state, navigate, completeOnboarding]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      previousStep();
      navigate(`/onboarding/${getStepPath(currentStep - 1)}`);
    } else {
      navigate('/');
    }
  }, [currentStep, previousStep, navigate]);

  return {
    ...state,
    currentStep,
    canProceed: canProceed(),
    handleNext,
    handlePrevious,
  };
};

const getStepPath = (step: number): string => {
  const paths = ['', 'goal', 'bank', 'sms', 'complete'];
  return paths[step] || 'goal';
};
```

## Form Validation Schemas

### Zod Validation Schemas
```typescript
// utils/validators.ts
import { z } from 'zod';

export const goalSettingSchema = z.object({
  goalAmount: z
    .number()
    .min(50, 'Minimum goal amount is $50')
    .max(50000, 'Maximum goal amount is $50,000'),
});

export const smsConsentSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
  smsConsent: z
    .boolean()
    .refine((val) => val === true, 'You must consent to receive SMS messages'),
});

export const bankConnectionSchema = z.object({
  institutionId: z.string().min(1, 'Please select a bank'),
  accountId: z.string().min(1, 'Account selection is required'),
  accessToken: z.string().min(1, 'Bank connection failed'),
});

export type GoalSettingFormData = z.infer<typeof goalSettingSchema>;
export type SMSConsentFormData = z.infer<typeof smsConsentSchema>;
export type BankConnectionFormData = z.infer<typeof bankConnectionSchema>;
```

## API Integration

### API Service Layer
```typescript
// services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T>(url: string): Promise<T> {
    const response = await this.api.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return response.data;
  }
}

export const apiService = new ApiService();
```

### Onboarding API Service
```typescript
// services/onboarding.ts
import { apiService } from './api';
import { BankConnection, OnboardingData, OnboardingResponse } from '@/types/api';

export const onboardingService = {
  async submitGoal(goalAmount: number): Promise<{ success: boolean }> {
    return apiService.post('/onboarding/goal', { goalAmount });
  },

  async connectBank(plaidData: any): Promise<BankConnection> {
    return apiService.post('/onboarding/bank', plaidData);
  },

  async submitSMSConsent(data: {
    phoneNumber: string;
    consent: boolean;
  }): Promise<{ success: boolean }> {
    return apiService.post('/onboarding/sms', data);
  },

  async completeOnboarding(data: OnboardingData): Promise<OnboardingResponse> {
    return apiService.post('/onboarding/complete', data);
  },

  async getOnboardingStatus(): Promise<{
    currentStep: number;
    isComplete: boolean;
    data: Partial<OnboardingData>;
  }> {
    return apiService.get('/onboarding/status');
  },
};
```

## Testing Strategy

### Component Testing with React Testing Library
```typescript
// components/ui/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('applies correct variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white', 'text-primary', 'border-primary');
  });
});
```

### Hook Testing
```typescript
// hooks/useOnboarding.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboarding } from './useOnboarding';

// Mock router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('useOnboarding', () => {
  beforeEach(() => {
    // Reset store state
    useOnboardingStore.getState().resetOnboarding();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useOnboarding());
    
    expect(result.current.currentStep).toBe(1);
    expect(result.current.goalAmount).toBeNull();
    expect(result.current.canProceed).toBe(false);
  });

  it('allows proceeding when goal amount is set', () => {
    const { result } = renderHook(() => useOnboarding());
    
    act(() => {
      useOnboardingStore.getState().setGoalAmount(1000);
    });

    expect(result.current.canProceed).toBe(true);
  });
});
```

### Integration Testing
```typescript
// pages/onboarding/GoalSetting/GoalSetting.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { GoalSetting } from './GoalSetting';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('GoalSetting Integration', () => {
  it('completes goal setting flow', async () => {
    renderWithRouter(<GoalSetting />);

    // Enter goal amount
    const input = screen.getByLabelText(/monthly spending goal/i);
    fireEvent.change(input, { target: { value: '1000' } });

    // Click continue
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).not.toBeDisabled();
    
    fireEvent.click(continueButton);

    // Verify navigation (would need router mock)
    await waitFor(() => {
      // Assertions for navigation or state changes
    });
  });
});
```

## Performance Optimization

### Code Splitting and Lazy Loading
```typescript
// App.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const GoalSetting = lazy(() => import('@/pages/onboarding/GoalSetting'));
const BankConnection = lazy(() => import('@/pages/onboarding/BankConnection'));
const SMSConsent = lazy(() => import('@/pages/onboarding/SMSConsent'));
const Confirmation = lazy(() => import('@/pages/onboarding/Confirmation'));

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <LandingPage />
        </Suspense>
      </ErrorBoundary>
    ),
  },
  {
    path: '/onboarding',
    children: [
      {
        path: 'goal',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <GoalSetting />
          </Suspense>
        ),
      },
      // ... other routes
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

### Memoization and Performance
```typescript
// components/sections/HowItWorks/HowItWorks.tsx
import { memo, useMemo } from 'react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Connect your bank securely',
    description: 'Link your account through our secure Plaid integration',
    icon: '🏦',
  },
  {
    id: 2,
    title: 'Set your spending goals',
    description: 'Define monthly budgets that work for your lifestyle',
    icon: '🎯',
  },
  {
    id: 3,
    title: 'Get daily text updates',
    description: 'Receive spending insights without opening any apps',
    icon: '📱',
  },
];

const HowItWorks = memo(() => {
  const stepElements = useMemo(
    () =>
      steps.map((step) => (
        <div key={step.id} className="text-center">
          <div className="text-4xl mb-4">{step.icon}</div>
          <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
          <p className="text-gray-600">{step.description}</p>
        </div>
      )),
    []
  );

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How it Works</h2>
        <div className="grid md:grid-cols-3 gap-8">{stepElements}</div>
      </div>
    </section>
  );
});

HowItWorks.displayName = 'HowItWorks';
export { HowItWorks };
```

## Accessibility Implementation

### Focus Management and ARIA
```typescript
// components/ui/Modal/Modal.tsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useKeyPress } from '@/hooks/useKeyPress';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useKeyPress('Escape', onClose);

  useEffect(() => {
    if (isOpen) {
      // Store currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus modal
      modalRef.current?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus
      previousActiveElement.current?.focus();
      
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4"
        tabIndex={-1}
      >
        <h2 id="modal-title" className="text-xl font-semibold mb-4">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body
  );
};
```

## Build Configuration

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          forms: ['react-hook-form', 'zod'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-checkbox'],
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Environment Configuration

### Environment Variables
```bash
# .env.local
VITE_API_URL=http://localhost:3001/api
VITE_PLAID_ENV=sandbox
VITE_PLAID_PUBLIC_KEY=your_plaid_public_key
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_APP_VERSION=1.0.0
```

### Environment Type Safety
```typescript
// types/env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PLAID_ENV: 'sandbox' | 'development' | 'production';
  readonly VITE_PLAID_PUBLIC_KEY: string;
  readonly VITE_TWILIO_ACCOUNT_SID: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## Performance Monitoring

### Web Vitals Tracking
```typescript
// utils/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  // Send to your analytics service
  console.log(metric);
};

export const initWebVitals = () => {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
};

// Initialize in main.tsx
// initWebVitals();
```

This frontend specification provides a comprehensive, scalable architecture for Budget Pal with modern React patterns, TypeScript safety, and production-ready practices.
