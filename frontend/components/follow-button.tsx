"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { users } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Props {
  handle: string;
  initialIsFollowing: boolean;
}

export function FollowButton({
  handle,
  initialIsFollowing,
}: Props) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  if (!authLoading && user?.handle === handle) {
    return null;
  }

  const [following, setFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

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
        typeof err === "object" && err && "status" in err
          ? (err as any).status
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

  return (
    <Button
      onClick={toggleFollow}
      disabled={loading}
      variant={following ? "outline" : "default"}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}