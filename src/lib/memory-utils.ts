/* Shared helpers for building/merging patient_memory from analysis data */

export function extractFirstParagraph(text: string, maxLen = 600): string {
  if (!text?.trim()) return '';
  const para = text.split(/\n\n/)[0].replace(/\*\*/g, '').trim();
  if (para.length <= maxLen) return para;
  const truncated = para.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

export function extractFirstSentence(text: string, maxLen = 400): string {
  if (!text?.trim()) return '';
  const clean = text.replace(/\*\*/g, '').trim();
  const match = clean.match(/[^.!?\n]+[.!?]/);
  const sentence = (match ? match[0] : clean).trim();
  if (sentence.length <= maxLen) return sentence;
  const truncated = sentence.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 60 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

export function appendUnique(existing: string[], incoming: string[]): string[] {
  const result = [...existing];
  for (const item of incoming) {
    const itemNorm = item.toLowerCase().trim();
    if (itemNorm.length < 5) continue;
    const prefix = itemNorm.slice(0, 50);
    const isDuplicate = result.some(e => {
      const eNorm = e.toLowerCase().trim();
      return eNorm === itemNorm || eNorm.startsWith(prefix) || itemNorm.startsWith(eNorm.slice(0, 50));
    });
    if (!isDuplicate) result.push(item);
  }
  return result;
}
