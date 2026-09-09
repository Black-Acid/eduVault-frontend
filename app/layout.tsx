import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { cn } from "~/lib/utils";
import { TooltipProvider } from "~/components/ui/tooltip";
import { Toaster } from "~/components/ui/toast";
import { PageTransitionLoader } from "~/components/general/page-transition-loader";

const source_sans_3 = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Fraunces({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EduVault",
    template: "%s",
  },
  description:
    "Practise WASSCE past questions, track your progress, and get an AI explanation for every answer you get wrong.",
  applicationName: "EduVault",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        "font-sans",
        source_sans_3.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          {children}
          <PageTransitionLoader />
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
