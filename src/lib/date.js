// Ngày theo giờ máy (giờ Việt Nam), dạng YYYY-MM-DD.
// Không dùng toISOString() vì nó trả về ngày UTC: từ 0h đến 7h sáng sẽ bị lùi một ngày.
export function toLocalDateStr(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayStr() {
  return toLocalDateStr(new Date());
}

export function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toLocalDateStr(d);
}
