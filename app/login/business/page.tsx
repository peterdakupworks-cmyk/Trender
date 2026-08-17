"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** No longer a separate login form. Trender uses one universal login at /login. */
export default function BusinessLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return null;
}
