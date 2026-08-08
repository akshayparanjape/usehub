"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { users as usersApi, type UserPublic, type ExperienceItem } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/avatar-upload";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [aiSince, setAiSince] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [techStackInput, setTechStackInput] = useState("");
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      usersApi.getByHandle(user.handle).then((p) => {
        setProfile(p);
        setName(p.name);
        setAvatarUrl(p.avatar_url);
        if (p.profile) {
          setBio(p.profile.bio ?? "");
          setAiSince(p.profile.ai_since ?? "");
          setLocation(p.profile.location ?? "");
          setWebsite(p.profile.website ?? "");
          setTwitter(p.profile.twitter ?? "");
          setGithubUsername(p.profile.github_username ?? "");
          setGithubUrl(p.profile.github_url ?? "");
          setLinkedinUrl(p.profile.linkedin_url ?? "");
          setPortfolioUrl(p.profile.portfolio_url ?? "");
          setSkillsInput((p.profile.skills ?? []).join(", "));
          setTechStackInput((p.profile.tech_stack ?? []).join(", "));
          setExperience(p.profile.experience ?? []);
        }
      });
    }
  }, [user]);

  function addExperienceItem() {
    setExperience((prev) => [
      ...prev,
      { company: "", role: "", start_date: "", end_date: "", current: false, description: "" },
    ]);
  }

  function removeExperienceItem(index: number) {
    setExperience((prev) => prev.filter((_, i) => i !== index));
  }

  function updateExperienceItem(index: number, key: keyof ExperienceItem, value: unknown) {
    setExperience((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsArray = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const techStackArray = techStackInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await usersApi.updateMe({
        name,
        bio,
        ai_since: aiSince || undefined,
        location,
        website,
        twitter,
        github_username: githubUsername,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        portfolio_url: portfolioUrl,
        skills: skillsArray,
        tech_stack: techStackArray,
        experience,
        avatar_url: avatarUrl ?? undefined,
      } as Parameters<typeof usersApi.updateMe>[0]);
      await refresh();
      toast.success("Profile updated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="max-w-xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold">Profile settings</h1>
        {profile?.profile?.completion_percentage !== undefined && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Profile Completion</span>
              <span>{profile.profile.completion_percentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${profile.profile.completion_percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <AvatarUpload
          currentUrl={avatarUrl}
          name={name || user.name}
          onUploaded={setAvatarUrl}
        />

        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Tell the community about yourself..."
          />
          <p className="text-xs text-muted-foreground">{bio.length}/1000</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ai_since">Using AI since</Label>
            <Input
              id="ai_since"
              type="date"
              value={aiSince}
              onChange={(e) => setAiSince(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
              placeholder="City, Country"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Skills (comma-separated)</Label>
          <Input
            id="skills"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="Prompt Engineering, LLM Fine-Tuning, RAG, System Architecture"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="techStack">Tech Stack (comma-separated)</Label>
          <Input
            id="techStack"
            value={techStackInput}
            onChange={(e) => setTechStackInput(e.target.value)}
            placeholder="Python, PyTorch, LangChain, FastAPI, Next.js, OpenAI"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            maxLength={255}
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="github_url">GitHub URL</Label>
            <Input
              id="github_url"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="portfolio_url">Portfolio URL</Label>
          <Input
            id="portfolio_url"
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://portfolio.dev"
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Experience</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExperienceItem}
              className="text-xs flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Position
            </Button>
          </div>

          {experience.map((exp, idx) => (
            <div key={idx} className="space-y-3 rounded-lg border p-3 bg-card relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeExperienceItem(idx)}
                className="absolute right-2 top-2 h-7 w-7 p-0 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="grid grid-cols-2 gap-3 pr-8">
                <Input
                  placeholder="Role (e.g. AI Engineer)"
                  value={exp.role || ""}
                  onChange={(e) => updateExperienceItem(idx, "role", e.target.value)}
                />
                <Input
                  placeholder="Company / Org"
                  value={exp.company || ""}
                  onChange={(e) => updateExperienceItem(idx, "company", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="text"
                  placeholder="Start (e.g. 2023)"
                  value={exp.start_date || ""}
                  onChange={(e) => updateExperienceItem(idx, "start_date", e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="End (or Present)"
                  value={exp.end_date || ""}
                  onChange={(e) => updateExperienceItem(idx, "end_date", e.target.value)}
                />
              </div>
              <Textarea
                placeholder="Description of role or achievements..."
                rows={2}
                value={exp.description || ""}
                onChange={(e) => updateExperienceItem(idx, "description", e.target.value)}
              />
            </div>
          ))}
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
