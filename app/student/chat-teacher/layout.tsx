import TextareaAutosize from "react-textarea-autosize";

import { AppSidebar } from "~/components/student/sidebar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";

export default function Chat_Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="w-full h-[calc(100vh-16px)] bg-transparent shadow rounded-lg sticky top-2 flex flex-col border overflow-hidden">
        <div className="h-full w-full overflow-y-auto flex">
          <div className="sticky min-w-xs max-w-xs w-xs h-full top-0 overflow-y-auto flex flex-col border-r">
            <div className="sticky z-10 top-0 border-b last:border-0 w-full p-4 bg-primary-foreground flex flex-col gap-y-3">
              <span className="text-blue-600 font-semibold font-mono text-xl">
                Chat Teacher
              </span>
              <Input placeholder="Search" />
            </div>
            <div className="border-b last:border-0 w-full p-4 flex gap-x-3 bg-blue-600/10 cursor-pointer">
              <Avatar className={"h-10 w-10"}>
                <AvatarImage src={"/avatar.png"}></AvatarImage>
                <AvatarFallback
                  className={"bg-blue-600 text-white font-semibold text-base"}
                >
                  TK
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col grow gap-y-1">
                <div className="flex justify-between gap-x-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">Hello</span>
                    <span className="text-xs text-blue-600">Physics</span>
                  </div>
                </div>
                <div className="text-primary/80 text-sm">
                  Try resolving the vector into x and y, t...
                </div>
              </div>
            </div>
            <div className="border-b last:border-0 w-full p-4 flex gap-x-3 hover:bg-primary-foreground cursor-pointer">
              <Avatar className={"h-10 w-10"}>
                <AvatarImage src={"/avatar.png"}></AvatarImage>
                <AvatarFallback
                  className={"bg-blue-600 text-white font-semibold text-base"}
                >
                  TK
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col grow gap-y-1">
                <div className="flex justify-between gap-x-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">Hello</span>
                    <span className="text-xs text-blue-600">Physics</span>
                  </div>
                  <div className="flex justify-center items-center h-5 w-5 rounded-full font-semibold text-xs text-white bg-blue-600">
                    2
                  </div>
                </div>
                <div className="text-primary/80 text-sm">
                  Try resolving the vector into x and...
                </div>
              </div>
            </div>
            <div className="border-b last:border-0 w-full p-4 flex gap-x-3 hover:bg-primary-foreground cursor-pointer">
              <Avatar className={"h-10 w-10"}>
                <AvatarImage src={"/avatar.png"}></AvatarImage>
                <AvatarFallback
                  className={"bg-blue-600 text-white font-semibold text-base"}
                >
                  TK
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col grow gap-y-1">
                <div className="flex justify-between gap-x-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">Hello</span>
                    <span className="text-xs text-blue-600">Physics</span>
                  </div>
                  <div className="flex justify-center items-center h-5 w-5 rounded-full font-semibold text-xs text-white bg-blue-600">
                    2
                  </div>
                </div>
                <div className="text-primary/80 text-sm">
                  Try resolving the vector into x and...
                </div>
              </div>
            </div>
            <div className="border-b last:border-0 w-full p-4 flex gap-x-3 hover:bg-primary-foreground cursor-pointer">
              <Avatar className={"h-10 w-10"}>
                <AvatarImage src={"/avatar.png"}></AvatarImage>
                <AvatarFallback
                  className={"bg-blue-600 text-white font-semibold text-base"}
                >
                  TK
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col grow gap-y-1">
                <div className="flex justify-between gap-x-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">Hello</span>
                    <span className="text-xs text-blue-600">Physics</span>
                  </div>
                </div>
                <div className="text-primary/80 text-sm">
                  Try resolving the vector into x and...
                </div>
              </div>
            </div>
            <div className="border-b last:border-0 w-full p-4 flex gap-x-3 hover:bg-primary-foreground cursor-pointer">
              <Avatar className={"h-10 w-10"}>
                <AvatarImage src={"/avatar.png"}></AvatarImage>
                <AvatarFallback
                  className={"bg-blue-600 text-white font-semibold text-base"}
                >
                  TK
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col grow gap-y-1">
                <div className="flex justify-between gap-x-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">Hello</span>
                    <span className="text-xs text-blue-600">Physics</span>
                  </div>
                  <div className="flex justify-center items-center h-5 w-5 rounded-full font-semibold text-xs text-white bg-blue-600">
                    2
                  </div>
                </div>
                <div className="text-primary/80 text-sm">
                  Try resolving the vector into x and...
                </div>
              </div>
            </div>
            <div className="border-b last:border-0 w-full p-4 flex gap-x-3 hover:bg-primary-foreground cursor-pointer">
              <Avatar className={"h-10 w-10"}>
                <AvatarImage src={"/avatar.png"}></AvatarImage>
                <AvatarFallback
                  className={"bg-blue-600 text-white font-semibold text-base"}
                >
                  TK
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col grow gap-y-1">
                <div className="flex justify-between gap-x-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">Hello</span>
                    <span className="text-xs text-blue-600">Physics</span>
                  </div>
                  <div className="flex justify-center items-center h-5 w-5 rounded-full font-semibold text-xs text-white bg-blue-600">
                    2
                  </div>
                </div>
                <div className="text-primary/80 text-sm">
                  Try resolving the vector into x and...
                </div>
              </div>
            </div>
            <div className="border-b last:border-0 w-full p-4 flex gap-x-3 hover:bg-primary-foreground cursor-pointer">
              <Avatar className={"h-10 w-10"}>
                <AvatarImage src={"/avatar.png"}></AvatarImage>
                <AvatarFallback
                  className={"bg-blue-600 text-white font-semibold text-base"}
                >
                  TK
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col grow gap-y-1">
                <div className="flex justify-between gap-x-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">Hello</span>
                    <span className="text-xs text-blue-600">Physics</span>
                  </div>
                </div>
                <div className="text-primary/80 text-sm">
                  Try resolving the vector into x and...
                </div>
              </div>
            </div>
            <div className="border-b last:border-0 w-full p-4 flex gap-x-3 hover:bg-primary-foreground cursor-pointer">
              <Avatar className={"h-10 w-10"}>
                <AvatarImage src={"/avatar.png"}></AvatarImage>
                <AvatarFallback
                  className={"bg-blue-600 text-white font-semibold text-base"}
                >
                  TK
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col grow gap-y-1">
                <div className="flex justify-between gap-x-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">Hello</span>
                    <span className="text-xs text-blue-600">Physics</span>
                  </div>
                  <div className="flex justify-center items-center h-5 w-5 rounded-full font-semibold text-xs text-white bg-blue-600">
                    2
                  </div>
                </div>
                <div className="text-primary/80 text-sm">
                  Try resolving the vector into x and...
                </div>
              </div>
            </div>
          </div>
          {/* Chat Area */}
          <div className="flex flex-col w-full">
            <div className="p-4 bg-primary-foreground backdrop-blur sticky top-0 flex items-center gap-x-4 w-full border-b">
              <Avatar>
                <AvatarImage></AvatarImage>
                <AvatarFallback
                  className={
                    "font-semibold bg-blue-600 border border-blue-600 text-white"
                  }
                >
                  WB
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold">Wisdom Banang-ere</span>
                <span className="text-xs">Physics</span>
              </div>
            </div>
            <div className="w-full h-dvh"></div>
            <section className="bottom-0 sticky w-full h-fit -mb-4 flex flex-col items-center gap-y-4 bg-white rounded-lg px-4 py-2">
              <div className="flex gap-x-4 w-full items-center rounded-lg bg-primary-foreground px-4 py-2 shadow border">
                <div className="w-full  flex items-center">
                  {/* <TextareaAutosize
                    maxRows={5}
                    className="w-full bg-none border-0 outline-0 no-scrollbar resize-none"
                    placeholder="Ask me anything..."
                  /> */}
                </div>
                <Button className={"px-2"}>
                  <HugeiconsIcon
                    icon={ArrowUp02Icon}
                    strokeWidth={2}
                    className="text-4xl"
                  />
                </Button>
              </div>

              <p className="text-xs">Disclaimer: AI can make mistakes</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
