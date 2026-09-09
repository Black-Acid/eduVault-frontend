// import { Button } from "~/components/ui/button";

// const tutors = [
//   {
//     name: "Ama Mensah",
//     initials: "AM",
//     subjects: ["Core Math", "Add Math", "Statistics"],
//     rating: 4.9,
//     reviews: 128,
//     experience: "6 years teaching experience",
//     location: "Accra, Ghana",
//     availability: "Available today",
//     price: "GH₵120 / session",
//     bio: "Focused on breaking difficult concepts into simple steps with exam-style practice.",
//   },
//   {
//     name: "Kofi Asare",
//     initials: "KA",
//     subjects: ["Integrated Science", "Physics", "Chemistry"],
//     rating: 4.8,
//     reviews: 94,
//     experience: "8 years teaching experience",
//     location: "Kumasi, Ghana",
//     availability: "Available this evening",
//     price: "GH₵150 / session",
//     bio: "Strong on WAEC preparation, practical explanations, and past-question drills.",
//   },
//   {
//     name: "Esi Boateng",
//     initials: "EB",
//     subjects: ["English Language", "Literature", "Writing"],
//     rating: 5.0,
//     reviews: 201,
//     experience: "5 years teaching experience",
//     location: "Tema, Ghana",
//     availability: "Available tomorrow",
//     price: "GH₵110 / session",
//     bio: "Helps students improve comprehension, essay writing, and confidence in exams.",
//   },
//   {
//     name: "Yaw Ofori",
//     initials: "YO",
//     subjects: ["Elective Math", "Further Math", "Problem Solving"],
//     rating: 4.7,
//     reviews: 76,
//     experience: "7 years teaching experience",
//     location: "Takoradi, Ghana",
//     availability: "Available weekends",
//     price: "GH₵140 / session",
//     bio: "Best for students who want a structured plan and repeated practice until mastery.",
//   },
// ];

// const StudentAvailableTutorsPage = () => {
//   return (
//     <section className="flex flex-col gap-6">
//       <div className="flex flex-col gap-2">
//         <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
//           Available Tutors
//         </p>
//         <div className="flex flex-wrap items-end justify-between gap-3">
//           <div>
//             <h1 className="font-mono text-3xl font-semibold text-ink">
//               Book a tutor that fits your subject needs.
//             </h1>
//             <p className="mt-2 max-w-2xl text-sm text-ink-soft">
//               Browse tutors by subject, review their ratings, and choose the
//               one that matches your learning pace.
//             </p>
//           </div>
//           <div className="rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-sm font-medium text-blue-700">
//             4 tutors online now
//           </div>
//         </div>
//       </div>

//       <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
//         {tutors.map((tutor) => (
//           <article
//             key={tutor.name}
//             className="rounded-2xl border border-line bg-white/80 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-lg"
//           >
//             <div className="flex items-start justify-between gap-4">
//               <div className="flex items-center gap-4">
//                 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-sm">
//                   {tutor.initials}
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-semibold text-ink">{tutor.name}</h2>
//                   <p className="text-sm text-ink-soft">{tutor.location}</p>
//                 </div>
//               </div>
//               <div className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-700">
//                 {tutor.availability}
//               </div>
//             </div>

//             <div className="mt-5 flex flex-wrap gap-2">
//               {tutor.subjects.map((subject) => (
//                 <span
//                   key={subject}
//                   className="rounded-full border border-blue-500/15 bg-blue-500/8 px-3 py-1 text-xs font-medium text-blue-700"
//                 >
//                   {subject}
//                 </span>
//               ))}
//             </div>

//             <div className="mt-5 grid gap-3 text-sm text-ink-soft sm:grid-cols-3">
//               <div className="rounded-xl bg-paper px-3 py-2">
//                 <p className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">
//                   Rating
//                 </p>
//                 <p className="mt-1 font-semibold text-ink">
//                   {tutor.rating} / 5.0
//                 </p>
//                 <p className="text-xs text-ink-soft">{tutor.reviews} reviews</p>
//               </div>
//               <div className="rounded-xl bg-paper px-3 py-2">
//                 <p className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">
//                   Experience
//                 </p>
//                 <p className="mt-1 font-semibold text-ink">{tutor.experience}</p>
//               </div>
//               <div className="rounded-xl bg-paper px-3 py-2">
//                 <p className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">
//                   Session Fee
//                 </p>
//                 <p className="mt-1 font-semibold text-ink">{tutor.price}</p>
//               </div>
//             </div>

//             <p className="mt-4 text-sm leading-6 text-ink-soft">{tutor.bio}</p>

