import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { caseStudies as csApi, users as usersApi } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReactionBar } from "@/components/reaction-bar";
import { Comments } from "@/components/comments";
import { FollowButton } from "@/components/follow-button";
import { CaseStudyHeaderActions } from "@/components/case-study-header-actions";
import { formatDistanceToNow } from "@/lib/utils";
import { AlertTriangle, Sparkles } from "lucide-react";

interface Props {
  params: Promise<{ handle: string; slug: string }>;
}

export default async function CaseStudyPage({ params }: Props) {
  const { handle, slug } = await params;
  const cookieHeader = (await cookies()).toString();

  const authorUser = await usersApi.getByHandle(handle, { Cookie: cookieHeader }).catch(() => null);

  const list = await csApi.byUser(handle, 20, undefined, { Cookie: cookieHeader }).catch(() => []);
  const listItem = list.find((cs) => cs.slug === slug);
  if (!listItem) notFound();

  const cs = await csApi.get(listItem.id, { Cookie: cookieHeader }).catch(() => null);
  if (!cs) notFound();

  const content = cs.content;

  return (
    <div className="max-w-3xl space-y-8">
      {cs.has_reports && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200 animate-in fade-in duration-200">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <div className="text-sm">
            <strong className="font-semibold block">⚠️ Under Moderation Review</strong>
            <span>This case study has received community reports and is currently being reviewed by moderators.</span>
          </div>
        </div>
      )}

      {cs.is_draft && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
              Draft
            </Badge>
            <span className="text-sm font-medium">This case study is private to you and not visible in public feed.</span>
          </div>
          <Link href={`/edit/${cs.id}`} className="text-sm font-semibold hover:underline">
            Edit Draft &rarr;
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={`/${cs.author.handle}`}
              className="flex items-center gap-2 hover:text-foreground font-semibold text-foreground transition-colors"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={cs.author.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {cs.author.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {cs.author.name}
            </Link>
            <span>·</span>
            <span>
              {cs.published_at
                ? formatDistanceToNow(cs.published_at)
                : "Draft"}
            </span>
            {cs.ai_model && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  {cs.ai_model}
                  {cs.ai_platform && ` · ${cs.ai_platform}`}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <FollowButton
              handle={cs.author.handle}
              initialIsFollowing={authorUser?.is_following ?? false}
            />
            <CaseStudyHeaderActions caseStudy={cs} />
          </div>
        </div>

        <h1 className="text-3xl font-bold leading-tight">{cs.title}</h1>

        {cs.summary && (
          <p className="text-muted-foreground text-lg leading-relaxed">
            {cs.summary}
          </p>
        )}

        {cs.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {cs.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Content */}
      {content && (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Prompt</h2>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {content.prompt}
            </div>
          </section>

          {content.iterations.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">
                Iterations ({content.iterations.length})
              </h2>
              <div className="space-y-4">
                {content.iterations.map((iter, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                      Iteration {idx + 1}
                    </div>
                    <div className="divide-y">
                      <div className="p-4 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Input</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {iter.input}
                        </p>
                      </div>
                      <div className="p-4 space-y-1 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground">Output</p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {iter.output}
                        </p>
                      </div>
                      {iter.notes && (
                        <div className="p-4 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Notes</p>
                          <p className="text-sm text-muted-foreground">
                            {iter.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Final Output</h2>
            <div className="rounded-lg border p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {content.final_output}
            </div>
          </section>
        </div>
      )}

      <Separator />

      {/* Reactions */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">React to this case study</p>
        <ReactionBar caseStudyId={cs.id} />
      </div>

      <Separator />

      {/* Comments */}
      <Comments caseStudyId={cs.id} />
    </div>
  );
}
