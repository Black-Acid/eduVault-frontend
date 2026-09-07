import { cookies } from "next/headers";
import ChatAiClient from "~/components/chat-ai/chat-ai-client";

const Chat_Ai = async () => {
  const cookieStore = await cookies();
  const dataCookie = cookieStore.get("quiz_results")?.value;
  const all_results = dataCookie ? JSON.parse(dataCookie) : null;

  if (!all_results) {
    return (
      <section className="flex border rounded-lg items-center justify-center p-20 min-h-[50vh]">
        <p className="text-center text-blue-600/70 text-xl font-medium">
          Please attempt a quiz before you can review with AI.
        </p>
      </section>
    );
  }

  // Filter out questions that have already been resolved
  const unresolved_questions = all_results.filter(
    (q: { is_resolved: boolean }) => !q.is_resolved,
  );

  if (unresolved_questions.length === 0) {
    return (
      <section className="flex border rounded-lg items-center justify-center p-20 min-h-[50vh]">
        <p className="text-center text-green-600 text-xl font-medium">
          Congratulations! You have resolved all your missed questions.
        </p>
      </section>
    );
  }

  return <ChatAiClient questions_to_solve={unresolved_questions} />;
};

export default Chat_Ai;