//             <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
//               <div className="text-sm text-ink-soft">
//                 <span className="font-semibold text-ink">Subjects:</span>{" "}
//                 {tutor.subjects.join(", ")}
//               </div>
//               <Button className="rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700">
//                 Book session
//               </Button>
//             </div>
//           </article>
//         ))}
//       </div>
//     </section>
//   );
// };

// export default StudentAvailableTutorsPage;


"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

const BASE_URL = "https://eduvault-jadl.onrender.com";

interface Tutor {
  id: number;
  full_name: string;
  location: string;
  is_available_today: boolean;
  specializations: string[];
  rating: number;
  review_count: number;
  years_of_experience: number;
  session_fee: string;
  bio: string;
  subjects: string[];
}

const StudentAvailableTutorsPage = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${BASE_URL}/tutors`);

        if (!response.ok) {
          throw new Error("Failed to fetch tutors");
        }

        const data = await response.json();

        setTutors(data);
      } catch (error) {
        console.error("Error fetching tutors:", error);
        setError("Unable to load tutors. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Available Tutors
          </p>

          <div>
            <h1 className="font-mono text-3xl font-semibold text-ink">
              Book a tutor that fits your subject needs.
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              Browse tutors by subject, review their ratings, and choose the
              one that matches your learning pace.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-ink-soft">Loading tutors...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Available Tutors
          </p>

          <div>
            <h1 className="font-mono text-3xl font-semibold text-ink">
              Book a tutor that fits your subject needs.
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              Browse tutors by subject, review their ratings, and choose the
              one that matches your learning pace.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          Available Tutors
        </p>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-mono text-3xl font-semibold text-ink">
              Book a tutor that fits your subject needs.
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              Browse tutors by subject, review their ratings, and choose the
              one that matches your learning pace.
            </p>
          </div>

          <div className="rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-sm font-medium text-blue-700">
            {tutors.length} tutor{tutors.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </div>

      {tutors.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white/80 p-8 text-center shadow-sm">
          <p className="text-sm text-ink-soft">
            No tutors are available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {tutors.map((tutor) => (
            <article
              key={tutor.id}
              className="rounded-2xl border border-line bg-white/80 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Tutor initials */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-sm">
                    {getInitials(tutor.full_name)}
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-ink">
                      {tutor.full_name}
                    </h2>

                    <p className="text-sm text-ink-soft">
                      {tutor.location}
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    tutor.is_available_today
                      ? "border border-green-500/20 bg-green-500/10 text-green-700"
                      : "border border-gray-500/20 bg-gray-500/10 text-gray-600"
                  }`}
                >
                  {tutor.is_available_today
                    ? "Available today"
                    : "Not available today"}
                </div>
              </div>

              {/* Specializations */}
              <div className="mt-5 flex flex-wrap gap-2">
                {tutor.specializations.map((specialization) => (
                  <span
                    key={specialization}
                    className="rounded-full border border-blue-500/15 bg-blue-500/8 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {specialization}
                  </span>
                ))}
              </div>

              {/* Tutor information */}
              <div className="mt-5 grid gap-3 text-sm text-ink-soft sm:grid-cols-3">
                <div className="rounded-xl bg-paper px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">
                    Rating
                  </p>

                  <p className="mt-1 font-semibold text-ink">
                    {Number(tutor.rating).toFixed(1)} / 5.0
                  </p>

                  <p className="text-xs text-ink-soft">
                    {tutor.review_count} reviews
                  </p>
                </div>

                <div className="rounded-xl bg-paper px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">
                    Experience
                  </p>

                  <p className="mt-1 font-semibold text-ink">
                    {tutor.years_of_experience} year
                    {tutor.years_of_experience !== 1 ? "s" : ""}
                  </p>

                  <p className="text-xs text-ink-soft">
                    teaching experience
                  </p>
                </div>

                <div className="rounded-xl bg-paper px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">
                    Session Fee
                  </p>

                  <p className="mt-1 font-semibold text-ink">
                    GH₵{Number(tutor.session_fee).toFixed(2)}
                  </p>

                  <p className="text-xs text-ink-soft">
                    per session
                  </p>
                </div>
              </div>

              {/* Bio */}
              <p className="mt-4 text-sm leading-6 text-ink-soft">
                {tutor.bio}
              </p>

              {/* Subjects + Book button */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <div className="text-sm text-ink-soft">
                  <span className="font-semibold text-ink">Subjects:</span>{" "}
                  {tutor.subjects.join(", ")}
                </div>

                <Button className="rounded-full bg-blue-600 px-5 text-white hover:bg-blue-700">
                  Book session
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default StudentAvailableTutorsPage;
