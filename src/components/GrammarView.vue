<script setup>
import { computed, ref, watch } from 'vue';
import { state } from '../store.js';

const answers = ref({});
const lessons = computed(() => state.grammar.flatMap((category) => category.lessons));
const lesson = computed(() => lessons.value.find((item) => item.id === state.currentLesson) || lessons.value[0]);

watch(() => state.currentLesson, () => { answers.value = {}; });
function chooseLesson(id) { state.currentLesson = id; }
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
        <div v-for="category in state.grammar" :key="category.category" class="grammar-category">
          <div class="category-label"><span>{{ category.icon }}</span>{{ category.category }}</div>
          <button v-for="item in category.lessons" :key="item.id" class="lesson-link" :class="{ active: item.id === state.currentLesson }" @click="chooseLesson(item.id)">{{ item.title }}<small>{{ item.level }}</small></button>
        </div>
      </aside>
      <article v-if="lesson" class="grammar-content">
        <section class="card lesson-hero"><span class="pill pill-indigo">{{ lesson.level }} · Bài học trọng tâm</span><h2>{{ lesson.title }}</h2><p>{{ lesson.summary }}</p><div class="formula"><span v-for="part in lesson.formula" :key="part.t" :class="`f-${part.c}`">{{ part.t }}</span></div></section>
        <section class="card lesson-block"><h3>💡 Mẹo ghi nhớ nhanh</h3><div class="memory-hack"><span>🧠</span><div><strong>Câu thần chú của Lio</strong><p>{{ lesson.mnemonic }}</p></div></div></section>
        <section class="card lesson-block"><h3>Đúng hay sai? Nhìn là hiểu</h3><div v-for="example in lesson.examples" :key="example.good" class="comparison"><div class="example-box good"><span class="example-label">✓ ĐÚNG</span><p>{{ example.good }}</p><small>Cấu trúc tự nhiên và chính xác.</small></div><div class="example-box bad"><span class="example-label">× SAI</span><p>{{ example.bad }}</p><small>{{ example.note }}</small></div></div></section>
        <section class="card lesson-block"><h3>Mini Quiz · Kiểm tra ngay</h3><div class="mini-quiz-list"><div v-for="(question, questionIndex) in lesson.quiz" :key="question.q" class="mini-question"><p>{{ questionIndex + 1 }}. {{ question.q }}</p><div class="mini-options"><button v-for="(option, optionIndex) in question.options" :key="option" class="mini-option" :class="answerClass(questionIndex, optionIndex, question.answer)" :disabled="answers[questionIndex] !== undefined" @click="answers[questionIndex] = optionIndex">{{ String.fromCharCode(65 + optionIndex) }}. {{ option }}</button></div></div></div></section>
      </article>
    </div>
  </section>
</template>
