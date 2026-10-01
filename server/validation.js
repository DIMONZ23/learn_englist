export class HttpError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}

export function assertObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Dữ liệu gửi lên không hợp lệ.');
}

export function cleanText(value, field, max = 500, min = 1) {
  if (typeof value !== 'string') throw new HttpError(400, `${field} phải là chuỗi.`);
  const text = value.trim();
  if (text.length < min || text.length > max) throw new HttpError(400, `${field} phải có từ ${min} đến ${max} ký tự.`);
  return text;
}

export function cleanStatus(value) {
  if (!['new', 'review', 'known'].includes(value)) throw new HttpError(400, 'Trạng thái từ vựng không hợp lệ.');
  return value;
}

export function cleanInteger(value, field, min = 0, max = 1000) {
  if (!Number.isInteger(value) || value < min || value > max) throw new HttpError(400, `${field} không hợp lệ.`);
  return value;
}
