import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <section className="grid lg:grid-cols-11 gap-16 py-10">
      <div className="lg:col-span-6 flex flex-col gap-y-8">
        <p className="rounded-full text-xs font-medium w-fit text-indigo-600 bg-indigo-600/10 px-2 py-1 border border-indigo-600">
          Built for Ghanaian Students
        </p>
        <div className="flex flex-col gap-y-4">
          <h2 className="text-5xl font-mono leading-normal font-semibold max-w-3xl">
            Practice WASSCE.{" "}
            <span className="text-indigo-600">Track every mark.</span>
          </h2>
          <p className="text-lg leading-relaxed text-primary/80 max-w-3xl">
            Free core-subject quizzes, saved progress, direct tutor support, and
            cutting-edge AI past question analysis provide a comprehensive suite
            of practice tests, milestone tracking, and expert guidance to help
            you overcome challenges, ensuring the ultimate confidence to walk
            into the WASSCE fully prepared.
          </p>
        </div>
        <div className="flex items-center gap-x-4">
          <Button>
            <Link href={"/login"}>Get Started as Student</Link>
          </Button>
          <Button variant={"outline"}>
            <Link href={"/signup"}>I&apos;m a Tutor</Link>
          </Button>
        </div>
      </div>
      <div className="lg:col-span-5 flex items-center">
        <Image
          height={1000}
          width={1000}
          src={"/hero.png"}
          quality={100}
          alt="Female SHS Student preparing herself for exams"
          className="object-cover w-full lg:w-auto h-full max-h-150 lg:max-h-100 rounded-lg lg:grayscale-100 hover:grayscale-0 transition-all duration-200"
        />
      </div>
    </section>
  );
}
