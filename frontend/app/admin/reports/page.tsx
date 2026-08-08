"use client";

import { useEffect, useState } from "react";
import { ReportItem, reports } from "@/lib/api";
import { formatDistanceToNow } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Flag, Shield, XCircle } from "lucide-react";

export default function AdminReportsPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReports = () => {
    setLoading(true);
    reports
      .list(statusFilter === "all" ? undefined : statusFilter, 50, 0)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await reports.updateStatus(id, newStatus);
      fetchReports();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Moderation Reports</h1>
            <p className="text-xs text-muted-foreground">Review flagged content and user reports</p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg text-xs">
          {["pending", "reviewed", "resolved", "dismissed", "all"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                statusFilter === status
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading reports...</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
          <h3 className="font-semibold text-base">No reports found</h3>
          <p className="text-xs text-muted-foreground">
            No moderation reports match the selected filter standard.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-sm hover:border-indigo-500/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-xs">
                    <Flag className="h-3 w-3 mr-1 text-rose-500" />
                    {item.target_type.replace("_", " ")}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`text-xs font-semibold capitalize ${
                      item.status === "pending"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : item.status === "resolved"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(item.created_at)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Reason: <span className="text-foreground capitalize">{item.reason}</span>
                </div>
                {item.details && (
                  <p className="text-xs text-foreground/90 bg-muted/50 p-2.5 rounded-lg font-mono">
                    "{item.details}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <div className="text-muted-foreground">
                  Reporter: <strong className="text-foreground">@{item.reporter.handle}</strong> ({item.reporter.name})
                </div>

                <div className="flex items-center gap-2">
                  {item.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingId === item.id}
                      onClick={() => handleUpdateStatus(item.id, "resolved")}
                      className="h-7 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                    >
                      Resolve
                    </Button>
                  )}
                  {item.status !== "dismissed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={updatingId === item.id}
                      onClick={() => handleUpdateStatus(item.id, "dismissed")}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
