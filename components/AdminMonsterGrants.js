import { useEffect, useState } from 'react';

export default function AdminMonsterGrants({ user, secret }) {
  const [catalog, setCatalog] = useState([]);
  const [grants, setGrants] = useState([]);
  const [species, setSpecies] = useState('pikachu');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState(5);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    fetch(`/api/admin/tralalerio?userId=${encodeURIComponent(user.id)}`, { headers: { 'x-admin-secret': secret } })
      .then(async r => { const data = await r.json(); if (!r.ok) throw Error(data.error); return data; })
      .then(data => { if (active) { setCatalog(data.species); setGrants(data.grants); } })
      .catch(e => { if (active) setMessage(e.message || '목록을 불러오지 못했습니다.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [user.id, secret]);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/admin/tralalerio', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret }, body: JSON.stringify({ userId: user.id, species, level: Number(level), quantity: Number(quantity) }) });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setGrants(prev => [...prev, data.grant]);
      setMessage(`${data.grant.name} ${quantity}마리 지급 등록 완료. 아이의 게임을 다시 열고 포켓몬센터 PC에서 꺼내 주세요.`);
    } catch (e) { setMessage(e.message || '지급 등록에 실패했습니다.'); }
    finally { setBusy(false); }
  }
  const options = catalog.filter(s => s.name.includes(search) || s.id.includes(search.toLowerCase()));
  const field = { padding: '10px', color: '#fff', background: '#132b27', border: '1px solid #4ade80', borderRadius: 8, maxWidth: '100%' };
  return <section style={{ marginTop: 12 }} aria-label={`${user.name} 몬스터 추가`}>
    <p style={{ marginBottom: 12, lineHeight: 1.7 }}>아이의 개인 게임 주소에 다시 접속하면 지급됩니다. 추가한 몬스터는 모두 포켓몬센터 PC의 빈 박스에 들어갑니다. 아이가 센터 PC에서 꺼내 동료로 데려갈 수 있습니다. 기존 기록은 유지됩니다. 전투 중이거나 박스가 가득 찼다면 정리 후 다시 접속해 주세요.</p>
    <form onSubmit={submit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
      <label>이름 검색<input aria-label="몬스터 검색" type="text" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <label>몬스터<br /><select aria-label="추가할 몬스터" style={field} value={species} onChange={e => setSpecies(e.target.value)} required>
        {!options.some(s => s.id === species) && catalog.some(s => s.id === species) && <option value={species}>{catalog.find(s => s.id === species).name} (선택됨)</option>}
        {options.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select></label>
      <label>레벨<br /><input aria-label="몬스터 레벨" style={{...field, width: 85}} type="number" min="1" max="100" required value={level} onChange={e => setLevel(e.target.value)} /></label>
      <label>마릿수<br /><input aria-label="몬스터 마릿수" style={{...field, width: 85}} type="number" min="1" max="30" required value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
      <button className="btn btn-primary" disabled={busy || !catalog.length}> {busy ? '처리 중…' : `${user.name}에게 추가`} </button>
    </form>
    <p role="status" style={{ margin: '12px 0', color: '#facc15' }}>{message}</p>
    <details><summary>지급 등록 내역 ({grants.length}건)</summary>
      <p style={{ margin: '8px 0' }}>등록 이력이며 실제 수령 여부는 아이의 게임에서 확인해 주세요. 브라우저 기록을 삭제하거나 새 모험을 시작하면 등록된 몬스터가 다시 지급됩니다.</p>
      <ul style={{ paddingLeft: 24 }}>{grants.slice().reverse().map(g => <li key={g.id}>{g.name} · Lv.{g.level} · {g.quantity}마리 · {new Date(g.createdAt).toLocaleString('ko-KR')}</li>)}</ul>
    </details>
    <a className="btn-open" style={{ marginTop: 12 }} href={`/${user.id}/tralalerio`} target="_blank" rel="noreferrer">아이의 포켓몬 게임 열기 ↗</a>
  </section>;
}
