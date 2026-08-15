export type DayActivity = {
  date: string;
  count: number;
};

export function getCurrentStreak(activity: DayActivity[], today: Date): number {
  const byDate = new Map(activity.map((a) => [a.date, a.count]));
  let streak = 0;
  const cursor = new Date(today);

  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if ((byDate.get(iso) ?? 0) > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}