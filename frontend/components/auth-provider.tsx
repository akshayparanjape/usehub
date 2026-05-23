"use client";

import { auth, type User } from "@/lib/api";
import { AuthCtx } from "@/hooks/use-auth";
import { useCallback, useEffect, useState } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await auth.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthCtx.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}
