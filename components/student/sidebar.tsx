"use client";
import Link from "next/link";
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
import { Button } from "../ui/button";
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
  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader className="text-lg font-semibold h-16 flex justify-start flex-row items-center px-4 border-b">
        <div className="text-primary/60 flex items-baseline gap-0">
          <span className="text-indigo-600 text-xl">Q</span>
          <span>uiz</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        {data.map(({ title, url }) => (
          <SidebarMenu key={title}>
            <SidebarMenuItem>
              <SidebarMenuButton className="group hover:bg-indigo-600/5 rounded-md">
                <Link
                  href={url}
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                  className="text-primary/70 hover:text-primary w-full h-full"
                >
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
