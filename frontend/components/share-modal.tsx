"use client";

import { useState } from "react";
import { Check, Copy, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        });
      } catch {
        // Ignored if user cancels share sheet
      }
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`Check out "${title}" on UseHub!`);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight">Share Case Study</h3>
            <p className="text-xs text-muted-foreground">Share this workflow with your network</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Share Link Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 bg-muted text-xs font-mono px-3 py-2.5 rounded-lg border border-border focus:outline-none select-all"
            />
            <Button
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-1.5 shrink-0 min-w-[90px]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium text-xs transition-colors border border-slate-700/50"
            >
              <svg className="h-4 w-4 fill-current text-sky-400" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Share on X</span>
            </a>

            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0A66C2] hover:bg-[#08529c] text-white font-medium text-xs transition-colors"
            >
              <svg className="h-4 w-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.6 1.6 0 1 0 1.6 1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
              </svg>
              <span>Share on LinkedIn</span>
            </a>
          </div>

          {/* Mobile Native Share */}
          {hasNativeShare && (
            <div className="pt-1">
              <Button
                variant="outline"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 text-xs py-2.5"
              >
                <Share2 className="h-4 w-4" />
                <span>More Share Options</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
