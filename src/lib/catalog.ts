import raw from '../data/catalog.full.json';
import type { Card, Direction, Formula, Section, Topic } from '../types';

export const sections = raw.sections as Section[];
export const topics = raw.topics as Topic[];
export const formulas = raw.formulas as Formula[];
export const formulaById = new Map(formulas.map(f => [f.id, f]));
export const topicById = new Map(topics.map(t => [t.id, t]));
export const sectionById = new Map(sections.map(s => [s.id, s]));
export const directions: Direction[] = ['name-formula','formula-name','symbol-meaning','meaning-symbol'];
export const cards: Card[] = formulas.flatMap(f => [
  {id:`${f.id}:name-formula`,formulaId:f.id,direction:'name-formula' as const},
  {id:`${f.id}:formula-name`,formulaId:f.id,direction:'formula-name' as const},
  ...f.symbols.flatMap((_,i) => [
    {id:`${f.id}:symbol-meaning:${i}`,formulaId:f.id,direction:'symbol-meaning' as const,symbolIndex:i},
    {id:`${f.id}:meaning-symbol:${i}`,formulaId:f.id,direction:'meaning-symbol' as const,symbolIndex:i}
  ])
]);
export const cardById = new Map(cards.map(c => [c.id,c]));
export const topicFormulas = (id: string) => formulas.filter(f => f.topicIds.includes(id));
export const topicCards = (id: string) => cards.filter(c => formulaById.get(c.formulaId)?.topicIds.includes(id));
