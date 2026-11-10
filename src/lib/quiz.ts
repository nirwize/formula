import { cards, formulaById, formulas } from './catalog';
import type { Card } from '../types';
export interface QuizQuestion {card:Card; prompt:string; symbolLatex?:string; options:{key:string;label:string;latex?:boolean}[]; correctKey:string; explanation:string;}
const shuffle = <T,>(xs:T[]) => [...xs].sort(()=>Math.random()-0.5);
const overlapsMeaning=(a:string,b:string)=>{const x=a.toLowerCase().split('(')[0].trim(),y=b.toLowerCase().split('(')[0].trim();return x.includes(y)||y.includes(x)};
const nearby = <T,>(items:T[], source:(x:T)=>{sectionId:string;topicIds:string[]}, f:typeof formulas[number]) => [
  ...shuffle(items.filter(x=>source(x).topicIds.some(id=>f.topicIds.includes(id)))),
  ...shuffle(items.filter(x=>!source(x).topicIds.some(id=>f.topicIds.includes(id))&&source(x).sectionId===f.sectionId)),
  ...shuffle(items.filter(x=>source(x).sectionId!==f.sectionId))
];
export function makeQuiz(card:Card):QuizQuestion|null {
  const f=formulaById.get(card.formulaId)!;
  if (card.direction==='name-formula'||card.direction==='formula-name') {
    const byName=card.direction==='name-formula';
    if (formulas.some(x=>x.id!==f.id&&(byName?x.title===f.title&&x.latex!==f.latex:x.latex===f.latex&&x.title!==f.title))) return null;
    const alternatives=nearby(formulas.filter(x=>x.id!==f.id && (byName?x.latex!==f.latex:x.title!==f.title)),x=>x,f).filter((x,i,a)=>a.findIndex(y=>byName?y.latex===x.latex:y.title===x.title)===i).slice(0,3);
    if (alternatives.length<3) return null;
    return {card,prompt:byName?f.title:f.latex,options:shuffle([f,...alternatives]).map(x=>({key:x.id,label:byName?x.latex:x.title,latex:byName})),correctKey:f.id,explanation:f.explanation};
  }
  const sym=f.symbols[card.symbolIndex!]; const reverse=card.direction==='meaning-symbol';
  const alternatives=shuffle(f.symbols.filter(x=>x.symbol!==sym.symbol&&!overlapsMeaning(x.meaning,sym.meaning)));
  const other=nearby(formulas.filter(x=>x.id!==f.id),x=>x,f).flatMap(x=>x.symbols).filter(x=>x.symbol!==sym.symbol&&!overlapsMeaning(x.meaning,sym.meaning)&&!f.symbols.some(y=>y.symbol===x.symbol||overlapsMeaning(y.meaning,x.meaning)));
  const pool=[...alternatives,...other];
  const unique=pool.filter((x,i,a)=>a.findIndex(y=>reverse?y.symbol===x.symbol:y.meaning===x.meaning)===i).slice(0,3);
  if (unique.length<3) return null;
  const selected=[sym,...unique];
  return {card,prompt:reverse?`Как обозначается «${sym.meaning}» в формуле «${f.title}»?`:`Что обозначает в формуле «${f.title}»?`,symbolLatex:reverse?undefined:sym.symbol,options:shuffle(selected).map((x,i)=>({key:`${i}:${x.symbol}:${x.meaning}`,label:reverse?x.symbol:x.meaning,latex:reverse})),correctKey:'',explanation:`${sym.symbol} — ${sym.meaning}${sym.unit?` (${sym.unit})`:''}.`};
}
export function quizFor(card:Card):QuizQuestion|null {const q=makeQuiz(card);if (!q)return null;if (q.correctKey)return q;const s=formulaById.get(card.formulaId)!.symbols[card.symbolIndex!];return {...q,correctKey:q.options.find(o=>o.key.endsWith(`:${s.symbol}:${s.meaning}`))!.key};}
export const quizCards=()=>shuffle(cards).filter(c=>quizFor(c)!==null);
