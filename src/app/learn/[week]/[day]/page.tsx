import { LessonPage } from "@/components/lesson-page";

export function generateStaticParams() {
  return Array.from({ length: 104 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => ({ week: String(weekIndex + 1), day: String(dayIndex + 1) })),
  ).flat();
}

export default async function ScheduledLesson({ params }: PageProps<"/learn/[week]/[day]">) {
  const { week, day } = await params;
  return <LessonPage requestedWeek={Number(week)} requestedDay={Number(day)} />;
}
