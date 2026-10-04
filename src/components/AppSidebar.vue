<script setup>
import { navigate, reloadData, reviewCount, state } from '../store.js';

const items = [
  { id: 'dashboard', icon: '⌂', label: 'Tổng quan' },
  { id: 'vocabulary', icon: 'A', label: 'Từ vựng' },
  { id: 'grammar', icon: '◇', label: 'Ngữ pháp' },
  { id: 'practice', icon: '✓', label: 'Luyện tập' }
];
</script>

<template>
  <aside id="sidebar" class="sidebar" :class="{ open: state.mobileNavOpen }">
    <div class="brand"><div class="brand-mark">L</div><div><strong>LingoFlow</strong><span>Learn with clarity</span></div></div>
    <nav aria-label="Điều hướng chính">
      <button v-for="item in items" :key="item.id" class="nav-item" :class="{ active: state.activeView === item.id }" @click="navigate(item.id)">
        <span class="nav-icon">{{ item.icon }}</span><span>{{ item.label }}</span>
        <em v-if="item.id === 'vocabulary'">{{ reviewCount }}</em>
      </button>
    </nav>
    <div class="sidebar-goal"><div class="goal-icon">⚡</div><div><span>Mục tiêu hôm nay</span><strong>18 / 25 phút</strong></div><div class="goal-bar"><i style="width:72%"></i></div></div>
    <div class="sidebar-footer">
      <button @click="reloadData">↻ <span>Tải lại dữ liệu</span></button>
      <small :class="state.online ? 'online' : 'offline'">{{ state.syncing ? 'Đang kết nối máy chủ…' : state.online ? '● PostgreSQL đã đồng bộ' : '● Chế độ offline' }}</small>
    </div>
  </aside>
</template>
