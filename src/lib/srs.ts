import type { CardProgress, Grade } from '../types';
const DAY = 86400000;
export const isDue = (p: CardProgress | undefined, now = new Date()) => !!p && new Date(p.nextReview).getTime() <= now.getTime();
export const isMastered = (p: CardProgress | undefined) => !!p && p.repetitions >= 3 && p.intervalDays >= 7 && p.correct >= 3;
export function reviewCard(previous: CardProgress | undefined, id: string, grade: Grade, at = new Date()): CardProgress {
  const p = previous ?? {id,status:'learning' as const,seen:0,correct:0,errors:0,lastReview:'',nextReview:'',intervalDays:0,ease:2.5,repetitions:0,history:[]};
  const correct = grade >= 2;
  const ease = Math.max(1.3, p.ease + (grade === 0 ? -0.25 : grade === 1 ? -0.15 : grade === 3 ? 0.1 : 0));
  const repetitions = correct ? p.repetitions + 1 : 0;
  const intervalDays = grade === 0 ? 0.01 : grade === 1 ? 0.25 : repetitions === 1 ? 1 : repetitions === 2 ? (grade === 3 ? 4 : 3) : Math.max(1,Math.round(p.intervalDays * ease * (grade === 3 ? 1.3 : 1)));
  return {id,status:correct ? 'review' : 'learning',seen:p.seen+1,correct:p.correct+(correct?1:0),errors:p.errors+(correct?0:1),lastReview:at.toISOString(),nextReview:new Date(at.getTime()+intervalDays*DAY).toISOString(),intervalDays,ease,repetitions,history:[...p.history,{at:at.toISOString(),grade}]};
}
