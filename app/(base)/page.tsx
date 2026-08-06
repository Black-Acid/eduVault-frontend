import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <section className="mx-auto pt-4 flex flex-col items-center justify-center gap-4">
      <h2 className="text-center font-semibold text-3xl">
        Welcome to the WASSCE Hub
      </h2>
      <p className="text-center">Get started by signing up or logging in.</p>
      <div className="flex items-center gap-x-4">
        <Button>
          <Link href={"/login"}>Login</Link>
        </Button>
        <Button variant={"outline"}>
          <Link href={"/signup"}>Sign Up</Link>
        </Button>
      </div>
    </section>
  );
}
