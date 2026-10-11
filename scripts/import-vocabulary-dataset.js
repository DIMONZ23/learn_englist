// Công cụ build một lần: trích 3.000 mục từ đã kiểm chứng từ nguồn mở vào JSON seed.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dictionaryPath = process.argv[2];
const oxfordPath = process.argv[3];
if (!dictionaryPath || !oxfordPath) throw new Error('Cần truyền đường dẫn dictionary.db và oxford_3000_5000.json.');

const oxford = JSON.parse(readFileSync(oxfordPath, 'utf8'));
const merged = new Map();
for (const item of oxford.filter(item => item.ox3000)) {
  const key=item.word.trim().toLowerCase();
  if (!merged.has(key)) merged.set(key,{ word:item.word.trim(),partOfSpeech:item.type,level:item.ox3000.toUpperCase() });
  else if (!merged.get(key).partOfSpeech.includes(item.type)) merged.get(key).partOfSpeech += `, ${item.type}`;
}

const toeicEssentials = [
  ['invoice','noun','B1'],['logistics','noun','B2'],['procurement','noun','C1'],['reimbursement','noun','C1'],
  ['teleconference','noun','B2'],['payroll','noun','B2'],['stakeholder','noun','B2'],['shipment','noun','B1'],
  ['retailer','noun','B2'],['wholesale','adjective, noun','B2'],['turnover','noun','B2'],['outsource','verb','C1'],
  ['merger','noun','C1'],['creditor','noun','C1'],['franchise','noun','B2'],['subsidy','noun','C1'],
  ['workforce','noun','B2'],['audit','noun, verb','B2'],['consultant','noun','B2'],['warehouse','noun','B1'],['deadline','noun','B1']
];
for (const [word,partOfSpeech,level] of toeicEssentials) {
  if (merged.size>=3000) break;
  if (!merged.has(word)) merged.set(word,{word,partOfSpeech,level});
}
const preferred = toeicEssentials.map(item=>item[0]);
const extras = oxford.filter(item => item.ox5000 && !item.ox3000).sort((a,b) => {
  const ai=preferred.indexOf(a.word.toLowerCase()),bi=preferred.indexOf(b.word.toLowerCase());
  return (ai<0?999:ai)-(bi<0?999:bi);
});
for (const item of extras) {
  if (merged.size>=3000) break;
  const key=item.word.trim().toLowerCase();
  if (!merged.has(key)) merged.set(key,{word:item.word.trim(),partOfSpeech:item.type,level:(item.ox5000||'c1').toUpperCase()});
}
if (merged.size!==3000) throw new Error(`Danh sách phải có 3.000 từ, hiện có ${merged.size}.`);

