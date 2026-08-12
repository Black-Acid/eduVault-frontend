"use client";
import Link from "next/link";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";

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
    <Sidebar {...props}>
      <SidebarHeader className="text-lg font-semibold h-16 flex justify-start border-b flex-row items-center px-6">
        <span>Quiz</span>
      </SidebarHeader>
      <SidebarContent className="p-4">
        {data.map(({ title, url }) => (
          <SidebarMenu key={title}>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Link
                  href={url}
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                  }}
                >
                  {title}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
