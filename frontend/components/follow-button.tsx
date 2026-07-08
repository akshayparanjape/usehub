"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

      router.refresh();   // <-- add this
    } catch (err) {
      console.error(err);
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