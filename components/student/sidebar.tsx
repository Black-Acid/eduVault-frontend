"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";
import Logout_Button from "../general/logout-button";

// This is sample data.
const data = [
  {
    title: "Dashboard",
    url: "/student",
  },
  {
    title: "Play Quiz",
    url: "/student/play-quiz",
  },
  {
    title: "Chat AI",
    url: "/student/chat-ai",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const isActiveRoute = (url: string) => {
    return (
      pathname === url || (url !== "/student" && pathname.startsWith(`${url}/`))
    );
  };

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader className="text-lg font-semibold h-16 flex justify-start flex-row items-center px-4 border-b">
        <div className="flex items-baseline gap-0.5 text-2xl tracking-tighter leading-none font-mono">
          <span className="font-black text-blue-600">Edu</span>
          <span className="font-semibold text-slate-700">Vault</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        {data.map(({ title, url }) => (
          <SidebarMenu key={title}>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isActiveRoute(url)}
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
                className={
                  isActiveRoute(url)
                    ? "group rounded-md bg-blue-600! text-white! shadow-sm hover:bg-blue-600! hover:text-white!"
                    : "group rounded-md"
                }
              >
                <Link href={url} className="flex h-full w-full items-center">
                  {title}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <Logout_Button />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
