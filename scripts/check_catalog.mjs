import fs from 'node:fs';
import katex from 'katex';
const data=JSON.parse(fs.readFileSync(new URL('../src/data/catalog.full.json',import.meta.url),'utf8'));
const paragraphs=JSON.parse(fs.readFileSync(new URL('./word_paragraphs.json',import.meta.url),'utf8'));
const problems=[];
const ids=new Set();const topicIds=new Set(data.topics.map(t=>t.id));
for(const f of data.formulas){
  if(ids.has(f.id))problems.push(`${f.id}: duplicate id`);ids.add(f.id);
  if(!f.topicIds.length||f.topicIds.some(t=>!topicIds.has(t)))problems.push(`${f.id}: unknown topic`);
  if(!f.sourceParagraphs?.length)problems.push(`${f.id}: no source reference`);
  for(const [kind,value] of [['formula',f.latex],...f.symbols.map(s=>['symbol',s.symbol])]){
    try{katex.renderToString(value,{throwOnError:true,strict:'ignore'})}
    catch(e){problems.push(`${f.sourceParagraphs[0]} ${kind}: ${e.message}`)}
  }
}
const referenced=new Set(data.formulas.flatMap(f=>f.sourceParagraphs.slice(1)));
const equationObjects=[...referenced].reduce((n,i)=>n+paragraphs[i].parts.filter(x=>'math' in x).length,0);
if(equationObjects!==183)problems.push(`Expected 183 source equation objects, found ${equationObjects}`);
console.log(`${data.formulas.length} formulas, ${equationObjects} source equation objects, ${data.formulas.reduce((n,f)=>n+f.symbols.length,0)} symbol definitions, ${problems.length} rendering/data errors`);
if(problems.length){console.error(problems.join('\n'));process.exitCode=1}
