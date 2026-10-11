<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { api } from '../api.js';
import { showToast, state } from '../store.js';
import ToeicModule from './ToeicModule.vue';

const labMode = ref('quick');
const selectedIndex = ref(null);
const result = ref(null);
const correctCount = ref(0);
const chatInput = ref('');
const chatBox = ref(null);
const messages = ref([{ role: 'ai', text: 'Chào bạn! Nếu có chỗ nào chưa rõ, hãy hỏi mình. Mình sẽ giải thích theo cách đơn giản nhất nhé.' }]);
const tutorThinking = ref(false);

const topics = computed(() => Object.keys(state.practice));
const questions = computed(() => state.practice[state.practiceTopic] || []);
const question = computed(() => questions.value[state.questionIndex] || questions.value[0]);
const total = computed(() => questions.value.length);
const progress = computed(() => total.value ? ((state.questionIndex + 1) / total.value) * 100 : 0);

watch(() => state.practiceTopic, resetQuestion);
watch(() => state.questionIndex, resetQuestion);
function resetQuestion() { selectedIndex.value = null; result.value = null; }
function chooseTopic(topic) {
  state.practiceTopic = topic;
  state.questionIndex = 0;
  correctCount.value = 0;
}
function optionClass(index) {
  if (!result.value) return '';
  if (index === result.value.correctIndex) return 'correct';
  return index === selectedIndex.value ? 'wrong' : '';
}
async function answer(index) {
  if (result.value || !question.value) return;
  selectedIndex.value = index;
  try {
    const response = state.online && question.value.id
      ? await api.submitAttempt(question.value.id, index)
      : { correct: index === question.value.answer, correctIndex: question.value.answer, explanation: question.value.explanation, traps: question.value.traps };
    result.value = response;
    if (response.correct) { correctCount.value += 1; showToast('Chính xác! Tuyệt vời 🎉'); }
    else showToast('Chưa đúng — xem giải thích bên dưới nhé.');
    if (response.stats) state.stats = response.stats;
    if (response.dashboard) state.dashboard = response.dashboard;
    else state.stats.exercises += 1;
  } catch (error) {
    selectedIndex.value = null;
    showToast(error.message);
  }
}
function nextQuestion() {
  if (!result.value) return;
  if (state.questionIndex === total.value - 1) {
    const percent = Math.round((correctCount.value / total.value) * 100);
    showToast(`Hoàn thành: ${correctCount.value}/${total.value} câu đúng (${percent}%).`);
    state.questionIndex = 0;
    correctCount.value = 0;
  } else state.questionIndex += 1;
}
async function scrollChat() {
  await nextTick();
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
}
function focusTutor() {
  messages.value.push({ role: 'ai', text: `Bạn đang hỏi về câu “${question.value.q}”. Chỗ nào làm bạn phân vân nhất?` });
  scrollChat();
}
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || tutorThinking.value) return;
  messages.value.push({ role: 'user', text });
  chatInput.value = '';
  tutorThinking.value = true;
  await scrollChat();
  try {
    let answerText;
    if (state.online && question.value.id) answerText = (await api.askTutor(question.value.id, text)).answer;
    else {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const correct = question.value.options[question.value.answer];
      answerText = text.toLowerCase().includes('đơn giản')
        ? `Hiểu ngắn gọn thế này: “${correct}” khớp cả nghĩa lẫn cấu trúc. Hãy tìm dấu hiệu thời gian hoặc loại từ trước khi chọn.`
        : `Đáp án đúng là “${correct}”. ${question.value.explanation}`;
    }
    messages.value.push({ role: 'ai', text: answerText });
  } catch (error) { messages.value.push({ role: 'ai', text: `Mình chưa thể trả lời lúc này: ${error.message}` }); }
  finally { tutorThinking.value = false; scrollChat(); }
}
</script>

<template>
  <section class="view active">
    <div class="practice-mode-switch"><button :class="{active:labMode==='quick'}" @click="labMode='quick'">⚡ Luyện tập nhanh</button><button :class="{active:labMode==='toeic'}" @click="labMode='toeic'">🎧 TOEIC Listening & Reading</button></div>
    <ToeicModule v-if="labMode==='toeic'" @back="labMode='quick'" />
    <div v-else>
    <div class="practice-hero card"><div><span class="pill pill-cyan">Practice Lab</span><h2>Luyện đúng điểm yếu,<br>tiến bộ đúng trọng tâm.</h2><p>Chọn chủ đề, làm bài và nhận giải thích chi tiết ngay lập tức.</p></div><div class="score-orbit"><span>🏆</span><strong>{{ state.dashboard.bestScore }}</strong><small>điểm cao nhất</small></div></div>
    <div class="topic-chips"><button v-for="topic in topics" :key="topic" class="topic-chip" :class="{ active: topic === state.practiceTopic }" @click="chooseTopic(topic)">{{ topic }}</button></div>
    <div class="practice-layout">
      <article class="card quiz-panel">
        <div class="quiz-top"><span>Câu {{ state.questionIndex + 1 }} / {{ total }}</span><div class="mini-progress"><i :style="{ width: `${progress}%` }"></i></div><span>{{ state.practiceTopic }}</span></div>
        <div v-if="question" class="practice-q"><span class="q-number">Chọn đáp án đúng</span><h3>{{ question.q }}</h3><div class="practice-options"><button v-for="(option, index) in question.options" :key="option" class="practice-option" :class="optionClass(index)" :disabled="Boolean(result)" @click="answer(index)"><b>{{ String.fromCharCode(65 + index) }}</b><span>{{ option }}</span></button></div><div v-if="result" class="explanation"><strong>✦ AI giải thích</strong><p>{{ result.explanation }}</p><ul v-if="result.traps?.length"><li v-for="trap in result.traps" :key="trap">{{ trap }}</li></ul></div></div>
        <div class="quiz-footer"><button class="btn btn-ghost" @click="focusTutor">✦ Hỏi AI về câu này</button><button class="btn btn-primary" :disabled="!result" @click="nextQuestion">{{ state.questionIndex === total - 1 ? 'Xem kết quả' : 'Câu tiếp theo' }}</button></div>
      </article>
      <aside class="card tutor-panel">
        <div class="tutor-head"><div class="bot-avatar">✦</div><div><h3>Gia sư Lio</h3><span><i></i> Đang sẵn sàng</span></div><button aria-label="Đóng gia sư" @click="showToast('Gia sư vẫn ở đây khi bạn cần nhé!')">×</button></div>
        <div ref="chatBox" class="chat-messages"><div v-for="(message, index) in messages" :key="index" class="message" :class="message.role">{{ message.text }}</div><div v-if="tutorThinking" class="message ai typing">Lio đang suy nghĩ...</div></div>
        <form class="chat-input" @submit.prevent="sendMessage"><input v-model="chatInput" placeholder="Ví dụ: Vì sao không dùng ‘went’?"><button type="submit" aria-label="Gửi câu hỏi">↑</button></form>
      </aside>
    </div>
    </div>
  </section>
</template>
