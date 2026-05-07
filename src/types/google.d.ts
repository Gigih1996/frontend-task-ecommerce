/**
 * Minimal type definitions for Google Identity Services (GIS) — the `google.accounts.id`
 * namespace exposed by https://accounts.google.com/gsi/client.
 */
export {};

declare global {
  interface Window {
    google?: typeof google;
  }

  namespace google.accounts.id {
    interface CredentialResponse {
      credential: string;
      select_by?: string;
      clientId?: string;
    }

    interface IdConfiguration {
      client_id: string;
      callback: (response: CredentialResponse) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
      context?: 'signin' | 'signup' | 'use';
      ux_mode?: 'popup' | 'redirect';
      use_fedcm_for_prompt?: boolean;
    }

    interface GsiButtonConfiguration {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number;
      locale?: string;
    }

    function initialize(config: IdConfiguration): void;
    function renderButton(
      element: HTMLElement,
      options: GsiButtonConfiguration
    ): void;
    function prompt(notification?: (n: unknown) => void): void;
    function cancel(): void;
    function disableAutoSelect(): void;
  }
}
