import { useState, useEffect } from 'react';
import Head from 'next/head';
import { getBaseUrl } from '../lib/config';

export default function HomePage({ initialBaseUrl = 'https://www.opyeung.com' }) {
  const [showModal, setShowModal] = useState(true);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);

  useEffect(() => {
    setBaseUrl(getBaseUrl());
  }, []);

  return (
    <>
      <Head>
        <title>아이들을 위한 수학 게임 플랫폼 · 블록 아일랜드</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="신나는 마인크래프트 감성의 모험과 함께 10칸 블록으로 자연스럽게 배우는 아이들을 위한 수학 게임 플랫폼!" />

        {/* Open Graph / KakaoTalk */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="아이들을 위한 수학 게임 플랫폼 · 블록 아일랜드" />
        <meta property="og:description" content="신나는 마인크래프트 감성의 모험과 함께 10칸 블록으로 자연스럽게 배우는 아이들을 위한 수학 게임 플랫폼!" />
        <meta property="og:image" content={`${baseUrl}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="워든과 함께하는 아이들을 위한 수학 게임 플랫폼" />
        <meta property="og:site_name" content="블록 아일랜드" />
        <meta property="og:url" content={baseUrl} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="아이들을 위한 수학 게임 플랫폼 · 블록 아일랜드" />
        <meta name="twitter:description" content="신나는 마인크래프트 감성의 모험과 함께 10칸 블록으로 자연스럽게 배우는 아이들을 위한 수학 게임 플랫폼!" />
        <meta name="twitter:image" content={`${baseUrl}/og-image.png`} />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #0b141a;
          font-family: 'Apple SD Gothic Neo', 'Pretendard', 'Malgun Gothic', 'Segoe UI', sans-serif;
          color: #e6f1ea;
        }

        .background-wrap {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        .background-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Modal Overlay */
        .guide-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 12, 16, 0.85);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .guide-card {
          background: linear-gradient(145deg, #132722, #0d1a18);
          border: 2px solid rgba(74, 222, 128, 0.4);
          border-radius: 24px;
          max-width: 480px;
          width: 100%;
          padding: 36px 28px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(74, 222, 128, 0.15);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(20px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .guide-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(74, 222, 128, 0.15);
          border: 1px solid rgba(74, 222, 128, 0.35);
          color: #86efac;
          font-size: 0.82rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }

        .guide-icon {
          font-size: 2.8rem;
          margin-bottom: 12px;
          display: block;
        }

        .guide-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.4;
          margin-bottom: 14px;
          word-break: keep-all;
        }

        .guide-desc {
          font-size: 0.95rem;
          color: #cbd5e1;
          line-height: 1.7;
          margin-bottom: 22px;
          word-break: keep-all;
        }

        .guide-desc strong {
          color: #facc15;
          font-weight: 700;
        }

        .url-example-box {
          background: rgba(0, 0, 0, 0.35);
          border: 1px dashed rgba(74, 222, 128, 0.35);
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 22px;
          font-family: monospace;
          font-size: 0.9rem;
          color: #4ade80;
        }

        .guide-subtext {
          font-size: 0.82rem;
          color: #94a3b8;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .btn-confirm {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          gap: 8px;
          background: linear-gradient(135deg, #10b981, #0284c7);
          color: #ffffff;
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
        }

        .btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
        }

        .floating-guide-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #10b981;
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 30px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          z-index: 100;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      {/* 배경 게임 체험 뷰 */}
      <div className="background-wrap">
        <iframe
          src="/index.html"
          className="background-iframe"
          title="블록섬 미리보기"
        />
      </div>

      {/* 배포된 전용 URL 접속 안내 가이드 모달 (관리자 링크 일체 노출 없음) */}
      {showModal && (
        <div className="guide-overlay">
          <div className="guide-card">
            <span className="guide-badge">🧭 접속 주소 안내</span>
            <span className="guide-icon">🎒</span>
            <h1 className="guide-title">
              개인별 전용 접속 링크로<br />접속해 주세요!
            </h1>
            <p className="guide-desc">
              열칸 블록섬과 햇살 모험은 각 아이마다 <strong>학습 진도, 배지, 점수</strong>를 개별 보관하기 위해 <strong>개인별 전용 주소</strong>로 운영됩니다.<br />
              선생님이나 부모님께 전달받으신 고유 링크로 접속하시면 나만의 모험이 시작됩니다!
            </p>

            <div className="url-example-box">
              전용 주소 형식: {baseUrl}/<strong>[개인코드]</strong>
            </div>

            <p className="guide-subtext">
              ※ 전용 주소를 아직 전달받지 못하셨다면 선생님 또는 부모님께 문의해 주세요.
            </p>

            <button
              className="btn-confirm"
              onClick={() => setShowModal(false)}
            >
              🎮 블록섬 먼저 둘러보기
            </button>
          </div>
        </div>
      )}

      {!showModal && (
        <button
          className="floating-guide-btn"
          onClick={() => setShowModal(true)}
        >
          🧭 전용 주소 안내 열기
        </button>
      )}
    </>
  );
}

export async function getServerSideProps({ req }) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.opyeung.com');
  return {
    props: {
      initialBaseUrl: baseUrl,
    },
  };
}
