import Link from "next/link";

import { buttonVariants } from "../ui/button";

const Navbar = () => {
  return (
    <header className="flex items-center justify-between border-b p-4">
      <div className="flex items-baseline gap-0.5 font-mono text-2xl leading-none tracking-tighter">
        <span className="font-black text-blue-600">Edu</span>
        <span className="font-semibold text-primary/70">Vault</span>
      </div>
      <nav className="flex items-center gap-x-4">
        <Link href="/login" className={buttonVariants()}>
          Log in
        </Link>
        <Link href="/signup" className={buttonVariants({ variant: "outline" })}>
          Sign up
        </Link>
      </nav>
    </header>
  );
};

export default Navbar;
