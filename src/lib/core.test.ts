import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { cards, formulas, topicCards } from './catalog';
import { getStats, topicStats } from './stats';
import { isDue, isMastered, reviewCard } from './srs';
import { quizFor } from './quiz';
import { db, exportBackup, importBackup, loadData, saveReview, validateBackup } from './storage';

describe('повторение',()=>{
  it('хранит направления отдельно и назначает интервалы по оценке',()=>{
    const date=new Date('2026-01-01T12:00:00Z');
    const p=reviewCard(undefined,'a',2,date);
    expect(p.intervalDays).toBe(1);expect(p.correct).toBe(1);expect(isDue(p,date)).toBe(false);
    const again=reviewCard(p,'a',2,new Date('2026-01-02T12:00:00Z'));
    const mastered=reviewCard(again,'a',3,new Date('2026-01-06T12:00:00Z'));
    expect(isMastered(mastered)).toBe(true);
    const failed=reviewCard(mastered,'a',0,new Date('2026-01-07T12:00:00Z'));
    expect(failed.repetitions).toBe(0);expect(failed.errors).toBe(1);expect(isMastered(failed)).toBe(false);
  });
});
describe('каталог и статистика',()=>{
  it('не дублирует формулу в нескольких темах и разделяет карточки',()=>{
    const f=formulas.find(x=>x.topicIds.length>1)!;
    expect(f.topicIds).toHaveLength(2);
    expect(formulas.filter(x=>x.id===f.id)).toHaveLength(1);
    expect(topicCards(f.topicIds[0]).some(c=>c.formulaId===f.id)).toBe(true);
    expect(topicCards(f.topicIds[1]).some(c=>c.formulaId===f.id)).toBe(true);
    expect(new Set(cards.map(c=>c.id)).size).toBe(cards.length);
    expect(getStats(new Map(),[]).uniqueFormulas).toBe(formulas.length);
    expect(getStats(new Map(),[]).totalCards).toBe(cards.length);
  });
  it('строит тест только с четырьмя различными вариантами',()=>{
    for(const card of cards){const q=quizFor(card);if(q){expect(q.options).toHaveLength(4);expect(new Set(q.options.map(o=>o.label)).size).toBe(4);expect(q.options.filter(o=>o.key===q.correctKey)).toHaveLength(1)}}
  });
  it('не создаёт тест с неоднозначным названием или выражением',()=>{
    for(const c of cards){
      const f=formulas.find(x=>x.id===c.formulaId)!;
      if(c.direction==='name-formula'&&formulas.some(x=>x.id!==f.id&&x.title===f.title&&x.latex!==f.latex))expect(quizFor(c)).toBeNull();
      if(c.direction==='formula-name'&&formulas.some(x=>x.id!==f.id&&x.latex===f.latex&&x.title!==f.title))expect(quizFor(c)).toBeNull();
    }
  });
  it('все формулы имеют ссылки на абзацы исходного файла',()=>{
    expect(formulas).toHaveLength(127);
    expect(formulas.every(f=>f.source==='verified'&&f.sourceParagraphs?.length)).toBe(true);
  });
  it('не смешивает статистику прежнего каталога с текущими карточками',()=>{
    const old={id:'legacy-answer',cardId:'old-formula:name-formula',at:'2026-01-01T12:00:00Z',grade:2 as const};
    expect(getStats(new Map(),[old]).answers).toBe(0);
  });
  it('засчитывает первое прохождение темы и сохраняет освоение отдельным показателем',()=>{
    const topic='kinematics';
    const group=topicCards(topic).filter(c=>c.direction==='name-formula');
    const date=new Date('2026-01-01T12:00:00Z');
    const progress=new Map(group.map(c=>[c.id,reviewCard(undefined,c.id,2,date)]));
    const summary=topicStats(topic,progress,date);
    expect(summary.directions['name-formula'].studied).toBe(group.length);
    expect(summary.directions['name-formula'].mastered).toBe(0);
    expect(summary.studied).toBe(group.length);
    expect(summary.total).toBeGreaterThan(group.length);
    expect(getStats(progress,[],date).studied).toBe(group.length);
  });
  it('учитывает одну карточку из разных тем один раз в общем прогрессе',()=>{
    const shared=formulas.find(f=>f.topicIds.length>1)!;
    const card=cards.find(c=>c.formulaId===shared.id)!;
    const date=new Date('2026-01-01T12:00:00Z');
    const progress=new Map([[card.id,reviewCard(undefined,card.id,0,date)]]);
    expect(getStats(progress,[],date).studied).toBe(1);
    expect(topicStats(shared.topicIds[0],progress,date).studied).toBe(1);
    expect(topicStats(shared.topicIds[1],progress,date).studied).toBe(1);
  });
});
describe('хранение и восстановление',()=>{
  beforeEach(async()=>{await db.progress.clear();await db.answers.clear();await db.meta.clear()});
  it('сохраняет ответ и восстанавливает резервную копию',async()=>{
    const card=cards[0],at=new Date('2026-01-01T12:00:00Z');const p=reviewCard(undefined,card.id,2,at);
    const event={id:'event-1',cardId:card.id,at:at.toISOString(),grade:2 as const};
    await saveReview(p,event,{ids:[card.id],index:0,answered:0,mode:'name-formula',kind:'learn'});
    const backup=await exportBackup();expect(validateBackup(backup).answers).toHaveLength(1);
    await db.progress.clear();await db.answers.clear();await importBackup(backup);
    const data=await loadData();expect(data.progress.get(card.id)?.seen).toBe(1);expect(data.answers).toHaveLength(1);
    const newer=reviewCard(p,card.id,3,new Date('2026-01-03T12:00:00Z'));
    await db.progress.put(newer);await importBackup(backup);
    expect((await loadData()).progress.get(card.id)?.seen).toBe(2);
    expect(()=>validateBackup({...backup,progress:[{...p,id:'!!'}]})).toThrow();
  });
});
