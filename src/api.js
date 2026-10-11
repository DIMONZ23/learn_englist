// REST client dùng chung cho các Vue component.
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`/api${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(body.error?.message || `Yêu cầu thất bại (${response.status})`, response.status, body.error?.details);
    }
    return response.status === 204 ? null : response.json();
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('Máy chủ phản hồi quá lâu.', 408);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () => request('/health'),
  bootstrap: () => request('/bootstrap'),
  lookup: (term) => request('/dictionary', { method: 'POST', body: JSON.stringify({ term }) }),
  addVocabulary: (word) => request('/vocabulary', { method: 'POST', body: JSON.stringify(word) }),
  updateVocabularyStatus: (id, status) => request(`/vocabulary/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteVocabulary: (id) => request(`/vocabulary/${id}`, { method: 'DELETE' }),
  submitAttempt: (questionId, selectedIndex) => request('/practice/attempts', { method: 'POST', body: JSON.stringify({ questionId, selectedIndex }) }),
  askTutor: (questionId, message) => request('/tutor', { method: 'POST', body: JSON.stringify({ questionId, message }) }),
  getToeicTests: () => request('/toeic/tests'),
  startToeicSession: (payload) => request('/toeic/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  getToeicSession: (id) => request(`/toeic/sessions/${id}`),
  saveToeicProgress: (id, payload) => request(`/toeic/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  submitToeicSession: (id) => request(`/toeic/sessions/${id}/submit`, { method: 'POST', body: '{}' }),
  reviewToeicSession: (id) => request(`/toeic/sessions/${id}/review`),
  getToeicVocabularyStats: () => request('/toeic/vocabulary/stats'),
  getToeicVocabularyMeta: () => request('/toeic/vocabulary/meta'),
  getToeicVocabulary: (params = {}) => request(`/toeic/vocabulary?${new URLSearchParams(params)}`),
  getToeicVocabularyDetail: (id) => request(`/toeic/vocabulary/${id}`),
  updateToeicVocabulary: (id, payload) => request(`/toeic/vocabulary/${id}/progress`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getToeicVocabularyQuiz: (limit = 10) => request(`/toeic/vocabulary-quiz?limit=${limit}`)
};
