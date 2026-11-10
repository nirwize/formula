"""Build a traceable catalog solely from the supplied Word document extraction.

The manifest below lists every formula heading and its equation paragraphs.
No equation or meaning is supplied from outside the source document.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
P=json.loads((ROOT/'scripts/word_paragraphs.json').read_text(encoding='utf-8'))
TEXT=lambda i: ''.join(x.get('text','') for x in P[i]['parts']).strip()
MATH=lambda i: [x['math'] for x in P[i]['parts'] if 'math' in x]
DISPLAY=lambda i: ''.join('['+x['math']+']' if 'math' in x else x.get('text','') for x in P[i]['parts']).strip()

SECTIONS=[
  {'id':'mechanics','title':'Механика','icon':'orbit','color':'#B8EF79'},
  {'id':'thermodynamics','title':'Молекулярная физика и термодинамика','icon':'thermometer','color':'#FFBC91'},
  {'id':'electricity','title':'Электромагнитные явления','icon':'zap','color':'#A9C7FF'},
  {'id':'optics','title':'Оптика','icon':'sun','color':'#F6D486'},
  {'id':'quantum','title':'Квантовая физика','icon':'atom','color':'#D9BDFF'},
]
TOPICS=[
  ('kinematics','mechanics','Кинематика',2,86),
  ('dynamics','mechanics','Динамика',86,148),
  ('statics','mechanics','Статика',148,174),
  ('conservation','mechanics','Законы сохранения',174,229),
  ('mechanical-waves','mechanics','Механические колебания и волны',229,286),
  ('molecular','thermodynamics','Молекулярная физика',286,364),
  ('thermo','thermodynamics','Термодинамика',364,411),
  ('electrostatics','electricity','Электростатика',411,491),
  ('current','electricity','Постоянный ток',491,544),
  ('magnetism','electricity','Магнитное поле',544,592),
  ('electromagnetic-waves','electricity','Электромагнитные колебания и волны',592,637),
  ('geometric-optics','optics','Оптика',637,680),
  ('quantum-basics','quantum','Квантовая физика',680,724),
]
TOPIC=lambda i: next(t for t in TOPICS if t[3]<=i<t[4])

# heading paragraph: equation paragraph(s). All mathematical expressions that are
# presented as named formulas in the document are covered by these groups.
GROUPS={
  4:[5],21:[22],24:[25],27:[28],30:[32,33],35:[36],38:[39],41:[42],44:[45],47:[48,49],51:[52],57:[58],60:[61,62],64:[65,66,67,69,70,72,73,75],
  88:[90],114:[116],118:[120],122:[124],126:[128],130:[132],134:[135,136],138:[139],141:[142],144:[145],
  150:[151],160:[161],163:[164],166:[167],169:[170,171],
  176:[177],191:[192],194:[195],197:[198],200:[201],203:[204],206:[207],209:[210],212:[213],215:[216],218:[219],221:[222],224:[225],
  231:[232,234],252:[253,255],257:[258,260],262:[263],265:[266],268:[269],271:[272],274:[275],277:[278],280:[281,282],
  288:[289],310:[311,312,313],316:[317],319:[320],322:[323],325:[326],329:[330],335:[336],341:[342],347:[348],350:[351],359:[360],
  366:[367],375:[376],378:[379],381:[382],384:[385],387:[388,389,390,391,392],403:[404],406:[407],
  415:[416],419:[420,421],430:[431],433:[435],437:[438],442:[443,445],451:[452,453,454],458:[459],462:[463,464],467:[468,469,470],480:[481],483:[484],486:[487],
  493:[494],509:[510],512:[513],515:[516],518:[519],521:[522,523,524],526:[527,528,529],531:[532],534:[535],537:[538],540:[541],
  546:[547],556:[557],564:[565],570:[571],573:[574],576:[577],582:[583],588:[589],
  594:[595,597],612:[613,615,616],618:[619],621:[622],624:[625],627:[628],630:[631],633:[634],
  639:[640],647:[648],650:[651],653:[654],660:[661],663:[664],666:[667],671:[672],674:[675],
  682:[683],691:[692],694:[695],697:[698,700],706:[707],709:[710],713:[714],717:[718],
}
TITLE_OVERRIDES={30:'Дополнительные формулы для пути при прямолинейном равноускоренном движении в одном направлении',433:'Напряжённость поля точечного заряда'}
NOTES={
  130:[131],231:[250,251],252:[250,251],257:[250,251],
  325:[327],329:[331,332,333],335:[337,338,339],341:[343,344,345],
  381:[382],387:[391,392],419:[420,421],
  594:[598,599],639:[645],653:[656],663:[656,658],
}
SYMBOL_ADDITIONS={
  150:[('p','полное давление в жидкости',None,150)],
  163:[('{F}_{A}','выталкивающая (архимедова) сила',None,163)],
  191:[('\\Delta p','импульс силы','Н·с',179)],
  419:[('{q}_{1}','заряды тел',None,417),('{q}_{2}','заряды тел',None,417)],
  430:[('{F}_{\\text{л}}','сила Лоренца (электрическая)',None,430)],
  570:[('{\\varepsilon }_{i}','ЭДС индукции в контуре при равномерном изменении потока',None,570)],
  573:[('{\\varepsilon }_{i}','ЭДС индукции в контуре',None,573)],
  576:[('{\\varepsilon }_{i}','ЭДС индукции в движущемся проводнике',None,576)],
  709:[('{E}_{m}','энергия электрона на другом энергетическом уровне',None,709)],
}
# Symbol-definition lines in source, not generated descriptions.
DEF_RANGES={
 'kinematics':[(6,19),(53,56),(78,80)],'dynamics':[(91,112)],'statics':[(152,160)],
 'conservation':[(178,191)],'mechanical-waves':[(235,249)],
 'molecular':[(290,306),(352,359)],'thermo':[(368,373),(393,403)],
 'electrostatics':[(417,419),(422,430),(439,451),(455,480)],
 'current':[(495,509)],'magnetism':[(550,569),(579,588)],
 'electromagnetic-waves':[(600,612),(635,637)],
 'geometric-optics':[(641,646),(655,660),(668,671),(676,679)],
 'quantum-basics':[(684,691),(701,706),(711,716),(719,722)]
}
FALLBACK_LINES={
  'statics':[102],
  'conservation':[91,95,97,102,8,12],
  'mechanical-waves':[102],
  'thermo':[293,295,301,303,304],
  'current':[12],
  'magnetism':[426,12,495,503],
}

def raw_symbol(i):
    s=DISPLAY(i).replace('[IMAGE]','').lstrip()
    if s.startswith('['):
        match=re.match(r'^\[([^]]+)\]',s)
        return match.group(1).strip() if match else ''
    match=re.match(r'^([A-Za-zА-Яа-яЁёαβγδελμνπρφωΦΔΓ]+)\s*(?:\([^)]*\))?\s*[-–—]',s)
    if not match:return ''
    s=match.group(1).translate(str.maketrans({'а':'a','х':'x','с':'c','е':'e','о':'o','р':'p','А':'A','Х':'X','С':'C','Е':'E','О':'O','Р':'P','Т':'T','М':'M','В':'B'}))
    return {'α':'\\alpha','β':'\\beta','γ':'\\gamma','δ':'\\delta','λ':'\\lambda','μ':'\\mu','ν':'\\nu','π':'\\pi','ρ':'\\rho','φ':'\\varphi','ω':'\\omega','Φ':'\\Phi','Δ':'\\Delta','Г':'\\Gamma'}.get(s,s)
def words(i):
    s=DISPLAY(i).replace('[IMAGE]','')
    s=re.sub(r'^\[[^]]+\]','',s)
    s=re.sub(r'^[^–—-]+[–—-]\s*','',s)
    s=re.sub(r'^\s*\([^)]*\)\s*[–—-]\s*','',s)
    return s.strip()
def unit(i):
    if i in {240,641,705}:return None # Inconsistent source units; do not teach them.
    s=DISPLAY(i)
    candidates=re.findall(r'\(([^()]*)\)',s)
    for c in reversed(candidates):
        c=c.strip()
        if c in {'м','с','кг','Н','Па','Дж','Вт','К','Гц','рад','м/с','Н/м','кг/моль','Дж/кг','Дж/К','В','Кл','Ф','Ом','А','Тл','Вб','Гн','моль','дптр','эВ','-'}:return c
        if c.startswith('[') and c.endswith(']'):
            u=c[1:-1]
            known={r'\frac{Н\cdot {м}^{2}}{{кг}^{2}}':'Н·м²/кг²',r'\frac{Н\cdot {м}^{2}}{{Кл}^{2}}':'Н·м²/Кл²',r'\frac{Дж}{моль\cdot К}':'Дж/(моль·К)',r'\frac{Дж}{кг\cdot ℃}':'Дж/(кг·°C)'}
            if u in known:return known[u]
            return u.replace('\\cdot','·').replace('{','').replace('}','').replace('^2','²').replace('^3','³').replace('^-1','⁻¹').replace('℃','°C')
    return None
def key_symbol(s):
    return re.sub(r'\s+|[{}]','',s).replace('\\text','')
def symbol_match(symbol,latex):
    a=key_symbol(normalize_latex(symbol));b=key_symbol(latex)
    if not a:return False
    if a.startswith('\\'):
        return re.search(re.escape(a)+(r'(?!_)' if '_' not in a else ''),b) is not None
    if len(a)==1 and a.isascii() and a.isalpha():
        cleaned=re.sub(r'\\(?:begin|end)\{[^}]*\}',' ',latex)
        cleaned=re.sub(r'\\(?:text|mathrm)\{[^}]*\}',' ',cleaned)
        cleaned=re.sub(r'(?<!\\)\\[A-Za-z]+',' ',cleaned)
        cleaned=re.sub(r'_\{[^}]*\}|_[A-Za-z0-9]',' ',cleaned)
        return a in cleaned
    return a in b
def definitions(topic):
    rows=[]
    for start,end in DEF_RANGES[topic]:
      for i in range(start,end):
        s=raw_symbol(i)
        desc=words(i)
        if s and desc and ('–' in DISPLAY(i) or '—' in DISPLAY(i) or '-' in DISPLAY(i)) and len(s)<30:
          desc=re.sub(r'\s*\([^)]*\)\s*$','',desc).strip()
          desc=re.sub(r'\s*\([^)]*\)\s*или\s*$','',desc).strip()
          if desc:rows.append((i,s,desc,unit(i)))
    return rows
def equation(i):
    maths=MATH(i)
    if len(maths)>1 and sum('=' in x for x in maths)>=2:return maths
    return [''.join(maths)]
def normalize_latex(s):
    s=s.replace('⁡','').replace('℃',r'^{\circ}\mathrm{C}').replace('Γ',r'\Gamma ').replace('±',r'\pm ').replace('Е','E').replace('С','C')
    s=re.sub(r'(?<![A-Za-z])cos(?=[\\(])',r'\\cos ',s)
    s=re.sub(r'(?<![A-Za-z])sin(?=[\\(])',r'\\sin ',s)
    s=re.sub(r'(?<![A-Za-z])const(?![A-Za-z])',r'\\mathrm{const}',s)
    # Word stores word-like subscripts as ordinary math letters. KaTeX renders
    # Cyrillic labels more reliably as text inside the subscript.
    s=re.sub(r'[А-Яа-яЁё]+',lambda m:r'\text{'+m.group(0)+'}',s)
    return s
def slug(s):
    table=str.maketrans({'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ы':'y','э':'e','ю':'yu','я':'ya','ь':'','ъ':''})
    return re.sub(r'[^a-z0-9]+','-',s.lower().translate(table)).strip('-')[:60]
def build():
    data={'catalogVersion':2,'status':'source-transcribed','sourceDocument':'Формулы ЕГЭ (обновленные).docx','sections':SECTIONS,'topics':[{'id':a,'sectionId':b,'title':c} for a,b,c,_,_ in TOPICS],'formulas':[]}
    used=set()
    for start,eqs in GROUPS.items():
      topic=TOPIC(start); title=TITLE_OVERRIDES.get(start,TEXT(start));
      expr=[]
      for i in eqs:
        used.add(i);expr += equation(i)
      expr=[normalize_latex(x).strip() for x in expr if x.strip()]
      if not expr:raise ValueError(f'No equation for heading {start}')
      latex=expr[0] if len(expr)==1 else r'\begin{gathered}' + r'\\'.join(expr) + r'\end{gathered}'
      symbols=[]
      options=definitions(topic[0])
      fallback=set(FALLBACK_LINES.get(topic[0],[]))
      for other in TOPICS:
        if other[0]!=topic[0]:options += [x for x in definitions(other[0]) if x[0] in fallback]
      for sym in sorted({x[1] for x in options},key=len,reverse=True):
        if not symbol_match(sym,latex):continue
        matches=[x for x in options if x[1]==sym]
        next_heading=min((h for h in GROUPS if h>start and TOPIC(h)[0]==topic[0]),default=topic[4])
        best=min(matches,key=lambda x:(0 if start<x[0]<next_heading else 1 if topic[3]<=x[0]<topic[4] else 2,abs(x[0]-start)))
        symbols.append({'symbol':normalize_latex(sym),'meaning':best[2],**({'unit':best[3]} if best[3] else {}),'sourceParagraph':best[0]})
      # A generic letter in F_A, W_C, etc. does not by itself denote the
      # generic quantity when the source explicitly defines the indexed one.
      filtered=[]
      for item in symbols:
        simple=key_symbol(item['symbol'])
        if len(simple)==1 and simple.isascii() and simple.isalpha():
          longer=[x['symbol'] for x in symbols if x is not item and key_symbol(x['symbol']).startswith(simple+'_')]
          residual=latex
          for x in longer:residual=residual.replace(x,'')
          if longer and not symbol_match(item['symbol'],residual):continue
        filtered.append(item)
      symbols=filtered
      for sym,meaning,u,source_line in SYMBOL_ADDITIONS.get(start,[]):
        symbols=[x for x in symbols if x['symbol']!=sym]
        symbols.append({'symbol':sym,'meaning':meaning,**({'unit':u} if u else {}),'sourceParagraph':source_line})
      notes=[DISPLAY(i) for i in NOTES.get(start,[]) if DISPLAY(i)]
      condition='; '.join(notes) if notes else 'В файле условия отдельно не указаны.'
      f={'id':f'{topic[0]}-{start}-{slug(title)}','sectionId':topic[1],'topicIds':[topic[0]],'subtopic':topic[2],
         'title':title,'latex':latex,'symbols':symbols,'conditions':condition,'explanation':' '.join(notes),'source':'verified',
         'sourceParagraphs':[start,*eqs]}
      prior=next((x for x in data['formulas'] if x['title']==f['title'] and x['latex']==f['latex']),None)
      if prior:
        prior['topicIds'].extend(t for t in f['topicIds'] if t not in prior['topicIds'])
        prior['sourceParagraphs'].extend(f['sourceParagraphs'])
      else:data['formulas'].append(f)
    # Every math-only equation paragraph with an equality sign must be in the
    # manifest, except conditions, definitions and reference notes.
    unassigned=[]
    for i,p in enumerate(P):
      ms=MATH(i)
      if ms and '=' in ''.join(ms) and i not in used and i not in {306,307,308,327,332,333,338,339,344,345,645,670,678,716}:
        if not TEXT(i) or len(TEXT(i))<5:unassigned.append((i,DISPLAY(i)))
    out=ROOT/'src/data/catalog.full.json'
    out.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print('formulas',len(data['formulas']),'expressions',sum(len(v) for v in GROUPS.values()),'symbols',sum(len(f['symbols']) for f in data['formulas']))
    print('unassigned formula-like paragraphs:',unassigned)
    if unassigned:raise ValueError('Formula-like paragraphs are missing from the catalog manifest')
if __name__=='__main__':build()
