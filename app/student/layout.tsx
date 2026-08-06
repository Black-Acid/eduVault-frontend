import { AppSidebar } from "~/components/student/sidebar";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";

export default function Student_Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-8"
            />
          </header>
          <main className="p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      {/* <Navbar /> */}
    </>
  );
}
