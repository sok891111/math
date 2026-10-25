import { Analytics } from '@vercel/analytics/next';
import { useEffect, useState } from 'react';

function loadCentralState() {
  if (!window.__centralStateLoader) {
    const load = src => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src; script.onload = resolve; script.onerror = reject;
      document.head.append(script);
    });
    window.__centralStateLoader = load('/central-state-keys.js?v=1').then(() => load('/central-state.js?v=1'));
  }
  return window.__centralStateLoader;
}
function PersonalStateGate({userId, children}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    loadCentralState().then(() => window.BlockCentralState.start(userId)).then(() => {
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
