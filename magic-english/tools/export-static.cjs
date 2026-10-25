/* Standalone file:// edition. Source game and its save data remain untouched.
 * npm install --prefix /tmp/tralalerio-export-tools esbuild --no-audit --no-fund
 * node tralalerio/tools/export-static.cjs [destination]
 */
const fs=require('node:fs'),path=require('node:path');
const source=path.resolve(__dirname,'..'),root=path.resolve(source,'..');
const target=path.resolve(process.argv[2]||path.resolve(root,'../temp/tralalerio-static'));
const esbuild=require(process.env.ESBUILD_MODULE||'/tmp/tralalerio-export-tools/node_modules/esbuild');
const ids=['ElmsLab','NewBarkTown','Route29'];
const read=file=>fs.readFileSync(path.join(source,file),'utf8');
const write=(file,value)=>{const full=path.join(target,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,value);};
if(target===source||target.startsWith(source+path.sep))throw Error('Export must be outside source game');
fs.mkdirSync(target,{recursive:true});
const data={};
function copyAssets(dir,relative='assets'){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const name=relative+'/'+entry.name,full=path.join(dir,entry.name);
  if(entry.isDirectory()){copyAssets(full,name);continue;}
  // Map graphics are the only map-specific PNGs at the asset root.
  const mapName=entry.name.replace(/\.png$/,'');
  const allMaps=JSON.parse(read('assets/maps.json'));
  if(relative==='assets'&&entry.name.endsWith('.png')&&allMaps[mapName]&&!ids.includes(mapName))continue;
  if(entry.name.endsWith('.json')){data[name]={json:JSON.parse(fs.readFileSync(full,'utf8'))};continue;}
  if(entry.name.endsWith('.wav')){data[name]={base64:fs.readFileSync(full).toString('base64')};continue;}
  write(name,fs.readFileSync(full));
 }
}
copyAssets(path.join(source,'assets'));
const maps=data['assets/maps.json'].json;
data['assets/maps.json'].json=Object.fromEntries(ids.map(id=>[id,maps[id]]));
for(const map of Object.values(data['assets/maps.json'].json))map.connections=map.connections.filter(c=>ids.includes(c.map));
// Keep warp indices intact: absent destinations are already silent boundaries in Game.move.
const sprites=new Set(['chris','teacher']);for(const id of ids)for(const o of maps[id].objects)if(o.sprite)sprites.add(o.sprite);
data['assets/sprites.json'].json=[...sprites];
const catalog=data['assets/town-map/map.json'].json;
catalog.maps=Object.fromEntries(ids.map(id=>[id,catalog.maps[id]]));
catalog.landmarks=catalog.landmarks.filter(p=>Object.values(catalog.maps).includes(p.id));
const battle=data['assets/battle-data.json'].json;
battle.encounters=Object.fromEntries(Object.entries(battle.encounters).filter(([id])=>ids.includes(id)));
battle.trainers={};
const offline=`(()=>{const files=${JSON.stringify(data)};window.fetch=async function(input){const raw=typeof input==='string'?input:input.url;const url=new URL(raw,location.href);const key=decodeURIComponent(url.pathname).split('/').slice(-((url.pathname.includes('/assets/'))?url.pathname.split('/assets/')[1].split('/').length+1:1)).join('/');const value=files[key];if(!value)throw new Error('오프라인 데이터 누락: '+raw);if(value.json!==undefined)return {ok:true,status:200,json:async()=>structuredClone(value.json),text:async()=>JSON.stringify(value.json)};const bytes=Uint8Array.from(atob(value.base64),c=>c.charCodeAt(0));return {ok:true,status:200,arrayBuffer:async()=>bytes.buffer};};})();`;
write('offline-data.js',offline);
function transform(file,text){
 text=text.replaceAll('/tralalerio/','./');
 if(file==='app.js'){
  text=text.replace("const VIOLET_TEST=new URLSearchParams(location.search).get('start')==='violet';","const VIOLET_TEST=false;");
  text=text.replace(/const BASE_KEY=.*?;const KEY=.*?;/,"const BASE_KEY='tralalerio-static-route29-v1';const KEY=BASE_KEY;");
  const start=text.indexOf("if(game.state.flags.easyStart){const quests="),end=text.indexOf('const p=game.state.party?.[0];',start);
  if(start<0||end<0)throw Error('Quest source changed');
  text=text.slice(0,start)+`{const f=game.state.flags,quests=[['mom','공박사와 인사하기','박사님에게 말을 걸면 친구들도 회복돼요.',f.staticProfessor],['town','연두마을 둘러보기','연구소 밖의 이웃들과 이야기해요.',f.town],['starter','피카츄와 함께하기','첫 동료가 자동으로 함께해요.',!!game.state.starter],['route','29번 도로 탐험하기','마을 서쪽 풀밭에서 친구를 만나요.',f.route],['city','새로운 친구 잡기','몬스터볼을 고르고 수학 문제를 풀어요.',game.state.party.length+game.state.storage.length>1],['mapCard','공박사에게 회복받기','연구소로 돌아오면 HP와 PP가 회복돼요.',f.staticProfessor]];for(const [id,title,hint,done]of quests){const row=$('#quest-'+id);row.querySelector('b').textContent=title;row.querySelector('small').textContent=hint;row.classList.toggle('done',!!done)}}`+text.slice(end);
  text=text.replace("persist();requestAnimationFrame(draw);","persist();if(!game.state.flags.staticWelcome){game.state.flags.staticWelcome=true;persist();say('공박사',['반가워! 피카츄와 함께 작은 모험을 시작해 보렴.','연구소 밖은 연두마을이란다. 서쪽 29번 도로의 풀밭에서 새 친구를 만날 수 있어.','몬스터볼을 던지고 수학 문제를 풀면 친구를 잡을 수 있단다. 지치면 나에게 돌아오렴!']);}requestAnimationFrame(draw);");
 }
 if(file==='chapter.js'){
  const start=text.indexOf('export function chapterGoal('),end=text.indexOf('export function storyInteraction',start);
  text=text.slice(0,start)+`export function chapterGoal(){return '연두마을 서쪽 29번 도로의 풀밭을 탐험해요. 지치면 공박사에게 돌아와 회복해요.';}\n`+text.slice(end);
  text=text.replace('const s=game.state,id=s.map;',`const s=game.state,id=s.map;if(id==='ElmsLab'&&o.sprite==='elm'){s.flags.staticProfessor=true;game.healParty();return {speaker:'공박사',pages:['피카츄와 잘 지내고 있니? 친구들의 힘을 모두 회복했단다!','서쪽 29번 도로의 풀밭을 탐험해 보렴. 몬스터볼을 던지고 수학 문제를 풀면 새 친구를 잡을 수 있어.']};}if(id==='ElmsLab'&&o.sprite==='scientist'){if(!s.flags.aidePotion){s.flags.aidePotion=true;s.potions++;}s.balls=Math.max(s.balls||0,5);return {speaker:'공박사의 조수',pages:['모험에 필요한 몬스터볼을 다섯 개 이상 챙겨 주었어.','친구가 지치면 박사님께 돌아와 회복해. 몬스터볼이 부족하면 다시 찾아와!']};}`);
 }
 if(file==='functional-npc.js')text=text.replace('야생 포켓몬은 먼저 공격해서 HP를 줄인 다음 잡는 거야.','몬스터볼을 고르고 수학 문제를 풀면 야생 친구를 잡을 수 있어.');
 if(file==='npc-dialogue.js')text=text.replace("서쪽으로 가면 무궁시티예요. 풀숲에서는 초급 문제로 모험해요.","풀숲에서 새 친구를 만나 보세요. 이번 모험은 29번 도로까지예요.");
 if(file==='town-map.js')text=text.replace("[['johto','성도'],['kanto','관동']]","[['johto','성도']]").replace("setRegion(region==='johto'?'kanto':'johto');","setRegion('johto');");
 return text;
}
(async()=>{
 const result=await esbuild.build({entryPoints:[path.join(source,'app.js')],bundle:true,format:'iife',platform:'browser',target:['safari15'],write:false,plugins:[{name:'standalone',setup(build){build.onResolve({filter:/\.js\?/},args=>({path:path.resolve(args.resolveDir,args.path.split('?')[0])}));build.onLoad({filter:/\.js$/},args=>({contents:transform(path.basename(args.path),fs.readFileSync(args.path,'utf8')),loader:'js'}));}}]});
 write('game.js',result.outputFiles[0].contents);
 for(const name of ['style.css','math-puzzle.css','monster-dex.css','pc.css','town-map.css','evolution.css'])write(name,read(name).replaceAll('/tralalerio/','./'));
 for(const name of ['battle-model.js','facto-puzzles.js','facto-ui.js','puzzle-hints.js'])write('creative/'+name,fs.readFileSync(path.join(root,'creative',name)));
 let html=read('index.html').replace('<base href="/tralalerio/">','').replaceAll('/tralalerio/','./').replaceAll('/creative/','creative/').replace(/\?v=[^"']+/g,'');
 html=html.replace('class="brand" href="./"','class="brand" href="index.html"');
 html=html.replace('type="module" src="app.js"','src="game.js"').replace('<script src="creative/battle-model.js">','<script src="offline-data.js"></script><script src="creative/battle-model.js">');
 html=html.replaceAll('SECOND BADGE · 04','OFFLINE · ROUTE 29').replaceAll('JOHTO REGION · PIKACHU → SECOND BADGE','OFFLINE · LAB → NEW BARK → ROUTE 29').replaceAll('두 번째 배지까지.','29번 도로까지.').replaceAll('도라지시티와 연결동굴을 지나 고동마을의 호일에게 도전해요.','연두마을과 29번 도로에서 새 친구를 만나 보세요.').replaceAll('PURE WEB · SECOND BADGE','OFFLINE · ROUTE 29').replaceAll('두 번째 배지로 가는 길','작은 모험의 시작').replace(/<footer>[\s\S]*?<\/footer>/,'<footer><span>서버 없이 즐기는 작은 모험.</span><p>공박사 연구소 · 연두마을 · 29번 도로만 포함한 오프라인 판입니다.<br>저장은 이 브라우저에 보관되며 기존 온라인 게임과 분리됩니다.</p></footer>');
 write('index.html',html);
 write('README.txt',`뜨랠레리오 오프라인 판\n\n실행: index.html 파일을 Chrome 또는 Safari에서 직접 열어 주세요.\n서버 설치, npm 실행, 인터넷 연결이 필요하지 않습니다.\n폴더 전체를 함께 옮겨 주세요. index.html만 옮기면 그림이 나오지 않습니다.\n\n범위: 공박사 연구소 → 연두마을 → 29번 도로. 다른 지역과 집 내부로 가는 출입구는 이동할 수 없습니다.\n피카츄와 연구소에서 시작합니다. 박사에게 말하면 HP/PP를 회복합니다.\n조수에게 말하면 몬스터볼을 최소 5개까지 보충합니다.\n풀밭의 야생 몬스터, 수학 공격/포획, 성장/레벨 진화, 도감, 지도, 소리를 포함합니다.\n방향키/화면 방향 버튼: 이동. Z/Enter/A: 대화. Esc/B: 메뉴.\n소리는 첫 클릭/키 입력 후 재생됩니다. 메뉴에서 끄고 켤 수 있습니다.\n\n저장: 같은 브라우저, 같은 파일 위치에서 이어하기. 메뉴 → 모험 저장하기.\n저장 키 tralalerio-static-route29-v1을 사용하므로 기존 게임 저장과 섞이지 않습니다.\n브라우저 데이터 삭제/시크릿 모드/다른 브라우저/파일 위치 이동 시 저장이 유지되지 않을 수 있습니다.\n개인코드 서버 연동 없이 해당 기기의 브라우저에만 저장됩니다.\n\n게임 원본 및 자산 출처는 source-notes.txt를 참고해 주세요.\n`);
 write('source-notes.txt',read('README.md')+'\n\n'+read('upstream/baseline.json'));
 console.log('Exported '+target+' (maps: '+ids.join(', ')+')');
})().catch(e=>{console.error(e);process.exitCode=1;});
