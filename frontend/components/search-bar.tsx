"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchSuggestions, feed } from "@/lib/api";
import { Clock, Hash, Search, User as UserIcon, FileText, X, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") || "";
  const initialType = searchParams?.get("type") || "all";

  const [query, setQuery] = useState(initialQ);
  const [filterType, setFilterType] = useState<string>(initialType);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions(null);
      return;
    }

    const timer = setTimeout(() => {
      feed
        .searchSuggestions(query.trim())
        .then((data) => setSuggestions(data))
        .catch(() => setSuggestions(null));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("recent_searches", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem("recent_searches", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleSearch = (searchTerm: string = query, type: string = filterType) => {
    if (!searchTerm.trim()) return;
    saveRecentSearch(searchTerm);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}&type=${type}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search Users, Tags, Case Studies..."
          className="w-full bg-muted/60 hover:bg-muted focus:bg-background border border-transparent focus:border-indigo-500/50 rounded-full pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground transition-all outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSuggestions(null);
            }}
            className="absolute right-3 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Quick Filters Header */}
          <div className="flex items-center gap-1 p-2 bg-muted/40 border-b border-border text-[11px]">
            <span className="font-semibold text-muted-foreground px-2">Type:</span>
            {[
              { id: "all", label: "All" },
              { id: "case_study", label: "Case Studies" },
              { id: "user", label: "Users" },
              { id: "tag", label: "Tags" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setFilterType(t.id);
                  if (query.trim()) handleSearch(query, t.id);
                }}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  filterType === t.id
                    ? "bg-indigo-500 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/50 text-xs">
            {/* Auto Suggestions */}
            {suggestions && (
              <>
                {/* Tags Suggestions */}
                {suggestions.tags.length > 0 && (
                  <div className="py-2 first:pt-0">
                    <div className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Hash className="h-3 w-3 text-indigo-500" /> Tags
                    </div>
                    <div className="flex flex-wrap gap-1 px-2 pt-1">
                      {suggestions.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setQuery(tag);
                            handleSearch(tag, "tag");
                          }}
                          className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 font-medium text-xs flex items-center gap-1 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Suggestions */}
                {suggestions.users.length > 0 && (
                  <div className="py-2">
                    <div className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <UserIcon className="h-3 w-3 text-indigo-500" /> Users
                    </div>
                    {suggestions.users.map((u) => (
                      <Link
                        key={u.handle}
                        href={`/${u.handle}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <span className="font-medium text-foreground">{u.name}</span>
                        <span className="text-[11px] text-muted-foreground">@{u.handle}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Case Studies Suggestions */}
                {suggestions.case_studies.length > 0 && (
                  <div className="py-2">
                    <div className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <FileText className="h-3 w-3 text-indigo-500" /> Case Studies
                    </div>
                    {suggestions.case_studies.map((cs) => (
                      <Link
                        key={cs.id}
                        href={`/${cs.author_handle}/${cs.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/80 transition-colors group"
                      >
                        <span className="font-medium text-foreground line-clamp-1 group-hover:underline">
                          {cs.title}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-2 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Recent Searches
                </div>
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      handleSearch(term);
                    }}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    <span className="font-medium text-foreground">{term}</span>
                    <button
                      onClick={(e) => removeRecentSearch(e, term)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Action */}
            {query.trim() && (
              <div
                onClick={() => handleSearch()}
                className="p-2.5 text-center text-xs font-semibold text-indigo-500 hover:bg-indigo-500/10 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Search for "{query.trim()}"</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
