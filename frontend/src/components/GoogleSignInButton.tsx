import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GOOGLE_CLIENT_ID } from "../config/google";
import { Loader2 } from "lucide-react";
import type { AuthResponse } from "../types/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: string | number;
              logo_alignment?: "left" | "center";
            }
          ) => void;
          prompt: (momentListener?: (moment: any) => void) => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  mode?: "signin" | "signup";
  onSuccess?: (res: AuthResponse) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = "signin",
  onSuccess,
  onError,
  className = "",
}) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const hiddenButtonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      if (!response.credential) {
        const msg = "No credential received from Google.";
        if (onError) onError(msg);
        return;
      }

      setIsProcessing(true);
      try {
        const authData = await loginWithGoogle(response.credential);
        if (onSuccess) {
          onSuccess(authData);
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err: any) {
        const msg =
          err instanceof Error
            ? err.message
            : "Google authentication failed. Please try again.";
        if (onError) onError(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [loginWithGoogle, navigate, onSuccess, onError]
  );

  // Initialize Google Identity Services
  useEffect(() => {
    let checkInterval: number;

    const initGsi = () => {
      if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          cancel_on_tap_outside: true,
        });

        // Render official Google button into hidden container for popup trigger fallback
        if (hiddenButtonRef.current) {
          hiddenButtonRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(hiddenButtonRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: mode === "signup" ? "signup_with" : "signin_with",
            shape: "rectangular",
            width: 320,
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      // Poll briefly for GIS script load
      checkInterval = window.setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGsi();
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [handleCredentialResponse, mode]);

  const handleCustomButtonClick = () => {
    if (isProcessing) return;

    if (window.google?.accounts?.id) {
      // Trigger prompt / One Tap
      window.google.accounts.id.prompt((moment: any) => {
        if (moment.isNotDisplayed() || moment.isSkippedMoment()) {
          // If One Tap is suppressed or skipped, click the hidden rendered button
          const googleBtn = hiddenButtonRef.current?.querySelector<HTMLElement>(
            "div[role=button], iframe"
          );
          if (googleBtn) {
            googleBtn.click();
          }
        }
      });
    } else {
      alert("Google Identity Services is currently loading. Please check your internet connection.");
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden container where GIS renders the official iframe button */}
      <div
        ref={hiddenButtonRef}
        className="sr-only pointer-events-none"
        aria-hidden="true"
      />

      {/* Styled Enterprise Button */}
      <button
        type="button"
        onClick={handleCustomButtonClick}
        disabled={isProcessing}
        className="w-full py-2.5 px-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-xl text-slate-200 hover:text-white font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none cursor-pointer group"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
        ) : (
          <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>
          {isProcessing
            ? "Verifying with Google..."
            : mode === "signup"
            ? "Sign up with Google"
            : "Sign in with Google"}
        </span>
      </button>
    </div>
  );
};
