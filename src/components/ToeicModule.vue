<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { api } from '../api.js';
import { showToast } from '../store.js';

const emit = defineEmits(['back']);
const tests = ref([]);
const loading = ref(true);
const screen = ref('list');
const selectedTest = ref(null);
const session = ref(null);
const questionIndex = ref(0);
const remaining = ref(0);
const flagged = ref([]);
const reviewFilter = ref('all');
const showNavigator = ref(false);
const audioPlayed = ref([]);
let timer;

const questions = computed(() => session.value?.questions || []);
const question = computed(() => questions.value[questionIndex.value]);
const answeredCount = computed(() => questions.value.filter(q => q.selectedIndex !== null && q.selectedIndex !== undefined).length);
const partGroups = computed(() => questions.value.reduce((all,q,i) => ((all[q.part] ||= []).push({ ...q,index:i }),all),{}));
const timeText = computed(() => `${String(Math.floor(remaining.value/60)).padStart(2,'0')}:${String(remaining.value%60).padStart(2,'0')}`);
const reviewQuestions = computed(() => {
  const list=questions.value;
  if (reviewFilter.value==='wrong') return list.filter(q=>q.selectedIndex!==null&&q.selectedIndex!==q.correctIndex);
  if (reviewFilter.value==='blank') return list.filter(q=>q.selectedIndex===null);
  if (reviewFilter.value==='flagged') return list.filter(q=>q.flagged);
  if (reviewFilter.value.startsWith('part-')) return list.filter(q=>q.part===Number(reviewFilter.value.slice(5)));
  return list;
});

onMounted(loadTests);
onBeforeUnmount(()=>{clearInterval(timer);speechSynthesis.cancel();});
async function loadTests(){
  loading.value=true;
  try { tests.value=(await api.getToeicTests()).tests; }
  catch(e){showToast(e.message);}
  finally{loading.value=false;}
}
function prepare(test){selectedTest.value=test;screen.value='intro';}
async function begin(mode='exam',part=null){
  try{
    const payload={testId:selectedTest.value.id,mode,part,durationMinutes:20};
    session.value=(await api.startToeicSession(payload)).session;
    questionIndex.value=0;flagged.value=[];audioPlayed.value=[];screen.value='exam';startTimer();
  }catch(e){showToast(e.message);}
}
async function resume(id){
  try{
    session.value=(await api.getToeicSession(id)).session;
    questionIndex.value=Math.max(0,questions.value.findIndex(q=>q.number===session.value.currentQuestion));
    flagged.value=questions.value.filter(q=>q.flagged).map(q=>q.id);screen.value='exam';startTimer();
  }catch(e){showToast(e.message);}
}
function startTimer(){
  clearInterval(timer);
  const tick=()=>{
    remaining.value=Math.max(0,Math.floor((new Date(session.value.expiresAt).getTime()-Date.now())/1000));
    if ([900,300,60].includes(remaining.value)) showToast(`Còn ${remaining.value/60} phút làm bài.`);
    if (!remaining.value){clearInterval(timer);finish(true);}
  };tick();timer=setInterval(tick,1000);
}
async function choose(index){
  if (!question.value || session.value.status!=='in_progress') return;
  question.value.selectedIndex=index;
  try{await api.saveToeicProgress(session.value.id,{questionId:question.value.id,selectedIndex:index,currentQuestion:question.value.number,flagged:flagged.value});}
  catch(e){showToast(e.message);}
}
async function go(index){
  questionIndex.value=Math.max(0,Math.min(questions.value.length-1,index));showNavigator.value=false;
  await api.saveToeicProgress(session.value.id,{currentQuestion:question.value.number,flagged:flagged.value}).catch(e=>showToast(e.message));
  window.scrollTo({top:0,behavior:'smooth'});
}
async function toggleFlag(){
  const id=question.value.id;
  flagged.value=flagged.value.includes(id)?flagged.value.filter(x=>x!==id):[...flagged.value,id];
  question.value.flagged=flagged.value.includes(id);
  await api.saveToeicProgress(session.value.id,{currentQuestion:question.value.number,flagged:flagged.value}).catch(e=>showToast(e.message));
}
function playAudio(){
  if(!question.value?.asset?.content)return;
  if(session.value.mode==='exam'&&audioPlayed.value.includes(question.value.asset.id)){showToast('Exam Mode chỉ phát đoạn nghe một lần.');return;}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(question.value.asset.content);utterance.lang='en-US';utterance.rate=question.value.asset.metadata?.rate||.92;speechSynthesis.speak(utterance);
  if(session.value.mode==='exam') audioPlayed.value=[...audioPlayed.value,question.value.asset.id];
}
async function finish(auto=false){
  const blank=questions.value.length-answeredCount.value;
  if(!auto&&!confirm(blank?`Bạn còn ${blank} câu chưa trả lời. Vẫn nộp bài?`:'Bạn chắc chắn muốn nộp bài?'))return;
  try{clearInterval(timer);const response=await api.submitToeicSession(session.value.id);session.value.result=response.result;session.value.status='completed';screen.value='result';await loadTests();}
  catch(e){showToast(e.message);}
}
async function openReview(id=session.value.id){
  try{session.value=(await api.reviewToeicSession(id)).session;reviewFilter.value='all';screen.value='review';}
  catch(e){showToast(e.message);}
}
async function openResult(id){
  const loaded=(await api.getToeicSession(id)).session;session.value=loaded;
  if(loaded.status==='completed')screen.value='result';else resume(id);
}
function backList(){clearInterval(timer);speechSynthesis.cancel();screen.value='list';loadTests();}
function keydown(e){
  if(screen.value!=='exam')return;
  if(['a','b','c','d'].includes(e.key.toLowerCase())){const i=e.key.toLowerCase().charCodeAt(0)-97;if(i<question.value.options.length)choose(i);}
  if(e.key==='ArrowRight')go(questionIndex.value+1);if(e.key==='ArrowLeft')go(questionIndex.value-1);
}
</script>

