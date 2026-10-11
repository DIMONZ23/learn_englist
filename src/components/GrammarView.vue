<script setup>
import { computed, ref, watch } from 'vue';
import { state } from '../store.js';

const answers = ref({});
const searchQuery = ref('');
const lessons = computed(() => state.grammar.flatMap((category) => category.lessons));
const lesson = computed(() => lessons.value.find((item) => item.id === state.currentLesson) || lessons.value[0]);
const visibleCategories = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('vi');
  if (!query) return state.grammar;
  return state.grammar
    .map((category) => ({
      ...category,
      lessons: category.lessons.filter((item) =>
        `${item.title} ${item.level} ${category.category}`.toLocaleLowerCase('vi').includes(query)
      )
    }))
    .filter((category) => category.lessons.length);
});

watch(() => state.currentLesson, () => { answers.value = {}; });
function chooseLesson(id) {
  state.currentLesson = id;
  if (window.innerWidth <= 760) window.scrollTo({ top: 0, behavior: 'smooth' });
}
function answerClass(questionIndex, optionIndex, correct) {
  if (answers.value[questionIndex] === undefined) return '';
  if (optionIndex === correct) return 'correct';
  return answers.value[questionIndex] === optionIndex ? 'wrong' : '';
}
</script>

<template>
  <section class="view active">
    <div class="grammar-layout">
      <aside class="card grammar-nav">
        <span class="section-kicker">Thư viện kiến thức</span><h2>Ngữ pháp</h2>
        <p class="curriculum-count">{{ lessons.length }} bài học · Từ nền tảng đến TOEIC</p>
        <label class="grammar-search">
          <span>⌕</span>
          <input v-model="searchQuery" type="search" placeholder="Tìm thì, từ loại, mệnh đề...">
        </label>
        <div v-for="category in visibleCategories" :key="category.category" class="grammar-category">
          <div class="category-label"><span>{{ category.icon }}</span>{{ category.category }}</div>
          <button v-for="item in category.lessons" :key="item.id" class="lesson-link" :class="{ active: item.id === state.currentLesson }" @click="chooseLesson(item.id)">{{ item.title }}<small>{{ item.level }}</small></button>
        </div>
        <p v-if="!visibleCategories.length" class="grammar-empty">Không tìm thấy bài học phù hợp.</p>
      </aside>
      <article v-if="lesson" class="grammar-content">
        <section class="card lesson-hero"><span class="pill pill-indigo">{{ lesson.level }} · Bài học trọng tâm</span><h2>{{ lesson.title }}</h2><p>{{ lesson.summary || lesson.definition }}</p><div v-if="lesson.formula?.length" class="formula"><span v-for="part in lesson.formula" :key="part.t" :class="`f-${part.c}`">{{ part.t }}</span></div></section>
        <section class="card lesson-block">
          <h3>1. Định nghĩa & vai trò</h3>
          <div class="lesson-grid">
            <div class="lesson-info"><span>Định nghĩa</span><p>{{ lesson.definition || lesson.summary }}</p></div>
            <div class="lesson-info"><span>Vai trò</span><p>{{ lesson.role || 'Giúp xây dựng câu tiếng Anh chính xác và tự nhiên.' }}</p></div>
          </div>
        </section>
        <section v-if="lesson.positions?.length || lesson.recognition?.length" class="card lesson-block">
          <h3>2. Vị trí & dấu hiệu nhận biết</h3>
          <div class="lesson-columns">
            <div v-if="lesson.positions?.length"><h4>Vị trí trong câu</h4><ul class="lesson-list"><li v-for="item in lesson.positions" :key="item">{{ item }}</li></ul></div>
            <div v-if="lesson.recognition?.length"><h4>Dấu hiệu nhận biết</h4><ul class="lesson-list"><li v-for="item in lesson.recognition" :key="item">{{ item }}</li></ul></div>
          </div>
        </section>
        <section v-if="lesson.rules?.length || lesson.exceptions?.length" class="card lesson-block">
          <h3>3. Quy tắc sử dụng & ngoại lệ</h3>
          <div class="lesson-columns">
            <div v-if="lesson.rules?.length"><h4>Quy tắc</h4><ul class="lesson-list"><li v-for="item in lesson.rules" :key="item">{{ item }}</li></ul></div>
            <div v-if="lesson.exceptions?.length"><h4>Ngoại lệ cần nhớ</h4><ul class="lesson-list exception-list"><li v-for="item in lesson.exceptions" :key="item">{{ item }}</li></ul></div>
          </div>
        </section>
        <section v-if="lesson.examplesTranslated?.length" class="card lesson-block">
          <h3>4. Ví dụ có bản dịch</h3>
          <div class="translated-examples"><div v-for="example in lesson.examplesTranslated" :key="example.en" class="translated-example"><strong>{{ example.en }}</strong><span>{{ example.vi }}</span></div></div>
        </section>
        <section class="card lesson-block"><h3>💡 Mẹo ghi nhớ nhanh</h3><div class="memory-hack"><span>🧠</span><div><strong>Câu thần chú của Lio</strong><p>{{ lesson.mnemonic }}</p></div></div></section>
        <section v-if="lesson.examples?.length" class="card lesson-block"><h3>5. Đúng hay sai? Nhìn là hiểu</h3><div v-for="example in lesson.examples" :key="example.good" class="comparison"><div class="example-box good"><span class="example-label">✓ ĐÚNG</span><p>{{ example.good }}</p><small>Cấu trúc tự nhiên và chính xác.</small></div><div class="example-box bad"><span class="example-label">× SAI</span><p>{{ example.bad }}</p><small>{{ example.note }}</small></div></div></section>
        <section v-if="lesson.commonMistakes?.length || lesson.comparisons?.length" class="card lesson-block">
          <h3>6. Lỗi thường gặp & phân biệt dễ nhầm</h3>
          <div class="lesson-columns">
            <div v-if="lesson.commonMistakes?.length"><h4>Lỗi người Việt thường mắc</h4><ul class="mistake-list"><li v-for="item in lesson.commonMistakes" :key="item">{{ item }}</li></ul></div>
            <div v-if="lesson.comparisons?.length"><h4>Phân biệt nhanh</h4><ul class="comparison-notes"><li v-for="item in lesson.comparisons" :key="item">{{ item }}</li></ul></div>
          </div>
        </section>
        <section v-if="lesson.summaryPoints?.length" class="card lesson-block"><h3>7. Tóm tắt bài học</h3><ul class="summary-list"><li v-for="item in lesson.summaryPoints" :key="item">{{ item }}</li></ul></section>
        <section v-if="lesson.quiz?.length" class="card lesson-block"><h3>8. Mini Quiz · Kiểm tra ngay</h3><div class="mini-quiz-list"><div v-for="(question, questionIndex) in lesson.quiz" :key="question.q" class="mini-question"><p>{{ questionIndex + 1 }}. {{ question.q }}</p><div class="mini-options"><button v-for="(option, optionIndex) in question.options" :key="option" class="mini-option" :class="answerClass(questionIndex, optionIndex, question.answer)" :disabled="answers[questionIndex] !== undefined" @click="answers[questionIndex] = optionIndex">{{ String.fromCharCode(65 + optionIndex) }}. {{ option }}</button></div><p v-if="answers[questionIndex] !== undefined" class="quiz-explanation"><strong>{{ answers[questionIndex] === question.answer ? 'Chính xác!' : 'Chưa đúng.' }}</strong> {{ question.explanation || question.note || 'Hãy xem lại quy tắc phía trên.' }}</p></div></div></section>
      </article>
    </div>
  </section>
</template>
