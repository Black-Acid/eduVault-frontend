"use client";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "../ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { Message, MessageAvatar, MessageContent } from "../ui/message";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Bubble, BubbleContent } from "../ui/bubble";

const ChatAiClient = () => {
  return (
    <div className="flex flex-col relative mx-auto max-w-3xl">
      <section className="min-h-[calc(100vh-200px)] flex flex-col gap-y-8">
        <div className="bg-primary-foreground p-4 flex flex-col gap-y-4 rounded-lg border shadow">
          <div className="flex justify-between items-center pb-4 border-b">
            <h2 className="font-semibold text-2xl font-mono text-blue-600">
              AI Review Session
            </h2>
            <p className="text-sm font-medium text-primary/80">
              Quesion 1 of 40
            </p>
          </div>
          <div className="flex flex-col gap-y-2">
            <p className="text-blue-600/70 font-semibold uppercase">
              Question: 1
            </p>
            <p className="font-semibold text-xl">
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Consectetur beatae consequuntur praesentium necessitatibus
              voluptatem vel quidem nihil iste exercitationem? Ipsum quaerat
              iure commodi doloribus assumenda odio quam, amet culpa. Cum?
            </p>
          </div>
        </div>

        <Message>
          <MessageContent>
            <Bubble variant={"ghost"}>
              <BubbleContent className="text-base flex flex-col gap-y-2">
                <span className="uppercase text-blue-600">AI Explanation</span>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Deleniti modi a ipsa odio dolorem sed possimus ab dicta.
                  Minima, veritatis deserunt? Id voluptatibus eveniet, assumenda
                  rem nemo eligendi itaque amet modi obcaecati animi fugiat
                  consectetur consequuntur nisi quasi impedit laboriosam
                  provident ad, iure aliquam eius. Blanditiis laborum vero,
                  asperiores, aliquid dolorem impedit voluptates, officia alias
                  fugiat ipsum quidem iste odio sunt maxime sequi deserunt ipsa
                  quos quasi delectus iusto soluta autem. Sapiente dolores id
                  tempora iusto a? Necessitatibus veritatis adipisci, iusto sunt
                  architecto unde incidunt reprehenderit qui blanditiis,
                  aspernatur, saepe voluptatibus esse perspiciatis. Quidem, quis
                  deserunt! Nihil atque cum impedit sapiente nesciunt quis
                  repudiandae dolor dignissimos fuga eos a quas illum suscipit
                  quos aut, quo animi laudantium amet fugit iste ut voluptate?
                  Beatae quia, molestiae cum et sint perspiciatis quos.
                </p>
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageAvatar>
            <Avatar>
              <AvatarImage src={"/avatar.png"} />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent className="text-base flex flex-col gap-y-2">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                  Facere illum vitae autem suscipit eveniet assumenda explicabo
                  dolor laudantium mollitia sequi?
                </p>
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message>
          <MessageContent>
            <Bubble variant={"ghost"}>
              <BubbleContent className="text-base flex flex-col gap-y-2">
                <span className="uppercase text-blue-600">AI Explanation</span>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Deleniti modi a ipsa odio dolorem sed possimus ab dicta.
                  Minima, veritatis deserunt? Id voluptatibus eveniet, assumenda
                  rem nemo eligendi itaque amet modi obcaecati animi fugiat
                  consectetur consequuntur nisi quasi impedit laboriosam
                  provident ad, iure aliquam eius. Blanditiis laborum vero,
                  asperiores, aliquid dolorem impedit voluptates, officia alias
                  fugiat ipsum quidem iste odio sunt maxime sequi deserunt ipsa
                  quos quasi delectus iusto soluta autem. Sapiente dolores id
                  tempora iusto a? Necessitatibus veritatis adipisci, iusto sunt
                  architecto unde incidunt reprehenderit qui blanditiis,
                  aspernatur, saepe voluptatibus esse perspiciatis. Quidem, quis
                  deserunt! Nihil atque cum impedit sapiente nesciunt quis
                  repudiandae dolor dignissimos fuga eos a quas illum suscipit
                  quos aut, quo animi laudantium amet fugit iste ut voluptate?
                  Beatae quia, molestiae cum et sint perspiciatis quos.
                </p>
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <div className="flex justify-end pt-8 border-t">
          <Button>Next Question</Button>
        </div>
      </section>

      <section className="bottom-0 sticky w-full h-fit -mb-4 flex flex-col items-center gap-y-4 bg-white rounded-lg px-4 py-2">
        <div className="flex gap-x-4 w-full items-center rounded-lg bg-primary-foreground px-4 py-2 shadow border">
          <div className="w-full  flex items-center">
            <TextareaAutosize
              maxRows={5}
              className="w-full bg-none border-0 outline-0 no-scrollbar resize-none"
              placeholder="Ask me anything..."
            />
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
  );
};

export default ChatAiClient;
