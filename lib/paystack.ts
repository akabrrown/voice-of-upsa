// Paystack payment utilities

export interface PaymentData {
  amount: number;
  email: string;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  success: boolean;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
  error?: unknown;
}

export interface VerificationResponse {
  success: boolean;
  data?: {
    reference: string;
    status: string;
    amount: number;
    paid_at: string;
    customer: unknown;
  };
  error?: unknown;
}

// Initialize payment with Paystack
export async function initializePayment(paymentData: PaymentData): Promise<PaymentResponse> {
  try {
    const response = await fetch('/api/ads/paystack/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data,
      };
    }

    return data;
  } catch (error) {
    console.error('Error initializing payment:', error);
    return {
      success: false,
      error: 'Failed to initialize payment',
    };
  }
}

// Verify payment with Paystack
export async function verifyPayment(reference: string): Promise<VerificationResponse> {
  try {
    const response = await fetch('/api/ads/paystack/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data,
      };
    }

    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: 'Failed to verify payment',
    };
  }
}

// Generate unique payment reference
export function generateReference(prefix = 'VOU'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

// Load Paystack script
export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.body.appendChild(script);
  });
}

// Open Paystack popup
export function openPaystackPopup(options: {
  key: string;
  email: string;
  amount: number;
  reference: string;
  callback: (response: unknown) => void;
  onClose?: () => void;
}): void {
  if (!window.PaystackPop) {
    throw new Error('Paystack script not loaded');
  }

  const handler = window.PaystackPop.setup(options);
  handler.openIframe();
}

// Extend Window interface for Paystack
declare global {
  interface Window {
    PaystackPop: {
      setup(options: {
        key: string;
        email: string;
        amount: number;
        reference: string;
        callback: (response: unknown) => void;
        onClose?: () => void;
      }): {
        openIframe(): void;
      };
    };
  }
}
