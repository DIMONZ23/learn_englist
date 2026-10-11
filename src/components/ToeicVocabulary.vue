<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '../api.js';
import { showToast, state } from '../store.js';

const emit=defineEmits(['back']);
const stats=ref(null),meta=ref({topics:[],partsOfSpeech:[],levels:[]}),items=ref([]),pagination=ref({page:1,pages:1,total:0});
const loading=ref(true),search=ref(''),topic=ref(''),partOfSpeech=ref(''),level=ref(''),status=ref(''),sort=ref('alphabet');
const detail=ref(null),screen=ref('list'),quiz=ref([]),quizIndex=ref(0),quizAnswer=ref(null),quizScore=ref(0);
const selectedTopic=ref(''),topicWords=ref([]),topicPagination=ref({page:1,pages:1,total:0}),topicLoading=ref(false);
const topicCardIndex=ref(0),topicFlipped=ref(false);
let searchTimer;
const currentQuiz=computed(()=>quiz.value[quizIndex.value]);
const topicWord=computed(()=>topicWords.value[topicCardIndex.value]||null);

onMounted(async()=>{await Promise.all([loadStats(),loadMeta(),loadItems()]);});
watch([topic,partOfSpeech,level,status,sort],()=>loadItems(1));
watch(search,()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadItems(1),350);});
async function loadStats(){try{stats.value=(await api.getToeicVocabularyStats()).stats;}catch(e){showToast(e.message);}}
async function loadMeta(){try{meta.value=await api.getToeicVocabularyMeta();}catch(e){showToast(e.message);}}
async function loadItems(page=1){loading.value=true;try{const data=await api.getToeicVocabulary({search:search.value,topic:topic.value,partOfSpeech:partOfSpeech.value,level:level.value,status:status.value,sort:sort.value,page,limit:30});items.value=data.items;pagination.value=data.pagination;}catch(e){showToast(e.message);}finally{loading.value=false;}}
async function openDetail(id){try{detail.value=(await api.getToeicVocabularyDetail(id)).item;}catch(e){showToast(e.message);}}
function speak(word){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(word);u.lang='en-US';u.rate=.82;speechSynthesis.speak(u);}
async function update(item,payload){try{const updated=(await api.updateToeicVocabulary(item.id,payload)).item;Object.assign(item,updated);if(detail.value?.id===item.id)Object.assign(detail.value,updated);await loadStats();showToast('Đã cập nhật tiến độ từ vựng.');}catch(e){showToast(e.message);}}
async function startQuiz(){try{quiz.value=(await api.getToeicVocabularyQuiz(10)).questions;quizIndex.value=0;quizAnswer.value=null;quizScore.value=0;screen.value='quiz';}catch(e){showToast(e.message);}}
async function answerQuiz(index){if(quizAnswer.value!==null)return;quizAnswer.value=index;const q=currentQuiz.value,correct=index===q.correctIndex;if(correct)quizScore.value++;await api.updateToeicVocabulary(q.id,{status:correct?'learning':'review'}).catch(()=>{});}
function nextQuiz(){if(quizIndex.value===quiz.value.length-1){screen.value='quiz-result';loadStats();}else{quizIndex.value++;quizAnswer.value=null;}}
function resetFilters(){search.value='';topic.value='';partOfSpeech.value='';level.value='';status.value='';sort.value='alphabet';}
async function openTopic(topicName){selectedTopic.value=topicName;screen.value='topic';topicCardIndex.value=0;topicFlipped.value=false;await loadTopicWords(1);window.scrollTo({top:0,behavior:'smooth'});}
async function loadTopicWords(page=1){topicLoading.value=true;try{const data=await api.getToeicVocabulary({topic:selectedTopic.value,page,limit:30,sort:'priority'});topicWords.value=data.items;topicPagination.value=data.pagination;topicCardIndex.value=0;topicFlipped.value=false;}catch(e){showToast(e.message);}finally{topicLoading.value=false;}}
function moveTopicCard(direction){if(!topicWords.value.length)return;topicCardIndex.value=(topicCardIndex.value+direction+topicWords.value.length)%topicWords.value.length;topicFlipped.value=false;}
function closeTopic(){screen.value='list';selectedTopic.value='';topicWords.value=[];}
</script>

