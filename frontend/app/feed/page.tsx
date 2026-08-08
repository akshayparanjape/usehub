"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { feed as feedApi, type CaseStudyList } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { CaseStudyCard } from "@/components/case-study-card";
import { RecentlyViewedWidget } from "@/components/recently-viewed";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CaseStudyList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      feedApi.home().then(setItems).finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col items-center text-center gap-4 py-16">
          <h2 className="text-xl font-semibold">Your feed is empty</h2>
          <p className="text-muted-foreground max-w-xs">
            Follow creators to see their case studies here.
          </p>
          <Button asChild>
            <Link href="/discover">Browse discover</Link>
          </Button>
        </div>
        <div className="hidden lg:block">
          <RecentlyViewedWidget />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-2xl font-bold">Your Feed</h1>
        <div className="space-y-4">
          {items.map((cs) => (
            <CaseStudyCard key={cs.id} cs={cs} />
          ))}
        </div>
      </div>
      <div className="hidden lg:block space-y-6">
        <RecentlyViewedWidget />
      </div>
    </div>
  );
}
