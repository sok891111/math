import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { getUser, getUserBadges } from '../../lib/stateManager';
import { hasFinalConsonant } from '../../lib/koreanHelper';
import { BADGE_CATALOG } from '../../lib/badgeCatalog';

export default function UserBadgesPage({ user, initialBadges }) {
  if (!user) return null;

  const childName = user.name;
  const hasBatchim = hasFinalConsonant(childName);
  const possessive = hasBatchim ? `${childName}이의` : `${childName}의`;

  const [activeFilter, setActiveFilter] = useState('all');
  const [showShareBox, setShowShareBox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [badgesData, setBadgesData] = useState(initialBadges || { earnedIds: [] });
  const [toastMsg, setToastMsg] = useState('');
  const toastTimeoutRef = useRef(null);

  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  // Sync client-side localStorage to state if available
  useEffect(() => {
    try {
      const runnerRaw = localStorage.getItem(`seonyul-sunshine-progress-v1_${user.id}`);
      const islandRaw = localStorage.getItem(`seonyul-block-island-v1_${user.id}`);
      const earnedSet = new Set(badgesData.earnedIds || []);

      if (runnerRaw) {
        const rData = JSON.parse(runnerRaw);
        if (rData && rData.earned) {
          Object.keys(rData.earned).forEach(id => earnedSet.add(id));
        }
      }

      if (islandRaw) {
        const iData = JSON.parse(islandRaw);
        if (iData && iData.completed > 0) {
          if (iData.completed >= 1) earnedSet.add('island-bridge-0');
          if (iData.completed >= 2) earnedSet.add('island-bridge-1');
          if (iData.completed >= 3) earnedSet.add('island-bridge-2');
        }
        if (iData && Array.isArray(iData.treasures)) {
          iData.treasures.forEach(tid => earnedSet.add(`island-treasure-${tid}`));
        }
        if (iData && iData.badges) {
          Object.keys(iData.badges).forEach(qKey => {
            earnedSet.add(`island-q-${qKey}`);
          });
          const count = Object.keys(iData.badges).length;
          if (count >= 5) earnedSet.add('island-milestone-5');
          if (count >= 10) earnedSet.add('island-milestone-10');
          if (count >= 20) earnedSet.add('island-milestone-20');
          if (count >= 45) earnedSet.add('island-milestone-45');
        }
      }

      const earnedArray = Array.from(earnedSet);
      if (earnedArray.length > (badgesData.earnedIds?.length || 0)) {
        setBadgesData(prev => ({ ...prev, earnedIds: earnedArray }));
        fetch(`/api/user/${user.id}/badges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ badges: { earnedIds: earnedArray } }),
        }).catch(() => {});
      }
    } catch (e) {}
  }, [user.id]);

  const showToast = (msg) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCopyUrl = async () => {
    try {
      const urlToCopy = shareUrl || window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = urlToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast('🎉 나의 뱃지 링크가 클립보드에 복사되었어요!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      showToast('주소창의 링크를 복사해 주세요!');
    }
  };

  const earnedSet = new Set(badgesData.earnedIds || []);
  const earnedCount = BADGE_CATALOG.filter(b => earnedSet.has(b.id)).length;
  const totalCount = BADGE_CATALOG.length;

  const runnerCount = BADGE_CATALOG.filter(b => b.game === 'runner' && earnedSet.has(b.id)).length;
  const islandCount = BADGE_CATALOG.filter(b => b.game === 'island' && earnedSet.has(b.id)).length;

  const filteredBadges = BADGE_CATALOG.filter(b => {
    const isEarned = earnedSet.has(b.id);
    if (activeFilter === 'earned') return isEarned;
    if (activeFilter === 'runner') return b.game === 'runner';
    if (activeFilter === 'island') return b.game === 'island';
    if (activeFilter === 'monster') return b.category === 'monster';
    if (activeFilter === 'math') return b.category === 'math';
    if (activeFilter === 'treasure') return b.category === 'treasure' || b.category === 'adventure' || b.category === 'bridge';
    return true;
  });

  return (
    <>
      <Head>
        <title>{possessive} 뱃지 명예의 전당 · {childName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/neodgm/neodgm-webfont@1.601/neodgm/style.css" />
      </Head>

      <div className="hall-wrapper">
        <div className="crt-lines" />

        <div className="hall-container">
          {/* Header */}
          <header className="hall-header">
            <div className="header-left">
              <a href={`/${user.id}`} className="back-btn">
                <span>◀</span>
                <span>게임 로비</span>
              </a>
            </div>

            <div className="header-center">
              <div className="sub-title">★ HALL OF FAME ★</div>
              <h1 className="main-title">{possessive} 뱃지 보관함</h1>
            </div>

            <div className="header-right">
              <button
                type="button"
                className="share-btn"
                onClick={() => setShowShareBox(!showShareBox)}
                title="나의 뱃지 링크 보기"
              >
                <span>🔗 나의 뱃지 링크</span>
              </button>
            </div>
          </header>

          {/* Dedicated Share URL Box */}
          {showShareBox && (
            <div className="share-url-panel">
              <div className="share-url-top">
                <span className="share-url-tag">🔗 나의 뱃지 링크</span>
                <span className="share-url-hint">친구들에게 보여줄 수 있는 전용 주소입니다.</span>
              </div>
              <div className="share-url-row">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="share-url-input"
                  onClick={(e) => e.target.select()}
                />
                <button
                  type="button"
                  className={`share-url-copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyUrl}
                >
                  {copied ? '✅ 복사 완료!' : '📋 복사하기'}
                </button>
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <section className="stats-bar">
            <div className="stat-card total-card">
              <span className="stat-icon">🏅</span>
              <div className="stat-info">
                <span className="stat-label">총 획득한 뱃지</span>
                <strong className="stat-val">{earnedCount} <small>/ {totalCount}</small></strong>
              </div>
            </div>

            <div className="stat-card runner-card">
              <span className="stat-icon">🏃</span>
              <div className="stat-info">
                <span className="stat-label">크래프트 Runner</span>
                <strong className="stat-val">{runnerCount} <small>/ 143</small></strong>
              </div>
            </div>

            <div className="stat-card island-card">
              <span className="stat-icon">🏝️</span>
              <div className="stat-info">
                <span className="stat-label">완성! block island</span>
                <strong className="stat-val">{islandCount} <small>/ 56</small></strong>
              </div>
            </div>
          </section>

          {/* Clean, Non-broken Filter Navigation */}
          <nav className="filter-nav" aria-label="뱃지 필터">
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              전체 ({totalCount})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'earned' ? 'active' : ''}`}
              onClick={() => setActiveFilter('earned')}
            >
              ✨ 획득 완료 ({earnedCount})
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'runner' ? 'active' : ''}`}
              onClick={() => setActiveFilter('runner')}
            >
              🏃 크래프트 Runner (143)
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'island' ? 'active' : ''}`}
              onClick={() => setActiveFilter('island')}
            >
              🏝️ 완성! block island (56)
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'monster' ? 'active' : ''}`}
              onClick={() => setActiveFilter('monster')}
            >
              👾 몬스터 도감
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'math' ? 'active' : ''}`}
              onClick={() => setActiveFilter('math')}
            >
              🧮 수학 도전
            </button>
            <button
              type="button"
              className={`filter-btn ${activeFilter === 'treasure' ? 'active' : ''}`}
              onClick={() => setActiveFilter('treasure')}
            >
              💎 보물/탐험
            </button>
          </nav>

          {/* Badges Grid */}
          <main className="badges-grid">
            {filteredBadges.map(badge => {
              const isEarned = earnedSet.has(badge.id);
              return (
                <article
                  key={badge.id}
                  className={`badge-card ${isEarned ? 'earned' : 'locked'}`}
                  onClick={() => setSelectedBadge(badge)}
                  style={{
                    '--rarity-color': badge.rarityColor,
                  }}
                >
                  <div className="card-top-tag">
                    <span className="rarity-badge">{badge.rarityName}</span>
                    <span className="game-tag">{badge.game === 'runner' ? 'Runner' : 'Island'}</span>
                  </div>

                  <div className="badge-icon-wrap">
                    <span className="badge-icon">{badge.icon}</span>
                    {!isEarned && <span className="lock-overlay">🔒</span>}
                  </div>

                  <h3 className="badge-title">{badge.title}</h3>
                  <p className="badge-desc">{badge.desc}</p>

                  <div className="badge-status">
                    {isEarned ? (
                      <span className="status-earned">✨ 획득 완료</span>
                    ) : (
                      <span className="status-locked">
                        {badge.target ? `0 / ${badge.target}` : '🔒 도전 중'}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </main>

          {/* Invitation Banner */}
          <section className="invite-banner">
            <div className="invite-text">
              <h2>{possessive} 뱃지 보관함 (총 {earnedCount}개 획득) 🚀</h2>
              <p>나의 뱃지 링크를 친구들에게 보내면 내가 모은 멋진 뱃지들을 구경할 수 있어요!</p>
            </div>
            <div className="invite-actions">
              <button
                type="button"
                className="invite-copy-btn"
                onClick={() => {
                  setShowShareBox(true);
                  handleCopyUrl();
                }}
              >
                <span>{copied ? '✅ 복사됨!' : '📋 나의 뱃지 링크 복사'}</span>
              </button>
              <a href={`/${user.id}`} className="invite-play-btn">
                <span>🎮 게임하러 가기 ▶</span>
              </a>
            </div>
          </section>
        </div>

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <div className="modal-backdrop" onClick={() => setSelectedBadge(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedBadge(null)}
              >
                ✕
              </button>

              <div
                className="modal-icon-box"
                style={{ '--rarity-color': selectedBadge.rarityColor }}
              >
                <span className="big-icon">{selectedBadge.icon}</span>
              </div>

              <span className="modal-rarity" style={{ color: selectedBadge.rarityColor }}>
                {selectedBadge.rarityName} 등급 배지
              </span>

              <h2 className="modal-title">{selectedBadge.title}</h2>
              <p className="modal-desc">{selectedBadge.desc}</p>

              <div className="modal-footer-status">
                {earnedSet.has(selectedBadge.id) ? (
                  <span className="modal-earned-pill">🏆 멋지게 획득 완료!</span>
                ) : (
                  <span className="modal-locked-pill">🔒 게임을 플레이해서 이 배지를 획득해 봐!</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastMsg && (
          <div className="toast-pop">
            <span>{toastMsg}</span>
          </div>
        )}
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        html, body {
          background: #080a10;
          color: #f1f5f9;
          font-family: 'NeoDGM', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
          min-height: 100vh;
        }

        .hall-wrapper {
          min-height: 100vh;
          background: radial-gradient(circle at center, #111524 0%, #06080e 100%);
          padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(32px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
          position: relative;
        }

        .crt-lines {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.22) 0px,
            rgba(0, 0, 0, 0.22) 2px,
            transparent 2px,
            transparent 4px
          );
          pointer-events: none;
          z-index: 50;
          opacity: 0.55;
        }

        .hall-container {
          max-width: 960px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        /* Header */
        .hall-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px dashed #28344e;
          padding-bottom: 18px;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #141b2b;
          border: 2px solid #2e3d5e;
          color: #94a3b8;
          text-decoration: none;
          font-size: 0.88rem;
          font-weight: 800;
          padding: 8px 14px;
          border-radius: 8px;
          box-shadow: 0 4px 0 #000;
          transition: all 0.1s ease;
        }

        .back-btn:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #000;
          color: #00f0ff;
        }

        .header-center {
          text-align: center;
          flex: 1;
        }

        .sub-title {
          font-size: 0.8rem;
          color: #ffe600;
          letter-spacing: 2px;
          margin-bottom: 4px;
          text-shadow: 0 0 8px rgba(255, 230, 0, 0.5);
        }

        .main-title {
          font-size: 1.8rem;
          font-weight: 900;
          color: #fff;
          text-shadow: 2px 2px 0 #000, 0 0 16px rgba(0, 240, 255, 0.4);
        }

        .share-btn {
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 800;
          background: #ff0055;
          border: 2px solid #ff4d88;
          color: #fff;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 0 #000, 0 0 15px rgba(255, 0, 85, 0.4);
          transition: all 0.1s ease;
        }

        .share-btn:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 #000;
        }

        /* Dedicated Share URL Box */
        .share-url-panel {
          background: #18233a;
          border: 2px solid #3b4d75;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          box-shadow: 0 6px 0 #000;
          animation: popUp 0.2s ease;
        }

        .share-url-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .share-url-tag {
          font-size: 0.88rem;
          font-weight: 900;
          color: #38bdf8;
        }

        .share-url-hint {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .share-url-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .share-url-input {
          flex: 1;
          background: #0a0d18;
          border: 2px solid #334466;
          border-radius: 8px;
          color: #ffe600;
          font-family: monospace;
          font-size: 0.9rem;
          padding: 10px 14px;
          outline: none;
        }

        .share-url-input:focus {
          border-color: #00f0ff;
        }

        .share-url-copy-btn {
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 800;
          background: #10b981;
          border: 2px solid #34d399;
          color: #fff;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 0 #000;
          transition: all 0.1s ease;
        }

        .share-url-copy-btn:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #000;
        }

        .share-url-copy-btn.copied {
          background: #059669;
          border-color: #10b981;
        }

        /* Stats Bar */
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #111726;
          border: 3px solid #23304a;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 6px 0 #000;
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.78rem;
          color: #8fa0be;
          margin-bottom: 2px;
          font-weight: 700;
        }

        .stat-val {
          font-size: 1.4rem;
          color: #fff;
          font-weight: 900;
        }

        .total-card .stat-val { color: #ffe600; text-shadow: 0 0 8px rgba(255, 230, 0, 0.4); }
        .runner-card .stat-val { color: #00f0ff; }
        .island-card .stat-val { color: #34d399; }

        /* Filter Navigation */
        .filter-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-btn {
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 800;
          line-height: 1.35;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #141b2d;
          border: 2px solid #2a3956;
          color: #cbd5e1;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 3px 0 #000;
          transition: all 0.1s ease;
          white-space: nowrap;
          box-sizing: border-box;
        }

        .filter-btn:hover {
          background: #1c2740;
          color: #fff;
        }

        .filter-btn.active {
          background: #00f0ff;
          color: #000;
          border-color: #00f0ff;
          box-shadow: 0 3px 0 #000, 0 0 12px rgba(0, 240, 255, 0.4);
        }

        .filter-btn:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #000;
        }

        /* Badges Grid */
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 16px;
          margin-bottom: 36px;
        }

        .badge-card {
          background: #101524;
          border: 3px solid #202b42;
          border-radius: 12px;
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          position: relative;
          box-shadow: 0 6px 0 #000;
          transition: all 0.15s ease;
        }

        .badge-card.earned {
          border-color: var(--rarity-color);
          background: linear-gradient(180deg, #131b2e 0%, #0c111e 100%);
          box-shadow: 0 6px 0 #000, 0 0 16px var(--rarity-color);
        }

        .badge-card.earned:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 0 #000, 0 0 24px var(--rarity-color);
        }

        .badge-card.locked {
          opacity: 0.65;
          filter: grayscale(0.55);
        }

        .card-top-tag {
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          margin-bottom: 12px;
        }

        .rarity-badge {
          color: var(--rarity-color);
          font-weight: 800;
        }

        .game-tag {
          color: #64748b;
          font-weight: 700;
        }

        .badge-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 12px;
          background: #090c14;
          border: 2px solid #23304a;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          position: relative;
        }

        .badge-card.earned .badge-icon-wrap {
          border-color: var(--rarity-color);
          box-shadow: inset 0 0 10px var(--rarity-color);
        }

        .badge-icon {
          font-size: 2.2rem;
        }

        .lock-overlay {
          position: absolute;
          bottom: 2px;
          right: 2px;
          font-size: 1rem;
        }

        .badge-title {
          font-size: 0.95rem;
          color: #fff;
          font-weight: 900;
          margin-bottom: 6px;
          line-height: 1.25;
        }

        .badge-desc {
          font-size: 0.72rem;
          color: #8fa0be;
          line-height: 1.35;
          margin-bottom: 12px;
          flex: 1;
        }

        .badge-status {
          font-size: 0.75rem;
          font-weight: 800;
        }

        .status-earned {
          color: var(--rarity-color);
          text-shadow: 0 0 8px var(--rarity-color);
        }

        .status-locked {
          color: #64748b;
        }

        /* Invitation Banner */
        .invite-banner {
          background: linear-gradient(135deg, #18233c 0%, #101626 100%);
          border: 3px solid #ffe600;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 8px 0 #000, 0 0 25px rgba(255, 230, 0, 0.2);
          gap: 20px;
          flex-wrap: wrap;
        }

        .invite-text h2 {
          font-size: 1.3rem;
          color: #ffe600;
          margin-bottom: 6px;
          font-weight: 900;
        }

        .invite-text p {
          font-size: 0.85rem;
          color: #cbd5e1;
        }

        .invite-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .invite-copy-btn, .invite-play-btn {
          font-family: inherit;
          font-size: 0.88rem;
          font-weight: 800;
          padding: 12px 18px;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          box-shadow: 0 4px 0 #000;
          transition: all 0.1s ease;
        }

        .invite-copy-btn {
          background: #ff0055;
          border: 2px solid #ff4d88;
          color: #fff;
        }

        .invite-play-btn {
          background: #00f0ff;
          border: 2px solid #00c3ff;
          color: #000;
        }

        .invite-copy-btn:active, .invite-play-btn:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #000;
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 100;
          backdrop-filter: blur(4px);
        }

        .modal-box {
          background: #111726;
          border: 4px solid #2e3e60;
          border-radius: 16px;
          padding: 28px 24px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          position: relative;
          box-shadow: 0 10px 0 #000, 0 0 30px rgba(0, 0, 0, 0.8);
        }

        .modal-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          background: #1c263c;
          border: 2px solid #3d4f75;
          color: #fff;
          font-size: 1rem;
          width: 34px;
          height: 34px;
          border-radius: 6px;
          cursor: pointer;
        }

        .modal-icon-box {
          width: 88px;
          height: 88px;
          border-radius: 16px;
          background: #0a0d16;
          border: 3px solid var(--rarity-color);
          box-shadow: 0 0 20px var(--rarity-color);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .big-icon {
          font-size: 3rem;
        }

        .modal-rarity {
          font-size: 0.82rem;
          font-weight: 800;
          display: block;
          margin-bottom: 8px;
        }

        .modal-title {
          font-size: 1.4rem;
          color: #fff;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .modal-desc {
          font-size: 0.88rem;
          color: #94a3b8;
          line-height: 1.45;
          margin-bottom: 20px;
        }

        .modal-earned-pill {
          display: inline-block;
          background: rgba(52, 211, 153, 0.15);
          border: 2px solid #34d399;
          color: #34d399;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 800;
        }

        .modal-locked-pill {
          display: inline-block;
          background: rgba(148, 163, 184, 0.1);
          border: 2px solid #64748b;
          color: #94a3b8;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.82rem;
        }

        /* Toast */
        .toast-pop {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: #10b981;
          color: #fff;
          border: 3px solid #34d399;
          box-shadow: 0 6px 0 #000, 0 0 20px rgba(16, 185, 129, 0.5);
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 800;
          z-index: 200;
          animation: popUp 0.3s ease;
        }

        @keyframes popUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        @media (max-width: 640px) {
          .main-title { font-size: 1.4rem; }
          .hall-header { justify-content: center; }
          .header-center { order: -1; width: 100%; margin-bottom: 8px; }
          .badges-grid { grid-template-columns: repeat(2, 1fr); }
          .share-url-row { flex-direction: column; align-items: stretch; }
        }
      `}</style>
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

  const savedBadges = await getUserBadges(userId);

  return {
    props: {
      user: {
        id: user.id,
        name: user.name,
      },
      initialBadges: savedBadges || { earnedIds: [] },
    },
  };
}
