import fs from 'fs';
import path from 'path';
import { getUser } from '../../lib/stateManager';
import { personalizeHtml } from '../../lib/koreanHelper';

export default function UserIslandPage() {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
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
    const filePath = path.join(process.cwd(), 'public/index.html');
    let html = fs.readFileSync(filePath, 'utf8');

    html = personalizeHtml(html, user.name);

    // Inject user context before </head>
    const userScript = `
<script>
  window.__BLOCK_USER__ = { id: ${JSON.stringify(user.id)}, name: ${JSON.stringify(user.name)} };
</script>
`;
    html = html.replace('</head>', `${userScript}</head>`);

    // Fix relative assets to absolute path
    html = html.replace(/href="style\.css([^"]*)"/g, 'href="/style.css$1"');
    html = html.replace(/src="game\.js([^"]*)"/g, 'src="/game.js$1"');

    // Link to platformer game
    html = html.replace(/href="platformer\/"/g, `href="/${user.id}/platformer"`);
    html = html.replace(/href="platformer"/g, `href="/${user.id}/platformer"`);
    html = html.replace(/☀ 햇살 모험/g, '🏃 크래프트 Runner');
    html = html.replace(/☀ 점프하며 좀비를 잡는 햇살 모험 →/g, '🏃 크래프트 Runner 모험하기 →');

    // Brand link back to Lobby (처음으로 가기)
    html = html.replace(/<a class="brand" href="\.\/"[^>]*>/g, `<a class="brand" href="/${user.id}" aria-label="처음으로 가기" title="처음으로 가기">`);
    html = html.replace(/<a class="brand" href="\.\/">/g, `<a class="brand" href="/${user.id}" aria-label="처음으로 가기" title="처음으로 가기">`);
    html = html.replace(/<span>열칸 블록섬/g, '<span>처음으로 가기');
    html = html.replace(/<span class="brand-icon">▦<\/span>/g, '<span class="brand-icon">🏠</span>');
    html = html.replace(/href="\.\/"/g, `href="/${user.id}/island"`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.write(html);
    res.end();
  } catch (e) {
    console.error('Failed to render island page:', e);
    return { notFound: true };
  }

  return { props: {} };
}
