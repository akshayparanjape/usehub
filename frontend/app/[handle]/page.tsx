import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { caseStudies as csApi, users as usersApi } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CaseStudyCard } from "@/components/case-study-card";
import { FollowButton } from "@/components/follow-button";
import { Briefcase, CalendarDays, Code2, Globe, MapPin, Wrench } from "lucide-react";

interface Props {
  params: Promise<{ handle: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;

  let user;
  try {
    const cookieStore = await cookies();

    user = await usersApi.getByHandle(handle, {
      Cookie: cookieStore.toString(),
    });
  } catch {
    notFound();
  }

  const caseStudyList = await csApi
    .byUser(handle)
    .catch(() => []);

  const profile = user.profile;

  // Separate pinned case study from others
  const pinnedCaseStudy = caseStudyList.find((cs) => cs.is_pinned);
  const otherCaseStudies = caseStudyList.filter((cs) => !cs.is_pinned);
  const sortedCaseStudies = pinnedCaseStudy
    ? [pinnedCaseStudy, ...otherCaseStudies]
    : caseStudyList;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-6">
        <Avatar className="h-20 w-20 shrink-0">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="text-2xl">
            {user.name[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground text-sm">@{user.handle}</p>
            </div>
            <FollowButton
              handle={user.handle}
              initialIsFollowing={user.is_following}
            />
          </div>

          {profile?.bio && (
            <p className="text-sm leading-relaxed">{profile.bio}</p>
          )}

          {profile?.completion_percentage !== undefined && (
            <div className="max-w-xs space-y-1 py-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Profile completeness</span>
                <span className="font-semibold text-foreground">{profile.completion_percentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${profile.completion_percentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {profile?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile?.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {profile?.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </a>
            )}
            {profile?.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9z" />
                </svg>
                LinkedIn
              </a>
            )}
            {profile?.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                Portfolio
              </a>
            )}
            {profile?.twitter && (
              <a
                href={`https://twitter.com/${profile.twitter.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                𝕏 {profile.twitter}
              </a>
            )}
            {profile?.ai_since && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Using AI since {new Date(profile.ai_since).getFullYear()}
              </span>
            )}
          </div>

          <div className="flex gap-4 text-sm">
            <span>
              <strong>{user.followers_count}</strong>{" "}
              <span className="text-muted-foreground">followers</span>
            </span>
            <span>
              <strong>{user.following_count}</strong>{" "}
              <span className="text-muted-foreground">following</span>
            </span>
            <span>
              <strong>{caseStudyList.length}</strong>{" "}
              <span className="text-muted-foreground">case studies</span>
            </span>
          </div>

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Code2 className="h-3.5 w-3.5" /> Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tech Stack */}
          {profile?.tech_stack && profile.tech_stack.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <Wrench className="h-3.5 w-3.5" /> Tech Stack
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.tech_stack.map((tech, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Experience Section */}
      {profile?.experience && profile.experience.length > 0 && (
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Briefcase className="h-4 w-4 text-indigo-500" />
            <span>Experience</span>
          </div>
          <div className="space-y-3">
            {profile.experience.map((exp, i) => (
              <div key={i} className="rounded-lg border bg-card p-3 text-sm space-y-1">
                <div className="flex items-center justify-between font-medium">
                  <span>{exp.role} {exp.company ? `@ ${exp.company}` : ""}</span>
                  {(exp.start_date || exp.end_date) && (
                    <span className="text-xs text-muted-foreground">
                      {exp.start_date} - {exp.current ? "Present" : exp.end_date || "Present"}
                    </span>
                  )}
                </div>
                {exp.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Case Studies</h2>
          {pinnedCaseStudy && (
            <span className="text-xs text-indigo-500 font-medium">
              📌 Pinned project featured
            </span>
          )}
        </div>
        {sortedCaseStudies.length === 0 ? (
          <p className="text-muted-foreground text-sm">No public case studies yet.</p>
        ) : (
          sortedCaseStudies.map((cs) => <CaseStudyCard key={cs.id} cs={cs} />)
        )}
      </div>
    </div>
  );
}
