"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { caseStudies, RecentlyViewedItem } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { CaseStudyCard } from "@/components/case-study-card";
import { Clock, History } from "lucide-react";

export default function RecentlyViewedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      caseStudies
        .recentlyViewed(30)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Recently Viewed</h1>
          <p className="text-xs text-muted-foreground">
            Case studies you have recently read or explored
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <History className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">No recent history</h3>
          <p className="text-xs text-muted-foreground">
            As you explore case studies across UseHub, your history will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <CaseStudyCard key={item.id} cs={item.case_study} />
          ))}
        </div>
      )}
    </div>
  );
}
