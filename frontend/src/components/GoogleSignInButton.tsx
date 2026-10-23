import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GOOGLE_CLIENT_ID } from "../config/google";
import { Loader2, AlertCircle, Copy, Check, ExternalLink } from "lucide-react";
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
  const [showOriginHelp, setShowOriginHelp] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

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

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: mode === "signup" ? "signup_with" : "signin_with",
            shape: "rectangular",
            width: 380,
            logo_alignment: "left",
          });
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
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

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2500);
  };

  return (
    <div className={`w-full space-y-2.5 ${className}`}>
      {/* Official Google Identity Services Render Container */}
      <div className="w-full flex items-center justify-center min-h-[44px]">
        {isProcessing ? (
          <div className="w-full py-2.5 px-4 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-300 font-medium text-xs flex items-center justify-center gap-2.5 shadow-xs">
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            <span>Verifying Google account...</span>
          </div>
        ) : (
          <div
            ref={googleBtnContainerRef}
            className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:!mx-auto hover:opacity-95 transition-opacity"
          />
        )}
      </div>

      {/* Origin Configuration Helper Link */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <button
          type="button"
          onClick={() => setShowOriginHelp(!showOriginHelp)}
          className="hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Origin configuration help</span>
        </button>
        <span className="font-mono text-[10px] text-slate-400">{currentOrigin}</span>
      </div>

      {/* Expandable Origin Diagnostic Banner */}
      {showOriginHelp && (
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-300 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-200">
                Fixing "Error 400: origin_mismatch":
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Google requires this exact origin to be listed in your Google Cloud Console under:
                <br />
                <strong>APIs & Services &rarr; Credentials &rarr; OAuth 2.0 Client IDs &rarr; Authorized JavaScript origins</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
            <code className="text-brand-300 font-mono text-[11px]">{currentOrigin}</code>
            <button
              type="button"
              onClick={handleCopyOrigin}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium transition cursor-pointer"
            >
              {copiedOrigin ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy URI</span>
                </>
              )}
            </button>
          </div>

          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 hover:underline pt-0.5"
          >
            <span>Open Google Cloud Credentials Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
