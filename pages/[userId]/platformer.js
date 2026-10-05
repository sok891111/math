import fs from 'fs';
import path from 'path';
import { getUser } from '../../lib/stateManager';
import { personalizeHtml } from '../../lib/koreanHelper';

export default function UserPlatformerGamePage() {
  return null;
}

export async function getServerSideProps({ params, res }) {
  const { userId } = params;
  if (!/^[A-Za-z0-9]{4,10}$/.test(userId)) {
    return { notFound: true };
  }

  const user = await getUser(userId);
  if (!user) {
    return { notFound: true };
  }

  try {
    const filePath = path.join(process.cwd(), 'public/platformer/index.html');
    let html = fs.readFileSync(filePath, 'utf8');

    html = personalizeHtml(html, user.name);

    // Inject user context before </head>
    const userScript = `
<script>
  window.__BLOCK_USER__ = { id: ${JSON.stringify(user.id)}, name: ${JSON.stringify(user.name)} };
</script>
`;
    html = html.replace('</head>', `${userScript}</head>`);

    // Fix relative assets to absolute /platformer/ path
    html = html.replace(/href="style\.css([^"]*)"/g, 'href="/platformer/style.css$1"');
    html = html.replace(/src="([a-zA-Z0-9_-]+\.js[^"]*)"/g, 'src="/platformer/$1"');

    // Link back to user lobby and island
    html = html.replace(/<a class="brand" href="\.\.\/">/g, `<a class="brand" href="/${user.id}" title="게임 선택 로비로 가기">`);
    html = html.replace(/<a href="\.\.\/">원래 블록섬으로 돌아가기 ↗<\/a>/g, `<a href="/${user.id}">🎮 게임 선택 로비로 나가기 ↗</a> <span style="margin: 0 8px; opacity: 0.4">|</span> <a href="/${user.id}/island">🏝️ 열칸 블록섬으로 이동 ↗</a>`);
    html = html.replace(/href="\.\.\/"/g, `href="/${user.id}"`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.write(html);
    res.end();
  } catch (e) {
    console.error('Failed to render platformer page:', e);
    return { notFound: true };
  }

  return { props: {} };
}
