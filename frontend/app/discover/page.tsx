"use client";

import { useEffect, useState } from "react";
import { feed as feedApi, type CaseStudyList, type SearchResults } from "@/lib/api";
import { CaseStudyCard } from "@/components/case-study-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Flame, Search } from "lucide-react";

type Timeframe = "today" | "week" | "month" | "all";

export default function DiscoverPage() {
  const [trending, setTrending] = useState<CaseStudyList[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setLoading(true);
    feedApi
      .discover(20, timeframe)
      .then(setTrending)
      .finally(() => setLoading(false));}, 0);
      return () => clearTimeout(timer);
  }, [timeframe]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }
      setSearching(true);
      try {
        const res = await feedApi.search(query.trim());
        setResults(res);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const displayItems = results?.case_studies ?? trending;

  const timeframeOptions: { label: string; value: Timeframe }[] = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "All Time", value: "all" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-amber-500 fill-amber-500/20" />
          <h1 className="text-2xl font-bold">Discover</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Trending AI case studies ranked by community interaction
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search case studies and creators..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!query && (
        <div className="flex items-center gap-2 border-b pb-3">
          <span className="text-xs text-muted-foreground font-medium mr-1">Timeframe:</span>
          {timeframeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={timeframe === opt.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeframe(opt.value)}
              className="text-xs h-7 rounded-full px-3"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      {results?.users && results.users.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">People</h2>
          <div className="flex flex-wrap gap-2">
            {results.users.map((u) => (
              <a
                key={u.id}
                href={`/${u.handle}`}
                className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium">{u.name}</span>
                <span className="text-xs text-muted-foreground">@{u.handle}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {query ? "No case studies found" : "No trending case studies found for this timeframe"}
        </div>
      ) : (
        <div className="space-y-4">
          {!query && (
            <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <span>Top {timeframeOptions.find((t) => t.value === timeframe)?.label} Case Studies</span>
            </h2>
          )}
          {displayItems.map((cs, idx) => (
            <CaseStudyCard key={cs.id} cs={cs} rank={!query ? idx + 1 : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
