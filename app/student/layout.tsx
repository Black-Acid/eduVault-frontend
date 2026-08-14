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
          <div className="z-20 py-2 px-4 h-20 sticky top-0">
            <div className="absolute bg-white h-4 -ml-4 w-full z-2 top-0"></div>
            <header className="relative z-3 flex h-16 shrink-0 items-center gap-2 bg-paper/0  border rounded-lg shadow backdrop-blur px-4">
              <SidebarTrigger className="-ml-1 text-indigo-600/80 hover:text-indigo-600 hover:bg-indigo-600/5" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-8 mt-3.5"
              />
            </header>
          </div>

          <main className="p-4 z-10">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      {/* <Navbar /> */}
    </>
  );
}
