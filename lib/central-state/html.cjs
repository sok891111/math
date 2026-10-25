function centralStateHTML(html, userId) {
  if (!userId) return html;
  // Context and import maps stay in place; game scripts wait for migration/hydration.
  html = html.replace(/<script\b([^>]*?)\bsrc="([^"]+)"([^>]*)>/gi, (_, before, src, after) => {
    const attributes = before + after;
    const type = /\btype="([^"]+)"/i.exec(attributes)?.[1] || '';
    return `<script type="application/x-block-pending" data-central-src="${src}" data-central-type="${type}">`;
  });
  const id = JSON.stringify(userId).replace(/</g, '\\u003c');
  return html.replace('</body>', `<script src="/central-state-keys.js?v=1"></script><script src="/central-state.js?v=1"></script><script>window.BlockCentralState.boot(${id});</script></body>`);
}
module.exports = {centralStateHTML};
