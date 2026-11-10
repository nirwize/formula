import { cards, cardById, formulaById, formulas, sections, topicCards } from './catalog';
import { isDue, isMastered } from './srs';
import type { AnswerEvent, Card, CardProgress, Direction } from '../types';
export function cardGroupStats(group: Card[], progress: Map<string,CardProgress>, now = new Date()) {
  return { total:group.length, studied:group.filter(c=>(progress.get(c.id)?.seen??0)>0).length,
    mastered:group.filter(c=>isMastered(progress.get(c.id))).length,
    due:group.filter(c=>isDue(progress.get(c.id),now)).length };
}
export function topicStats(id:string, progress:Map<string,CardProgress>, now = new Date()) {
  const group=topicCards(id);
  const directions:Direction[]=['name-formula','formula-name','symbol-meaning','meaning-symbol'];
  return {...cardGroupStats(group,progress,now),directions:Object.fromEntries(directions.map(d=>[d,cardGroupStats(group.filter(c=>c.direction===d),progress,now)])) as Record<Direction,ReturnType<typeof cardGroupStats>>};
}
export function getStats(progress: Map<string,CardProgress>, answers: AnswerEvent[], now = new Date()) {
  answers=answers.filter(a=>cardById.has(a.cardId));
  const overall=cardGroupStats(cards,progress,now);
  const correct = answers.filter(a => a.grade >= 2).length;
  const localDay = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const days = new Set(answers.map(a => localDay(new Date(a.at))));
  let streak = 0; const day = new Date(now); day.setHours(0,0,0,0);
  if (!days.has(localDay(day))) day.setDate(day.getDate()-1);
  while (days.has(localDay(day))) {streak++; day.setDate(day.getDate()-1);}
  return { uniqueFormulas:formulas.length,totalCards:overall.total,studied:overall.studied,mastered:overall.mastered,due:overall.due,remaining:overall.total-overall.studied,answers:answers.length,correctPercent:answers.length?Math.round(100*correct/answers.length):0,errors:answers.length-correct,streak,
    sections:sections.map(s=>({...s,...cardGroupStats(cards.filter(c=>formulaById.get(c.formulaId)?.sectionId===s.id),progress,now)}))};
}
