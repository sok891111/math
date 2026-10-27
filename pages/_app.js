import { Analytics } from '@vercel/analytics/next';
import { useEffect, useState } from 'react';

function loadCentralState(userId) {
  if (!window.__centralStateLoader) {
    const load = src => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src; script.dataset.user=userId; script.onload = resolve; script.onerror = reject;
      document.head.append(script);
    });
    window.__centralStateLoader = load('/game-access.js?v=1').then(()=>window.BlockGameAccess?.ready).then(allowed=>{if(allowed!==true)throw Error('게임 이용 설정을 확인하고 있어요.');return load('/central-state-keys.js?v=1');}).then(() => load('/central-state.js?v=2'));
  }
  return window.__centralStateLoader;
}
function PersonalStateGate({userId, children}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    loadCentralState(userId).then(() => window.BlockCentralState.start(userId)).then(() => {
      if (!cancelled) setReady(true);
    }).catch(error => { if (!cancelled) setError(error.message || '기록 서버에 연결하지 못했어요.'); });
    return () => { cancelled = true; };
  }, [userId]);
  if (!ready) return <main style={{padding: 40}}><p>{error || '기존 모험 기록을 확인하고 있어요…'}</p>{error && <button onClick={() => location.reload()}>다시 연결하기</button>}</main>;
  return children;
}
export default function App({ Component, pageProps }) {
  const page = <Component {...pageProps} />;
  return <>{pageProps.user?.id ? <PersonalStateGate key={pageProps.user.id} userId={pageProps.user.id}>{page}</PersonalStateGate> : page}<Analytics /></>;
}
