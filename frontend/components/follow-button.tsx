"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { users } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { UserCheck, UserMinus, UserPlus } from "lucide-react";

interface Props {
  handle: string;
  initialIsFollowing: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function FollowButton({
  handle,
  initialIsFollowing,
  size = "sm",
  className = "",
}: Props) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [following, setFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  if (!authLoading && user?.handle === handle) {
    return null;
  }

  const toggleFollow = async () => {
    if (loading) return;

    setLoading(true);

    try {
      if (following) {
        await users.unfollow(handle);
        setFollowing(false);
      } else {
        await users.follow(handle);
        setFollowing(true);
      }

      router.refresh();
    } catch (err) {
      const status =
        typeof err === "object" &&
        err !== null &&
        "status" in err
          ? (err as { status?: number }).status
          : null;

      if (status === 401) {
        router.push("/login");
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (following) {
    return (
      <Button
        onClick={toggleFollow}
        disabled={loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        variant="outline"
        size={size}
        className={`rounded-full font-semibold transition-all duration-200 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 ${className}`}
      >
        {isHovered ? (
          <>
            <UserMinus className="h-3.5 w-3.5 mr-1 text-red-500" />
            Unfollow
          </>
        ) : (
          <>
            <UserCheck className="h-3.5 w-3.5 mr-1" />
            Following
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      onClick={toggleFollow}
      disabled={loading}
      variant="default"
      size={size}
      className={`rounded-full font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all duration-200 ${className}`}
    >
      <UserPlus className="h-3.5 w-3.5 mr-1" />
      Follow
    </Button>
  );
}