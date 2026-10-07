// Smart task text parser for quick capture

export function parseQuickInput(rawText) {
  if (!rawText) return { text: '', priority: 'normal', dueDate: '', tags: [] };

  let text = rawText.trim();
  let priority = 'normal';
  const tags = [];
  let dueDate = '';

  const today = new Date();
  const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Priority flags
  if (/(!gap|!khancap|!urgent|!1)\b/i.test(text)) {
    priority = 'urgent';
    text = text.replace(/(!gap|!khancap|!urgent|!1)\b/gi, '').trim();
  } else if (/(!qt|!quantrong|!high|!2)\b/i.test(text)) {
    priority = 'high';
    text = text.replace(/(!qt|!quantrong|!high|!2)\b/gi, '').trim();
  } else if (/(!bt|!binhthuong|!normal|!3)\b/i.test(text)) {
    priority = 'normal';
    text = text.replace(/(!bt|!binhthuong|!normal|!3)\b/gi, '').trim();
  }

  // Tags (#tag)
  const tagMatches = text.match(/#([\p{L}\w_-]+)/gu);
  if (tagMatches) {
    tagMatches.forEach((t) => {
      tags.push(t.substring(1));
    });
    text = text.replace(/#([\p{L}\w_-]+)/gu, '').trim();
  }

  // Quick date indicators
  if (/(hôm nay|hom nay|today)/i.test(text)) {
    dueDate = formatYMD(today);
  } else if (/(ngày mai|ngay mai|mai|tomorrow)/i.test(text)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = formatYMD(tomorrow);
  }

  // Clean double spaces
  text = text.replace(/\s+/g, ' ').trim();

  return {
    text,
    priority,
    tags,
    dueDate
  };
}
