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
          <div className=" py-2 pl-2 pr-4">
            <header className="flex h-16 shrink-0 items-center gap-2 border rounded-lg shadow bg-sidebar px-4">
              <SidebarTrigger className="-ml-1 text-indigo-600/80 hover:text-indigo-600 hover:bg-indigo-600/5" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-8 mt-3.5"
              />
            </header>
          </div>

          <main className="p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      {/* <Navbar /> */}
    </>
  );
}
