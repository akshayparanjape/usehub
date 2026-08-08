"use client";

import { useEffect, useState } from "react";
import { CaseStudyVersion, CaseStudyVersionDetail, caseStudies } from "@/lib/api";
import { formatDistanceToNow } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { History, RotateCcw, X, Clock, FileText, CheckCircle2 } from "lucide-react";

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseStudyId: string;
  isAuthor: boolean;
  onRestored?: () => void;
}

export function EditHistoryModal({
  isOpen,
  onClose,
  caseStudyId,
  isAuthor,
  onRestored,
}: EditHistoryModalProps) {
  const [versions, setVersions] = useState<CaseStudyVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [versionDetail, setVersionDetail] = useState<CaseStudyVersionDetail | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && caseStudyId) {
      setLoading(true);
      setError(null);
      caseStudies
        .versions(caseStudyId)
        .then((data) => {
          setVersions(data);
          if (data.length > 0) {
            setSelectedVersionId(data[0].id);
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to load history");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, caseStudyId]);

  useEffect(() => {
    if (caseStudyId && selectedVersionId) {
      caseStudies
        .versionDetail(caseStudyId, selectedVersionId)
        .then((detail) => setVersionDetail(detail))
        .catch(() => setVersionDetail(null));
    }
  }, [caseStudyId, selectedVersionId]);

  if (!isOpen) return null;

  const handleRestore = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore this version? This will create a new current version.")) {
      return;
    }
    setRestoring(true);
    try {
      await caseStudies.restoreVersion(caseStudyId, versionId);
      if (onRestored) onRestored();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to restore version");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">Version History</h3>
              <p className="text-xs text-muted-foreground">GitHub-style edit history and restoration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: List of Versions */}
          <div className="w-1/3 border-r border-border overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading history...</div>
            ) : error ? (
              <div className="py-8 text-center text-xs text-destructive">{error}</div>
            ) : versions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No versions found</div>
            ) : (
              versions.map((ver, index) => {
                const isSelected = ver.id === selectedVersionId;
                const isLatest = index === 0;
                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500/40 text-foreground"
                        : "bg-muted/30 hover:bg-muted/60 border-transparent text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        Version {ver.version_number}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Current
                        </span>
                      )}
                    </div>
                    {ver.title && (
                      <p className="text-xs font-medium line-clamp-1 text-foreground/90">
                        {ver.title}
                      </p>
                    )}
                    <p className="text-[11px] line-clamp-1 italic">
                      {ver.change_message || "Updated"}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span>{formatDistanceToNow(ver.created_at)}</span>
                      {ver.edited_by && (
                        <span className="font-medium text-foreground">@{ver.edited_by.handle}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Version Preview */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/10">
            {versionDetail ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-base">Version {versionDetail.version_number}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(versionDetail.created_at)}
                      </span>
                    </div>
                    {versionDetail.title && (
                      <p className="text-sm font-medium mt-1 text-foreground">{versionDetail.title}</p>
                    )}
                    {versionDetail.edited_by && (
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={versionDetail.edited_by.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[10px]">
                            {versionDetail.edited_by.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          Edited by <strong className="text-foreground">{versionDetail.edited_by.name}</strong> (@{versionDetail.edited_by.handle})
                        </span>
                      </div>
                    )}
                  </div>

                  {isAuthor && versionDetail.version_number !== versions[0]?.version_number && (
                    <Button
                      size="sm"
                      onClick={() => handleRestore(versionDetail.id)}
                      disabled={restoring}
                      className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{restoring ? "Restoring..." : "Restore Version"}</span>
                    </Button>
                  )}
                </div>

                {/* Prompt Preview */}
                {versionDetail.content?.prompt && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> Prompt
                    </label>
                    <div className="bg-card p-3 rounded-lg border text-xs font-mono whitespace-pre-wrap">
                      {versionDetail.content.prompt}
                    </div>
                  </div>
                )}

                {/* Final Output Preview */}
                {versionDetail.content?.final_output && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Final Output
                    </label>
                    <div className="bg-card p-3 rounded-lg border text-xs font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">
                      {versionDetail.content.final_output}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Select a version from the left panel to inspect details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
