import { todayStr, tomorrowStr } from './date';

// Smart task text parser for quick capture

export function parseQuickInput(rawText) {
  if (!rawText) return { text: '', priority: 'normal', dueDate: '', tags: [] };

  let text = rawText.trim();
  let priority = 'normal';
  const tags = [];
  let dueDate = '';


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

  // Quick date indicators: chỉ khớp khi là một từ riêng
  // (\b của JS không hiểu chữ có dấu, nên tự kiểm tra ký tự chữ/số hai bên)
  // để "email", "maiu" hay "Hôm nayy" không bị hiểu nhầm là ngày.
  if (/(?<![\p{L}\p{N}])(hôm nay|hom nay|today)(?![\p{L}\p{N}])/iu.test(text)) {
    dueDate = todayStr();
  } else if (/(?<![\p{L}\p{N}])(ngày mai|ngay mai|mai|tomorrow)(?![\p{L}\p{N}])/iu.test(text)) {
    dueDate = tomorrowStr();
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
