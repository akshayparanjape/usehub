"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CaseStudyCard } from "@/components/case-study-card";
import { SearchResults, Tag, UserMinimal, feed } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hash, Search, User as UserIcon, FileText, Frown } from "lucide-react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const initialType = searchParams?.get("type") || "all";

  const [activeTab, setActiveTab] = useState<string>(initialType);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    feed
      .search(query, activeTab, 30, 0)
      .then((data) => setResults(data))
      .catch((err) => setError(err.message || "Failed to load search results"))
      .finally(() => setLoading(false));
  }, [query, activeTab]);

  if (!query) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <Search className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold">Search UseHub</h1>
        <p className="text-sm text-muted-foreground">
          Enter a keyword in the search bar above to discover case studies, users, and tags.
        </p>
      </div>
    );
  }

  const caseStudies = results?.case_studies || [];
  const users = results?.users || [];
  const tags = results?.tags || [];

  const totalResults = caseStudies.length + users.length + tags.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>Results for</span>
          <span className="text-indigo-500 font-mono">"{query}"</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Found {totalResults} result{totalResults !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {[
          { id: "all", label: "All Results", icon: Search },
          { id: "case_study", label: `Case Studies (${caseStudies.length})`, icon: FileText },
          { id: "user", label: `Users (${users.length})`, icon: UserIcon },
          { id: "tag", label: `Tags (${tags.length})`, icon: Hash },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-indigo-500 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results Content */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Searching for "{query}"...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-destructive">{error}</div>
      ) : totalResults === 0 ? (
        <div className="py-16 text-center space-y-3">
          <Frown className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">No results found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try searching for something else or changing your search filters.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tags Section */}
          {(activeTab === "all" || activeTab === "tag") && tags.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Hash className="h-4 w-4 text-indigo-500" /> Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((t: Tag) => (
                  <Link key={t.id} href={`/search?q=${encodeURIComponent(t.name)}&type=tag`}>
                    <Badge variant="secondary" className="px-3 py-1 text-xs hover:bg-indigo-500/20 transition-colors">
                      #{t.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Users Section */}
          {(activeTab === "all" || activeTab === "user") && users.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserIcon className="h-4 w-4 text-indigo-500" /> Users
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u: UserMinimal) => (
                  <Link
                    key={u.id}
                    href={`/${u.handle}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-indigo-500/30 transition-all"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.avatar_url ?? undefined} />
                      <AvatarFallback>{u.name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-sm leading-tight hover:underline">{u.name}</h4>
                      <p className="text-xs text-muted-foreground">@{u.handle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Case Studies Section */}
          {(activeTab === "all" || activeTab === "case_study") && caseStudies.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-500" /> Case Studies
              </h2>
              <div className="space-y-4">
                {caseStudies.map((cs) => (
                  <CaseStudyCard key={cs.id} cs={cs} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
