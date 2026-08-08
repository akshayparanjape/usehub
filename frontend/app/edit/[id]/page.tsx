"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { caseStudies as csApi, type CaseStudy } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { CaseStudyForm } from "@/components/case-study-form";
import { toast } from "sonner";
import { FileText } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditCaseStudyPage({ params }: Props) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && id) {
      csApi
        .get(id)
        .then((data) => {
          if (data.author.id !== user.id) {
            toast.error("You can only edit your own case studies");
            router.replace("/");
            return;
          }
          setCaseStudy(data);
        })
        .catch(() => {
          toast.error("Case study not found");
          router.replace("/drafts");
        })
        .finally(() => setLoading(false));
    }
  }, [user, id, router]);

  if (authLoading || loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!caseStudy) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Edit {caseStudy.is_draft ? "Draft" : "Case Study"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your prompt, iterations, outcome, or publish settings.
        </p>
      </div>
      <CaseStudyForm existing={caseStudy} />
    </div>
  );
}
