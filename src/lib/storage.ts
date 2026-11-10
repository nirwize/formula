import Dexie, { type EntityTable } from 'dexie';
import type { AnswerEvent, Backup, CardProgress, SavedSession } from '../types';
import { cardById } from './catalog';

type Meta = {key:string; value:unknown};
class FormulaDB extends Dexie {
  progress!: EntityTable<CardProgress,'id'>;
  answers!: EntityTable<AnswerEvent,'id'>;
  meta!: EntityTable<Meta,'key'>;
  constructor() { super('formula-progress'); this.version(1).stores({progress:'id,nextReview',answers:'id,cardId,at',meta:'key'}); this.version(2).stores({progress:'id,nextReview',answers:'id,cardId,at',meta:'key'}).upgrade(async tx => { await tx.table('meta').put({key:'schemaVersion',value:2}); }); }
}
export const db = new FormulaDB();
export async function loadData() {
  const [progress,answers,favorites,session,lastTopic] = await Promise.all([db.progress.toArray(),db.answers.toArray(),db.meta.get('favorites'),db.meta.get('session'),db.meta.get('lastTopic')]);
  const saved=(session?.value as SavedSession | null) ?? null;
  const usable=saved&&saved.ids.every(id=>cardById.has(id))&&saved.index<saved.ids.length?saved:null;
  return {progress:new Map(progress.map(p=>[p.id,p])),answers,favorites:new Set((favorites?.value as string[]) ?? []),session:usable,lastTopic:(lastTopic?.value as string | null) ?? null};
}
export async function saveReview(p:CardProgress,a:AnswerEvent,session:SavedSession | null) { await db.transaction('rw',db.progress,db.answers,db.meta,async()=>{await db.progress.put(p);await db.answers.put(a);await db.meta.put({key:'session',value:session});}); }
export async function saveSession(s:SavedSession | null) { await db.meta.put({key:'session',value:s}); }
export async function saveFavorites(ids:Set<string>) { await db.meta.put({key:'favorites',value:[...ids]}); }
export async function saveLastTopic(id:string) { await db.meta.put({key:'lastTopic',value:id}); }
export async function exportBackup():Promise<Backup> {const d=await loadData();return {format:'formula-progress',version:1,exportedAt:new Date().toISOString(),progress:[...d.progress.values()],answers:d.answers,favorites:[...d.favorites],session:d.session};}
const object = (x:unknown):x is Record<string,unknown> => typeof x==='object' && x!==null && !Array.isArray(x);
export function validateBackup(x:unknown):Backup {
  if (!object(x)||x.format!=='formula-progress'||x.version!==1||!Array.isArray(x.progress)||!Array.isArray(x.answers)||!Array.isArray(x.favorites)||!(x.session===null||object(x.session))) throw new Error('Неверный формат резервной копии.');
  const validId=(id:unknown)=>typeof id==='string'&&/^[a-z0-9:-]+$/.test(id)&&id.length<160;
  for (const p of x.progress) if (!object(p)||!validId(p.id)||!['learning','review'].includes(String(p.status))||!Number.isInteger(p.seen)||!Number.isInteger(p.correct)||!Number.isInteger(p.errors)||!Number.isFinite(p.intervalDays)||!Number.isFinite(p.ease)||!Number.isInteger(p.repetitions)||!Array.isArray(p.history)||!p.history.every(h=>object(h)&&Number.isFinite(Date.parse(String(h.at)))&&[0,1,2,3].includes(Number(h.grade)))||!Number.isFinite(Date.parse(String(p.lastReview)))||!Number.isFinite(Date.parse(String(p.nextReview)))||Number(p.correct)<0||Number(p.errors)<0||Number(p.seen)<Number(p.correct)+Number(p.errors)) throw new Error('Некорректные данные карточек.');
  for (const a of x.answers) if (!object(a)||!validId(a.id)||!validId(a.cardId)||!Number.isFinite(Date.parse(String(a.at)))||![0,1,2,3].includes(Number(a.grade))) throw new Error('Некорректная история ответов.');
  if (!x.favorites.every(validId)) throw new Error('Некорректное избранное.');
  if (x.session!==null) { const s=x.session; if (!Array.isArray(s.ids)||!s.ids.every(id=>typeof id==='string'&&cardById.has(id))||!Number.isInteger(s.index)||Number(s.index)<0||Number(s.index)>s.ids.length||!Number.isInteger(s.answered)||Number(s.answered)<0||!['name-formula','formula-name','symbol-meaning','meaning-symbol','mixed','quiz'].includes(String(s.mode))||!['learn','review','errors','random','favorites'].includes(String(s.kind))) throw new Error('Некорректная незавершённая сессия.'); }
  return x as unknown as Backup;
}
export async function importBackup(backup:Backup, replace=false) {
  validateBackup(backup);
  await db.transaction('rw',db.progress,db.answers,db.meta,async()=>{
    if (replace) {await db.progress.clear();await db.answers.clear();}
    const existing = replace ? new Map<string,CardProgress>() : new Map((await db.progress.toArray()).map(p=>[p.id,p]));
    await db.progress.bulkPut(backup.progress.filter(p=>!existing.has(p.id)||Date.parse(p.lastReview)>=Date.parse(existing.get(p.id)!.lastReview)));
    await db.answers.bulkPut(backup.answers);
    const current=(await db.meta.get('favorites'))?.value as string[]|undefined;
    await db.meta.put({key:'favorites',value:replace?backup.favorites:[...new Set([...(current??[]),...backup.favorites])]});
    if (replace) await db.meta.put({key:'session',value:backup.session});
  });
}
