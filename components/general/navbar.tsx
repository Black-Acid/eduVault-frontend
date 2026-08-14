import Link from "next/link";
import { Button } from "../ui/button";

const Navbar = () => {
  return (
    <header className="p-4 flex justify-between items-center border-b">
      <div className="flex items-baseline gap-0.5 text-2xl tracking-tighter leading-none font-mono">
        <span className="font-black text-blue-600">Edu</span>
        <span className="font-semibold text-primary/70">Vault</span>
      </div>
      <div className="flex items-center gap-x-4">
        <Button>
          <Link href={"/login"}>Login</Link>
        </Button>
        <Button variant={"outline"}>
          <Link href={"/signup"}>Sign Up</Link>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
