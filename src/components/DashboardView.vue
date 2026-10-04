<script setup>
import { computed } from 'vue';
import { navigate, state } from '../store.js';

const weeklyGoal = computed(() => state.stats.weeklyGoal ?? 68);
const stats = computed(() => [
  ['A', state.stats.learned, 'Từ đã ghi nhớ'],
  ['✓', state.stats.exercises, 'Bài đã hoàn thành'],
  ['◎', `${state.stats.accuracy}%`, 'Tỷ lệ chính xác'],
  ['↗', '+14%', 'So với tuần trước']
]);
const reviews = [
  ['at / on / in', 'Giới từ chỉ thời gian', 'Sai 3 lần'],
  ['resilient', 'Từ vựng học thuật', 'Đến hạn ôn'],
  ['Present Perfect', 'Phân biệt với Past Simple', '72% chính xác']
];

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
        <div class="week-row"><div v-for="(day, index) in ['T2','T3','T4','T5','T6','T7','CN']" :key="day" class="day" :class="{ done: index < 5, today: index === 4 }"><i>{{ index < 5 ? '✓' : index + 1 }}</i><span>{{ day }}</span></div></div>
        <p class="muted compact">Học thêm hôm nay để giữ chuỗi tuyệt vời này.</p>
      </article>
    </div>
    <div class="stats-grid"><article v-for="item in stats" :key="item[2]" class="card stat-card"><div class="stat-icon">{{ item[0] }}</div><div class="stat-copy"><strong>{{ item[1] }}</strong><span>{{ item[2] }}</span></div></article></div>
    <div class="dashboard-lower">
      <article class="card digest-card">
        <div class="card-heading"><div><span class="ai-badge">✦ AI Daily Review</span><h2>Nội dung nên ôn hôm nay</h2></div><span class="updated">Vừa cập nhật</span></div>
        <p>Dựa trên kết quả 7 ngày gần nhất, bạn đang nhầm nhiều ở <strong>giới từ chỉ thời gian</strong> và nhóm từ học thuật dưới đây.</p>
        <div class="review-list"><div v-for="(review, index) in reviews" :key="review[0]" class="review-item"><span class="review-icon">{{ index ? 'A' : '@' }}</span><div><strong>{{ review[0] }}</strong><small>{{ review[1] }}</small></div><em>{{ review[2] }}</em></div></div>
        <div class="action-row"><button class="btn btn-primary" @click="reviewNow">Ôn tập ngay · 8 phút</button><button class="btn btn-ghost" @click="navigate('grammar')">Xem lý thuyết</button></div>
      </article>
      <article class="card quick-card"><span class="section-kicker">Hành động nhanh</span><h2>Bạn có 5 phút?</h2><p class="muted">Một bài kiểm tra ngắn giúp kiến thức ở lại lâu hơn.</p><div class="quick-visual"><span>5</span><small>phút</small></div><button class="btn btn-dark full" @click="navigate('practice')">Bắt đầu kiểm tra nhanh</button></article>
    </div>
  </section>
</template>
