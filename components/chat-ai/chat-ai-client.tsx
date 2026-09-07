"use client";
// import TextareaAutosize from "react-textarea-autosize";
import { Button } from "../ui/button";
// import { HugeiconsIcon } from "@hugeicons/react";
// import { ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { Message, MessageAvatar, MessageContent } from "../ui/message";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Bubble, BubbleContent } from "../ui/bubble";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "../ui/toast";

interface ChatAiClientProps {
  questions_to_solve: questions_to_solve[];
}

type questions_to_solve = {
  question_id: string;
  attempt_id: string;
  is_resolved: boolean;
};

type AiResponse = {
  question_id: number;
  question_text: string;
  student_answer: {
    label: string;
    text: string;
  };
  correct_answer: {
    label: string;
    text: string;
  };
  topic: string;
  concept: string;
  why_student_answer_is_wrong: string;
  why_correct_answer_is_right: string;
  solution: string;
  key_takeaway: string;
};

const ChatAiClient = ({ questions_to_solve }: ChatAiClientProps) => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiResponse | null | "Failed">(
    null,
  );

  const currentQuestion = questions_to_solve[currentIndex];

  // Hit the /api/chat-ai/ endpoint automatically when the component mounts or question changes
  useEffect(() => {
    if (!currentQuestion) return;

    const fetchInitialAiReview = async () => {
      try {
        const response = await fetch("/api/chat-ai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question_id: currentQuestion.question_id,
            attempt_id: currentQuestion.attempt_id,
          }),
        });

        if (!response.ok) {
          toast.add({
            description:
              "Couldn't fetch AI explanation. Please try again later.",
            type: "error",
          });
          setAiResponse("Failed"); // Indicate that the AI response failed
          return;
        }

        const data = await response.json();

        // Adjust this depending on your API response structure (e.g. data.verdict or data.message)
        return setAiResponse(data);
      } catch {
        toast.add({
          description: "Couldn't fetch AI explanation. Please try again later.",
          type: "error",
        });
      }
    };

    fetchInitialAiReview();
  }, [currentIndex, currentQuestion]);

  const handleNextQuestion = async () => {
    if (!currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/resolve-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: currentQuestion.question_id,
          attempt_id: currentQuestion.attempt_id,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to resolve question", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return aiResponse === null ? (
    <div className="animate-pulse flex items-center justify-center p-20 border shadow rounded-lg">
      <p className="text-blue-600/70 text-xl font-medium">
        Fetching AI explanation...
      </p>
    </div>
  ) : aiResponse === "Failed" ? (
    <div className="flex items-center justify-center p-20 border shadow rounded-lg">
      <p className="text-red-600/70 text-xl font-medium">
        Failed to fetch AI explanation. Please try again later.
      </p>
    </div>
  ) : (
    <div className="flex flex-col relative mx-auto max-w-360 min-h-dvh -mt-6">
      <div className="sticky top-0 h-2 bg-white w-full z-20"></div>
      <section className="top-2 z-10 sticky bg-primary-foreground/90 backdrop-blur p-4 rounded-lg shadow border">
        <div className="flex justify-between items-center pb-2 border-b">
          <h2 className="font-medium text-blue-600">
            Reviewing missed questions
          </h2>
          <p className="text-xs font-medium text-primary/80">Quesion 1 of 40</p>
        </div>
        <div className="flex flex-col gap-y-2 mt-2">
          <p className="text-blue-600/70 font-semibold uppercase">
            Question: {currentQuestion?.question_id}
          </p>
          <p className="-mt-1">
            <span className="text-base text-primary/90">
              {aiResponse.question_text}
            </span>
          </p>
          <div className="flex gap-x-4">
            <div className="text-sm max-w-md p-2 bg-red/10 rounded-lg border border-red/50 gap-y-1 flex flex-col min-w-50">
              <p className="uppercase text-red font-semibold flex gap-x-2">
                <span>✕</span>
                <span>your answer</span>
              </p>
              <p className="">
                <span className="text-base text-primary/90 capitalize">
                  {aiResponse.student_answer.text}
                </span>
              </p>
            </div>
            <div className="text-sm max-w-md p-2 bg-green/10 rounded-lg border border-green/50 gap-y-1 flex flex-col min-w-50">
              <p className="uppercase text-green font-semibold flex gap-x-2">
                <span>✓</span>
                <span>correct answer</span>
              </p>
              <p className="">
                <span className="text-base text-primary/90 capitalize">
                  {aiResponse?.correct_answer.text}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="min-h-[calc(100vh-200px)] flex flex-col gap-y-8 px-4 z-0 mt-6">
        <Message>
          <MessageAvatar className="self-start">
            <Avatar>
              <AvatarImage src={"/avatar.png"} />
              <AvatarFallback
                className={"bg-blue-600 text-white font-semibold"}
              >
                AI
              </AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant={"ghost"}>
              <BubbleContent className="text-base flex flex-col gap-y-2">
                <div className="flex flex-col gap-y-1">
                  <p className="font-semibold text-blue-600 text-sm uppercase flex gap-x-2">
                    Topic: <span>{aiResponse.topic}</span>
                  </p>
                  <p className="font-semibold text-blue-600 text-sm uppercase flex gap-x-2">
                    Concept: <span>{aiResponse.concept}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-y-1">
                  <span className="font-semibold text-blue-600 text-sm uppercase">
                    Solution
                  </span>
                  <span className="text-base text-primary/90 whitespace-pre-line">
                    {aiResponse.solution}
                  </span>
                </div>
                <div className="flex flex-col gap-y-1">
                  <span className="font-semibold text-blue-600 text-sm uppercase">
                    Why your answer is wrong
                  </span>
                  <span className="text-base text-primary/90 whitespace-pre-line">
                    {aiResponse.why_student_answer_is_wrong}
                  </span>
                </div>
                <div className="flex flex-col gap-y-1">
                  <span className="font-semibold text-blue-600 text-sm uppercase">
                    Why the correct answer is right
                  </span>
                  <span className="text-base text-primary/90 whitespace-pre-line">
                    {aiResponse.why_correct_answer_is_right}
                  </span>
                </div>
                <div className="flex flex-col gap-y-1">
                  <span className="font-semibold text-blue-600 text-sm uppercase">
                    Key takeaway
                  </span>
                  <span className="text-base text-primary/90 whitespace-pre-line">
                    {aiResponse.key_takeaway}
                  </span>
                </div>
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        {/* <Message align="end">
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
        </Message> */}
        {/* <Message>
          <MessageAvatar className="self-start">
            <Avatar>
              <AvatarImage src={"/avatar.png"} />
              <AvatarFallback
                className={"bg-blue-600 text-white font-semibold"}
              >
                AI
              </AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant={"ghost"}>
              <BubbleContent className="text-base flex flex-col gap-y-1">
                <span className="font-semibold text-primary/50 text-sm uppercase">
                  follow-up
                </span>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Deleniti modi a ipsa odio dolorem sed possimus ab dicta. Minima,
                veritatis deserunt? Id voluptatibus eveniet, assumenda rem nemo
                eligendi itaque amet modi obcaecati animi fugiat consectetur
                consequuntur nisi quasi impedit laboriosam provident ad, iure
                aliquam eius. Blanditiis laborum vero, asperiores, aliquid
                dolorem impedit voluptates, officia alias fugiat ipsum quidem
                iste odio sunt maxime sequi deserunt ipsa quos quasi delectus
                iusto soluta autem. Sapiente dolores id tempora iusto a?
                Necessitatibus veritatis adipisci, iusto sunt architecto unde
                incidunt reprehenderit qui blanditiis, aspernatur, saepe
                voluptatibus esse perspiciatis. Quidem, quis deserunt! Nihil
                atque cum impedit sapiente nesciunt quis repudiandae dolor
                dignissimos fuga eos a quas illum suscipit quos aut, quo animi
                laudantium amet fugit iste ut voluptate? Beatae quia, molestiae
                cum et sint perspiciatis quos.
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
        </Message> */}
        {/* <Message>
          <MessageAvatar className="self-start">
            <Avatar>
              <AvatarImage src={"/avatar.png"} />
              <AvatarFallback
                className={"bg-blue-600 text-white font-semibold"}
              >
                AI
              </AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant={"ghost"}>
              <BubbleContent className="text-base flex flex-col gap-y-1">
                <span className="font-semibold text-primary/50 text-sm uppercase">
                  follow-up
                </span>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Deleniti modi a ipsa odio dolorem sed possimus ab dicta. Minima,
                veritatis deserunt? Id voluptatibus eveniet, assumenda rem nemo
                eligendi itaque amet modi obcaecati animi fugiat consectetur
                consequuntur nisi quasi impedit laboriosam provident ad, iure
                aliquam eius. Blanditiis laborum vero, asperiores, aliquid
                dolorem impedit voluptates, officia alias fugiat ipsum quidem
                iste odio sunt maxime sequi deserunt ipsa quos quasi delectus
                iusto soluta autem. Sapiente dolores id tempora iusto a?
                Necessitatibus veritatis adipisci, iusto sunt architecto unde
                incidunt reprehenderit qui blanditiis, aspernatur, saepe
                voluptatibus esse perspiciatis. Quidem, quis deserunt! Nihil
                atque cum impedit sapiente nesciunt quis repudiandae dolor
                dignissimos fuga eos a quas illum suscipit quos aut, quo animi
                laudantium amet fugit iste ut voluptate? Beatae quia, molestiae
                cum et sint perspiciatis quos.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message> */}
        <div className="flex justify-end pt-8 border-t">
          <Button onClick={handleNextQuestion}>Next Question</Button>
        </div>
      </section>

      {/* <section className="bottom-0 sticky w-full h-fit -mb-4 flex flex-col items-center gap-y-4 bg-white rounded-lg px-4 py-2">
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
      </section> */}
    </div>
  );
};

export default ChatAiClient;
