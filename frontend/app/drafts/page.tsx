"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { caseStudies as csApi, type CaseStudyList } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { CaseStudyCard } from "@/components/case-study-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Edit, FileText, Globe, Plus, Trash2 } from "lucide-react";

export default function DraftsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [drafts, setDrafts] = useState<CaseStudyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const items = await csApi.myDrafts();
      setDrafts(items);
    } catch {
      toast.error("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDrafts();
    }
  }, [user]);

  const handlePublish = async (id: string) => {
    try {
      setActionId(id);
      const cs = await csApi.publish(id);
      toast.success("Case study published successfully!");
      router.push(`/${cs.author.handle}/${cs.slug}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish draft");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return;
    try {
      setActionId(id);
      await csApi.delete(id);
      toast.success("Draft deleted");
      setDrafts((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete draft");
    } finally {
      setActionId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          My Drafts
        </h1>
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            My Drafts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Work in progress case studies. Only visible to you until published.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/new">
            <Plus className="h-4 w-4 mr-1" />
            New Case Study
          </Link>
        </Button>
      </div>

      {drafts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl bg-muted/20 space-y-3">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <p className="font-medium text-foreground">No drafts found</p>
          <p className="text-sm max-w-md mx-auto">
            You don&apos;t have any unpublished case studies. All your case studies are published or you haven&apos;t created any drafts yet.
          </p>
          <Button asChild size="sm" className="mt-2">
            <Link href="/new">Create Case Study</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((cs) => (
            <div key={cs.id} className="relative group rounded-xl border bg-card p-1">
              <CaseStudyCard cs={cs} />
              <div className="flex items-center justify-end gap-2 p-3 pt-0 border-t bg-muted/20 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/edit/${cs.id}`}>
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Link>
                </Button>
                <Button
                  size="sm"
                  disabled={actionId === cs.id}
                  onClick={() => handlePublish(cs.id)}
                >
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  {actionId === cs.id ? "Publishing..." : "Publish"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={actionId === cs.id}
                  onClick={() => handleDelete(cs.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
