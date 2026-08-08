"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CaseStudyList, RecentlyViewedItem, caseStudies } from "@/lib/api";
import { formatDistanceToNow } from "@/lib/utils";
import { Eye, History, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RecentlyViewedWidget() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caseStudies
      .recentlyViewed(5)
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <History className="h-4 w-4 text-indigo-500" />
        <span>Recently Viewed</span>
      </div>

      <div className="space-y-3 divide-y divide-border/50">
        {items.map((item) => {
          const cs = item.case_study;
          if (!cs) return null;
          return (
            <div key={item.id} className="pt-2.5 first:pt-0 space-y-1">
              <Link
                href={`/${cs.author.handle}/${cs.slug}`}
                className="font-medium text-xs text-foreground hover:underline line-clamp-2 leading-snug"
              >
                {cs.title}
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Avatar className="h-3.5 w-3.5">
                    <AvatarImage src={cs.author.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[8px]">
                      {cs.author.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  @{cs.author.handle}
                </span>
                <span>·</span>
                <span>{formatDistanceToNow(item.viewed_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
