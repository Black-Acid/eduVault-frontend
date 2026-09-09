import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata = {
  title: "Log in | EduVault",
};

export default function Page() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* The form reads `returnTo` from the query string. */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
