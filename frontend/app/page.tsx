import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center text-center gap-8 sm:gap-12 md:gap-16 py-8 sm:py-12 md:py-16 px-2 sm:px-4">
      {/* Hero Section */}
      <div className="flex flex-col items-center gap-4 sm:gap-5 max-w-2xl">
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/80 border border-border/50 px-3.5 py-1.5 rounded-full shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>The GitHub for AI case studies</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.15]">
          Share how you work with AI
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed text-balance max-w-xl">
          Document your prompts, show your iterations, and inspire others.
          UseHub is the place to share real AI case studies — not just the final
          result.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mt-2">
          <Button asChild size="lg" className="w-full sm:w-auto px-6 h-11 text-base font-semibold shadow-xs">
            <Link href="/login">Get started free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto px-6 h-11 text-base">
            <Link href="/discover">Browse case studies</Link>
          </Button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl mt-2 sm:mt-6">
        {[
          {
            icon: BookOpen,
            title: "Structured case studies",
            desc: "Show your prompt, iterations, and final output. Not just the result.",
          },
          {
            icon: Users,
            title: "Social layer",
            desc: "Follow creators, react to posts, and discover what the community is building.",
          },
          {
            icon: Sparkles,
            title: "Built for iteration",
            desc: "Every edit is versioned. Your AI journey is preserved, not overwritten.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:p-6 text-left hover:border-primary/30 transition-all hover:shadow-xs group"
          >
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-normal">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

