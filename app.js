/* LingoFlow - SPA kết nối REST API/PostgreSQL, có fallback offline. */
(() => {
  'use strict';

  const DATA = window.APP_DATA;
  const api = window.LingoAPI;
  const STORAGE_KEY = 'lingoflow-state-v1';
  const defaultState = {
    theme: 'light', activeView: 'dashboard', cardIndex: 0,
    vocab: DATA.vocabulary, currentLesson: 'present-perfect',
    practiceTopic: 'Thì động từ', questionIndex: 0, correct: 0,
    stats: { streak: 12, learned: 184, exercises: 36, accuracy: 87 }
  };
  let state = loadState();
  let backendOnline = false;
  let currentLookup = null;
  let toastTimer;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const allowed = saved ? { theme:saved.theme, activeView:saved.activeView, cardIndex:saved.cardIndex, currentLesson:saved.currentLesson, practiceTopic:saved.practiceTopic, questionIndex:saved.questionIndex } : {};
      return { ...structuredClone(defaultState), ...allowed };
    } catch { return structuredClone(defaultState); }
  }
  function saveState() {
    const local = { theme:state.theme, activeView:state.activeView, cardIndex:state.cardIndex, currentLesson:state.currentLesson, practiceTopic:state.practiceTopic, questionIndex:state.questionIndex };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
  }
  function setConnectionStatus(online, text) {
    backendOnline = online;
    const el=$('#syncStatus'); if(!el)return;
    el.textContent=text; el.className=online?'online':'offline';
  }
  async function syncFromBackend() {
    try {
      const payload=await api.bootstrap();
      state.vocab=payload.vocabulary; state.stats=payload.stats;
      if(payload.grammar?.length) DATA.grammar=payload.grammar;
      if(payload.practice && Object.keys(payload.practice).length) DATA.practice=payload.practice;
      const profile=payload.profile;
      $$('.profile-copy strong').forEach(el=>el.textContent=profile.name);
      $$('.profile-copy small').forEach(el=>el.textContent=`Intermediate · ${profile.level}`);
      setConnectionStatus(true,'● PostgreSQL đã đồng bộ');
      renderDashboard();renderFlashcard();renderVocabTable();renderGrammarLesson(state.currentLesson);renderTopics();renderPracticeQuestion();
    } catch (error) {
      console.warn('[sync] chạy ở chế độ offline:',error.message);
      setConnectionStatus(false,'● Chế độ offline');
    }
  }
  function showToast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // Điều hướng SPA
  const pageMeta = {
    dashboard: ['Tổng quan hôm nay', 'Chào buổi sáng, Minh! <span>👋</span>'],
    vocabulary: ['Học từ vựng thông minh', 'Xây vốn từ vững chắc'],
    grammar: ['Ngữ pháp trực quan', 'Hiểu bản chất, nhớ thật lâu'],
    practice: ['Luyện tập cá nhân hóa', 'Thử thách kiến thức của bạn']
  };
  function switchView(target) {
    state.activeView = target; saveState();
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === target));
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.target === target));
    $('#pageEyebrow').textContent = pageMeta[target][0];
    $('#pageTitle').innerHTML = pageMeta[target][1];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderDashboard() {
    const weeklyGoal=state.stats.weeklyGoal ?? 68;
    const ring=$('.progress-ring'); if(ring){ring.style.setProperty('--progress',weeklyGoal);ring.setAttribute('aria-label',`Tiến độ ${weeklyGoal} phần trăm`);}
    if($('#weeklyGoalValue'))$('#weeklyGoalValue').textContent=`${weeklyGoal}%`;
    if($('#weeklyGoalCopy'))$('#weeklyGoalCopy').textContent=`${weeklyGoal}%`;
    if($('#streakValue'))$('#streakValue').textContent=state.stats.streak;
    const statItems = [
      ['A', state.stats.learned, 'Từ đã ghi nhớ'], ['✓', state.stats.exercises, 'Bài đã hoàn thành'],
      ['◎', `${state.stats.accuracy}%`, 'Tỷ lệ chính xác'], ['↗', '+14%', 'So với tuần trước']
    ];
    $('#statsGrid').innerHTML = statItems.map(s => `<article class="card stat-card"><div class="stat-icon">${s[0]}</div><div class="stat-copy"><strong>${s[1]}</strong><span>${s[2]}</span></div></article>`).join('');
    $('#weekStreak').innerHTML = ['T2','T3','T4','T5','T6','T7','CN'].map((d,i) => `<div class="day ${i < 5 ? 'done' : ''} ${i === 4 ? 'today' : ''}"><i>${i < 5 ? '✓' : i + 1}</i><span>${d}</span></div>`).join('');
    const reviews = [
      ['at / on / in', 'Giới từ chỉ thời gian', 'Sai 3 lần'], ['resilient', 'Từ vựng học thuật', 'Đến hạn ôn'], ['Present Perfect', 'Phân biệt với Past Simple', '72% chính xác']
    ];
    $('#reviewList').innerHTML = reviews.map((r,i) => `<div class="review-item"><span class="review-icon">${i ? 'A' : '@'}</span><div><strong>${r[0]}</strong><small>${r[1]}</small></div><em>${r[2]}</em></div>`).join('');
  }

  // Flashcard và từ vựng
  function renderFlashcard() {
    if (!state.vocab.length) {
      $('#frontType').textContent = 'Sổ tay trống'; $('#frontWord').textContent = 'Ready?'; $('#frontIpa').textContent = 'Hãy tra và lưu một từ mới';
      $('#backMeaning').textContent = 'Bắt đầu từ một từ bạn thường gặp'; $('#backDefinition').textContent = 'Từ đã lưu sẽ xuất hiện ở đây dưới dạng flashcard.'; $('#backExample').textContent = '“Small steps create lasting progress.”';
      $('#cardCounter').textContent = '00 / 00'; return;
    }
    state.cardIndex = Math.min(state.cardIndex, state.vocab.length - 1);
    const w = state.vocab[state.cardIndex];
    $('#cardCounter').textContent = `${String(state.cardIndex + 1).padStart(2,'0')} / ${String(state.vocab.length).padStart(2,'0')}`;
    $('#frontType').textContent = w.type; $('#frontWord').textContent = w.word; $('#frontIpa').textContent = w.ipa;
    $('#backMeaning').textContent = w.meaning; $('#backDefinition').textContent = w.definition; $('#backExample').textContent = `“${w.example}”`;
    $('#flashcard').classList.remove('flipped');
  }
  const statusMap = { known:'Đã thuộc', review:'Cần ôn', new:'Chưa học' };
  function renderVocabTable(filter = $('.filter.active')?.dataset.filter || 'all') {
    const rows = state.vocab.filter(w => filter === 'all' || w.status === filter);
    $('#vocabTableBody').innerHTML = rows.length ? rows.map(w => `<tr><td><span class="word-cell"><strong>${w.word}</strong><small>${w.ipa}</small></span></td><td>${w.type}</td><td>${w.meaning}</td><td><span class="status status-${w.status}">${statusMap[w.status]}</span></td><td><button class="delete-word" data-delete="${w.id}" aria-label="Xóa ${w.word}">×</button></td></tr>`).join('') : `<tr><td colspan="5" class="muted">Chưa có từ nào trong nhóm này.</td></tr>`;
    $('#vocabCount').textContent = state.vocab.length;
    $('#reviewBadge').textContent = state.vocab.filter(w => w.status === 'review').length;
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) return showToast('Trình duyệt chưa hỗ trợ phát âm.');
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang='en-US';u.rate=.82;speechSynthesis.speak(u);
  }
  async function dictionaryLookup(term) {
    const key = term.trim().toLowerCase(); if (!key) return;
    if (!/^[a-z][a-z '\-]{0,39}$/i.test(key)) return showToast('Vui lòng nhập một từ hoặc cụm từ tiếng Anh hợp lệ.');
    const box = $('#dictionaryResult');
    box.className = 'dictionary-result empty-state'; box.innerHTML = '<div class="empty-icon">✦</div><h4>AI đang phân tích...</h4><p>Đối chiếu ngữ nghĩa và ngữ cảnh sử dụng.</p>';
    try {
      currentLookup = backendOnline ? (await api.lookup(key)).entry : (DATA.dictionary[key] || {
        word: key, ipa: '/ˈwɜːd/', type: 'word', meaning: 'Từ mới do người học thêm',
        definition: `A useful English word. Connect a real dictionary API to retrieve the full entry for “${key}”.`,
        example: `I am learning how to use “${key}” in context.`, collocations: [`use ${key}`, `learn ${key}`, `understand ${key}`]
      });
      box.className = 'dictionary-result';
      box.innerHTML = `<div class="result-word"><div><h3>${currentLookup.word}</h3><p>${currentLookup.ipa} · ${currentLookup.type}</p></div><button class="sound-btn" id="speakLookup" aria-label="Nghe phát âm">◖))</button></div><div class="result-definition"><strong>${currentLookup.meaning}</strong>${currentLookup.definition}<br><em>“${currentLookup.example}”</em></div><div class="collocations">${currentLookup.collocations.map(c=>`<span>${c}</span>`).join('')}</div><button class="btn btn-primary save-word" id="saveLookup">+ Lưu vào sổ tay</button>`;
      $('#speakLookup').onclick = () => speak(currentLookup.word);
      $('#saveLookup').onclick = saveLookup;
    } catch(error) {
      box.className='dictionary-result empty-state';
      box.innerHTML=`<div class="empty-icon">!</div><h4>Không thể tra từ</h4><p>${escapeHTML(error.message)}</p>`;
    }
  }
  async function saveLookup() {
    if (state.vocab.some(w => w.word.toLowerCase() === currentLookup.word.toLowerCase())) return showToast('Từ này đã có trong sổ tay.');
    try {
      const item=backendOnline?(await api.addVocabulary(currentLookup)).item:{...currentLookup,id:Date.now(),status:'new'};
      state.vocab.unshift(item); state.cardIndex=0; saveState(); renderFlashcard(); renderVocabTable(); showToast(`Đã lưu “${currentLookup.word}” vào sổ tay.`);
    } catch(error) { showToast(error.message); }
  }

  // Grammar Hub
  function renderGrammarTree() {
    $('#grammarTree').innerHTML = DATA.grammar.map(cat => `<div class="grammar-category"><div class="category-label"><span>${cat.icon}</span>${cat.category}</div>${cat.lessons.map(l=>`<button class="lesson-link ${l.id===state.currentLesson?'active':''}" data-lesson="${l.id}">${l.title}<small>${l.level}</small></button>`).join('')}</div>`).join('');
  }
  function getLesson(id) { return DATA.grammar.flatMap(c=>c.lessons).find(l=>l.id===id) || DATA.grammar[0].lessons[0]; }
  function renderGrammarLesson(id) {
    const l = getLesson(id); state.currentLesson=l.id; saveState(); renderGrammarTree();
    const examples = l.examples.map(e=>`<div class="comparison"><div class="example-box good"><span class="example-label">✓ ĐÚNG</span><p>${e.good}</p><small>Cấu trúc tự nhiên và chính xác.</small></div><div class="example-box bad"><span class="example-label">× SAI</span><p>${e.bad}</p><small>${e.note}</small></div></div>`).join('');
    $('#grammarContent').innerHTML = `<section class="card lesson-hero"><span class="pill pill-indigo">${l.level} · Bài học trọng tâm</span><h2>${l.title}</h2><p>${l.summary}</p><div class="formula">${l.formula.map(f=>`<span class="f-${f.c}">${f.t}</span>`).join('')}</div></section><section class="card lesson-block"><h3>💡 Mẹo ghi nhớ nhanh</h3><div class="memory-hack"><span>🧠</span><div><strong>Câu thần chú của Lio</strong><p>${l.mnemonic}</p></div></div></section><section class="card lesson-block"><h3>Đúng hay sai? Nhìn là hiểu</h3>${examples}</section><section class="card lesson-block"><h3>Mini Quiz · Kiểm tra ngay</h3><div class="mini-quiz-list">${l.quiz.map((q,qi)=>`<div class="mini-question"><p>${qi+1}. ${q.q}</p><div class="mini-options">${q.options.map((o,oi)=>`<button class="mini-option" data-q="${qi}" data-a="${oi}" data-correct="${q.answer}">${String.fromCharCode(65+oi)}. ${o}</button>`).join('')}</div></div>`).join('')}</div></section>`;
  }

  // Practice
  function renderTopics() {
    $('#practiceTopics').innerHTML = Object.keys(DATA.practice).map(t=>`<button class="topic-chip ${t===state.practiceTopic?'active':''}" data-topic="${t}">${t}</button>`).join('');
  }
  function renderPracticeQuestion() {
    const set = DATA.practice[state.practiceTopic]; if (state.questionIndex >= set.length) state.questionIndex=0;
    const q = set[state.questionIndex], total=set.length;
    $('#questionProgress').textContent=`Câu ${state.questionIndex+1} / ${total}`; $('#quizTopic').textContent=state.practiceTopic;
    $('#quizProgressBar').style.width=`${((state.questionIndex+1)/total)*100}%`;
    $('#practiceQuestion').innerHTML=`<div class="practice-q"><span class="q-number">Chọn đáp án đúng</span><h3>${q.q}</h3><div class="practice-options">${q.options.map((o,i)=>`<button class="practice-option" data-answer="${i}"><b>${String.fromCharCode(65+i)}</b><span>${o}</span></button>`).join('')}</div><div id="answerExplanation"></div></div>`;
    $('#nextQuestionBtn').disabled=true; $('#nextQuestionBtn').textContent=state.questionIndex===total-1?'Xem kết quả':'Câu tiếp theo';
  }
  async function answerPractice(index) {
    const q=DATA.practice[state.practiceTopic][state.questionIndex], buttons=$$('.practice-option');
    buttons.forEach(b=>b.disabled=true);
    try {
      const result=backendOnline&&q.id?await api.submitAttempt(q.id,index):{correct:index===q.answer,correctIndex:q.answer,explanation:q.explanation};
      buttons.forEach((b,i)=>{if(i===result.correctIndex)b.classList.add('correct');if(i===index&&i!==result.correctIndex)b.classList.add('wrong')});
      if(result.correct){state.correct++;showToast('Chính xác! Tuyệt vời 🎉')}else showToast('Chưa đúng — xem giải thích bên dưới nhé.');
      if(result.stats)state.stats=result.stats;else state.stats.exercises++;
      saveState();renderDashboard();
      $('#answerExplanation').innerHTML=`<div class="explanation"><strong>✦ AI giải thích</strong><p>${escapeHTML(result.explanation)}</p></div>`;$('#nextQuestionBtn').disabled=false;
    } catch(error) { buttons.forEach(b=>b.disabled=false);showToast(error.message); }
  }
  function nextPractice() {
    const total=DATA.practice[state.practiceTopic].length;
    if(state.questionIndex===total-1){
      const pct=Math.round((state.correct/total)*100); showToast(`Hoàn thành: ${state.correct}/${total} câu đúng (${pct}%).`);
      state.questionIndex=0;state.correct=0;
    } else state.questionIndex++;
    saveState();renderPracticeQuestion();
  }

  // AI giả lập. Thay nội dung hàm này bằng fetch tới backend của bạn.
  async function mockAIResponse(question) {
    const current=DATA.practice[state.practiceTopic][state.questionIndex];
    if(backendOnline&&current.id)return (await api.askTutor(current.id,question)).answer;
    await new Promise(r=>setTimeout(r,850));
    const q=current;
    const lower=question.toLowerCase();
    if(lower.includes('vì sao')||lower.includes('tại sao')) return `Điểm mấu chốt là dấu hiệu trong câu. ${q.explanation} Hãy gạch chân mốc thời gian hoặc từ nối trước khi chọn đáp án.`;
    if(lower.includes('đơn giản')||lower.includes('dễ hiểu')) return `Hiểu thật ngắn gọn thế này: “${q.options[q.answer]}” khớp cả nghĩa lẫn cấu trúc. Các lựa chọn khác thuộc sai thời điểm hoặc sai loại từ. Bạn thử đọc cả câu với đáp án đúng một lần nhé.`;
    return `Với câu này, đáp án đúng là “${q.options[q.answer]}”. ${q.explanation} Bẫy thường gặp: ${q.traps[0]}`;
  }

  /* Placeholder AI thật — KHÔNG đặt API key trực tiếp ở frontend khi triển khai thật.
  async function callRealAI(prompt) {
    const response = await fetch('/api/ai-tutor', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt }) });
    if (!response.ok) throw new Error('AI service unavailable');
    return (await response.json()).answer;
  }
  */

  function bindEvents() {
    $$('.nav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.target)));
    $$('[data-go]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.go)));
    $('#themeToggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=state.theme;saveState()});
    $('#reviewNowBtn').addEventListener('click',()=>{switchView('vocabulary');state.cardIndex=Math.max(0,state.vocab.findIndex(w=>w.status==='review'));renderFlashcard()});
    $('#quickTestBtn').addEventListener('click',()=>switchView('practice'));
    $('#flashcard').addEventListener('click',e=>{if(!e.target.closest('button'))$('#flashcard').classList.toggle('flipped')});
    $('#flashcard').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#flashcard').classList.toggle('flipped')}});
    $('#speakWord').addEventListener('click',e=>{e.stopPropagation();if(state.vocab.length)speak(state.vocab[state.cardIndex].word)});
    $('#prevCard').onclick=()=>{if(!state.vocab.length)return;state.cardIndex=(state.cardIndex-1+state.vocab.length)%state.vocab.length;saveState();renderFlashcard()};
    $('#nextCard').onclick=()=>{if(!state.vocab.length)return;state.cardIndex=(state.cardIndex+1)%state.vocab.length;saveState();renderFlashcard()};
    $$('.rating-btn').forEach(b=>b.addEventListener('click',async()=>{if(!state.vocab.length)return;const word=state.vocab[state.cardIndex];try{if(backendOnline)await api.updateVocabularyStatus(word.id,b.dataset.rate);word.status=b.dataset.rate;renderVocabTable();showToast(b.dataset.rate==='known'?'Đã ghi nhận là thuộc!':'Đã lên lịch ôn lại.');$('#nextCard').click()}catch(error){showToast(error.message)}}));
    $('#dictionaryForm').addEventListener('submit',e=>{e.preventDefault();dictionaryLookup($('#wordInput').value)});
    $('#vocabFilters').addEventListener('click',e=>{const b=e.target.closest('.filter');if(!b)return;$$('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderVocabTable(b.dataset.filter)});
    $('#vocabTableBody').addEventListener('click',async e=>{const b=e.target.closest('[data-delete]');if(!b)return;try{if(backendOnline)await api.deleteVocabulary(Number(b.dataset.delete));state.vocab=state.vocab.filter(w=>w.id!==Number(b.dataset.delete));state.cardIndex=0;renderVocabTable();renderFlashcard();showToast('Đã xóa từ khỏi sổ tay.')}catch(error){showToast(error.message)}});
    $('#grammarTree').addEventListener('click',e=>{const b=e.target.closest('[data-lesson]');if(b)renderGrammarLesson(b.dataset.lesson)});
    $('#grammarContent').addEventListener('click',e=>{const b=e.target.closest('.mini-option');if(!b)return;const parent=b.parentElement;$$('.mini-option',parent).forEach(x=>{x.disabled=true;if(Number(x.dataset.a)===Number(x.dataset.correct))x.classList.add('correct')});if(Number(b.dataset.a)!==Number(b.dataset.correct))b.classList.add('wrong')});
    $('#practiceTopics').addEventListener('click',e=>{const b=e.target.closest('[data-topic]');if(!b)return;state.practiceTopic=b.dataset.topic;state.questionIndex=0;state.correct=0;saveState();renderTopics();renderPracticeQuestion()});
    $('#practiceQuestion').addEventListener('click',e=>{const b=e.target.closest('[data-answer]');if(b&&!b.disabled)answerPractice(Number(b.dataset.answer))});
    $('#nextQuestionBtn').onclick=nextPractice;
    $('#askTutorBtn').onclick=()=>{$('#tutorPanel').scrollIntoView({behavior:'smooth',block:'center'});$('#chatInput').focus();const q=DATA.practice[state.practiceTopic][state.questionIndex];$('#chatMessages').innerHTML+=`<div class="message ai">Bạn đang hỏi về câu “${q.q}”. Chỗ nào làm bạn phân vân nhất?</div>`};
    $('#closeTutor').onclick=()=>showToast('Gia sư vẫn ở đây khi bạn cần nhé!');
    $('#chatForm').addEventListener('submit',async e=>{e.preventDefault();const input=$('#chatInput'),text=input.value.trim();if(!text)return;$('#chatMessages').innerHTML+=`<div class="message user">${escapeHTML(text)}</div><div class="message ai typing">Lio đang suy nghĩ...</div>`;input.value='';const box=$('#chatMessages');box.scrollTop=box.scrollHeight;const answer=await mockAIResponse(text);$('.typing').remove();box.innerHTML+=`<div class="message ai">${escapeHTML(answer)}</div>`;box.scrollTop=box.scrollHeight});
    $('#resetData').onclick=async()=>{localStorage.removeItem(STORAGE_KEY);state={...structuredClone(defaultState),theme:state.theme};await syncFromBackend();switchView('dashboard');showToast(backendOnline?'Đã tải lại dữ liệu từ máy chủ.':'Đang dùng dữ liệu demo offline.')};
  }
  function escapeHTML(value){const d=document.createElement('div');d.textContent=value;return d.innerHTML}

  async function init(){
    document.documentElement.dataset.theme=state.theme;renderDashboard();renderFlashcard();renderVocabTable();renderGrammarTree();renderGrammarLesson(state.currentLesson);renderTopics();renderPracticeQuestion();switchView(state.activeView);
    await syncFromBackend();
  }
  bindEvents(); init();
})();
