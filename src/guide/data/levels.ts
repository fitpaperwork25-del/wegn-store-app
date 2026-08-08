// Academy levels — a simple, honest reflection of lessons completed
// so far. No hidden scoring, just a friendlier name for a milestone
// count.

export interface AcademyLevel {
  rank: number;
  name: string;
  minLessons: number;
}

export const ACADEMY_LEVELS: AcademyLevel[] = [
  { rank: 1, name: "New Hire", minLessons: 0 },
  { rank: 2, name: "Trainee", minLessons: 3 },
  { rank: 3, name: "Associate", minLessons: 6 },
  { rank: 4, name: "Specialist", minLessons: 10 },
  { rank: 5, name: "Expert", minLessons: 15 },
  { rank: 6, name: "Master", minLessons: 20 },
];

export function getLevelForCompletedCount(completedCount: number): AcademyLevel {
  let current = ACADEMY_LEVELS[0];
  for (const level of ACADEMY_LEVELS) {
    if (completedCount >= level.minLessons) current = level;
  }
  return current;
}

export function getNextLevel(completedCount: number): AcademyLevel | null {
  return ACADEMY_LEVELS.find((l) => l.minLessons > completedCount) ?? null;
}
