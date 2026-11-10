export type Direction = 'name-formula' | 'formula-name' | 'symbol-meaning' | 'meaning-symbol';
export type Grade = 0 | 1 | 2 | 3;
export type Filter = 'all' | 'new' | 'due' | 'hard' | 'favorites';
export interface SymbolDef { symbol: string; meaning: string; unit?: string; sourceParagraph?: number; }
export interface Formula { id: string; sectionId: string; topicIds: string[]; subtopic: string; title: string; latex: string; symbols: SymbolDef[]; conditions: string; explanation: string; source: 'demo' | 'verified'; sourceParagraphs?: number[]; }
export interface Topic { id: string; sectionId: string; title: string; }
export interface Section { id: string; title: string; icon: string; color: string; }
export interface Card { id: string; formulaId: string; direction: Direction; symbolIndex?: number; }
export interface Review { at: string; grade: Grade; }
export interface CardProgress { id: string; status: 'learning' | 'review'; seen: number; correct: number; errors: number; lastReview: string; nextReview: string; intervalDays: number; ease: number; repetitions: number; history: Review[]; }
export interface AnswerEvent { id: string; cardId: string; at: string; grade: Grade; }
export interface SavedSession { ids: string[]; index: number; answered: number; topicId?: string; mode: Direction | 'mixed' | 'quiz'; kind: 'learn' | 'review' | 'errors' | 'random' | 'favorites'; }
export interface Backup { format: 'formula-progress'; version: 1; exportedAt: string; progress: CardProgress[]; answers: AnswerEvent[]; favorites: string[]; session: SavedSession | null; }