<template>
  <section class="toeic-module" tabindex="0" @keydown="keydown">
    <div v-if="screen==='list'">
      <button class="back-link" @click="emit('back')">← Luyện tập nhanh</button>
      <div class="toeic-banner card"><div><span class="pill pill-cyan">TOEIC Listening & Reading</span><h2>Mô phỏng 200 câu · 120 phút</h2><p>Luyện đủ 7 Parts, lưu tiến độ trên PostgreSQL và phân tích điểm mạnh, điểm yếu sau bài thi.</p></div><div class="toeic-score-mark"><strong>990</strong><span>Target score</span></div></div>
      <div class="toeic-toolbar"><h3>Danh sách đề thi</h3><span>{{ tests.length }} đề đã sẵn sàng</span></div>
      <div v-if="loading" class="card toeic-empty">Đang tải ngân hàng đề...</div>
      <article v-for="test in tests" :key="test.id" class="card test-card">
        <div class="test-icon">🎧</div><div class="test-main"><span>{{ test.code }} · Mục tiêu {{ test.targetScore }}+</span><h3>{{ test.title }}</h3><p>{{ test.description }}</p><div class="test-meta"><b>200 câu</b><b>120 phút</b><b>7 Parts</b><b :class="`test-status ${test.latestSession?.status||'new'}`">{{ test.latestSession?.status==='in_progress'?'Đang làm':test.latestSession?.status==='completed'?'Đã hoàn thành':'Chưa làm' }}</b></div></div>
        <div class="test-actions"><button class="btn btn-primary" @click="test.latestSession?.status==='in_progress'?resume(test.latestSession.id):prepare(test)">{{ test.latestSession?.status==='in_progress'?'Tiếp tục thi':'Bắt đầu thi' }}</button><button v-if="test.latestSession?.status==='completed'" class="btn btn-ghost" @click="openResult(test.latestSession.id)">Xem kết quả</button></div>
      </article>
      <div v-if="tests[0]" class="card part-practice"><div><span class="section-kicker">Practice Mode</span><h3>Luyện riêng từng Part</h3><p>Xem transcript, nghe lại và xem lời giải sau khi kết thúc lượt luyện.</p></div><div class="part-buttons"><button v-for="part in 7" :key="part" @click="selectedTest=tests[0];begin('practice',part)"><b>Part {{ part }}</b><span>{{ ['Photographs','Question–Response','Conversations','Talks','Incomplete Sentences','Text Completion','Reading Comprehension'][part-1] }}</span></button></div></div>
    </div>

    <div v-else-if="screen==='intro'" class="card exam-intro">
      <button class="back-link" @click="backList">← Danh sách đề</button><span class="pill pill-indigo">{{ selectedTest.code }}</span><h2>{{ selectedTest.title }}</h2><p>{{ selectedTest.description }}</p>
      <div class="exam-facts"><div><strong>200</strong><span>Câu hỏi</span></div><div><strong>45′</strong><span>Listening</span></div><div><strong>75′</strong><span>Reading</span></div><div><strong>120′</strong><span>Tổng thời gian</span></div></div>
      <div class="exam-rules"><h3>Trước khi bắt đầu</h3><ul><li>Listening gồm 100 câu, audio chỉ phát một lần trong Exam Mode.</li><li>Reading gồm 100 câu; bạn tự quản lý thời gian trong giới hạn chung.</li><li>Đáp án và lời giải chỉ xuất hiện sau khi nộp bài.</li><li>Tiến độ, đáp án và thời hạn được lưu để tiếp tục khi tải lại trang.</li></ul></div>
      <button class="btn btn-primary btn-large" @click="begin()">Bắt đầu 120 phút</button>
    </div>

    <div v-else-if="screen==='exam'&&question" class="exam-shell">
      <header class="card exam-header"><div><span class="section-kicker">{{ session.mode==='exam'?'Exam Mode':'Practice Mode' }}</span><h3>{{ session.title }} · Part {{ question.part }}</h3></div><div class="exam-progress"><b>{{ answeredCount }}/{{ questions.length }}</b><span>đã trả lời</span></div><div class="exam-clock" :class="{urgent:remaining<=300}">⏱ {{ timeText }}</div><button class="btn btn-danger" @click="finish(false)">Nộp bài</button></header>
      <div class="exam-body">
        <aside class="card exam-parts"><button v-for="(items,part) in partGroups" :key="part" :class="{active:Number(part)===question.part}" @click="go(items[0].index)"><span>Part {{ part }}</span><b>{{ items.filter(x=>x.selectedIndex!==null&&x.selectedIndex!==undefined).length }}/{{ items.length }}</b></button><button class="navigator-toggle" @click="showNavigator=!showNavigator">▦ Bảng câu hỏi</button></aside>
        <article class="card exam-question">
          <div class="question-head"><span>Câu {{ question.number }} / 200</span><span>{{ question.type }} · {{ question.difficulty }}</span><button :class="{flagged:flagged.includes(question.id)}" @click="toggleFlag">⚑ {{ flagged.includes(question.id)?'Đã đánh dấu':'Xem lại' }}</button></div>
          <img v-if="question.imageUrl" :src="question.imageUrl" :alt="`TOEIC Part 1 question ${question.number}`" class="toeic-photo">
          <div v-if="question.asset?.type==='passage'" class="toeic-passage"><h4>{{ question.asset.title }}</h4><pre>{{ question.asset.content }}</pre></div>
          <button v-if="question.asset?.type==='audio'" class="audio-player" @click="playAudio">▶ {{ session.mode==='exam'&&audioPlayed.includes(question.asset.id)?'Đã phát audio':'Phát audio câu hỏi' }}</button>
          <p v-if="session.mode==='practice'&&question.asset?.type==='audio'" class="practice-transcript"><strong>Transcript:</strong> {{ question.asset.content }}</p>
          <h2>{{ question.part<=2?'Chọn đáp án bạn nghe được.':question.prompt }}</h2>
          <div class="toeic-options"><button v-for="(option,index) in question.options" :key="option" :class="{selected:question.selectedIndex===index}" @click="choose(index)"><b>{{ String.fromCharCode(65+index) }}</b><span>{{ question.part<=2&&session.mode==='exam'?'Phương án '+String.fromCharCode(65+index):option }}</span></button></div>
          <footer><button class="btn btn-ghost" :disabled="questionIndex===0" @click="go(questionIndex-1)">← Câu trước</button><button class="btn btn-primary" :disabled="questionIndex===questions.length-1" @click="go(questionIndex+1)">Câu tiếp →</button></footer>
        </article>
        <aside v-if="showNavigator" class="card question-map"><div class="map-head"><h3>Điều hướng nhanh</h3><button @click="showNavigator=false">×</button></div><div v-for="(items,part) in partGroups" :key="part"><h4>Part {{ part }}</h4><div><button v-for="item in items" :key="item.id" :class="{answered:item.selectedIndex!==null,current:item.index===questionIndex,flagged:flagged.includes(item.id)}" @click="go(item.index)">{{ item.number }}</button></div></div><p><i class="answered"></i> Đã làm · <i class="flagged"></i> Đánh dấu</p></aside>
      </div>
    </div>

    <div v-else-if="screen==='result'&&session.result" class="result-view">
      <button class="back-link" @click="backList">← Danh sách đề</button><div class="card result-hero"><div class="result-ring"><strong>{{ session.result.estimatedScore }}</strong><span>/ 990</span></div><div><span class="pill pill-cyan">Đã hoàn thành</span><h2>Kết quả TOEIC ước tính</h2><p>{{ session.result.disclaimer }}</p></div></div>
      <div class="result-stats"><div class="card"><span>Listening</span><strong>{{ session.result.listeningScore }}</strong><small>{{ session.result.listeningCorrect }}/100 câu đúng</small></div><div class="card"><span>Reading</span><strong>{{ session.result.readingScore }}</strong><small>{{ session.result.readingCorrect }}/100 câu đúng</small></div><div class="card"><span>Độ chính xác</span><strong>{{ session.result.accuracy }}%</strong><small>{{ session.result.correct }}/{{ session.result.total }} câu đúng</small></div><div class="card"><span>Chưa trả lời</span><strong>{{ session.result.unanswered }}</strong><small>{{ session.result.wrong }} câu sai</small></div></div>
      <div class="card part-results"><h3>Phân tích theo Part</h3><div v-for="(stat,part) in session.result.parts" :key="part"><span>Part {{ part }}</span><div><i :style="{width:`${stat.accuracy}%`}"></i></div><b>{{ stat.correct }}/{{ stat.total }} · {{ stat.accuracy }}%</b></div></div>
      <div class="result-actions"><button class="btn btn-primary" @click="openReview()">Xem chi tiết đáp án</button><button class="btn btn-ghost" @click="selectedTest=tests[0];begin(session.mode,session.selectedPart)">Làm lại</button><button class="btn btn-ghost" @click="backList">Quay lại danh sách</button></div>
    </div>

    <div v-else-if="screen==='review'" class="review-view">
      <button class="back-link" @click="screen='result'">← Kết quả</button><div class="review-head"><div><span class="section-kicker">Answer Review</span><h2>Xem lại đáp án chi tiết</h2></div><select v-model="reviewFilter"><option value="all">Tất cả câu</option><option value="wrong">Câu sai</option><option value="blank">Chưa trả lời</option><option value="flagged">Đã đánh dấu</option><option v-for="part in 7" :key="part" :value="`part-${part}`">Part {{ part }}</option></select></div>
      <article v-for="q in reviewQuestions" :key="q.id" class="card review-card" :class="q.selectedIndex===q.correctIndex?'is-correct':'is-wrong'"><div class="review-label"><b>Câu {{ q.number }} · Part {{ q.part }}</b><span>{{ q.selectedIndex===null?'Chưa trả lời':q.selectedIndex===q.correctIndex?'Đúng':'Sai' }}</span></div><img v-if="q.imageUrl" :src="q.imageUrl" class="toeic-photo" alt="Ảnh câu hỏi TOEIC"><div v-if="q.asset?.type==='passage'" class="toeic-passage"><pre>{{ q.asset.content }}</pre></div><h3>{{ q.prompt }}</h3><div class="review-options"><p v-for="(option,index) in q.options" :key="option" :class="{correct:index===q.correctIndex,chosen:index===q.selectedIndex}"><b>{{ String.fromCharCode(65+index) }}</b> {{ option }}</p></div><div class="review-explain"><p><strong>Giải thích:</strong> {{ q.explanation }}</p><p><strong>Dịch:</strong> {{ q.translation||q.asset?.translation }}</p><p v-if="q.asset?.type==='audio'"><strong>Transcript:</strong> {{ q.asset.content }}</p><p><strong>Từ vựng/chủ điểm:</strong> {{ q.tags.join(' · ') }}</p></div></article>
    </div>
  </section>
</template>
