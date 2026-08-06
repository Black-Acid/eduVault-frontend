import Link from "next/link";
import { Button } from "../ui/button";

const Navbar = () => {
  return (
    <header className="p-4 flex justify-between items-center">
      <div>Quiz</div>
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
