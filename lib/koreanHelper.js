export function hasFinalConsonant(word) {
  if (!word || typeof word !== 'string') return false;
  const lastChar = word.charCodeAt(word.length - 1);
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) return false;
  return (lastChar - 0xAC00) % 28 > 0;
}

export function personalizeHtml(html, childName) {
  if (!childName) return html;

  const hasBatchim = hasFinalConsonant(childName);
  const vocative = hasBatchim ? `${childName}아` : `${childName}야`;
  const subject = hasBatchim ? `${childName}이가` : `${childName}가`;
  const topic = hasBatchim ? `${childName}이는` : `${childName}는`;
  const object = hasBatchim ? `${childName}이를` : `${childName}를`;
  const possessive = hasBatchim ? `${childName}이의` : `${childName}의`;

  let personalized = html
    .replace(/선율이의/g, possessive)
    .replace(/선율아/g, vocative)
    .replace(/선율이가/g, subject)
    .replace(/선율이는/g, topic)
    .replace(/선율이를/g, object)
    .replace(/선율이/g, hasBatchim ? `${childName}이` : childName)
    .replace(/SEONYUL’S/gi, `${childName.toUpperCase()}’S`)
    .replace(/선율/g, childName);

  return personalized;
}