<template>
  <div class="toeic-vocab">
    <button v-if="screen==='list'" class="back-link" @click="emit('back')">← Sổ tay cá nhân</button>
    <template v-if="screen==='list'">
      <section class="card vocab-bank-hero"><div><span class="pill pill-cyan">TOEIC Vocabulary Bank</span><h2>3.000 từ vựng thiết yếu</h2><p>Dữ liệu Anh–Việt có nguồn, phân cấp CEFR và đồng bộ tiến độ học bằng PostgreSQL.</p><button class="btn btn-primary" @click="startQuiz">Kiểm tra nhanh 10 từ</button></div><div class="vocab-bank-orbit"><strong>{{ stats?.progress||0 }}%</strong><span>đã hoàn thành</span></div></section>
      <section v-if="stats" class="vocab-bank-stats"><div class="card"><span>Tổng số từ</span><strong>{{ stats.total.toLocaleString('vi-VN') }}</strong></div><div class="card"><span>Đã thuộc</span><strong>{{ stats.known }}</strong></div><div class="card"><span>Cần ôn</span><strong>{{ stats.review }}</strong></div><div class="card"><span>Học hôm nay</span><strong>{{ stats.today }}</strong></div><div class="card"><span>Yêu thích</span><strong>{{ stats.favorites }}</strong></div></section>
      <section class="card vocab-browser">
        <div class="vocab-browser-head"><div><span class="section-kicker">Word Explorer</span><h3>Khám phá ngân hàng từ</h3></div><span>{{ pagination.total.toLocaleString('vi-VN') }} kết quả</span></div>
        <div class="vocab-search-filters"><label class="bank-search">⌕<input v-model="search" placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt..."></label><select v-model="topic"><option value="">Tất cả chủ đề</option><option v-for="x in meta.topics" :key="x.topic" :value="x.topic">{{ x.topic }} ({{ x.count }})</option></select><select v-model="partOfSpeech"><option value="">Mọi từ loại</option><option v-for="x in meta.partsOfSpeech" :key="x.value" :value="x.value">{{ x.value }} ({{ x.count }})</option></select><select v-model="level"><option value="">Mọi cấp độ</option><option v-for="x in meta.levels" :key="x.level" :value="x.level">{{ x.level }} ({{ x.count }})</option></select><select v-model="status"><option value="">Mọi trạng thái</option><option value="new">Chưa học</option><option value="learning">Đang học</option><option value="review">Cần ôn</option><option value="known">Đã thuộc</option></select><select v-model="sort"><option value="alphabet">A → Z</option><option value="priority">Ưu tiên TOEIC</option><option value="level">Cấp độ</option></select></div>
        <div v-if="loading" class="toeic-empty">Đang tải dữ liệu từ PostgreSQL...</div>
        <div v-else-if="!items.length" class="toeic-empty">Không tìm thấy từ phù hợp. <button class="back-link" @click="resetFilters">Xóa bộ lọc</button></div>
        <div v-else class="vocab-bank-table"><div class="vocab-row vocab-row-head"><span>Từ vựng</span><span>Nghĩa tiếng Việt</span><span>Chủ đề</span><span>Cấp độ</span><span>Trạng thái</span><span></span></div><div v-for="item in items" :key="item.id" class="vocab-row"><button class="bank-word" @click="openDetail(item.id)"><strong>{{ item.word }}</strong><small>{{ item.ipa||'Chưa có IPA xác minh' }} · {{ item.partOfSpeech }}</small></button><span>{{ item.meaningVi||item.meaningEn||'Chưa có nghĩa xác minh' }}</span><span class="bank-topic">{{ item.topic }}</span><b class="level-badge">{{ item.level }}</b><span class="status" :class="`status-${item.status}`">{{ {new:'Chưa học',learning:'Đang học',review:'Cần ôn',known:'Đã thuộc'}[item.status] }}</span><button class="favorite-btn" :class="{active:item.favorite}" :aria-label="`Yêu thích ${item.word}`" @click="update(item,{favorite:!item.favorite})">{{ item.favorite?'★':'☆' }}</button></div></div>
        <div class="bank-pagination"><button class="btn btn-ghost" :disabled="pagination.page<=1" @click="loadItems(pagination.page-1)">← Trước</button><span>Trang {{ pagination.page }} / {{ pagination.pages }}</span><button class="btn btn-ghost" :disabled="pagination.page>=pagination.pages" @click="loadItems(pagination.page+1)">Sau →</button></div>
      </section>
      <section v-if="stats" class="card topic-progress"><div class="topic-progress-head"><div><span class="section-kicker">Học theo chủ đề</span><h3>Chọn bộ từ bạn muốn học</h3></div><small>Flashcard + danh sách từ vựng</small></div><button v-for="x in stats.topics" :key="x.topic" class="topic-progress-row" @click="openTopic(x.topic)"><span>{{ x.topic }}</span><div><i :style="{width:`${Math.round(x.known/x.total*100)}%`}"></i></div><b>{{ x.known }}/{{ x.total }}</b><em>Học ngay →</em></button></section>
    </template>

    <template v-else-if="screen==='topic'">
      <button class="back-link" @click="closeTopic">← Tất cả chủ đề</button>
      <section class="card topic-study-head"><div><span class="pill pill-cyan">Học theo chủ đề</span><h2>{{ selectedTopic }}</h2><p>Học lần lượt bằng flashcard, sau đó xem và quản lý toàn bộ từ trong chủ đề.</p></div><div><strong>{{ topicPagination.total.toLocaleString('vi-VN') }}</strong><span>từ vựng</span></div></section>

      <section class="topic-learning-grid">
        <div class="card topic-flash-area">
          <div class="topic-section-title"><div><span class="section-kicker">Flashcard</span><h3>Ghi nhớ nhanh</h3></div><span v-if="topicWords.length">{{ topicCardIndex+1 }} / {{ topicWords.length }} từ trên trang này</span></div>
          <div v-if="topicLoading" class="toeic-empty">Đang chuẩn bị flashcard...</div>
          <div v-else-if="topicWord" class="topic-flashcard" :class="{flipped:topicFlipped}" role="button" tabindex="0" :aria-label="`Lật flashcard ${topicWord.word}`" @click="topicFlipped=!topicFlipped" @keydown.enter="topicFlipped=!topicFlipped" @keydown.space.prevent="topicFlipped=!topicFlipped">
            <div class="topic-flashcard-inner">
              <article class="topic-flash-face topic-flash-front"><span>{{ topicWord.partOfSpeech }} · {{ topicWord.level }}</span><h2>{{ topicWord.word }}</h2><p>{{ topicWord.ipa||'IPA chưa có dữ liệu xác minh' }}</p><button class="sound-btn" aria-label="Nghe phát âm" @click.stop="speak(topicWord.word)">◖))</button><small>Chạm để xem nghĩa</small></article>
              <article class="topic-flash-face topic-flash-back"><span>Nghĩa tiếng Việt</span><h3>{{ topicWord.meaningVi||topicWord.meaningEn||'Chưa có nghĩa xác minh' }}</h3><p>{{ topicWord.meaningEn }}</p><blockquote v-if="topicWord.exampleEn">“{{ topicWord.exampleEn }}”<small v-if="topicWord.exampleVi">{{ topicWord.exampleVi }}</small></blockquote><small>Chạm để xem lại từ</small></article>
            </div>
          </div>
          <div v-else class="toeic-empty">Chủ đề này chưa có từ vựng.</div>
          <div v-if="topicWord" class="topic-flash-actions"><button class="btn btn-ghost" @click="moveTopicCard(-1)">← Trước</button><button class="btn btn-ghost review-action" @click="update(topicWord,{status:'review'})">↻ Cần ôn</button><button class="btn btn-primary" @click="update(topicWord,{status:'known'})">✓ Đã thuộc</button><button class="btn btn-ghost" @click="moveTopicCard(1)">Sau →</button></div>
        </div>
        <aside class="card topic-study-guide"><span class="section-kicker">Cách học hiệu quả</span><h3>Nhớ từ qua 3 bước</h3><ol><li><b>Đoán nghĩa</b><span>Nhìn từ và đọc thành tiếng trước khi lật thẻ.</span></li><li><b>Kiểm tra</b><span>Lật thẻ, đọc nghĩa và ví dụ trong ngữ cảnh.</span></li><li><b>Tự đánh giá</b><span>Chọn Cần ôn hoặc Đã thuộc để lưu tiến độ.</span></li></ol><button v-if="topicWord" class="btn btn-ghost" @click="openDetail(topicWord.id)">Xem chi tiết từ này</button></aside>
      </section>

      <section class="card vocab-browser topic-word-browser">
        <div class="vocab-browser-head"><div><span class="section-kicker">Bộ từ vựng</span><h3>{{ selectedTopic }}</h3></div><span>{{ topicPagination.total.toLocaleString('vi-VN') }} từ</span></div>
        <div v-if="topicLoading" class="toeic-empty">Đang tải bộ từ vựng...</div>
        <div v-else-if="topicWords.length" class="vocab-bank-table"><div class="vocab-row topic-vocab-row vocab-row-head"><span>Từ vựng</span><span>Nghĩa tiếng Việt</span><span>Nhóm nhỏ</span><span>Cấp độ</span><span>Trạng thái</span><span></span></div><div v-for="item in topicWords" :key="item.id" class="vocab-row topic-vocab-row" :class="{'is-current':item.id===topicWord?.id}"><button class="bank-word" @click="openDetail(item.id)"><strong>{{ item.word }}</strong><small>{{ item.ipa||'Chưa có IPA xác minh' }} · {{ item.partOfSpeech }}</small></button><span>{{ item.meaningVi||item.meaningEn||'Chưa có nghĩa xác minh' }}</span><span class="bank-topic">{{ item.subTopic||item.topic }}</span><b class="level-badge">{{ item.level }}</b><button class="status status-button" :class="`status-${item.status}`" @click="topicCardIndex=topicWords.findIndex(word=>word.id===item.id);topicFlipped=false">{{ {new:'Chưa học',learning:'Đang học',review:'Cần ôn',known:'Đã thuộc'}[item.status] }}</button><button class="favorite-btn" :class="{active:item.favorite}" :aria-label="`Yêu thích ${item.word}`" @click="update(item,{favorite:!item.favorite})">{{ item.favorite?'★':'☆' }}</button></div></div>
        <div v-else class="toeic-empty">Chủ đề này chưa có từ vựng.</div>
        <div class="bank-pagination"><button class="btn btn-ghost" :disabled="topicPagination.page<=1" @click="loadTopicWords(topicPagination.page-1)">← Trước</button><span>Trang {{ topicPagination.page }} / {{ topicPagination.pages }}</span><button class="btn btn-ghost" :disabled="topicPagination.page>=topicPagination.pages" @click="loadTopicWords(topicPagination.page+1)">Sau →</button></div>
      </section>
    </template>

    <section v-else-if="screen==='quiz'&&currentQuiz" class="card vocab-quiz"><button class="back-link" @click="screen='list'">← Thoát bài kiểm tra</button><div class="quiz-top"><span>Câu {{ quizIndex+1 }} / {{ quiz.length }}</span><div class="mini-progress"><i :style="{width:`${(quizIndex+1)/quiz.length*100}%`}"></i></div><span>{{ quizScore }} điểm</span></div><div class="quiz-word"><span>{{ currentQuiz.partOfSpeech }} · {{ currentQuiz.level }}</span><h2>{{ currentQuiz.word }}</h2><button class="sound-btn" @click="speak(currentQuiz.word)">◖))</button><p>{{ currentQuiz.prompt }}</p></div><div class="practice-options"><button v-for="(option,index) in currentQuiz.options" :key="option" class="practice-option" :class="{correct:quizAnswer!==null&&index===currentQuiz.correctIndex,wrong:quizAnswer===index&&index!==currentQuiz.correctIndex}" :disabled="quizAnswer!==null" @click="answerQuiz(index)"><b>{{ String.fromCharCode(65+index) }}</b><span>{{ option }}</span></button></div><button class="btn btn-primary quiz-next" :disabled="quizAnswer===null" @click="nextQuiz">{{ quizIndex===quiz.length-1?'Xem kết quả':'Câu tiếp theo' }}</button></section>
    <section v-else class="card vocab-quiz-result"><span>🏆</span><h2>{{ quizScore }}/{{ quiz.length }}</h2><p>Bạn trả lời đúng {{ Math.round(quizScore/quiz.length*100) }}%. Các từ sai đã được đưa vào danh sách Cần ôn.</p><div><button class="btn btn-primary" @click="startQuiz">Luyện lại</button><button class="btn btn-ghost" @click="screen='list'">Về ngân hàng từ</button></div></section>

    <div v-if="detail" class="vocab-modal" @click.self="detail=null"><article class="card vocab-detail"><button class="modal-close" @click="detail=null">×</button><div class="detail-title"><div><span>{{ detail.partOfSpeech }} · {{ detail.level }} · {{ detail.toeicPriority }} priority</span><h2>{{ detail.word }}</h2><p>{{ detail.ipa||'IPA chưa có dữ liệu xác minh' }}</p></div><button class="sound-btn" @click="speak(detail.word)">◖))</button></div><div class="detail-meanings"><div><span>Nghĩa tiếng Việt</span><p>{{ detail.meaningVi||'Chưa có dữ liệu xác minh.' }}</p></div><div><span>English definition</span><p>{{ detail.meaningEn||'No verified definition available.' }}</p></div></div><blockquote v-if="detail.exampleEn">“{{ detail.exampleEn }}”<small v-if="detail.exampleVi">{{ detail.exampleVi }}</small></blockquote><div class="detail-tags"><span>{{ detail.topic }}</span><span>{{ detail.subTopic }}</span><span v-for="tag in detail.tags.slice(0,4)" :key="tag">{{ tag }}</span></div><div v-if="detail.synonyms.length||detail.wordFamily.length" class="detail-relations"><p v-if="detail.synonyms.length"><b>Đồng nghĩa:</b> {{ detail.synonyms.join(', ') }}</p><p v-if="detail.wordFamily.length"><b>Họ từ:</b> {{ detail.wordFamily.join(', ') }}</p></div><div class="detail-actions"><button class="btn btn-ghost" @click="update(detail,{status:'review'})">↻ Cần ôn</button><button class="btn btn-primary" @click="update(detail,{status:'known'})">✓ Đã thuộc</button><button class="favorite-btn" :class="{active:detail.favorite}" @click="update(detail,{favorite:!detail.favorite})">{{ detail.favorite?'★ Đã yêu thích':'☆ Yêu thích' }}</button></div><small class="data-source">Nguồn: {{ detail.source }}</small></article></div>
  </div>
</template>
