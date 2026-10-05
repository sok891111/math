import Head from 'next/head';
import { getUser } from '../../lib/stateManager';
import { hasFinalConsonant } from '../../lib/koreanHelper';

export default function UserLobbyPage({ user }) {
  if (!user) return null;

  const childName = user.name;
  const hasBatchim = hasFinalConsonant(childName);
  const vocative = hasBatchim ? `${childName}아` : `${childName}야`;
  const possessive = hasBatchim ? `${childName}이의` : `${childName}의`;

  return (
    <>
      <Head>
        <title>{possessive} 수학 모험 기지 · 열칸 블록섬</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          background: #0d1815;
          font-family: 'Apple SD Gothic Neo', 'Pretendard', 'Malgun Gothic', 'Segoe UI', sans-serif;
          min-height: 100vh;
          color: #f1f8f3;
        }

        /* Dot Grid Pixel Background */
        body {
          background-color: #0c1815;
          background-image:
            radial-gradient(#1c3a32 2px, transparent 2px),
            radial-gradient(circle at top center, #16362c 0%, #0c1815 75%);
          background-size: 24px 24px, 100% 100%;
          padding: 24px 16px 60px;
        }

        .lobby-container {
          max-width: 860px;
          margin: 0 auto;
        }

        /* Pixel Header */
        .lobby-header {
          text-align: center;
          margin-bottom: 36px;
          padding: 24px 16px 12px;
          position: relative;
        }

        .pixel-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #1e3b33;
          border: 2px solid #34d399;
          box-shadow: 0 4px 0 #0d2821;
          color: #6ee7b7;
          font-size: 0.85rem;
          font-weight: 800;
          padding: 6px 16px;
          border-radius: 8px;
          margin-bottom: 14px;
          letter-spacing: 0.5px;
        }

        .lobby-title {
          font-size: 2.1rem;
          font-weight: 900;
          background: linear-gradient(90deg, #4ade80, #38bdf8, #facc15);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 10px rgba(74, 222, 128, 0.2);
        }

        .lobby-greeting {
          font-size: 1.1rem;
          color: #94a3b8;
          font-weight: 600;
        }

        .lobby-greeting strong {
          color: #facc15;
        }

        /* Dot Games Grid */
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 36px;
        }

        /* Dot / Pixel Card Style */
        .dot-card {
          display: flex;
          flex-direction: column;
          background: #132420;
          border: 3.5px solid #22493f;
          border-radius: 20px;
          padding: 24px 22px;
          box-shadow: 0 8px 0 #081411;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .dot-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 0 #081411;
          border-color: #34d399;
        }

        .dot-card.sunshine {
          background: linear-gradient(165deg, #182e27 0%, #10211d 100%);
        }

        .dot-card.island {
          background: linear-gradient(165deg, #132832 0%, #0e1e26 100%);
          border-color: #1f4254;
          box-shadow: 0 8px 0 #071015;
        }

        .dot-card.island:hover {
          box-shadow: 0 12px 0 #071015;
          border-color: #38bdf8;
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .card-tag {
          font-size: 0.76rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1.5px solid;
          letter-spacing: 0.5px;
        }

        .sunshine .card-tag {
          background: rgba(250, 204, 21, 0.15);
          border-color: #facc15;
          color: #fde047;
        }

        .island .card-tag {
          background: rgba(56, 189, 248, 0.15);
          border-color: #38bdf8;
          color: #7dd3fc;
        }

        .card-art-box {
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.25);
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          margin-bottom: 18px;
          font-size: 3.2rem;
          user-select: none;
        }

        .card-title {
          font-size: 1.45rem;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card-desc {
          font-size: 0.92rem;
          color: #cbd5e1;
          line-height: 1.6;
          margin-bottom: 18px;
          min-height: 44px;
        }

        .feature-pills {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 22px;
        }

        .pill-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 10px;
          border-radius: 8px;
          border-left: 3px solid #34d399;
        }

        .island .pill-item {
          border-left-color: #38bdf8;
        }

        /* Big Pixel Action Button */
        .btn-entry {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          font-size: 1.05rem;
          font-weight: 900;
          text-decoration: none;
          color: #ffffff;
          border: 2.5px solid;
          cursor: pointer;
          transition: all 0.1s ease;
          margin-top: auto;
          letter-spacing: 0.5px;
        }

        .btn-sunshine {
          background: linear-gradient(135deg, #10b981, #059669);
          border-color: #34d399;
          box-shadow: 0 5px 0 #064e3b;
        }

        .btn-sunshine:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(2px);
          box-shadow: 0 3px 0 #064e3b;
        }

        .btn-island {
          background: linear-gradient(135deg, #0284c7, #0369a1);
          border-color: #38bdf8;
          box-shadow: 0 5px 0 #0c4a6e;
        }

        .btn-island:hover {
          background: linear-gradient(135deg, #0369a1, #075985);
          transform: translateY(2px);
          box-shadow: 0 3px 0 #0c4a6e;
        }

        .btn-entry:active {
          transform: translateY(5px);
          box-shadow: 0 0 0 transparent;
        }

        /* Bottom Footer */
        .lobby-footer {
          text-align: center;
          padding: 20px;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .lobby-footer span {
          display: inline-block;
          background: rgba(255, 255, 255, 0.04);
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 480px) {
          .lobby-title { font-size: 1.75rem; }
          .games-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="lobby-container">
        {/* 헤더 */}
        <header className="lobby-header">
          <div className="pixel-badge">
            <span>✨</span>
            <span>{possessive} 전용 모험 기지</span>
          </div>
          <h1 className="lobby-title">{childName}의 수학 모험 기지</h1>
          <p className="lobby-greeting">
            반가워, <strong>{vocative}</strong>! 오늘은 어떤 모험을 떠나볼까? 🎒
          </p>
        </header>

        {/* 게임 선택 그리드 */}
        <main className="games-grid">
          {/* 게임 1: 햇살 플랫포머 */}
          <article
            className="dot-card sunshine"
            onClick={() => { window.location.href = `/${user.id}/platformer`; }}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-top">
              <span className="card-tag">☀️ 점프 액션</span>
              <span style={{ fontSize: '0.8rem', color: '#facc15', fontWeight: 800 }}>Lv 1~3 캠페인</span>
            </div>

            <div className="card-art-box">
              🏃‍♂️ 💨 🧟 ☀️
            </div>

            <h2 className="card-title">
              <span>햇살 플랫포머</span>
            </h2>
            <p className="card-desc">
              깡충 뛰어 몬스터를 만나고, 신나는 덧셈과 구구단 마법으로 숲에 햇살을 돌려줘요!
            </p>

            <div className="feature-pills">
              <div className="pill-item">
                <span>🕹️</span>
                <span>횡스크롤 점프 & 달리기 조작</span>
              </div>
              <div className="pill-item">
                <span>⚔️</span>
                <span>15초/30초 몬스터 수학 배틀</span>
              </div>
              <div className="pill-item">
                <span>🏅</span>
                <span>82종 배지 & 드래곤 전설 알 수집</span>
              </div>
            </div>

            <a href={`/${user.id}/platformer`} className="btn-entry btn-sunshine">
              <span>햇살 모험 시작하기</span>
              <span>→</span>
            </a>
          </article>

          {/* 게임 2: 열칸 블록섬 */}
          <article
            className="dot-card island"
            onClick={() => { window.location.href = `/${user.id}/island`; }}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-top">
              <span className="card-tag">🏝️ 블록 다리 건축</span>
              <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800 }}>10 만들기 퍼즐</span>
            </div>

            <div className="card-art-box">
              🦊 🐻 🐰 🌉
            </div>

            <h2 className="card-title">
              <span>열칸 블록섬</span>
            </h2>
            <p className="card-desc">
              블록을 옮겨 10을 완성하고, 강 너머 여우·곰·토끼 친구들을 만나 다리를 열어 봐요!
            </p>

            <div className="feature-pills">
              <div className="pill-item">
                <span>🧊</span>
                <span>손으로 옮기며 세는 열 칸 틀</span>
              </div>
              <div className="pill-item">
                <span>🍎</span>
                <span>사과·보석·당근 소풍 친구 놀이</span>
              </div>
              <div className="pill-item">
                <span>🌱</span>
                <span>자유롭게 꾸미는 나만의 블록 정원</span>
              </div>
            </div>

            <a href={`/${user.id}/island`} className="btn-entry btn-island">
              <span>블록섬 탐험하기</span>
              <span>→</span>
            </a>
          </article>
        </main>

        <footer className="lobby-footer">
          <span>작은 블록 하나, 커다란 자신감 하나! 즐겁게 배우는 수학 세상 🌈</span>
        </footer>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { userId } = params;
  if (!/^[A-Za-z0-9]{4,10}$/.test(userId)) {
    return { notFound: true };
  }

  const user = await getUser(userId);
  if (!user) {
    return { notFound: true };
  }

  return {
    props: {
      user: {
        id: user.id,
        name: user.name,
      },
    },
  };
}
