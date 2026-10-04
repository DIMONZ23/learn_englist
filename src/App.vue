<script setup>
import { computed, onMounted } from 'vue';
import AppSidebar from './components/AppSidebar.vue';
import DashboardView from './components/DashboardView.vue';
import GrammarView from './components/GrammarView.vue';
import PracticeView from './components/PracticeView.vue';
import VocabularyView from './components/VocabularyView.vue';
import { bootstrap, initials, state } from './store.js';

const pageMeta = {
  dashboard: ['Tổng quan hôm nay', 'Chào buổi sáng, Minh!'],
  vocabulary: ['Học từ vựng thông minh', 'Xây vốn từ vững chắc'],
  grammar: ['Ngữ pháp trực quan', 'Hiểu bản chất, nhớ thật lâu'],
  practice: ['Luyện tập cá nhân hóa', 'Thử thách kiến thức của bạn']
};
const currentMeta = computed(() => pageMeta[state.activeView] || pageMeta.dashboard);

onMounted(bootstrap);
</script>

<template>
  <a class="skip-link" href="#main-content">Bỏ qua đến nội dung</a>
  <div class="app-shell">
    <main id="main-content" class="main-content">
      <header class="topbar">
        <div><p class="eyebrow">{{ currentMeta[0] }}</p><h1>{{ currentMeta[1] }} <span v-if="state.activeView === 'dashboard'">👋</span></h1></div>
        <div class="topbar-actions">
          <button class="icon-btn" aria-label="Chuyển giao diện sáng tối" title="Đổi giao diện" @click="state.theme = state.theme === 'dark' ? 'light' : 'dark'"><span class="sun-icon">☀</span><span class="moon-icon">☾</span></button>
          <button class="profile-chip" aria-label="Hồ sơ người học"><span class="avatar">{{ initials }}</span><span class="profile-copy"><strong>{{ state.profile.name }}</strong><small>Intermediate · {{ state.profile.level }}</small></span></button>
        </div>
      </header>

      <DashboardView v-if="state.activeView === 'dashboard'" />
      <VocabularyView v-else-if="state.activeView === 'vocabulary'" />
      <GrammarView v-else-if="state.activeView === 'grammar'" />
      <PracticeView v-else />
    </main>

    <AppSidebar />
    <button class="mobile-nav-toggle" aria-label="Mở menu" :aria-expanded="state.mobileNavOpen" @click="state.mobileNavOpen = !state.mobileNavOpen">☰</button>
    <div class="toast" :class="{ show: state.toast }" role="status" aria-live="polite">{{ state.toast }}</div>
  </div>
</template>