const categories = [
  ['Văn phòng và công việc','Office & Work',/\b(?:office|documents?|letters?|emails?|meetings?|appointments?|schedules?|deadlines?|employ\w*|recruit\w*|staff|careers?|jobs?|interviews?|colleagues?|managers?|secretar\w*|assistants?|departments?|workplace|professions?|tasks?|calendars?|printers?|paper|files?|desks?)\b/i],
  ['Kinh doanh và quản lý','Business & Management',/\b(?:business|compan(?:y|ies)|corporate|manage\w*|market(?:ing)?|advertis\w*|sales?|customers?|clients?|contracts?|agreements?|negotiat\w*|strateg\w*|performance|brands?|products?|services?|directors?|leadership|agenc(?:y|ies)|commercial|consumers?|competition)\b/i],
  ['Tài chính và kế toán','Finance & Accounting',/\b(?:banks?|accounts?|budgets?|expenses?|invoices?|payments?|tax(?:es)?|fees?|profits?|loss(?:es)?|invest\w*|financial|finance|revenue|costs?|prices?|credits?|cash|salar(?:y|ies)|wages?|funds?|loans?|insurance|econom\w*|currenc\w*|bills?)\b/i],
  ['Du lịch và giao thông','Travel & Transportation',/\b(?:airports?|flights?|airlines?|hotels?|accommodation|reserv\w*|transport\w*|trains?|buses|bus|vehicles?|cars?|roads?|routes?|directions?|travel\w*|trips?|journeys?|tours?|tickets?|passengers?|stations?|terminals?|departures?|arrivals?|luggage|traffic)\b/i],
  ['Nhà hàng, mua sắm và dịch vụ','Dining, Retail & Service',/\b(?:restaurants?|food|drinks?|meals?|menus?|shops?|stores?|retail\w*|orders?|deliver\w*|refunds?|exchanges?|complaints?|purchases?|buy|sell|waiters?|kitchens?|discounts?|receipts?|packages?|parcels?)\b/i],
  ['Sản xuất và chuỗi cung ứng','Manufacturing & Supply Chain',/\b(?:manufactur\w*|factor(?:y|ies)|machines?|equipment|quality|inventory|warehouses?|shipping|logistics?|procure\w*|suppliers?|distributors?|production|materials?|assembly|inspections?|stock|suppl(?:y|ies)|shipments?)\b/i],
  ['Công nghệ và truyền thông','Technology & Communication',/\b(?:computers?|software|internet|digital|telephones?|phones?|data|information|technical|online|media|communications?|networks?|websites?|applications?|devices?|systems?|technology|screens?|keyboards?|databases?|security)\b/i],
  ['Bất động sản và cơ sở vật chất','Property & Facilities',/\b(?:buildings?|facilities|rent\w*|leases?|properties|property|maintenance|repairs?|construct\w*|renovat\w*|apartments?|houses?|rooms?|floors?|elevators?|entrances?|architecture|land|estate|tenants?|roofs?)\b/i],
  ['Sức khỏe, an toàn và môi trường','Health, Safety & Environment',/\b(?:health|medical|doctors?|hospitals?|safe|safety|emergenc\w*|environment\w*|energy|sustain\w*|recycl\w*|pollution|accidents?|injur\w*|medicine|patients?|climate|waste|protect\w*)\b/i]
];
const topicOverrides = {
  invoice:2, logistics:5, procurement:5, reimbursement:2, teleconference:6, payroll:2,
  stakeholder:1, shipment:5, retailer:4, wholesale:4, turnover:2, outsource:1,
  merger:1, creditor:2, franchise:1, subsidy:2, workforce:0, audit:2,
  consultant:1, warehouse:5, deadline:0
};
function classify(word,pos,headword=''){
  const override=topicOverrides[headword.toLowerCase()];
  if(override!==undefined)return {topic:categories[override][0],subTopic:categories[override][1]};
  const found=categories.find(([, ,pattern])=>pattern.test(word));
  if(found)return {topic:found[0],subTopic:found[1]};
  const p=pos.toLowerCase();
  return {topic:'Từ vựng học thuật và giao tiếp TOEIC',subTopic:p.includes('verb')?'Common verbs':p.includes('noun')?'Common nouns':p.includes('adjective')||p.includes('adverb')?'Adjectives and adverbs':p.includes('preposition')||p.includes('conjunction')?'Prepositions and conjunctions':'Common expressions'};
}
function slugify(value){return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function clean(text){return String(text||'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();}

const db=new DatabaseSync(dictionaryPath,{readOnly:true});
const definitions=db.prepare(`SELECT d.definition,d.pos,d.definition_lang,wd.example FROM words w JOIN word_definitions wd ON wd.word_id=w.id JOIN definitions d ON d.id=wd.definition_id WHERE LOWER(w.word)=? AND w.lang_code='en' ORDER BY CASE d.definition_lang WHEN 'vi' THEN 0 WHEN 'en' THEN 1 ELSE 2 END, CASE WHEN wd.example IS NULL THEN 1 ELSE 0 END LIMIT 12`);
const pronunciations=db.prepare(`SELECT p.ipa,p.region FROM words w JOIN pronunciations p ON p.word_id=w.id WHERE LOWER(w.word)=? AND w.lang_code='en' ORDER BY CASE WHEN LOWER(COALESCE(p.region,'')) LIKE '%us%' THEN 0 ELSE 1 END LIMIT 1`);
const relations=db.prepare(`SELECT r.related_word,r.relation_type FROM words w JOIN word_relations r ON r.word_id=w.id WHERE LOWER(w.word)=? AND w.lang_code='en' LIMIT 12`);

const entries=[];let index=0;
for(const base of merged.values()){
  const key=base.word.toLowerCase();
  const defs=definitions.all(key), pronunciation=pronunciations.get(key), rels=relations.all(key);
  const vi=defs.find(x=>x.definition_lang==='vi'),en=defs.find(x=>x.definition_lang==='en');
  const example=defs.find(x=>x.example&&/[a-z]{3}/i.test(x.example))?.example||'';
  // Phân loại theo cả headword và định nghĩa để không gán sai chỉ vì hình thức từ.
  const group=classify(`${base.word} ${vi?.definition||''} ${en?.definition||''}`,base.partOfSpeech,base.word);
  const synonymTypes=/synonym|đồng nghĩa/i,antonymTypes=/antonym|trái nghĩa/i;
  entries.push({
    id:`toeic-vocab-${String(++index).padStart(4,'0')}`,word:base.word,slug:slugify(base.word),
    ipa:clean(pronunciation?.ipa),partOfSpeech:base.partOfSpeech,meaningVi:clean(vi?.definition),meaningEn:clean(en?.definition),
    topic:group.topic,subTopic:group.subTopic,level:base.level,
    toeicPriority:group.topic==='Từ vựng học thuật và giao tiếp TOEIC'?'medium':'high',
    exampleEn:clean(example),exampleVi:'',collocations:[],
    wordFamily:rels.filter(x=>!synonymTypes.test(x.relation_type)&&!antonymTypes.test(x.relation_type)).map(x=>x.related_word).slice(0,5),
    synonyms:rels.filter(x=>synonymTypes.test(x.relation_type)).map(x=>x.related_word).slice(0,5),
    antonyms:rels.filter(x=>antonymTypes.test(x.relation_type)).map(x=>x.related_word).slice(0,5),
    commonMistakes:'',audioUrl:'',tags:[base.word.toLowerCase(),group.topic,group.subTopic,base.partOfSpeech,base.level]
  });
}
const output={
  metadata:{count:entries.length,generatedAt:new Date().toISOString(),license:'CC BY-SA 4.0 for dictionary-derived fields',sources:[
    {name:'Oxford 3000/5000 CEFR list',url:'https://www.oxfordlearnersdictionaries.com/about/wordlists/'},
    {name:'minhqnd Dictionary',url:'https://dict.minhqnd.com',license:'CC BY-SA 4.0'}
  ]},entries
};
writeFileSync(resolve('db/toeic-vocabulary.json'),JSON.stringify(output));
console.log(JSON.stringify({count:entries.length,withIpa:entries.filter(x=>x.ipa).length,withVietnamese:entries.filter(x=>x.meaningVi).length,withExample:entries.filter(x=>x.exampleEn).length,topics:Object.fromEntries([...new Set(entries.map(x=>x.topic))].map(t=>[t,entries.filter(x=>x.topic===t).length]))},null,2));
