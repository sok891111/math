import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function HomePage() {
  const [showModal, setShowModal] = useState(true);

  return (
    <>
      <Head>
        <title>열칸 블록섬 & 햇살 모험</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
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
          background: rgba(4, 12, 16, 0.82);
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
          max-width: 520px;
          width: 100%;
          padding: 32px 28px;
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
          margin-bottom: 24px;
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
          margin-bottom: 24px;
          font-family: monospace;
          font-size: 0.9rem;
          color: #4ade80;
        }

        .guide-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-admin {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #10b981, #0284c7);
          color: #ffffff;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);
        }

        .btn-admin:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
        }

        .btn-dismiss {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #94a3b8;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-dismiss:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
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

      {/* 배포된 전용 URL 접속 안내 가이드 모달 */}
      {showModal && (
        <div className="guide-overlay">
          <div className="guide-card">
            <span className="guide-badge">🧭 접속 주소 안내</span>
            <span className="guide-icon">🎒</span>
            <h1 className="guide-title">
              개인별 전용 접속 링크로<br />접속해 주세요!
            </h1>
            <p className="guide-desc">
              열칸 블록섬과 햇살 모험은 각 아이마다 <strong>학습 진도, 배지, 점수</strong>를 개별 관리하기 위해 <strong>개인별 전용 주소</strong>로 운영됩니다.<br />
              선생님이나 부모님께 전달받으신 고유 링크로 접속하시면 나만의 모험이 시작됩니다!
            </p>

            <div className="url-example-box">
              예시: https://도메인/<strong>[아이코드]</strong>
            </div>

            <div className="guide-actions">
              <Link href="/admin" className="btn-admin">
                🛸 관리자 페이지 바로가기 (링크 발급) ↗
              </Link>
              <button
                className="btn-dismiss"
                onClick={() => setShowModal(false)}
              >
                🎮 게스트 모드로 둘러보기 (모달 닫기)
              </button>
            </div>
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
