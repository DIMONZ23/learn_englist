import { computed, reactive, watch } from 'vue';
import { appData } from './data.js';
import { api } from './api.js';

const STORAGE_KEY = 'lingoflow-vue-state-v2';
const defaults = {
  theme: 'light', activeView: 'dashboard', cardIndex: 0,
  currentLesson: 'present-perfect', practiceTopic: 'Thì động từ', questionIndex: 0
};

function savedPreferences() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { ...defaults }; }
}

export const state = reactive({
  ...savedPreferences(),
  profile: { name: 'Minh Nguyễn', level: 'B1' },
  stats: { streak: 12, learned: 184, exercises: 36, accuracy: 87, weeklyGoal: 68 },
  vocabulary: structuredClone(appData.vocabulary),
  grammar: structuredClone(appData.grammar),
  practice: structuredClone(appData.practice),
  online: false,
  syncing: true,
  mobileNavOpen: false,
  toast: ''
});

let toastTimer;
export const reviewCount = computed(() => state.vocabulary.filter((word) => word.status === 'review').length);
export const initials = computed(() => state.profile.name.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase());

watch(
  () => [state.theme, state.activeView, state.cardIndex, state.currentLesson, state.practiceTopic, state.questionIndex],
  () => localStorage.setItem(STORAGE_KEY, JSON.stringify({
    theme: state.theme, activeView: state.activeView, cardIndex: state.cardIndex,
    currentLesson: state.currentLesson, practiceTopic: state.practiceTopic, questionIndex: state.questionIndex
  })),
  { deep: true }
);
watch(() => state.theme, (theme) => { document.documentElement.dataset.theme = theme; }, { immediate: true });

export function showToast(message) {
  state.toast = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { state.toast = ''; }, 2600);
}

export function navigate(view) {
  state.activeView = view;
  state.mobileNavOpen = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function bootstrap() {
  state.syncing = true;
  try {
    const payload = await api.bootstrap();
    state.profile = payload.profile;
    state.stats = payload.stats;
    state.vocabulary = payload.vocabulary;
    if (payload.grammar?.length) state.grammar = payload.grammar;
    if (payload.practice && Object.keys(payload.practice).length) state.practice = payload.practice;
    if (!state.practice[state.practiceTopic]) state.practiceTopic = Object.keys(state.practice)[0];
    state.online = true;
  } catch (error) {
    console.warn('[bootstrap] Chế độ offline:', error.message);
    state.online = false;
  } finally {
    state.syncing = false;
  }
}

export async function reloadData() {
  localStorage.removeItem(STORAGE_KEY);
  await bootstrap();
  navigate('dashboard');
  showToast(state.online ? 'Đã tải lại dữ liệu từ PostgreSQL.' : 'Đang dùng dữ liệu demo offline.');
}
