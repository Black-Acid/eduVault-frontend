"use client";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
const Logout_Button = () => {
  const router = useRouter();

  //   Handle Sign Out
  const handle_sign_out = async () => {
    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (res.ok) {
        router.push("/"); // Redirect to the signin page after successful logout
      } else {
        return alert("Sign out failed");
      }
    } catch {
      alert("An error occurred during sign out");
    }
  };
  return (
    <Button
      className={"w-full"}
      variant={"destructive"}
      onClick={handle_sign_out}
    >
      Logout
    </Button>
  );
};

export default Logout_Button;
