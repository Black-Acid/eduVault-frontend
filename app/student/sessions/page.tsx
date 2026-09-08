import React, { Suspense } from "react";
import { cookies } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  XCircle,
  Clock3,
  MonitorPlay,
  Info
} from "lucide-react";
import Link from "next/link";

type SessionStatus =
  | "PENDING"
  | "CONFIRMED"
  | "LIVE"
  | "DECLINED"
  | "COMPLETED";

interface TutoringSession {
  id: number;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  meeting_url: string | null;
  created_at: string;
  tutor: {
    id: number;
    name: string;
  };
  subject: {
    id: number;
    name: string;
  };
}

const getStatusConfig = (status: SessionStatus) => {
  switch (status) {
    case "LIVE":
      return {
        label: "Live Now",
        icon: <Video className="w-4 h-4 mr-1.5" />,
        colorClass: "bg-red-100 text-red-700 border-red-200",
        message: "Your session is live. Join now to start learning.",
      };
    case "CONFIRMED":
      return {
        label: "Confirmed",
        icon: <CheckCircle className="w-4 h-4 mr-1.5" />,
        colorClass: "bg-green-100 text-green-700 border-green-200",
        message: "Confirmed — waiting for tutor to start the session",
      };
    case "PENDING":
      return {
        label: "Pending",
        icon: <Clock3 className="w-4 h-4 mr-1.5" />,
        colorClass: "bg-amber-100 text-amber-700 border-amber-200",
        message: "Waiting for tutor confirmation",
      };
    case "DECLINED":
      return {
        label: "Declined",
        icon: <XCircle className="w-4 h-4 mr-1.5" />,
        colorClass: "bg-slate-100 text-slate-700 border-slate-200",
        message: "This session was declined by the tutor.",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        icon: <MonitorPlay className="w-4 h-4 mr-1.5" />,
        colorClass: "bg-blue-100 text-blue-700 border-blue-200",
        message: "This session has ended.",
      };
    default:
      return {
        label: status,
        icon: <Info className="w-4 h-4 mr-1.5" />,
        colorClass: "bg-gray-100 text-gray-700 border-gray-200",
        message: "",
      };
  }
};

const SessionCard = ({ session }: { session: TutoringSession }) => {
  const statusConfig = getStatusConfig(session.status);
  const date = new Date(session.scheduled_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 ${session.status === 'LIVE' ? 'border-red-300 shadow-md ring-1 ring-red-100' : 'hover:shadow-sm'}`}>
      {session.status === "LIVE" && (
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
      )}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">
              {session.subject.name}
            </CardTitle>
            <CardDescription className="text-base mt-1.5 text-muted-foreground flex items-center">
              {session.tutor.name}
            </CardDescription>
          </div>
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.colorClass}`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-slate-600">
              <Calendar className="w-4 h-4 mr-2 text-slate-400" />
              {formattedDate}
            </div>
            <div className="flex items-center text-slate-600">
              <Clock className="w-4 h-4 mr-2 text-slate-400" />
              {formattedTime}
            </div>
            <div className="flex items-center text-slate-600">
              <Clock3 className="w-4 h-4 mr-2 text-slate-400" />
              {session.duration_minutes} min
            </div>
          </div>

          <div className="mt-2 text-sm text-slate-500 italic bg-slate-50 p-3 rounded-md border border-slate-100">
            {statusConfig.message}
          </div>
        </div>
      </CardContent>

      {session.status === "LIVE" && session.meeting_url && (
        <CardFooter className="pt-2 bg-red-50/30">
          <Button nativeButton={false} render={<Link href={session.meeting_url} target="_blank" rel="noopener noreferrer" />} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-colors">
            <Video className="w-4 h-4 mr-2" />
            Join Session
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

async function SessionsData() {
  const cookieStore = await cookies();
  const dataCookie = cookieStore.get("data")?.value;
  let token = "";
  if (dataCookie) {
    try {
      token = JSON.parse(dataCookie).access_token || "";
    } catch (e) { }
  }

  let sessions: TutoringSession[] = [];
  let errorMsg = "";

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://eduvault-jadl.onrender.com";

  try {
    const res = await fetch(`${apiUrl}/sessions/my-sessions`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!res.ok) {
      errorMsg = "Unable to load your tutoring sessions.";
    } else {
      sessions = await res.json();
    }
  } catch (err) {
    errorMsg = "Unable to load your tutoring sessions.";
  }

  if (errorMsg) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
        <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-red-800">
          Error
        </h3>
        <p className="text-red-600 mt-1">
          {errorMsg}
        </p>
      </div>
    );
  }

  const liveSessions = sessions.filter((s) => s.status === "LIVE");
  const upcomingSessions = sessions.filter(
    (s) => s.status === "PENDING" || s.status === "CONFIRMED"
  );
  const pastSessions = sessions.filter(
    (s) => s.status === "COMPLETED" || s.status === "DECLINED"
  );

  return (
    <div className="space-y-10">
      {liveSessions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-800 flex items-center">
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Live Now
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {liveSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </section>
      )}

      {upcomingSessions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-800">
            Upcoming Sessions
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </section>
      )}

      {pastSessions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-800">
            Past & Declined Sessions
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {pastSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </section>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">
            No sessions found
          </h3>
          <p className="text-slate-500 mt-1">
            You haven't booked any tutoring sessions yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Tutoring Sessions
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Manage and view your booked tutoring sessions.
        </p>
      </div>

      <Suspense fallback={
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <h3 className="text-lg font-medium text-slate-700">Loading your tutoring sessions...</h3>
        </div>
      }>
        <SessionsData />
      </Suspense>
    </div>
  );
}
