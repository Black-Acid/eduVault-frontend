"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "../ui/button";

const Logout_Button = () => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setError(null);

    try {
      const response = await fetch("/api/logout", { method: "POST" });

      if (!response.ok) {
        setError("We could not sign you out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("We could not reach EduVault. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="w-full"
        variant="destructive"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Signing out…" : "Log out"}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default Logout_Button;
