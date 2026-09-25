/**
 * Platform Adapter — Abstraction layer for platform-specific functionality.
 *
 * This module defines the interface between the Tarot application and
 * the platform it runs on (web browser, KBZPay Mini App, etc.).
 *
 * The web/default implementation is provided for now.
 * KBZPay-specific implementations can be added behind this boundary
 * when official documentation becomes available.
 *
 * DO NOT invent KBZPay SDK methods, APIs, or authentication flows.
 * Only implement what is actually needed.
 */

export interface UserContext {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ShareOptions {
  title: string;
  text: string;
}

export interface PlatformAdapter {
  /** Get the current user's context, or null if not authenticated */
  getUserContext(): Promise<UserContext | null>;

  /** Close the application (for Mini App environments) */
  closeApp(): void;

  /** Share content using the platform's native sharing mechanism */
  share(options: ShareOptions): Promise<boolean>;

  /** Check if the platform is a Mini App WebView */
  isMiniApp(): boolean;
}

/**
 * Web platform adapter — the default implementation for standard browsers.
 */
export class WebPlatformAdapter implements PlatformAdapter {
  async getUserContext(): Promise<UserContext | null> {
    // In the web version, there's no authenticated user context
    // unless the admin features are used, which is separate
    return null;
  }

  closeApp(): void {
    // Web browsers don't have a "close app" concept
    // This is a no-op for the web implementation
    console.warn("closeApp() is not supported in web environment");
  }

  async share(options: ShareOptions): Promise<boolean> {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(options);
        return true;
      }
      // Fallback to clipboard
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(options.text);
        return true;
      }
    } catch {
      // Sharing not available or user cancelled
    }
    return false;
  }

  isMiniApp(): boolean {
    // Check for WebView indicators
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    return /WebView|MiniApp|KBZPay/i.test(ua) ||
      (typeof window !== "undefined" && window.hasOwnProperty("__kbzpay"));
  }
}

/**
 * Get the appropriate platform adapter for the current environment.
 * Returns WebPlatformAdapter for standard browsers.
 * Can be overridden for Mini App environments.
 */
let currentAdapter: PlatformAdapter | null = null;

export function getPlatformAdapter(): PlatformAdapter {
  if (currentAdapter) return currentAdapter;
  return new WebPlatformAdapter();
}

export function setPlatformAdapter(adapter: PlatformAdapter): void {
  currentAdapter = adapter;
}

/**
 * Check if the current environment is a Mini App WebView.
 */
export function isMiniAppEnvironment(): boolean {
  return getPlatformAdapter().isMiniApp();
}
