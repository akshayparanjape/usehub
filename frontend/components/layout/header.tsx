"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/search-bar";
import { NotificationBell } from "@/components/notification-bell";
import {
  BookOpen,
  Clock,
  Compass,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Rss,
  Settings,
  User,
  X,
} from "lucide-react";

export function Header() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await auth.logout();
    await refresh();
    setMobileMenuOpen(false);
    router.refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4">
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-1.5 font-bold text-base sm:text-lg shrink-0"
          >
            <BookOpen className="h-5 w-5 text-primary shrink-0" />
            <span>UseHub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground shrink-0">
            <Link
              href="/discover"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Compass className="h-4 w-4" />
              Discover
            </Link>
            {user && (
              <>
                <Link
                  href="/feed"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Rss className="h-4 w-4" />
                  Feed
                </Link>
                <Link
                  href="/drafts"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  My Drafts
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-xs sm:max-w-sm mx-1 sm:mx-2 min-w-0">
          <SearchBar />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              <Button asChild size="sm" variant="ghost" className="px-2 sm:px-3">
                <Link href="/new" onClick={() => setMobileMenuOpen(false)}>
                  <Plus className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">New</span>
                </Link>
              </Button>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                      <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/${user.handle}`}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/drafts">
                      <FileText className="mr-2 h-4 w-4" />
                      My Drafts
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recently-viewed">
                      <Clock className="mr-2 h-4 w-4" />
                      Recently Viewed
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/98 px-4 py-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
          <nav className="flex flex-col space-y-1 text-sm font-medium">
            <Link
              href="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-foreground"
            >
              <Compass className="h-4 w-4 text-indigo-500" />
              <span>Discover</span>
            </Link>
            {user ? (
              <>
                <Link
                  href="/feed"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-foreground"
                >
                  <Rss className="h-4 w-4 text-indigo-500" />
                  <span>Feed</span>
                </Link>
                <Link
                  href="/drafts"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-foreground"
                >
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <span>My Drafts</span>
                </Link>
                <Link
                  href="/recently-viewed"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-foreground"
                >
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <span>Recently Viewed</span>
                </Link>
                <Link
                  href={`/${user.handle}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted transition-colors text-foreground"
                >
                  <User className="h-4 w-4 text-indigo-500" />
                  <span>Profile (@{user.handle})</span>
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-center justify-center mt-2"
              >
                <span>Sign in to UseHub</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

