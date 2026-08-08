/**
 * Typed API client. All requests go through here so the base URL is
 * configured in one place and credentials are always included.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    credentials: "include",
    cache: options.cache ?? "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let code = "unknown_error";
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? body?.detail ?? message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  me: () => request<User>("/auth/me"),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  loginUrl: (provider: "google" | "github") =>
    `${API_BASE}/api/v1/auth/${provider}`,
  devLogin: (username: string, password: string) =>
    request<{ handle: string }>("/auth/login/email", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = {
  getByHandle: (handle: string, headers?: HeadersInit) =>
    request<UserPublic>(`/users/${handle}`, { headers }),
  updateMe: (data: Partial<ProfileUpdate>) =>
    request<UserPublic>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  follow: (handle: string) =>
    request<void>(`/users/${handle}/follow`, { method: "POST" }),
  unfollow: (handle: string) =>
    request<void>(`/users/${handle}/follow`, { method: "DELETE" }),
  followers: (limit = 20, offset = 0) =>
    request<UserMinimal[]>(`/users/me/followers?limit=${limit}&offset=${offset}`),
  following: (limit = 20, offset = 0) =>
    request<UserMinimal[]>(`/users/me/following?limit=${limit}&offset=${offset}`),
  tools: () => request<Tool[]>("/users/tools/catalog"),
  avatarUploadUrl: (contentType: string) =>
    request<{ upload_url: string; public_url: string; key: string }>(
      `/media/avatar-upload-url?content_type=${encodeURIComponent(contentType)}`,
      { method: "POST" },
    ),
};

// ── Case Studies ──────────────────────────────────────────────────────────────

export const caseStudies = {
  list: (cursor?: string, limit = 20) =>
    request<CaseStudyList[]>(
      `/case-studies?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`,
    ),
  myDrafts: (cursor?: string, limit = 20) =>
    request<CaseStudyList[]>(
      `/case-studies/drafts/me?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`,
    ),
  get: (id: string, headers?: HeadersInit) =>
    request<CaseStudy>(`/case-studies/${id}`, { headers }),
  create: (data: CaseStudyCreate) =>
    request<CaseStudy>("/case-studies", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CaseStudyCreate>) =>
    request<CaseStudy>(`/case-studies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  publish: (id: string) =>
    request<CaseStudy>(`/case-studies/${id}/publish`, { method: "POST" }),
  pin: (id: string) =>
    request<CaseStudy>(`/case-studies/${id}/pin`, { method: "POST" }),
  unpin: (id: string) =>
    request<CaseStudy>(`/case-studies/${id}/unpin`, { method: "POST" }),
  delete: (id: string) =>
    request<void>(`/case-studies/${id}`, { method: "DELETE" }),
  byUser: (handle: string, limit = 20, cursor?: string, headers?: HeadersInit) =>
    request<CaseStudyList[]>(
      `/users/${handle}/case-studies?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`,
      { headers },
    ),
  trackView: (id: string) =>
    request<void>(`/case-studies/${id}/view`, { method: "POST" }),
  recentlyViewed: (limit = 10) =>
    request<RecentlyViewedItem[]>(`/case-studies/recently-viewed/me?limit=${limit}`),
  versions: (id: string) =>
    request<CaseStudyVersion[]>(`/case-studies/${id}/versions`),
  versionDetail: (id: string, versionId: string) =>
    request<CaseStudyVersionDetail>(`/case-studies/${id}/versions/${versionId}`),
  restoreVersion: (id: string, versionId: string) =>
    request<CaseStudy>(`/case-studies/${id}/versions/${versionId}/restore`, { method: "POST" }),
};

// ── Engagement ────────────────────────────────────────────────────────────────

export const engagement = {
  reactions: (caseStudyId: string) =>
    request<ReactionCounts>(`/case-studies/${caseStudyId}/reactions`),
  addReaction: (caseStudyId: string, reactionType: string) =>
    request<void>(`/case-studies/${caseStudyId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction_type: reactionType }),
    }),
  removeReaction: (caseStudyId: string, reactionType: string) =>
    request<void>(`/case-studies/${caseStudyId}/reactions/${reactionType}`, {
      method: "DELETE",
    }),
  comments: (caseStudyId: string, limit = 20, offset = 0) =>
    request<Comment[]>(
      `/case-studies/${caseStudyId}/comments?limit=${limit}&offset=${offset}`,
    ),
  addComment: (caseStudyId: string, body: string, parentId?: string) =>
    request<Comment>(`/case-studies/${caseStudyId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body, parent_id: parentId }),
    }),
  deleteComment: (commentId: string) =>
    request<void>(`/comments/${commentId}`, { method: "DELETE" }),
  toggleBookmark: (caseStudyId: string) =>
    request<void>(`/case-studies/${caseStudyId}/bookmarks`, { method: "POST" }),
};

// ── Feed ──────────────────────────────────────────────────────────────────────

export const feed = {
  home: (cursor?: string, limit = 20) =>
    request<CaseStudyList[]>(
      `/feed?limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`,
    ),
  discover: (limit = 20, timeframe = "week") =>
    request<CaseStudyList[]>(`/discover?limit=${limit}&timeframe=${timeframe}`),
  search: (q: string, type = "all", limit = 20, offset = 0) =>
    request<SearchResults>(
      `/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}&offset=${offset}`,
    ),
  searchSuggestions: (q: string) =>
    request<SearchSuggestions>(`/search/suggestions?q=${encodeURIComponent(q)}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reports = {
  create: (data: ReportCreate) =>
    request<Report>("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: (status?: string, targetType?: string, limit = 20, offset = 0) =>
    request<Report[]>(
      `/reports?limit=${limit}&offset=${offset}${status ? `&status=${status}` : ""}${targetType ? `&target_type=${targetType}` : ""}`,
    ),
  updateStatus: (id: string, status: string) =>
    request<Report>(`/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notifications = {
  list: (limit = 20, offset = 0) =>
    request<Notification[]>(`/notifications?limit=${limit}&offset=${offset}`),
  unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  markRead: (ids?: string[]) =>
    request<void>("/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify(ids),
    }),
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  handle: string;
  name: string;
  email: string;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
}

export interface UserMinimal {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  category: string | null;
}

export interface UserTool {
  tool: Tool | null;
  custom_tool_name: string | null;
}

export interface Project {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
}

export interface ExperienceItem {
  company?: string;
  role?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
  description?: string;
}

export interface Profile {
  bio: string | null;
  ai_since: string | null;
  location: string | null;
  website: string | null;
  twitter: string | null;
  github_username: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  skills: string[];
  tech_stack: string[];
  experience: ExperienceItem[];
  completion_percentage: number;
  tools: UserTool[];
  projects: Project[];
}

export interface UserPublic extends User {
  profile: Profile | null;
  is_following: boolean;
}

export interface ProfileUpdate {
  name: string;
  bio: string;
  ai_since: string;
  location: string;
  website: string;
  twitter: string;
  github_username: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  skills: string[];
  tech_stack: string[];
  experience: ExperienceItem[];
  tool_ids: string[];
  custom_tools: string[];
  avatar_url: string;
}

export interface Iteration {
  input: string;
  output: string;
  notes?: string;
}

export interface CaseStudyContent {
  prompt: string;
  iterations: Iteration[];
  final_output: string;
  notes?: string;
}

export interface CaseStudyCreate {
  title: string;
  summary?: string;
  ai_model?: string;
  ai_platform?: string;
  visibility: "public" | "unlisted" | "private";
  is_draft?: boolean;
  content: CaseStudyContent;
  tags?: string[];
  change_message?: string;
}

export interface Author {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface CaseStudyList {
  id: string;
  author: Author;
  title: string;
  slug: string;
  summary: string | null;
  ai_model: string | null;
  visibility: string;
  is_draft: boolean;
  is_pinned: boolean;
  has_reports?: boolean;
  views_count: number;
  tags: Tag[];
  likes_count: number;
  applause_count: number;
  aha_count: number;
  comments_count: number;
  published_at: string | null;
  created_at: string;
}

export interface CaseStudy extends CaseStudyList {
  ai_platform: string | null;
  content: CaseStudyContent | null;
  current_version_id: string | null;
  updated_at: string;
}

export interface CaseStudyVersion {
  id: string;
  version_number: number;
  title: string | null;
  change_message: string | null;
  created_at: string;
  edited_by: Author | null;
}

export interface CaseStudyVersionDetail extends CaseStudyVersion {
  content: CaseStudyContent;
}

export interface RecentlyViewedItem {
  id: string;
  case_study: CaseStudyList;
  viewed_at: string;
}

export interface ReportCreate {
  target_type: "case_study" | "comment" | "user";
  target_id: string;
  reason: "spam" | "inappropriate" | "harassment" | "copyright" | "other";
  details?: string;
}

export interface Report {
  id: string;
  reporter: Author;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "dismissed" | "resolved";
  created_at: string;
  updated_at: string;
}

export interface SearchSuggestions {
  tags: string[];
  users: { handle: string; name: string }[];
  case_studies: { id: string; title: string; slug: string; author_handle: string }[];
}

export interface ReactionCounts {
  likes_count: number;
  applause_count: number;
  aha_count: number;
  user_reactions: string[];
}

export interface Comment {
  id: string;
  author: Author;
  body: string;
  parent_id: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, string>;
  read_at: string | null;
  created_at: string;
}

export interface SearchResults {
  case_studies?: CaseStudyList[];
  users?: UserMinimal[];
  tags?: Tag[];
}

