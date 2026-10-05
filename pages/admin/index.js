import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    const saved = localStorage.getItem('block_admin_secret');
    if (saved) {
      setSecret(saved);
      setAuthed(true);
    }
  }, []);

  const fetchUsers = useCallback(async (s) => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/users', {
        headers: { 'x-admin-secret': s }
      });
      if (r.ok) {
        const data = await r.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && secret) {
      fetchUsers(secret);
    }
  }, [authed, secret, fetchUsers]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const r = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await r.json();
      if (r.ok) {
        localStorage.setItem('block_admin_secret', data.secret);
        setSecret(data.secret);
        setAuthed(true);
      } else {
        setAuthError(data.error || '로그인에 실패했습니다.');
      }
    } catch {
      setAuthError('네트워크 오류가 발생했습니다.');
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('block_admin_secret');
    setAuthed(false);
    setSecret('');
    setUsers([]);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddLoading(true);
    try {
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        body: JSON.stringify({ name: newName.trim() })
      });
      const data = await r.json();
      if (r.ok) {
        setUsers(prev => [...prev, data.user]);
        setNewName('');
        showToast(`✅ ${data.user.name} (${data.user.id}) 추가 완료!`);
      } else {
        showToast('❌ ' + (data.error || '추가 실패'));
      }
    } catch {
      showToast('❌ 추가 중 오류가 발생했습니다.');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(userId, name) {
    try {
      const r = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        body: JSON.stringify({ userId })
      });
      if (r.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setDeleteConfirm(null);
        showToast(`🗑️ ${name} 삭제 완료`);
      } else {
        showToast('❌ 삭제 실패');
      }
    } catch {
      showToast('❌ 삭제 중 오류가 발생했습니다.');
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 주소가 복사되었습니다!'));
  }

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  return (
    <>
      <Head>
        <title>🏝️ 열칸 블록섬 관리자</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          background: #0b141a;
          font-family: 'Apple SD Gothic Neo', 'Pretendard', 'Malgun Gothic', 'Segoe UI', sans-serif;
          min-height: 100vh;
          color: #e6f1ea;
        }
        body {
          background-image: radial-gradient(circle at top right, #132b27 0%, #0b141a 75%);
          padding: 24px 16px 60px;
        }
        h1 {
          font-size: 1.85rem;
          font-weight: 900;
          background: linear-gradient(90deg, #4ade80, #38bdf8, #facc15);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .subtitle {
          font-size: 0.9rem;
          color: #8da498;
          margin-bottom: 28px;
        }
        .card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(74, 222, 128, 0.2);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
        }
        .section-title {
          font-size: 0.85rem;
          color: #4ade80;
          letter-spacing: 1.5px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        input[type=text], input[type=password] {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(74, 222, 128, 0.35);
          border-radius: 10px;
          color: #fff;
          font-size: 1rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: #4ade80;
          background: rgba(255, 255, 255, 0.09);
        }
        .btn {
          font-family: inherit;
          cursor: pointer;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #10b981, #0284c7);
          color: #fff;
          padding: 12px 24px;
          font-size: 0.95rem;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35);
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .btn-danger {
          background: rgba(239, 68, 68, 0.12);
          border: 1.5px solid rgba(239, 68, 68, 0.4);
          color: #fca5a5;
          padding: 6px 14px;
          font-size: 0.8rem;
        }
        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: #ef4444;
        }
        .btn-copy {
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #7dd3fc;
          padding: 6px 12px;
          font-size: 0.78rem;
          white-space: nowrap;
        }
        .btn-copy:hover {
          background: rgba(56, 189, 248, 0.25);
        }
        .btn-open {
          background: rgba(74, 222, 128, 0.12);
          border: 1px solid rgba(74, 222, 128, 0.4);
          color: #86efac;
          padding: 6px 12px;
          font-size: 0.78rem;
          text-decoration: none;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
        }
        .btn-open:hover {
          background: rgba(74, 222, 128, 0.25);
        }
        .btn-logout {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #aaa;
          padding: 8px 18px;
          font-size: 0.85rem;
        }
        .btn-logout:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        .user-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 18px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(74, 222, 128, 0.15);
          border-radius: 14px;
          margin-bottom: 14px;
        }
        .user-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .user-name {
          font-size: 1.15rem;
          font-weight: 800;
          color: #fff;
        }
        .user-id {
          font-size: 0.75rem;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          padding: 3px 9px;
          border-radius: 6px;
          letter-spacing: 1px;
          font-family: monospace;
          font-weight: 700;
        }
        .user-date {
          font-size: 0.72rem;
          color: #6ee7b7;
          opacity: 0.75;
        }
        .url-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 10px;
          padding: 10px 14px;
        }
        .url-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .url-label {
          font-size: 0.76rem;
          color: #cbd5e1;
          width: 90px;
          flex-shrink: 0;
          font-weight: 700;
        }
        .url-link {
          font-size: 0.82rem;
          color: #4ade80;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 380px;
          font-family: monospace;
        }
        .url-link:hover {
          text-decoration: underline;
        }
        .url-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }
        .empty-state {
          text-align: center;
          color: #8da498;
          padding: 36px;
          font-size: 0.95rem;
          line-height: 1.8;
        }
        .add-form {
          display: flex;
          gap: 12px;
        }
        .add-form input {
          flex: 1;
        }
        .error-msg {
          color: #f87171;
          font-size: 0.85rem;
          margin-top: 8px;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(6px);
        }
        .modal-box {
          background: linear-gradient(135deg, #132b27, #0b141a);
          border: 2px solid rgba(239, 68, 68, 0.4);
          border-radius: 20px;
          padding: 28px;
          max-width: 420px;
          width: 92%;
          text-align: center;
        }
        .modal-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #fca5a5;
          margin-bottom: 12px;
        }
        .modal-desc {
          font-size: 0.92rem;
          color: #cbd5e1;
          margin-bottom: 24px;
          line-height: 1.6;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
        }
        .btn-cancel {
          flex: 1;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #cbd5e1;
          padding: 12px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .toast {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10, 30, 24, 0.95);
          border: 1.5px solid rgba(74, 222, 128, 0.4);
          color: #4ade80;
          padding: 12px 26px;
          border-radius: 30px;
          font-size: 0.92rem;
          font-weight: 700;
          z-index: 2000;
          white-space: nowrap;
          backdrop-filter: blur(12px);
          animation: fadeIn 0.2s ease;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .login-wrap {
          max-width: 420px;
          margin: 80px auto;
        }
        .login-wrap h1 {
          text-align: center;
          margin-bottom: 6px;
        }
        .login-wrap .subtitle {
          text-align: center;
          margin-bottom: 28px;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        @media (max-width: 600px) {
          .url-link { max-width: 200px; }
          .add-form { flex-direction: column; }
          .url-actions { margin-left: 0; width: 100%; justify-content: flex-end; }
        }
      `}</style>

      {!authed ? (
        <div className="login-wrap">
          <h1>🏝️ 열칸 블록섬 관리자</h1>
          <div className="subtitle">사용자 접속 URL 관리 시스템</div>
          <div className="card">
            <form className="login-form" onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="관리자 비밀번호"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              {authError && <div className="error-msg">{authError}</div>}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={authLoading || !password}
              >
                {authLoading ? '확인 중...' : '🔓 로그인'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div className="header-row">
            <div>
              <h1>🏝️ 열칸 블록섬 관리자</h1>
              <div className="subtitle">사용자별 고유 링크를 만들고 공유하세요</div>
            </div>
            <button className="btn btn-logout" onClick={logout}>로그아웃</button>
          </div>

          {/* 새 사용자 추가 카드 */}
          <div className="card">
            <div className="section-title">➕ 새 사용자 추가</div>
            <form className="add-form" onSubmit={handleAdd}>
              <input
                type="text"
                placeholder="아이 이름 (예: 선율, 지우, 민준)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={20}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={addLoading || !newName.trim()}
              >
                {addLoading ? '추가 중...' : '추가하기'}
              </button>
            </form>
          </div>

          {/* 사용자 목록 카드 */}
          <div className="card">
            <div className="section-title">👥 등록된 사용자 ({users.length}명)</div>
            {loading ? (
              <div className="empty-state">사용자 목록을 불러오는 중...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                등록된 사용자가 없습니다.<br />위 입력창에서 아이 이름을 입력하고 추가해 보세요!
              </div>
            ) : (
              users.map(user => {
                const platformerUrl = `${origin}/${user.id}`;
                const islandUrl = `${origin}/${user.id}/island`;
                return (
                  <div key={user.id} className="user-row">
                    <div className="user-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="user-name">{user.name}</span>
                        <span className="user-id">{user.id}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="user-date">{formatDate(user.createdAt)}</span>
                        <button
                          className="btn btn-danger"
                          onClick={() => setDeleteConfirm(user)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <div className="url-box">
                      {/* 햇살 플랫포머 모험 (기본 접속) URL */}
                      <div className="url-row">
                        <span className="url-label" style={{ color: '#facc15' }}>☀️ 햇살 모험 <small style={{ fontSize: '0.68rem', color: '#4ade80' }}>(기본)</small></span>
                        <a
                          className="url-link"
                          href={platformerUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {platformerUrl}
                        </a>
                        <div className="url-actions">
                          <button
                            className="btn btn-copy"
                            onClick={() => copyText(platformerUrl)}
                          >
                            복사
                          </button>
                          <a
                            className="btn-open"
                            href={platformerUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            열기 ↗
                          </a>
                        </div>
                      </div>

                      {/* 열칸 블록섬 모험 URL */}
                      <div className="url-row">
                        <span className="url-label">🏝️ 열칸 블록섬</span>
                        <a
                          className="url-link"
                          href={islandUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {islandUrl}
                        </a>
                        <div className="url-actions">
                          <button
                            className="btn btn-copy"
                            onClick={() => copyText(islandUrl)}
                          >
                            복사
                          </button>
                          <a
                            className="btn-open"
                            href={islandUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            열기 ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🗑️ 사용자 삭제</div>
            <div className="modal-desc">
              <strong style={{ color: '#fff' }}>{deleteConfirm.name}</strong> ({deleteConfirm.id}) 사용자를<br />
              정말 삭제하시겠습니까?<br />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>삭제 후에는 해당 접속 링크가 비활성화됩니다.</span>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>
                취소
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 2, padding: '12px', fontSize: '0.95rem', borderRadius: '10px' }}
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)}
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
