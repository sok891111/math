import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { getUser, getUserBadges } from '../../lib/stateManager';
import { hasFinalConsonant } from '../../lib/koreanHelper';
import { BADGE_CATALOG } from '../../lib/badgeCatalog';

export default function UserLobbyPage({ user, initialBadges }) {
  if (!user) return null;

  const childName = user.name;
  const hasBatchim = hasFinalConsonant(childName);
  const vocative = hasBatchim ? `${childName}아` : `${childName}야`;
  const possessive = hasBatchim ? `${childName}이의` : `${childName}의`;

  // 0: 크래프트 Runner, 1: 완성! block island
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const audioCtxRef = useRef(null);

  // Touch Swipe tracking for iPad
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  // Badge Modal & Share URL state
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [showShareBox, setShowShareBox] = useState(false);
  const [badgeFilter, setBadgeFilter] = useState('all');
  const [earnedBadgeIds, setEarnedBadgeIds] = useState(initialBadges?.earnedIds || []);
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimeoutRef = useRef(null);

  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/${user.id}/badges`);
    }
  }, [user.id]);

  const games = [
    {
      id: 'platformer',
      title: '크래프트 Runner',
      path: `/${user.id}/platformer`,
      type: 'ACTION RUNNER',
      meta: 'LV 1~3 CAMPAIGN · 1P',
      themeColor: '#00f0ff',
      themeBorder: '#00c3ff',
      accentBg: 'linear-gradient(135deg, #092233 0%, #03101c 100%)',
      sceneClass: 'runner-scene',
    },
    {
      id: 'island',
      title: '완성! block island',
      path: `/${user.id}/island`,
      type: '10-BLOCK PUZZLE',
      meta: 'PUZZLE ISLAND · 1P',
      themeColor: '#ffe600',
      themeBorder: '#e6c800',
      accentBg: 'linear-gradient(135deg, #2b1f05 0%, #150e02 100%)',
      sceneClass: 'island-scene',
    },
  ];

  // Unlock iOS Safari AudioContext on first touch
  const unlockAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handleFirstTouch = () => {
      unlockAudio();
    };
    window.addEventListener('touchstart', handleFirstTouch, { once: true, passive: true });
    window.addEventListener('touchend', handleFirstTouch, { once: true, passive: true });
    window.addEventListener('click', handleFirstTouch, { once: true, passive: true });
    return () => {
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('touchend', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };
  }, []);

  // Sync earned badges from localStorage across both games
  useEffect(() => {
    try {
      const runnerRaw = localStorage.getItem(`seonyul-sunshine-progress-v1_${user.id}`);
      const islandRaw = localStorage.getItem(`seonyul-block-island-v1_${user.id}`);
      const earnedSet = new Set(earnedBadgeIds);

      // 1. Craft Runner earned badges
      if (runnerRaw) {
        const rData = JSON.parse(runnerRaw);
        if (rData && rData.earned) {
          Object.keys(rData.earned).forEach(id => earnedSet.add(id));
        }
      }

      // 2. Block Island earned badges
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

      const arr = Array.from(earnedSet);
      if (arr.length > earnedBadgeIds.length) {
        setEarnedBadgeIds(arr);
        fetch(`/api/user/${user.id}/badges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ badges: { earnedIds: arr } }),
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
      const urlToCopy = shareUrl || `${window.location.origin}/${user.id}/badges`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        const ta = document.createElement('textarea');
        ta.value = urlToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      showToast('🎉 나의 뱃지 링크가 클립보드에 복사되었어요!');
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      showToast('주소창에서 링크를 복사해 주세요!');
    }
  };

  // 8-bit Web Audio Synth SFX
  const playSound = (type) => {
    if (!sfxEnabled || typeof window === 'undefined') return;
    try {
      unlockAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'select') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.setValueAtTime(480, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'start') {
        osc.type = 'triangle';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.06);
        osc.frequency.setValueAtTime(659.25, now + 0.12);
        osc.frequency.setValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {}
  };

  const handleLaunch = (path) => {
    playSound('start');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    setTimeout(() => {
      window.location.href = path;
    }, 150);
  };

  // Keyboard controls for iPad Magic Keyboard / PC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isBadgeModalOpen) {
        if (e.key === 'Escape') setIsBadgeModalOpen(false);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setSelectedIdx(0);
        playSound('select');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setSelectedIdx(1);
        playSound('select');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleLaunch(games[selectedIdx].path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, sfxEnabled, isBadgeModalOpen]);

  // Touch Swipe Handlers for iPad
  const onTouchStart = (e) => {
    unlockAudio();
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const onTouchEnd = (e) => {
    if (touchStartXRef.current === null || isBadgeModalOpen) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : null;
    const endY = e.changedTouches ? e.changedTouches[0].clientY : null;
    if (endX !== null && endY !== null) {
      const diffX = endX - touchStartXRef.current;
      const diffY = endY - touchStartYRef.current;
      if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0 && selectedIdx === 0) {
          setSelectedIdx(1);
          playSound('select');
        } else if (diffX > 0 && selectedIdx === 1) {
          setSelectedIdx(0);
          playSound('select');
        }
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const earnedSet = new Set(earnedBadgeIds);
  const earnedCount = BADGE_CATALOG.filter(b => earnedSet.has(b.id)).length;
  const totalBadgeCount = BADGE_CATALOG.length;

  const modalBadges = BADGE_CATALOG.filter(b => {
    if (badgeFilter === 'earned') return earnedSet.has(b.id);
    if (badgeFilter === 'runner') return b.game === 'runner';
    if (badgeFilter === 'island') return b.game === 'island';
    if (badgeFilter === 'monster') return b.category === 'monster';
    if (badgeFilter === 'math') return b.category === 'math';
    if (badgeFilter === 'treasure') return b.category === 'treasure' || b.category === 'adventure' || b.category === 'bridge';
    return true;
  });

  return (
    <>
      <Head>
        <title>{possessive} 매트로 게임 선택기 · {childName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/neodgm/neodgm-webfont@1.601/neodgm/style.css" />
      </Head>

      <div
        className="arcade-cabinet"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="crt-scanlines" />
        <div className="crt-glow" />

        <div className="arcade-screen">
          {/* Top Marquee HUD */}
          <header className="arcade-hud">
            <div className="hud-badge player-badge">
              <span className="blink-dot">●</span>
              <span>1P: {childName}</span>
            </div>
            <div className="hud-badge credit-badge">
              <span className="coin-icon">🪙</span>
              <span>CREDIT: 99</span>
            </div>
            <button
              type="button"
              className="hud-btn sfx-btn"
              onClick={(e) => {
                e.stopPropagation();
                unlockAudio();
                const nextState = !sfxEnabled;
                setSfxEnabled(nextState);
                if (nextState) playSound('select');
              }}
              title="사운드 켜기/끄기"
            >
              {sfxEnabled ? '🔊 SFX ON' : '🔈 MUTE'}
            </button>
          </header>

          {/* Marquee Arcade Title */}
          <div className="marquee-banner">
            <div className="marquee-sub">★ ARCADE STAGE SELECT ★</div>
            <h1 className="marquee-title">GAME SELECT</h1>
          </div>

          {/* iPad Touch Segmented Switcher Tabs */}
          <nav className="touch-tab-nav" aria-label="게임 선택 탭">
            {games.map((g, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`touch-tab ${isSelected ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    unlockAudio();
                    if (selectedIdx !== idx) {
                      setSelectedIdx(idx);
                      playSound('select');
                    }
                  }}
                  style={{
                    '--tab-color': g.themeColor,
                  }}
                >
                  <span className="tab-icon">{idx === 0 ? '🏃‍♂️' : '🏝️'}</span>
                  <span className="tab-label">{g.title}</span>
                  {isSelected && <span className="tab-pip">●</span>}
                </button>
              );
            })}
          </nav>

          {/* Two Retro Game Selection Cards */}
          <main className="select-grid">
            {games.map((g, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <article
                  key={g.id}
                  className={`game-pod ${isSelected ? 'active' : ''} pod-${g.id}`}
                  onClick={() => {
                    unlockAudio();
                    if (selectedIdx !== idx) {
                      setSelectedIdx(idx);
                      playSound('select');
                    } else {
                      handleLaunch(g.path);
                    }
                  }}
                  style={{
                    '--accent': g.themeColor,
                    '--border-color': g.themeBorder,
                  }}
                >
                  <div className="pod-indicator">
                    {isSelected ? '👉 READY! [터치하여 플레이]' : 'TAP TO CHOOSE'}
                  </div>

                  <div className="pod-tag-bar">
                    <span className="pod-type">{g.type}</span>
                    <span className="pod-meta">{g.meta}</span>
                  </div>

                  <div className={`preview-screen ${g.sceneClass}`}>
                    {g.id === 'platformer' ? (
                      <div className="pixel-stage runner-stage">
                        <div className="pixel-sun">☀️</div>
                        <div className="pixel-cloud c1">☁️</div>
                        <div className="pixel-cloud c2">☁️</div>
                        <div className="pixel-diamond">💎</div>
                        <div className="pixel-sprite runner-sprite">🏃‍♂️💨</div>
                        <div className="pixel-sprite zombie-sprite">🧟</div>
                        <div className="pixel-ground runner-ground" />
                      </div>
                    ) : (
                      <div className="pixel-stage island-stage">
                        <div className="pixel-moon">🌙</div>
                        <div className="pixel-stars">✨ 🌟 ✨</div>
                        <div className="pixel-rainbow">🌈</div>
                        <div className="pixel-bridge">🌉</div>
                        <div className="pixel-animals">🦊 🐻 🐰</div>
                        <div className="pixel-blocks">🧊 🍎 🥕</div>
                        <div className="pixel-ground island-ground" />
                      </div>
                    )}
                    <div className="screen-lines" />
                  </div>

                  <h2 className="game-name">{g.title}</h2>

                  <a
                    href={g.path}
                    className="arcade-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      unlockAudio();
                      handleLaunch(g.path);
                    }}
                  >
                    <span className="btn-label">
                      {isSelected ? '🕹️ 지금 플레이 시작! ▶' : '▶ 게임 시작 ◀'}
                    </span>
                  </a>
                </article>
              );
            })}
          </main>

          {/* iPad Big Touch Action Bar */}
          <div className="ipad-action-bar">
            <button
              type="button"
              className="ipad-nav-btn prev-btn"
              disabled={selectedIdx === 0}
              onClick={(e) => {
                e.stopPropagation();
                unlockAudio();
                setSelectedIdx(0);
                playSound('select');
              }}
              aria-label="이전 게임 선택"
            >
              ◀
            </button>

            <button
              type="button"
              className="ipad-start-main-btn"
              onClick={(e) => {
                e.stopPropagation();
                unlockAudio();
                handleLaunch(games[selectedIdx].path);
              }}
              style={{
                '--main-color': games[selectedIdx].themeColor,
              }}
            >
              <span className="main-btn-sparkle">★</span>
              <span className="main-btn-text">
                {games[selectedIdx].title} 시작하기!
              </span>
              <span className="main-btn-arrow">▶</span>
            </button>

            <button
              type="button"
              className="ipad-nav-btn next-btn"
              disabled={selectedIdx === 1}
              onClick={(e) => {
                e.stopPropagation();
                unlockAudio();
                setSelectedIdx(1);
                playSound('select');
              }}
              aria-label="다음 게임 선택"
            >
              ▶
            </button>
          </div>

          {/* Badge Launcher Area */}
          <section className="badge-launcher-area">
            <button
              type="button"
              className="badge-launcher-btn"
              onClick={() => {
                unlockAudio();
                playSound('select');
                setIsBadgeModalOpen(true);
              }}
            >
              <span className="launcher-icon">🏅</span>
              <span className="launcher-title">지금까지 모은 뱃지 보러가기</span>
              <span className="launcher-badge-pill">{earnedCount} / {totalBadgeCount}개 획득!</span>
              <span className="launcher-arrow">▶</span>
            </button>
          </section>

          {/* Arcade Cabinet Footer */}
          <footer className="arcade-footer">
            <div className="key-guides">
              <span className="touch-tip">📱 화면을 좌우로 밀거나 탭하세요</span>
              <span className="guide-divider">|</span>
              <a href={`/${user.id}/badges`} className="footer-badge-link">
                🏅 나의 뱃지 링크 바로가기 ↗
              </a>
            </div>
            <div className="insert-coin">● INSERT COIN TO PLAY ●</div>
          </footer>
        </div>

        {/* ─── Retro Badge Collection Modal ─── */}
        {isBadgeModalOpen && (
          <div className="badge-modal-backdrop" onClick={() => setIsBadgeModalOpen(false)}>
            <div className="badge-modal-card" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="modal-header">
                <div className="modal-title-group">
                  <span className="modal-header-icon">🏆</span>
                  <div>
                    <h2 className="modal-title">{childName}이의 뱃지 보관함</h2>
                    <span className="modal-subtitle">
                      총 {totalBadgeCount}개 중 <strong>{earnedCount}개 획득</strong>
                    </span>
                  </div>
                </div>

                {/* Right Top Action Buttons */}
                <div className="modal-actions-right">
                  <button
                    type="button"
                    className="modal-share-btn"
                    onClick={() => {
                      setShowShareBox(!showShareBox);
                      playSound('select');
                    }}
                    title="나의 뱃지 링크 보기"
                  >
                    <span>🔗 나의 뱃지 링크</span>
                  </button>
                  <button
                    type="button"
                    className="modal-close-x"
                    onClick={() => setIsBadgeModalOpen(false)}
                    aria-label="닫기"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Dedicated Share URL Display Panel */}
              {showShareBox && (
                <div className="share-url-panel">
                  <div className="share-url-top">
                    <span className="share-url-tag">🔗 나의 뱃지 링크</span>
                    <span className="share-url-hint">친구들에게 보여줄 전용 링크입니다.</span>
                  </div>
                  <div className="share-url-input-row">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="share-url-field"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      className={`share-url-btn ${copied ? 'copied' : ''}`}
                      onClick={handleCopyUrl}
                    >
                      {copied ? '✅ 복사됨!' : '📋 복사하기'}
                    </button>
                  </div>
                </div>
              )}

              {/* Clean, Non-broken Filter Tabs */}
              <div className="modal-filters-bar">
                <button
                  type="button"
                  className={`tab-filter-btn ${badgeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setBadgeFilter('all')}
                >
                  전체 ({totalBadgeCount})
                </button>
                <button
                  type="button"
                  className={`tab-filter-btn ${badgeFilter === 'earned' ? 'active' : ''}`}
                  onClick={() => setBadgeFilter('earned')}
                >
                  ✨ 획득 ({earnedCount})
                </button>
                <button
                  type="button"
                  className={`tab-filter-btn ${badgeFilter === 'runner' ? 'active' : ''}`}
                  onClick={() => setBadgeFilter('runner')}
                >
                  🏃 크래프트 Runner (143)
                </button>
                <button
                  type="button"
                  className={`tab-filter-btn ${badgeFilter === 'island' ? 'active' : ''}`}
                  onClick={() => setBadgeFilter('island')}
                >
                  🏝️ 완성! block island (56)
                </button>
                <button
                  type="button"
                  className={`tab-filter-btn ${badgeFilter === 'monster' ? 'active' : ''}`}
                  onClick={() => setBadgeFilter('monster')}
                >
                  👾 몬스터 도감
                </button>
                <button
                  type="button"
                  className={`tab-filter-btn ${badgeFilter === 'math' ? 'active' : ''}`}
                  onClick={() => setBadgeFilter('math')}
                >
                  🧮 수학 도전
                </button>
              </div>

              {/* Badges Grid inside Modal */}
              <div className="modal-badge-scroll">
                <div className="modal-badges-grid">
                  {modalBadges.map(badge => {
                    const isEarned = earnedSet.has(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`m-badge-card ${isEarned ? 'earned' : 'locked'}`}
                        style={{ '--rarity-color': badge.rarityColor }}
                      >
                        <div className="m-card-top">
                          <span className="m-rarity-pill">{badge.rarityName}</span>
                          <span className="m-game-pill">{badge.game === 'runner' ? 'Runner' : 'Island'}</span>
                        </div>

                        <div className="m-icon-box">
                          <span className="m-icon">{badge.icon}</span>
                          {!isEarned && <span className="m-lock">🔒</span>}
                        </div>

                        <h4 className="m-badge-name">{badge.title}</h4>
                        <p className="m-badge-desc">{badge.desc}</p>

                        <div className="m-status-row">
                          {isEarned ? (
                            <span className="m-earned-text">✨ 획득 완료</span>
                          ) : (
                            <span className="m-locked-text">
                              {badge.target ? `0 / ${badge.target}` : '🔒 도전 중'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Bar */}
              <div className="modal-footer-bar">
                <a href={`/${user.id}/badges`} className="modal-hall-link">
                  <span>🌟 전체화면 뱃지 명예의 전당 보러가기 ↗</span>
                </a>
                <button
                  type="button"
                  className="modal-copy-link-btn"
                  onClick={() => {
                    setShowShareBox(true);
                    handleCopyUrl();
                  }}
                >
                  <span>{copied ? '✅ 복사 완료!' : '📋 나의 뱃지 링크 복사'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast */}
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
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        html, body {
          background: #08090d;
          color: #f1f5f9;
          font-family: 'NeoDGM', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .arcade-cabinet {
          min-height: 100vh;
          background: radial-gradient(circle at center, #111422 0%, #06070a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
          position: relative;
        }

        .crt-scanlines {
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
          opacity: 0.6;
        }

        .crt-glow {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.8);
          pointer-events: none;
          z-index: 51;
        }

        .arcade-screen {
          width: 100%;
          max-width: 920px;
          background: #0d101a;
          border: 6px solid #202638;
          box-shadow:
            0 0 0 4px #000,
            0 0 35px rgba(0, 240, 255, 0.15),
            inset 0 0 40px rgba(0, 0, 0, 0.8);
          border-radius: 20px;
          padding: 24px 22px 18px;
          position: relative;
          z-index: 10;
        }

        .arcade-hud {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px dashed #2a344d;
          padding-bottom: 12px;
          margin-bottom: 20px;
          font-size: 0.88rem;
          letter-spacing: 0.5px;
        }

        .hud-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: #141926;
          border: 2px solid #2e3b59;
          border-radius: 6px;
        }

        .player-badge {
          color: #ffe600;
          font-weight: 800;
          text-shadow: 0 0 8px rgba(255, 230, 0, 0.5);
        }

        .blink-dot {
          color: #ff0055;
          animation: blink 0.8s infinite;
        }

        .credit-badge {
          color: #00f0ff;
          font-weight: 800;
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
        }

        .hud-btn {
          font-family: inherit;
          font-size: 0.8rem;
          font-weight: 800;
          background: #192033;
          border: 2px solid #3d4f77;
          color: #94a3b8;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: transform 0.1s ease, background 0.1s ease;
          min-height: 40px;
        }

        .hud-btn:active {
          transform: scale(0.95);
          background: #253150;
          color: #fff;
          border-color: #00f0ff;
        }

        .marquee-banner {
          text-align: center;
          margin-bottom: 20px;
        }

        .marquee-sub {
          font-size: 0.82rem;
          color: #00f0ff;
          letter-spacing: 2px;
          text-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
          margin-bottom: 4px;
        }

        .marquee-title {
          font-size: 2.4rem;
          font-weight: 900;
          letter-spacing: 3px;
          color: #fff;
          text-shadow:
            3px 3px 0 #ff0055,
            -3px -3px 0 #00f0ff,
            0 0 25px rgba(255, 255, 255, 0.4);
        }

        .touch-tab-nav {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          justify-content: center;
        }

        .touch-tab {
          flex: 1;
          max-width: 420px;
          min-height: 52px;
          background: #131726;
          border: 3px solid #28334f;
          border-radius: 12px;
          color: #8b9bb4;
          font-family: inherit;
          font-size: 1.05rem;
          font-weight: 900;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 5px 0 #000;
          transition: all 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }

        .touch-tab.active {
          background: #1c2338;
          border-color: var(--tab-color);
          color: #fff;
          box-shadow: 0 6px 0 #000, 0 0 20px var(--tab-color);
          transform: translateY(-2px);
        }

        .touch-tab:active {
          transform: translateY(3px) scale(0.98);
          box-shadow: 0 2px 0 #000;
        }

        .tab-icon {
          font-size: 1.4rem;
        }

        .tab-pip {
          color: var(--tab-color);
          font-size: 0.75rem;
          animation: blink 0.7s infinite;
        }

        .select-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 22px;
          margin-bottom: 24px;
        }

        .game-pod {
          background: #111522;
          border: 4px solid #252e47;
          border-radius: 16px;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          position: relative;
          transition: all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
          box-shadow: 0 8px 0 #000, 0 12px 20px rgba(0, 0, 0, 0.5);
        }

        .game-pod.active {
          border-color: var(--accent);
          background: #151a2a;
          box-shadow:
            0 12px 0 #000,
            0 0 28px var(--accent),
            inset 0 0 16px rgba(0, 0, 0, 0.6);
          transform: translateY(-4px);
        }

        .game-pod:active {
          transform: scale(0.98) translateY(2px);
          box-shadow: 0 4px 0 #000;
        }

        .pod-indicator {
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 8px;
          height: 18px;
          text-align: center;
        }

        .game-pod.active .pod-indicator {
          color: var(--accent);
          text-shadow: 0 0 10px var(--accent);
          animation: blink 0.7s infinite;
        }

        .pod-tag-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .pod-type {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 3px 8px;
          background: #1d2538;
          border: 1.5px solid var(--border-color);
          color: var(--accent);
          border-radius: 4px;
        }

        .pod-meta {
          font-size: 0.72rem;
          color: #94a3b8;
        }

        .preview-screen {
          width: 100%;
          height: 150px;
          border-radius: 10px;
          border: 3px solid #000;
          box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.9);
          margin-bottom: 16px;
          overflow: hidden;
          position: relative;
        }

        .runner-scene {
          background: linear-gradient(180deg, #1b3a4b 0%, #0d222e 65%, #184c28 65%, #0e3019 100%);
        }

        .island-scene {
          background: linear-gradient(180deg, #161a38 0%, #0b0f24 65%, #1b3848 65%, #0d202b 100%);
        }

        .screen-lines {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.35) 0px,
            rgba(0, 0, 0, 0.35) 2px,
            transparent 2px,
            transparent 4px
          );
          pointer-events: none;
        }

        .pixel-stage {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pixel-sun {
          position: absolute;
          top: 14px;
          right: 20px;
          font-size: 1.6rem;
          filter: drop-shadow(0 0 10px #ffe600);
          animation: floatSlow 3s infinite ease-in-out;
        }

        .pixel-moon {
          position: absolute;
          top: 14px;
          right: 20px;
          font-size: 1.5rem;
          filter: drop-shadow(0 0 12px #ffe600);
        }

        .pixel-cloud {
          position: absolute;
          font-size: 1.1rem;
          opacity: 0.7;
        }
        .pixel-cloud.c1 { top: 16px; left: 15px; animation: drift 14s infinite linear; }
        .pixel-cloud.c2 { top: 38px; left: 90px; animation: drift 18s infinite linear reverse; }

        .pixel-diamond {
          position: absolute;
          top: 44px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.5rem;
          filter: drop-shadow(0 0 8px #00f0ff);
          animation: floatFast 1.5s infinite ease-in-out;
        }

        .runner-sprite {
          position: absolute;
          bottom: 24px;
          left: 36px;
          font-size: 2.4rem;
          animation: runBounce 0.4s infinite alternate;
        }

        .zombie-sprite {
          position: absolute;
          bottom: 24px;
          right: 36px;
          font-size: 2.2rem;
          animation: monsterWiggle 0.8s infinite alternate;
        }

        .runner-ground, .island-ground {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 22px;
          border-top: 3px solid #000;
        }

        .runner-ground { background: #2d6a4f; }
        .island-ground { background: #1b4965; }

        .pixel-stars {
          position: absolute;
          top: 16px;
          left: 20px;
          font-size: 0.9rem;
          letter-spacing: 6px;
          animation: blink 1.2s infinite;
        }

        .pixel-rainbow {
          position: absolute;
          top: 30px;
          font-size: 1.6rem;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
        }

        .pixel-animals {
          position: absolute;
          bottom: 24px;
          left: 24px;
          font-size: 1.8rem;
          letter-spacing: 4px;
          animation: floatSlow 2s infinite ease-in-out;
        }

        .pixel-blocks {
          position: absolute;
          bottom: 26px;
          right: 24px;
          font-size: 1.6rem;
          letter-spacing: 4px;
          animation: runBounce 0.6s infinite alternate;
        }

        .game-name {
          font-size: 1.45rem;
          font-weight: 900;
          color: #fff;
          text-align: center;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
          text-shadow: 2px 2px 0 #000;
        }

        .game-pod.active .game-name {
          color: var(--accent);
          text-shadow: 0 0 12px var(--accent), 2px 2px 0 #000;
        }

        .arcade-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          min-height: 52px;
          padding: 12px 16px;
          background: #1b2336;
          border: 3px solid var(--accent);
          border-radius: 10px;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 900;
          letter-spacing: 0.5px;
          box-shadow: 0 6px 0 #000;
          transition: all 0.1s ease;
          position: relative;
        }

        .game-pod.active .arcade-btn {
          background: var(--accent);
          color: #000;
          box-shadow: 0 6px 0 #000, 0 0 16px var(--accent);
        }

        .arcade-btn:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #000;
        }

        .ipad-action-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 20px;
          padding: 6px 0;
        }

        .ipad-nav-btn {
          min-width: 58px;
          min-height: 58px;
          border-radius: 12px;
          background: #161c2e;
          border: 3px solid #334366;
          color: #ffe600;
          font-size: 1.4rem;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 6px 0 #000;
          transition: all 0.1s ease;
        }

        .ipad-nav-btn:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #000;
        }

        .ipad-nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          box-shadow: 0 2px 0 #000;
          transform: none;
        }

        .ipad-start-main-btn {
          flex: 1;
          max-width: 480px;
          min-height: 58px;
          border-radius: 14px;
          background: linear-gradient(180deg, var(--main-color) 0%, #101626 220%);
          border: 3.5px solid var(--main-color);
          color: #000;
          font-family: inherit;
          font-size: 1.15rem;
          font-weight: 900;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 8px 0 #000, 0 0 25px var(--main-color);
          transition: all 0.12s ease;
          letter-spacing: 0.5px;
        }

        .ipad-start-main-btn:active {
          transform: translateY(5px);
          box-shadow: 0 3px 0 #000, 0 0 10px var(--main-color);
        }

        .main-btn-sparkle {
          font-size: 1.2rem;
          animation: blink 0.8s infinite;
        }

        .main-btn-arrow {
          font-size: 1.1rem;
        }

        /* Badge Launcher Area */
        .badge-launcher-area {
          margin-bottom: 22px;
          display: flex;
          justify-content: center;
        }

        .badge-launcher-btn {
          width: 100%;
          max-width: 680px;
          min-height: 60px;
          background: linear-gradient(90deg, #1b233a 0%, #18283d 50%, #1a2338 100%);
          border: 3px solid #facc15;
          border-radius: 14px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          box-shadow: 0 6px 0 #000, 0 0 20px rgba(250, 204, 21, 0.25);
          transition: all 0.15s ease;
          gap: 12px;
        }

        .badge-launcher-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 9px 0 #000, 0 0 30px rgba(250, 204, 21, 0.4);
          border-color: #ffe600;
        }

        .badge-launcher-btn:active {
          transform: translateY(3px);
          box-shadow: 0 2px 0 #000;
        }

        .launcher-icon {
          font-size: 1.8rem;
          animation: floatSlow 2s infinite ease-in-out;
        }

        .launcher-title {
          font-family: inherit;
          font-size: 1.08rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: 0.5px;
          flex: 1;
          text-align: left;
        }

        .launcher-badge-pill {
          background: #facc15;
          color: #000;
          font-size: 0.82rem;
          font-weight: 900;
          padding: 5px 12px;
          border-radius: 20px;
          box-shadow: 0 2px 0 #000;
        }

        .launcher-arrow {
          font-size: 1.2rem;
          color: #facc15;
        }

        /* Footer Controls */
        .arcade-footer {
          border-top: 3px dashed #2a344d;
          padding-top: 16px;
          text-align: center;
        }

        .key-guides {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 0.82rem;
          color: #94a3b8;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .touch-tip {
          color: #38bdf8;
          font-weight: bold;
        }

        .footer-badge-link {
          color: #facc15;
          text-decoration: none;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(250, 204, 21, 0.12);
          border: 1px solid rgba(250, 204, 21, 0.4);
        }

        .footer-badge-link:hover {
          background: rgba(250, 204, 21, 0.25);
        }

        .guide-divider {
          opacity: 0.3;
          margin: 0 4px;
        }

        .insert-coin {
          font-size: 0.75rem;
          color: #ff0055;
          letter-spacing: 2px;
          animation: blink 0.9s infinite;
        }

        /* ─── Retro Badge Collection Modal ─── */
        .badge-modal-backdrop {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(4, 6, 12, 0.82);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 200;
        }

        .badge-modal-card {
          width: 100%;
          max-width: 860px;
          max-height: 90vh;
          background: #0f1524;
          border: 4px solid #293856;
          border-radius: 18px;
          box-shadow: 0 14px 0 #000, 0 0 40px rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          background: #141d30;
          border-bottom: 3px solid #23304c;
          gap: 12px;
          flex-wrap: wrap;
        }

        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-header-icon {
          font-size: 2.2rem;
        }

        .modal-title {
          font-size: 1.35rem;
          color: #fff;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .modal-subtitle {
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 700;
        }

        .modal-subtitle strong {
          color: #facc15;
        }

        .modal-actions-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-share-btn {
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 800;
          background: #ff0055;
          border: 2px solid #ff4d88;
          color: #fff;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 0 #000, 0 0 12px rgba(255, 0, 85, 0.4);
          transition: all 0.1s ease;
        }

        .modal-share-btn:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #000;
        }

        .modal-close-x {
          background: #1c263c;
          border: 2px solid #3d4f75;
          color: #fff;
          font-size: 1.1rem;
          font-weight: bold;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 0 #000;
        }

        .modal-close-x:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #000;
        }

        /* Dedicated Share URL Display Panel */
        .share-url-panel {
          background: #18233a;
          border-bottom: 2px solid #283756;
          padding: 14px 22px;
          animation: popUp 0.2s ease;
        }

        .share-url-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .share-url-tag {
          font-size: 0.82rem;
          font-weight: 900;
          color: #38bdf8;
        }

        .share-url-hint {
          font-size: 0.78rem;
          color: #94a3b8;
        }

        .share-url-input-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .share-url-field {
          flex: 1;
          background: #0a0d18;
          border: 2px solid #334466;
          border-radius: 8px;
          color: #ffe600;
          font-family: monospace;
          font-size: 0.88rem;
          padding: 8px 12px;
          outline: none;
        }

        .share-url-field:focus {
          border-color: #00f0ff;
        }

        .share-url-btn {
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 800;
          background: #10b981;
          border: 2px solid #34d399;
          color: #fff;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 0 #000;
          transition: all 0.1s ease;
        }

        .share-url-btn:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #000;
        }

        .share-url-btn.copied {
          background: #059669;
          border-color: #10b981;
        }

        /* Clean, Non-broken Filter Tabs */
        .modal-filters-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 14px 20px;
          background: #111728;
          border-bottom: 2px solid #1c273e;
          overflow: visible;
        }

        .tab-filter-btn {
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 800;
          line-height: 1.35;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #182238;
          border: 2px solid #2b3956;
          color: #cbd5e1;
          padding: 8px 15px;
          border-radius: 8px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 0 #000;
          transition: all 0.1s ease;
          box-sizing: border-box;
        }

        .tab-filter-btn:hover {
          background: #202d4a;
          color: #fff;
        }

        .tab-filter-btn.active {
          background: #00f0ff;
          color: #000;
          border-color: #00f0ff;
          box-shadow: 0 3px 0 #000, 0 0 10px rgba(0, 240, 255, 0.4);
        }

        .tab-filter-btn:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 #000;
        }

        /* Modal Badges Grid */
        .modal-badge-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #0c111e;
        }

        .modal-badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 14px;
        }

        .m-badge-card {
          background: #121829;
          border: 3px solid #212c44;
          border-radius: 12px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          box-shadow: 0 4px 0 #000;
          transition: all 0.15s ease;
        }

        .m-badge-card.earned {
          border-color: var(--rarity-color);
          box-shadow: 0 4px 0 #000, 0 0 14px var(--rarity-color);
          background: linear-gradient(180deg, #162035 0%, #0e1422 100%);
        }

        .m-badge-card.locked {
          opacity: 0.65;
          filter: grayscale(0.55);
        }

        .m-card-top {
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          margin-bottom: 8px;
        }

        .m-rarity-pill {
          color: var(--rarity-color);
          font-weight: 800;
        }

        .m-game-pill {
          color: #64748b;
          font-weight: 700;
        }

        .m-icon-box {
          width: 58px;
          height: 58px;
          border-radius: 10px;
          background: #090c14;
          border: 2px solid #23304a;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          position: relative;
        }

        .m-badge-card.earned .m-icon-box {
          border-color: var(--rarity-color);
          box-shadow: inset 0 0 8px var(--rarity-color);
        }

        .m-icon {
          font-size: 1.8rem;
        }

        .m-lock {
          position: absolute;
          bottom: 0;
          right: 0;
          font-size: 0.85rem;
        }

        .m-badge-name {
          font-size: 0.88rem;
          color: #fff;
          font-weight: 900;
          margin-bottom: 4px;
          line-height: 1.25;
        }

        .m-badge-desc {
          font-size: 0.7rem;
          color: #8fa0be;
          line-height: 1.3;
          margin-bottom: 8px;
          flex: 1;
        }

        .m-status-row {
          font-size: 0.72rem;
          font-weight: 800;
        }

        .m-earned-text {
          color: var(--rarity-color);
          text-shadow: 0 0 6px var(--rarity-color);
        }

        .m-locked-text {
          color: #64748b;
        }

        .modal-footer-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: #141d30;
          border-top: 3px solid #23304c;
          gap: 12px;
          flex-wrap: wrap;
        }

        .modal-hall-link {
          color: #facc15;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 900;
        }

        .modal-hall-link:hover {
          text-decoration: underline;
        }

        .modal-copy-link-btn {
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 800;
          background: #ff0055;
          border: 2px solid #ff4d88;
          color: #fff;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 4px 0 #000;
          transition: all 0.1s ease;
        }

        .modal-copy-link-btn:active {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #000;
        }

        /* Global Toast */
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
          z-index: 300;
          animation: popUp 0.3s ease;
          text-align: center;
          max-width: 90vw;
        }

        @keyframes popUp {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.15; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        @keyframes runBounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }

        @keyframes monsterWiggle {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(-1); }
        }

        @keyframes floatFast {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -10px); }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes drift {
          0% { transform: translateX(0); }
          50% { transform: translateX(20px); }
          100% { transform: translateX(0); }
        }

        @media (max-width: 768px) {
          .arcade-screen {
            padding: 16px 12px 14px;
            border-width: 4px;
          }
          .marquee-title {
            font-size: 1.8rem;
            letter-spacing: 2px;
          }
          .game-name {
            font-size: 1.25rem;
          }
          .touch-tab {
            font-size: 0.9rem;
            min-height: 48px;
            padding: 8px 10px;
          }
          .arcade-btn {
            font-size: 0.88rem;
            min-height: 48px;
          }
          .ipad-start-main-btn {
            font-size: 1rem;
            min-height: 52px;
          }
          .ipad-nav-btn {
            min-width: 50px;
            min-height: 52px;
            font-size: 1.2rem;
          }
          .launcher-title {
            font-size: 0.92rem;
          }
          .modal-header {
            padding: 14px 16px;
          }
          .modal-badges-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .share-url-input-row {
            flex-direction: column;
            align-items: stretch;
          }
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

  const initialBadges = await getUserBadges(userId);

  return {
    props: {
      user: {
        id: user.id,
        name: user.name,
      },
      initialBadges: initialBadges || { earnedIds: [] },
    },
  };
}
