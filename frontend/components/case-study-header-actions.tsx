"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CaseStudy, caseStudies, auth, User } from "@/lib/api";
import { ShareModal } from "@/components/share-modal";
import { EditHistoryModal } from "@/components/edit-history-modal";
import { ReportModal } from "@/components/report-modal";
import { Button } from "@/components/ui/button";
import { Flag, History, Pencil, Pin, Share2 } from "lucide-react";
import { toast } from "sonner";

interface CaseStudyHeaderActionsProps {
  caseStudy: CaseStudy;
}

export function CaseStudyHeaderActions({ caseStudy: initialCaseStudy }: CaseStudyHeaderActionsProps) {
  const [cs, setCs] = useState<CaseStudy>(initialCaseStudy);
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pinning, setPinning] = useState(false);

  useEffect(() => {
    // Record view
    caseStudies.trackView(cs.id).catch(() => {});

    // Check user for author matching
    auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, [cs.id]);

  const isAuthor = currentUser?.id === cs.author.id;
  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://usehub.in/${cs.author.handle}/${cs.slug}`;

  const handleTogglePin = async () => {
    setPinning(true);
    try {
      if (cs.is_pinned) {
        await caseStudies.unpin(cs.id);
        setCs((prev) => ({ ...prev, is_pinned: false }));
        toast.success("Unpinned from profile");
      } else {
        await caseStudies.pin(cs.id);
        setCs((prev) => ({ ...prev, is_pinned: true }));
        toast.success("Pinned to top of profile!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update pin state");
    } finally {
      setPinning(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Author Actions: Edit & Pin */}
      {isAuthor && (
        <>
          <Button
            asChild
            variant="default"
            size="sm"
            className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Link href={`/edit/${cs.id}`}>
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Link>
          </Button>

          <Button
            variant={cs.is_pinned ? "secondary" : "outline"}
            size="sm"
            disabled={pinning}
            onClick={handleTogglePin}
            className={`h-8 px-2.5 text-xs flex items-center gap-1.5 ${
              cs.is_pinned ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : ""
            }`}
            title={cs.is_pinned ? "Unpin from profile" : "Pin to profile"}
          >
            <Pin className={`h-3.5 w-3.5 ${cs.is_pinned ? "fill-amber-500 text-amber-500" : ""}`} />
            <span className="hidden sm:inline">{cs.is_pinned ? "Pinned" : "Pin"}</span>
          </Button>
        </>
      )}

      {/* View History Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setHistoryOpen(true)}
        className="h-8 px-2.5 text-xs flex items-center gap-1.5"
        title="View Edit History"
      >
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="hidden sm:inline">History</span>
      </Button>

      {/* Share Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShareOpen(true)}
        className="h-8 px-2.5 text-xs flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
      >
        <Share2 className="h-3.5 w-3.5" />
        <span>Share</span>
      </Button>

      {/* Report Button */}
      {!isAuthor && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setReportOpen(true)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500"
          title="Report Case Study"
        >
          <Flag className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* Modals */}
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={cs.title}
        url={currentUrl}
      />

      <EditHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        caseStudyId={cs.id}
        isAuthor={isAuthor}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="case_study"
        targetId={cs.id}
        targetTitle={cs.title}
      />
    </div>
  );
}
