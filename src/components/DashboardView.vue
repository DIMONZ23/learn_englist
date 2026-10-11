<script setup>
import { computed } from 'vue';
import { navigate, state } from '../store.js';

const weeklyGoal = computed(() => state.stats.weeklyGoal ?? 68);
const stats = computed(() => [
  ['A', state.stats.learned, 'Từ đã ghi nhớ'],
  ['✓', state.stats.exercises, 'Bài đã hoàn thành'],
  ['◎', `${state.stats.accuracy}%`, 'Tỷ lệ chính xác'],
  ['↗', `${state.stats.weeklyChange >= 0 ? '+' : ''}${state.stats.weeklyChange}%`, 'So với tuần trước']
]);
const weakness = computed(() => state.dashboard.reviews[0]?.subtitle || 'các nội dung đến hạn ôn');
const weekDays = computed(() => {
  const activity = new Map(state.dashboard.weekActivity.map((item) => [item.date, item]));
  return Array.from({ length:7 }, (_, index) => {
    const date = new Date();
    date.setHours(12,0,0,0);
    date.setDate(date.getDate() - 6 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return { key, label:['CN','T2','T3','T4','T5','T6','T7'][date.getDay()], done:activity.has(key), today:index===6 };
  });
});
function reviewNow() {
  const index = state.vocabulary.findIndex((word) => word.status === 'review');
  state.cardIndex = Math.max(0, index);
  navigate('vocabulary');
}
</script>

<template>
  <section class="view active">
    <div class="dashboard-grid">
      <article class="card progress-hero">
        <div class="progress-copy">
          <span class="pill pill-cyan">Mục tiêu tuần</span>
          <h2>Tiến bộ đều đặn,<br>tự tin mỗi ngày.</h2>
          <p>Bạn đã hoàn thành <strong>{{ weeklyGoal }}%</strong> mục tiêu tuần này. Tiếp tục duy trì nhịp học nhé!</p>
          <button class="btn btn-primary" @click="navigate('vocabulary')">Tiếp tục học <span>›</span></button>
        </div>
        <div class="progress-ring" :style="{ '--progress': weeklyGoal }" :aria-label="`Tiến độ ${weeklyGoal} phần trăm`"><div><strong>{{ weeklyGoal }}%</strong><span>tuần này</span></div></div>
      </article>
      <article class="card streak-card">
        <div class="card-heading"><div><span class="section-kicker">Chuỗi học</span><h3>{{ state.stats.streak }} ngày liên tiếp</h3></div><div class="fire">🔥</div></div>
        <div class="week-row"><div v-for="day in weekDays" :key="day.key" class="day" :class="{ done: day.done, today: day.today }"><i>{{ day.done ? '✓' : '·' }}</i><span>{{ day.label }}</span></div></div>
        <p class="muted compact">Học thêm hôm nay để giữ chuỗi tuyệt vời này.</p>
      </article>
    </div>
    <div class="stats-grid"><article v-for="item in stats" :key="item[2]" class="card stat-card"><div class="stat-icon">{{ item[0] }}</div><div class="stat-copy"><strong>{{ item[1] }}</strong><span>{{ item[2] }}</span></div></article></div>
    <div class="dashboard-lower">
      <article class="card digest-card">
        <div class="card-heading"><div><span class="ai-badge">✦ AI Daily Review</span><h2>Nội dung nên ôn hôm nay</h2></div><span class="updated">Vừa cập nhật</span></div>
        <p>Dựa trên kết quả 7 ngày gần nhất, bạn nên tập trung vào <strong>{{ weakness }}</strong> và các nội dung dưới đây.</p>
        <div class="review-list"><div v-for="review in state.dashboard.reviews" :key="review.title" class="review-item"><span class="review-icon">{{ review.icon }}</span><div><strong>{{ review.title }}</strong><small>{{ review.subtitle }}</small></div><em>{{ review.badge }}</em></div></div>
        <div class="action-row"><button class="btn btn-primary" @click="reviewNow">Ôn tập ngay · 8 phút</button><button class="btn btn-ghost" @click="navigate('grammar')">Xem lý thuyết</button></div>
      </article>
      <article class="card quick-card"><span class="section-kicker">Hành động nhanh</span><h2>Bạn có 5 phút?</h2><p class="muted">Một bài kiểm tra ngắn giúp kiến thức ở lại lâu hơn.</p><div class="quick-visual"><span>5</span><small>phút</small></div><button class="btn btn-dark full" @click="navigate('practice')">Bắt đầu kiểm tra nhanh</button></article>
    </div>
  </section>
</template>
