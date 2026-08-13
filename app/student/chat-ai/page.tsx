import { cookies } from "next/headers";
import ChatAiClient from "~/components/chat-ai/chat-ai-client";

const Chat_Ai = async () => {
  // const cookieStore = await cookies();
  // const dataCookie = cookieStore.get("quiz_results")?.value;
  // const quiz_results = dataCookie ? JSON.parse(dataCookie) : null;

  // if (!quiz_results) {
  //   return (
  //     <section className="flex border rounded-lg items-center justify-center p-20 min-h-[50vh]">
  //       <p className="text-center text-indigo-600/70 text-xl font-medium">
  //         Please attempt a quiz before you can review with AI.
  //       </p>
  //     </section>
  //   );
  // }

  // return <ChatAiClient initialResults={quiz_results} />;
  return <div>Hello World for the next three hours</div>;
};

export default Chat_Ai;
