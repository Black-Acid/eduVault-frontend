import { AppSidebar } from "~/components/student/sidebar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

export default function Student_Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* <div className="z-20 py-2 px-4 h-20 sticky top-0">
            <div className="absolute bg-white h-4 -ml-4 w-full z-2 top-0"></div>
            <header className="relative z-3 flex h-16 shrink-0 items-center gap-2 bg-primary-foreground/80 backdrop-blur px-4 border rounded-lg shadow">
              <SidebarTrigger className="-ml-1 text-blue-600/80 hover:text-blue-600 hover:bg-paper-dim" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-8 mt-3.5"
              />
            </header>
          </div> */}

          <main className="p-4 z-10 w-full">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      {/* <Navbar /> */}
    </>
  );
}
