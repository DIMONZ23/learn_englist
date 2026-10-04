<script setup>
import { computed, ref, watch } from 'vue';
import { api } from '../api.js';
import { appData } from '../data.js';
import { showToast, state } from '../store.js';

const filter = ref('all');
const flipped = ref(false);
const query = ref('');
const lookup = ref(null);
const lookupState = ref('idle');
const lookupError = ref('');
const statusMap = { known: 'Đã thuộc', review: 'Cần ôn', new: 'Chưa học' };

const currentWord = computed(() => state.vocabulary[state.cardIndex] || null);
const filteredWords = computed(() => state.vocabulary.filter((word) => filter.value === 'all' || word.status === filter.value));
const cardCounter = computed(() => state.vocabulary.length ? `${String(state.cardIndex + 1).padStart(2, '0')} / ${String(state.vocabulary.length).padStart(2, '0')}` : '00 / 00');

watch(() => state.vocabulary.length, (length) => {
  if (!length) state.cardIndex = 0;
  else if (state.cardIndex >= length) state.cardIndex = length - 1;
});
watch(() => state.cardIndex, () => { flipped.value = false; });

function moveCard(direction) {
  if (!state.vocabulary.length) return;
  state.cardIndex = (state.cardIndex + direction + state.vocabulary.length) % state.vocabulary.length;
}
function speak(text) {
  if (!('speechSynthesis' in window)) return showToast('Trình duyệt chưa hỗ trợ phát âm.');
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  speechSynthesis.speak(utterance);
}
async function rateWord(status) {
  const word = currentWord.value;
  if (!word) return;
  try {
    if (state.online) await api.updateVocabularyStatus(word.id, status);
    word.status = status;
    showToast(status === 'known' ? 'Đã ghi nhận là thuộc!' : 'Đã lên lịch ôn lại.');
    moveCard(1);
  } catch (error) { showToast(error.message); }
}
async function searchDictionary() {
  const term = query.value.trim().toLowerCase();
  if (!term) return;
  if (!/^[a-z][a-z '\-]{0,39}$/i.test(term)) return showToast('Vui lòng nhập một từ hoặc cụm từ tiếng Anh hợp lệ.');
  lookupState.value = 'loading';
  lookupError.value = '';
  try {
    lookup.value = state.online ? (await api.lookup(term)).entry : (appData.dictionary[term] || {
      word: term, ipa: '/ˈwɜːd/', type: 'word', meaning: 'Từ mới do người học thêm',
      definition: `A useful English word. Connect a real dictionary API to retrieve the full entry for “${term}”.`,
      example: `I am learning how to use “${term}” in context.`, collocations: [`use ${term}`, `learn ${term}`, `understand ${term}`]
    });
    lookupState.value = 'ready';
  } catch (error) {
    lookupError.value = error.message;
    lookupState.value = 'error';
  }
}
async function saveLookup() {
  if (!lookup.value) return;
  if (state.vocabulary.some((word) => word.word.toLowerCase() === lookup.value.word.toLowerCase())) return showToast('Từ này đã có trong sổ tay.');
  try {
    const item = state.online ? (await api.addVocabulary(lookup.value)).item : { ...lookup.value, id: Date.now(), status: 'new' };
    state.vocabulary.unshift(item);
    state.cardIndex = 0;
    showToast(`Đã lưu “${lookup.value.word}” vào sổ tay.`);
  } catch (error) { showToast(error.message); }
}
async function removeWord(id) {
  try {
    if (state.online) await api.deleteVocabulary(id);
    state.vocabulary = state.vocabulary.filter((word) => word.id !== id);
    state.cardIndex = 0;
    showToast('Đã xóa từ khỏi sổ tay.');
  } catch (error) { showToast(error.message); }
}
</script>

<template>
  <section class="view active">
    <div class="section-intro"><div><span class="pill pill-indigo">Vocabulary Builder</span><h2>Học từ mới theo cách bộ não ghi nhớ</h2><p>Lật thẻ, nghe phát âm và tự đánh giá để hệ thống lên lịch ôn phù hợp.</p></div><div class="session-count"><strong>{{ state.vocabulary.length }}</strong><span>từ trong sổ</span></div></div>
    <div class="vocab-layout">
      <article class="flashcard-wrap">
        <div class="flashcard" :class="{ flipped }" tabindex="0" role="button" aria-label="Lật thẻ từ vựng" @click="flipped = !flipped" @keydown.enter.prevent="flipped = !flipped" @keydown.space.prevent="flipped = !flipped">
          <div class="flashcard-inner">
            <div class="flash-face flash-front">
              <span class="card-counter">{{ cardCounter }}</span>
              <button class="sound-btn" aria-label="Nghe phát âm" @click.stop="currentWord && speak(currentWord.word)">◖))</button>
              <div v-if="currentWord" class="word-main"><span class="word-type">{{ currentWord.type }}</span><h2>{{ currentWord.word }}</h2><p>{{ currentWord.ipa }}</p></div>
              <div v-else class="word-main"><span class="word-type">Sổ tay trống</span><h2>Ready?</h2><p>Hãy tra và lưu một từ mới</p></div>
              <span class="flip-hint">↻ Chạm để xem nghĩa</span>
            </div>
            <div class="flash-face flash-back">
              <span class="card-counter">Mặt sau</span>
              <div v-if="currentWord" class="meaning"><span>Nghĩa tiếng Việt</span><h2>{{ currentWord.meaning }}</h2><p>{{ currentWord.definition }}</p></div>
              <div v-else class="meaning"><span>Bắt đầu học</span><h2>Một từ mới mỗi ngày</h2><p>Từ đã lưu sẽ xuất hiện ở đây dưới dạng flashcard.</p></div>
              <blockquote>“{{ currentWord?.example || 'Small steps create lasting progress.' }}”</blockquote>
              <span class="flip-hint">↻ Chạm để quay lại</span>
            </div>
          </div>
        </div>
        <div class="flash-controls"><button class="round-control" aria-label="Từ trước" @click="moveCard(-1)">←</button><button class="rating-btn again" @click="rateWord('review')"><span>↻</span>Cần ôn</button><button class="rating-btn known" @click="rateWord('known')"><span>✓</span>Đã thuộc</button><button class="round-control" aria-label="Từ tiếp theo" @click="moveCard(1)">→</button></div>
      </article>
      <aside class="card dictionary-card">
        <div class="card-heading"><div><span class="ai-badge">✦ AI Dictionary</span><h3>Tra & thêm từ nhanh</h3></div></div>
        <form class="search-box" @submit.prevent="searchDictionary"><input v-model="query" autocomplete="off" placeholder="Nhập từ, ví dụ: thrive" aria-label="Nhập từ cần tra"><button type="submit" aria-label="Tra từ">⌕</button></form>
        <div v-if="lookupState === 'idle'" class="dictionary-result empty-state"><div class="empty-icon">Aa</div><h4>Khám phá một từ mới</h4><p>AI sẽ gợi ý phiên âm, định nghĩa, collocations và ví dụ thực tế.</p></div>
        <div v-else-if="lookupState === 'loading'" class="dictionary-result empty-state"><div class="empty-icon">✦</div><h4>AI đang phân tích...</h4><p>Đối chiếu ngữ nghĩa và ngữ cảnh sử dụng.</p></div>
        <div v-else-if="lookupState === 'error'" class="dictionary-result empty-state"><div class="empty-icon">!</div><h4>Không thể tra từ</h4><p>{{ lookupError }}</p></div>
        <div v-else class="dictionary-result"><div class="result-word"><div><h3>{{ lookup.word }}</h3><p>{{ lookup.ipa }} · {{ lookup.type }}</p></div><button class="sound-btn" aria-label="Nghe phát âm" @click="speak(lookup.word)">◖))</button></div><div class="result-definition"><strong>{{ lookup.meaning }}</strong>{{ lookup.definition }}<br><em>“{{ lookup.example }}”</em></div><div class="collocations"><span v-for="item in lookup.collocations" :key="item">{{ item }}</span></div><button class="btn btn-primary save-word" @click="saveLookup">+ Lưu vào sổ tay</button></div>
      </aside>
    </div>
    <article class="card notebook-card">
      <div class="notebook-head"><div><span class="section-kicker">Sổ tay của tôi</span><h2>Từ vựng đã lưu</h2></div><div class="filter-group"><button v-for="item in [['all','Tất cả'],['known','Đã thuộc'],['review','Cần ôn'],['new','Chưa học']]" :key="item[0]" class="filter" :class="{ active: filter === item[0] }" @click="filter = item[0]">{{ item[1] }}</button></div></div>
      <div class="table-wrap"><table><thead><tr><th>Từ vựng</th><th>Loại từ</th><th>Nghĩa</th><th>Trạng thái</th><th></th></tr></thead><tbody><tr v-for="word in filteredWords" :key="word.id"><td><span class="word-cell"><strong>{{ word.word }}</strong><small>{{ word.ipa }}</small></span></td><td>{{ word.type }}</td><td>{{ word.meaning }}</td><td><span class="status" :class="`status-${word.status}`">{{ statusMap[word.status] }}</span></td><td><button class="delete-word" :aria-label="`Xóa ${word.word}`" @click="removeWord(word.id)">×</button></td></tr><tr v-if="!filteredWords.length"><td colspan="5" class="muted">Chưa có từ nào trong nhóm này.</td></tr></tbody></table></div>
    </article>
  </section>
</template>
