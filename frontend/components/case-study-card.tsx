import Link from "next/link";
import { type CaseStudyList } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, Heart, MessageCircle, Pin, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface Props {
  cs: CaseStudyList;
  rank?: number;
  canPin?: boolean;
  onPinToggle?: (id: string, currentlyPinned: boolean) => void;
}

export function CaseStudyCard({ cs, rank, canPin, onPinToggle }: Props) {
  const totalReactions = cs.likes_count + cs.applause_count + cs.aha_count;

  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow relative">
      {cs.has_reports && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Under Moderation Review (Reported)</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {rank !== undefined && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              rank === 1
                ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                : rank === 2
                ? "bg-slate-300/20 text-slate-400 border border-slate-400/30"
                : rank === 3
                ? "bg-amber-700/20 text-amber-600 border border-amber-700/30"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            #{rank}
          </span>
        )}
        <Avatar className="h-7 w-7">
          <AvatarImage src={cs.author.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">
            {cs.author.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Link
          href={`/${cs.author.handle}`}
          className="text-sm font-medium hover:underline"
        >
          {cs.author.name}
        </Link>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">
          {cs.published_at ? formatDistanceToNow(cs.published_at) : "Draft"}
        </span>

        {cs.is_pinned && (
          <Badge
            variant="secondary"
            className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-medium flex items-center gap-1 ml-auto"
          >
            <Pin className="h-3 w-3 fill-indigo-500/30" />
            Pinned
          </Badge>
        )}

        {cs.is_draft ? (
          <Badge
            variant="outline"
            className={`text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium ${
              cs.is_pinned ? "" : "ml-auto"
            }`}
          >
            Draft
          </Badge>
        ) : (
          cs.ai_model && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {cs.ai_model}
              </span>
            </>
          )
        )}

        {canPin && onPinToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPinToggle(cs.id, cs.is_pinned)}
            className={`h-7 px-2 text-xs flex items-center gap-1 ${
              cs.is_pinned ? "text-indigo-500 hover:text-indigo-600" : "text-muted-foreground hover:text-foreground"
            } ${!cs.is_pinned && !cs.is_draft ? "ml-auto" : ""}`}
            title={cs.is_pinned ? "Unpin from profile" : "Pin to profile"}
          >
            <Pin className="h-3.5 w-3.5" />
            <span>{cs.is_pinned ? "Unpin" : "Pin"}</span>
          </Button>
        )}
      </div>

      <div>
        <Link
          href={`/${cs.author.handle}/${cs.slug}`}
          className="font-semibold text-base hover:underline leading-snug"
        >
          {cs.title}
        </Link>
        {cs.summary && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {cs.summary}
          </p>
        )}
      </div>

      {cs.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {cs.tags.slice(0, 5).map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" />
          {totalReactions}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {cs.comments_count}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {cs.views_count || 0}
        </span>
      </div>
    </article>
  );
}
