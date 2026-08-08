"use client";

import { useState } from "react";
import { reports } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Flag, X } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "case_study" | "comment" | "user";
  targetId: string;
  targetTitle?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  const [reason, setReason] = useState<"spam" | "inappropriate" | "harassment" | "copyright" | "other">("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await reports.create({
        target_type: targetType,
        target_id: targetId,
        reason,
        details: details.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const targetLabel = targetType === "case_study" ? "Case Study" : targetType === "comment" ? "Comment" : "User";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
            <Flag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight">Report {targetLabel}</h3>
            {targetTitle && (
              <p className="text-xs text-muted-foreground line-clamp-1">&quot;{targetTitle}&quot;</p>
            )}
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-500">
              <Flag className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-base">Report Submitted</h4>
            <p className="text-xs text-muted-foreground">
              Thank you for helping keep UseHub safe. Our team will review this.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Reason for reporting
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as typeof reason)}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              >
                <option value="spam">Spam or misleading</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="harassment">Harassment or hate speech</option>
                <option value="copyright">Copyright infringement</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Provide any additional context..."
                className="w-full bg-muted border border-border rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
