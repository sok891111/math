import Head from 'next/head';
import {useEffect,useState} from 'react';
import {getUser} from '../../lib/stateManager';
import styles from '../../styles/parent.module.css';
const resultNames={correct:'정답',incorrect:'오답',skipped:'넘김',complete:'문장 전체 전달',partial:'핵심 표현 전달',retry:'다시 연습',unheard:'목소리 미인식',error:'연결·마이크 오류'};
const dateTime=value=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(value));
const duration=value=>value<60?`${Math.round(value)}초`:`${Math.floor(value/60)}분${value%60?` ${Math.round(value%60)}초`:''}`;
const percent=(a,b)=>b?`${Math.round(a/b*100)}%`:'—';
const display=value=>Array.isArray(value)?value.map(v=>v===null?'빈칸':String(v)).join(' · '):String(value??'');
function Shape({values,label}){return <div><small>{label}</small><div className={styles.shape} style={{gridTemplateColumns:`repeat(${Math.sqrt(values.length)%1===0?Math.sqrt(values.length):values.length}, 18px)`}} aria-label={label}>{values.map((v,i)=><span key={i} style={{background:v?'#5d8d72':'#eef1e9'}}>{v?'●':''}</span>)}</div></div>;}
function Question({event}){
 const q=event.question;
 return <div className={styles.question}>
  <p>{q.prompt||q.instruction||q.title||event.label}</p>
  {q.prompt&&q.instruction&&q.prompt!==q.instruction&&<p>{q.instruction}</p>}
  {q.equation&&<p className={styles.equation}>{q.equation}</p>}
  {q.operands&&!q.equation&&<p>{q.operands.join(q.type==='times_table'?' × ':' · ')}</p>}
  {q.shown&&<p>문제의 수열: {display(q.shown)}</p>}
  {q.numberCards&&<p>숫자 카드: {display(q.numberCards)}</p>}
  {q.pyramid&&<div>{q.pyramid.map((row,i)=><p key={i}> {display(row)}</p>)}</div>}
  {q.operationChain&&<p>처음 ? → {q.operationChain.operations.map(o=>`${o.op} ${o.value}`).join(' → ')} → 마지막 {q.operationChain.final}</p>}
  {q.source&&Array.isArray(q.source)&&<Shape values={q.source} label="문제의 모양"/>}
  {q.grid&&<div className={styles.numberGrid} style={{gridTemplateColumns:`repeat(${q.n||Math.round(Math.sqrt(q.grid.length))}, 34px)`}}>{q.grid.map((v,i)=><span key={i}>{q.holes?.includes(i)?'?':v}</span>)}</div>}
  {q.table&&<div className={styles.tableWrap}><table><tbody>{q.tableHeaders&&<tr><th></th>{q.tableHeaders.slice(1).map((v,i)=><th key={i}>{v}</th>)}</tr>}{q.table.map((row,i)=><tr key={i}><th>{q.tableRowLabels?.[i]||`${i+1}번째`}</th>{row.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table></div>}
  {q.matrix&&<div className={styles.numberGrid} style={{gridTemplateColumns:`repeat(${q.matrix.length}, 34px)`}}>{q.matrix.flat().map((v,i)=><span key={i}>{v===null?'?':q.symbols?.[v]??v}</span>)}</div>}
  {(q.shapeChoices||q.choices)?.length>0&&<div className={styles.choices}>{(q.shapeChoices||q.choices).map((c,i)=><div key={i}>{c.shape?<Shape values={c.shape} label={`선택 ${i+1}`}/>:<span>{c.label||c.value}</span>}</div>)}</div>}
  <dl className={styles.answer}><div><dt>아이의 답</dt><dd>{display(event.answer)||'선택 없음'}</dd></div><div><dt>기준 정답</dt><dd>{display(q.solution||q.answer)||'문제 규칙에 맞는 답'}</dd></div><div><dt>힌트</dt><dd>{event.hints}단계</dd></div><div><dt>풀이 시간</dt><dd>{duration(event.durationSeconds)}</dd></div></dl>
  <small>도형·배치 문제의 답은 선택 번호 또는 칸별 값으로 표시합니다. 같은 규칙을 만족하는 다른 정답도 인정될 수 있습니다.</small>
 </div>;
}
function Breakdown({title,items,empty,render}){return <section className={styles.panel}><h2>{title}</h2>{items.length?<div className={styles.breakdown}>{items.map(render)}</div>:<p className={styles.muted}>{empty}</p>}</section>;}
export default function ParentPage({userId}){
 const [authed,setAuthed]=useState(false),[configured,setConfigured]=useState(null),[parentId,setParentId]=useState(''),[access,setAccess]=useState(null),[controlsBusy,setControlsBusy]=useState(false),[notice,setNotice]=useState(''),[currentPassword,setCurrentPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[gameFilter,setGameFilter]=useState(''),[password,setPassword]=useState(''),[data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[tab,setTab]=useState('dashboard'),[page,setPage]=useState(1),[from,setFrom]=useState(''),[to,setTo]=useState(''),[search,setSearch]=useState(''),[draft,setDraft]=useState(''),[result,setResult]=useState(''),[refresh,setRefresh]=useState(0);
 useEffect(()=>{
  let cancelled=false;
  fetch(`/api/user/${userId}/parent`,{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('부모 설정을 확인하지 못했습니다.');return r.json();}).then(d=>{if(cancelled)return;setConfigured(d.configured);setAuthed(d.authenticated);if(d.authenticated){setParentId(d.parentId);setAccess(d.access);}}).catch(e=>{if(!cancelled)setError(e.message);});
  // Retry this browser's pending attempts here too, without counting parent viewing time.
  const script=document.createElement('script');script.src='/learning-client.js?v=1';script.dataset.user=userId;document.body.append(script);
  return ()=>{cancelled=true;script.remove();};
 },[userId]);
 useEffect(()=>{
  if(!authed)return;const controller=new AbortController();setBusy(true);setError('');
  const query=new URLSearchParams({kind:tab==='speech'?'speech':tab==='minecraft'?'usage':'math',page:String(page),from,to,search,result,game:gameFilter});
  fetch(`/api/user/${userId}/learning?${query}`,{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async r=>{const body=await r.json();if(r.status===401){setAuthed(false);setData(null);}if(!r.ok)throw Error(body.error||'기록을 불러오지 못했습니다.');return body;}).then(setData).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  return ()=>controller.abort();
 },[authed,userId,tab,page,from,to,search,result,gameFilter,refresh]);
 async function parentRequest(body){const r=await fetch(`/api/user/${userId}/parent`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw Error(d.error||'설정을 저장하지 못했습니다.');return d;}
 async function login(e){e.preventDefault();setBusy(true);setError('');try{await parentRequest({action:'login',parentId,password});const r=await fetch(`/api/user/${userId}/parent`,{cache:'no-store'}),d=await r.json();if(!r.ok||!d.authenticated)throw Error('로그인 상태를 확인하지 못했습니다.');setParentId(d.parentId);setAccess(d.access);setPassword('');setAuthed(true);}catch(e){setError(e.message||'로그인에 실패했습니다.');}finally{setBusy(false);}}
 function changeTab(next){setData(null);setTab(next);setPage(1);setResult('');setSearch('');setDraft('');setGameFilter('');}
 async function logout(){setError('');try{await parentRequest({action:'logout'});setAuthed(false);setData(null);}catch(e){setError(e.message);}}
 async function toggleAccess(){setControlsBusy(true);setError('');setNotice('');try{const d=await parentRequest({action:'access',blocked:!access.blocked});setAccess(d.access);setNotice(d.access.blocked?'모든 게임을 금지했습니다. 이미 열린 게임도 약 10초 안에 멈춥니다.':'모든 게임을 다시 허용했습니다.');}catch(e){setError(e.message);}finally{setControlsBusy(false);}}
 async function updatePassword(e){e.preventDefault();setError('');setNotice('');if(newPassword!==confirmPassword){setError('새 비밀번호가 서로 다릅니다.');return;}setControlsBusy(true);try{await parentRequest({action:'password',currentPassword,newPassword});setCurrentPassword('');setNewPassword('');setConfirmPassword('');setNotice('부모 비밀번호를 변경했습니다. 다른 기기의 부모 로그인은 해제됩니다.');}catch(e){setError(e.message);}finally{setControlsBusy(false);}}
 const s=data?.summary,totalTime=s?Object.values(s.usage).reduce((a,b)=>a+b,0):0;
 const title=data?`${data.child.name}의 배움 기록`:'우리 아이 배움 기록';
 return <main className={styles.page}>
  <style jsx global>{`body{margin:0}`}</style>
  <Head><title>{title} · 부모 페이지</title><meta name="robots" content="noindex,nofollow"/><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
  <div className={styles.shell}><header className={styles.header}><div><a className={styles.brand} href={`/${userId}`}>BLOCK ISLAND <span>FOR PARENTS</span></a><h1>{title}</h1><p>얼마나 했는지, 무엇을 배우고 있는지 함께 살펴보세요.</p></div>{authed&&<button onClick={logout}>잠그기</button>}</header>
  {!authed?<section className={`${styles.panel} ${styles.login}`}><span className={styles.tag}>부모 전용</span><h2>아이의 배움과 놀이를 한눈에</h2><p>{configured===false?'관리자 페이지에서 부모 계정을 먼저 연결해 주세요.':'이 아이와 연결된 부모 계정으로 로그인해 주세요.'}</p><form onSubmit={login}><label htmlFor="parent-id">부모 로그인 ID</label><input id="parent-id" value={parentId} onChange={e=>setParentId(e.target.value)} required autoComplete="username"/><label htmlFor="parent-password">부모 비밀번호</label><input id="parent-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/><button className={styles.primary} disabled={busy||configured===false}>{busy?'확인 중…':'부모 페이지 열기'}</button></form></section>:<>
  <section className={styles.panel} aria-label="부모 관리 설정"><div className={styles.historyHeading}><div><h2>아이의 전체 게임 접근</h2><p className={styles.muted}>부모 계정: {parentId} · {access?.blocked?'모든 게임 금지 중':'게임 이용 허용 중'}</p></div><button className={styles.primary} onClick={toggleAccess} disabled={controlsBusy||!access}>{access?.blocked?'전체 게임 허용':'전체 게임 금지'}</button></div><p className={styles.muted}>이 아이의 뜨랠레리오·마법영어·마인크래프트 및 나머지 개인 게임을 함께 관리합니다. 금지하면 새 진입을 막고, 이미 열린 게임은 약 10초 안에 멈춥니다. 오프라인에서는 설정을 확인할 때까지 플레이를 멈춥니다.</p><details><summary>부모 비밀번호 변경</summary><form onSubmit={updatePassword} className={styles.passwordForm}><label>현재 비밀번호<input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required autoComplete="current-password"/></label><label>새 비밀번호<input type="password" minLength={8} maxLength={128} value={newPassword} onChange={e=>setNewPassword(e.target.value)} required autoComplete="new-password"/></label><label>새 비밀번호 확인<input type="password" minLength={8} maxLength={128} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required autoComplete="new-password"/></label><button disabled={controlsBusy}>비밀번호 변경</button></form></details>{notice&&<p role="status">{notice}</p>}</section>
  <nav className={styles.tabs} aria-label="학습 기록 메뉴">{[['dashboard','대시보드'],['math','수학 전체 이력'],['speech','영어 전체 이력'],['minecraft','마인크래프트 플레이']].map(([key,label])=><button key={key} aria-current={tab===key?'page':undefined} className={tab===key?styles.active:''} onClick={()=>changeTab(key)}>{label}</button>)}</nav>
  <section className={styles.toolbar} aria-label="조회 기간"><div className={styles.dateFields}><label>시작일<input type="date" value={from} max={to||undefined} onChange={e=>{setFrom(e.target.value);setPage(1);}}/></label><span>—</span><label>종료일<input type="date" value={to} min={from||undefined} onChange={e=>{setTo(e.target.value);setPage(1);}}/></label></div><div className={styles.actions}><button onClick={()=>{setFrom('');setTo('');setPage(1);}}>전체 기간</button><button onClick={()=>setRefresh(n=>n+1)} disabled={busy}>새로고침</button></div></section>
  {busy&&<p role="status" className={styles.muted}>기록을 확인하고 있어요…</p>}
  {data&&!busy&&!error&&<>
   <p className={styles.period}>{from||'기록 시작'} ~ {to||'오늘'} · 한국 시간 기준 · {dateTime(data.generatedAt)} 업데이트</p>
   {tab==='dashboard'?<>
    <div className={styles.cards}>
     <section className={`${styles.metric} ${styles.green}`}><span>전체 사용 시간</span><strong>{duration(totalTime)}</strong><small>수학 모험 + 영어 모험 + 마인크래프트 플레이</small></section>
     <section className={styles.metric}><span>수학 문제 시도</span><strong>{s.math.total}<em>회</em></strong><small>정답 {s.math.correct} · 오답 {s.math.incorrect} · 넘김 {s.math.skipped}</small></section>
     <section className={styles.metric}><span>수학 정답률</span><strong>{percent(s.math.correct,s.math.correct+s.math.incorrect)}</strong><small>넘김 제외 · 힌트 사용 {s.math.hinted}회</small></section>
     <section className={`${styles.metric} ${styles.blue}`}><span>영어 말하기 시도</span><strong>{s.speech.total}<em>회</em></strong><small>전달한 표현 {s.speech.unique}개 · 반복 연습 포함</small></section>
    </div>
    <div className={styles.columns}><section className={styles.panel}><h2>하루의 놀이 시간</h2><div className={styles.legend}><span>● 수학 모험</span><span>● 영어 모험</span><span>● 마인크래프트 플레이</span></div><div className={styles.chart} role="img" aria-label="날짜별 수학 모험, 영어 모험, 마인크래프트 사용 시간">{s.days.map(d=>{const max=Math.max(60,...s.days.map(v=>v.math+v.english+v.world));return <div className={styles.chartRow} key={d.date}><span>{d.date.slice(5).replace('-','/')}</span><div className={styles.track}>{[['math','#7a9b78'],['english','#7ca4ba'],['world','#d7af6c']].map(([k,color])=><span key={k} style={{width:`${d[k]/max*100}%`,background:color}} title={`${d.date} ${k==='math'?'수학':k==='english'?'영어':'마인크래프트'} ${duration(d[k])}`}/>)}</div><b>{duration(d.math+d.english+d.world)}</b></div>;})}</div><details><summary>날짜별 시간 표로 보기</summary><div className={styles.tableWrap}><table><thead><tr><th>날짜</th><th>수학</th><th>영어</th><th>마인크래프트</th></tr></thead><tbody>{s.days.map(d=><tr key={d.date}><td>{d.date}</td><td>{duration(d.math)}</td><td>{duration(d.english)}</td><td>{duration(d.world)}</td></tr>)}</tbody></table></div></details></section>
    <section className={styles.panel}><h2>게임별 플레이 시간</h2><div className={styles.balance}>{[['수학 모험',s.usage.tralalerio],['영어 모험',s.usage['magic-english']],['마인크래프트 플레이',s.usage['magic-english-world']]].map(([label,value])=><div key={label}><span>{label}</span><strong>{duration(value)}</strong></div>)}</div><p className={styles.muted}>모험 시간에는 이동·이야기·전투도 포함됩니다. 문제 풀이만의 시간은 수학 이력에서 따로 볼 수 있어요.</p><div className={styles.callout}>영어는 문장 전체 전달 {s.speech.complete}회, 핵심 표현 전달 {s.speech.partial}회, 다시 연습 {s.speech.retry}회입니다. 목소리 미인식 {s.speech.unheard}회와 연결·마이크 오류 {s.speech.error}회는 별도로 구분합니다.</div></section></div>
    <div className={styles.columns}><Breakdown title="수학은 어떤 방식으로 연습했나요?" items={s.mathTypes} empty="수학 문제를 풀면 유형별 기록이 나타납니다." render={t=><div key={t.type+':'+t.grade}><div><strong>{t.label}</strong><small>게임 레벨 {t.grade} · 정답 {t.correct}/{t.total}회</small></div><b>{t.total}회</b></div>}/><Breakdown title="영어는 어떤 표현을 말했나요?" items={s.speechTargets} empty="Speak로 말하면 표현별 기록이 나타납니다." render={t=><div key={t.target}><div><strong lang="en">{t.phrase}</strong><small>전달 성공 {t.passed}회 · 시도 {t.total}회</small></div><b>{t.total}회</b></div>}/></div>
   </>:<section className={styles.panel}>
    <div className={styles.historyHeading}><div><h2>{tab==='math'?'풀었던 수학 문제':tab==='minecraft'?'마인크래프트 플레이 이력':'말해 본 영어 표현'}</h2><p className={styles.muted}>조건에 맞는 기록 {data.total.toLocaleString()}건 · 최신순</p></div><form className={styles.search} onSubmit={e=>{e.preventDefault();setSearch(draft);setPage(1);}}><label className={styles.srOnly} htmlFor="history-search">문제 또는 문장 검색</label><input id="history-search" value={draft} onChange={e=>setDraft(e.target.value)} placeholder={tab==='math'?'문제·유형 검색':'목표·인식 문장 검색'}/><button type="submit">검색</button></form></div>
    {tab!=='minecraft'&&<label className={styles.filter}>결과<select aria-label="결과" value={result} onChange={e=>{setResult(e.target.value);setPage(1);}}><option value="">모든 결과</option>{(tab==='math'?['correct','incorrect','skipped']:['complete','partial','retry','unheard','error']).map(k=><option key={k} value={k}>{resultNames[k]}</option>)}</select></label>}
    {tab==='speech'&&<label className={styles.filter}>말한 장소<select aria-label="말한 장소" value={gameFilter} onChange={e=>{setGameFilter(e.target.value);setPage(1);}}><option value="">모든 장소</option><option value="magic-english">마법영어 모험</option><option value="magic-english-world">마인크래프트</option></select></label>}
    {!data.history.length?<div className={styles.empty}><h3>아직 표시할 기록이 없어요</h3><p>이 페이지가 추가된 이후 개인 주소로 플레이한 기록부터 쌓입니다.<br/>조회 기간이나 검색 조건도 확인해 주세요.</p></div>:<div className={styles.history}>{data.history.map(event=><article key={event.id}><div className={styles.historyTop}><time dateTime={event.at}>{dateTime(event.at)}</time><span className={['correct','complete','partial'].includes(event.result)?styles.success:styles.neutral}>{event.kind==='usage'?duration(event.seconds):resultNames[event.result]}</span></div>{tab==='math'?<><h3>{event.label} <small>게임 레벨 {event.grade}</small></h3><p className={styles.muted}>{{attack:'공격',capture:'포획',escape:'도망'}[event.context]||'수학'} 도전 · 힌트 {event.hints}단계 · {duration(event.durationSeconds)}</p><p className={styles.preview}>{event.question.equation||event.question.prompt||event.question.instruction||event.question.title}</p><details><summary>문제와 답안 자세히 보기</summary><Question event={event}/></details></>:tab==='minecraft'?<><h3>마인크래프트 플레이</h3><p>{dateTime(event.startedAt)} ~ {dateTime(event.at)}</p><p>활동 시간 {duration(event.seconds)} · 영어 Speak {event.speechCount}회</p></>:<><p className={styles.muted}>{event.game==='magic-english-world'?'마인크래프트':'마법영어 모험'}</p><h3 lang="en">{event.phrase}</h3><dl className={styles.speech}><dt>인식된 말</dt><dd lang="en">{event.transcript||'인식된 문장 없음'}</dd></dl>{event.result==='error'&&<p className={styles.muted}>마이크 또는 연결 문제로 확인하지 못한 시도입니다.</p>}<small className={styles.muted}>말하기·인식 소요 {duration(event.durationSeconds)} · 발음 점수가 아닌 인식 문장 기반 결과</small></>}</article>)}</div>}
    <div className={styles.pagination}><button disabled={page<=1} onClick={()=>setPage(n=>n-1)}>이전</button><span>{page} / {Math.max(1,Math.ceil(data.total/data.pageSize))}</span><button disabled={page*data.pageSize>=data.total} onClick={()=>setPage(n=>n+1)}>다음</button></div>
   </section>}
   <aside className={styles.note}><strong>기록을 읽는 방법</strong><p>이 기능을 추가하기 전의 전체 문제·발화·사용 시간은 복원할 수 없습니다.{s.firstRecordedAt?` 첫 기록: ${dateTime(s.firstRecordedAt)}.`:''} 오프라인 기록은 같은 브라우저가 다시 연결되면 전송하며, 아직 전송하지 않은 기록은 다른 기기에 표시되지 않습니다.</p><p>사용 시간은 화면이 보이고 최근 2분 안에 조작한 시간을 약 15초 간격으로 기록합니다. 숨긴 화면·장시간 무조작은 제외하고, 같은 아이의 여러 탭은 중복 집계하지 않습니다. 앱 종료 직전의 미전송 시간이나 긴 생각·듣기 시간은 일부 빠질 수 있습니다.</p><p>게임 레벨은 학교 학년이 아닙니다. 영어 결과는 발음·회화 능력의 진단이 아니며 음성 파일은 저장하지 않습니다. 부모 계정에 연결된 아이의 기록과 이용 설정만 관리할 수 있습니다. 이전 영어 이력에는 장소 정보가 없어 마법영어 모험으로 표시될 수 있습니다.</p></aside>
  </>}
  </>}
  {error&&<div className={styles.error} role="alert">{error}{authed&&<button onClick={()=>setRefresh(n=>n+1)}>다시 시도</button>}</div>}
  <footer className={styles.footer}>작은 배움을 함께 발견하는 시간 · BLOCK ISLAND</footer></div>
 </main>;
}
export async function getServerSideProps({params,res}){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
 if(!/^[A-Za-z0-9]{4,10}$/.test(params.userId)||!await getUser(params.userId))return {notFound:true};
 return {props:{userId:params.userId}};
}
