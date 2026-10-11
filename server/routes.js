import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { pool, withTransaction, mapVocabulary } from './db.js';
import { config } from './config.js';
import { HttpError, assertObject, cleanInteger, cleanStatus, cleanText } from './validation.js';

export const apiRouter = Router();

function currentUserId(req) {
  const value = req.get('x-user-id') || config.demoUserId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, 'User ID không hợp lệ.');
  }
  return value;
}

async function getStats(db, userId) {
  const { rows } = await db.query(
    `SELECT u.streak_count,
            COALESCE(s.learned_count, 0) AS learned_count,
            COALESCE(s.exercises_count, 0) AS exercises_count,
            COALESCE(s.correct_count, 0) AS correct_count,
            COALESCE(s.answer_count, 0) AS answer_count,
            COALESCE(s.weekly_goal_percent, 0) AS weekly_goal_percent,
            COALESCE(s.weekly_change_percent, 0) AS weekly_change_percent
       FROM users u LEFT JOIN user_stats s ON s.user_id = u.id
      WHERE u.id = $1`, [userId]
  );
  if (!rows[0]) throw new HttpError(404, 'Không tìm thấy hồ sơ người học. Hãy chạy lệnh seed dữ liệu.');
  const r = rows[0];
  return {
    streak: r.streak_count,
    learned: r.learned_count,
    exercises: r.exercises_count,
    accuracy: r.answer_count ? Math.round((r.correct_count / r.answer_count) * 100) : 0,
    weeklyGoal: r.weekly_goal_percent,
    weeklyChange: r.weekly_change_percent
  };
}

async function getDashboard(db, userId) {
  const [summaryResult, reviewResult, activityResult] = await Promise.all([
    db.query(
      `SELECT s.daily_goal_minutes, s.best_score, COALESCE(a.minutes,0) AS completed_minutes
         FROM user_stats s
         LEFT JOIN study_activity a ON a.user_id=s.user_id AND a.activity_date=CURRENT_DATE
        WHERE s.user_id=$1`, [userId]
    ),
    db.query(
      `SELECT title,subtitle,badge,icon FROM daily_reviews
        WHERE user_id=$1 ORDER BY sort_order,id`, [userId]
    ),
    db.query(
      `SELECT activity_date::text AS date,minutes,completed_items FROM study_activity
        WHERE user_id=$1 AND activity_date BETWEEN CURRENT_DATE-6 AND CURRENT_DATE
        ORDER BY activity_date`, [userId]
    )
  ]);
  const summary = summaryResult.rows[0] || { daily_goal_minutes:25, best_score:0, completed_minutes:0 };
  const target = Number(summary.daily_goal_minutes);
  const completed = Number(summary.completed_minutes);
  return {
    todayGoal: { completed, target, percent: Math.min(100, Math.round((completed / target) * 100)) },
    bestScore: Number(summary.best_score),
    reviews: reviewResult.rows,
    weekActivity: activityResult.rows.map(row => ({ date:row.date, minutes:Number(row.minutes), completedItems:Number(row.completed_items) }))
  };
}

async function getGrammar() {
  const { rows } = await pool.query('SELECT lesson_key, category, icon, title, level, content FROM grammar_lessons ORDER BY sort_order, lesson_key');
  const categories = new Map();
  for (const row of rows) {
    if (!categories.has(row.category)) categories.set(row.category, { category: row.category, icon: row.icon, lessons: [] });
    categories.get(row.category).lessons.push({ id: row.lesson_key, title: row.title, level: row.level, ...row.content });
  }
  return [...categories.values()];
}

async function getPractice() {
  const { rows } = await pool.query('SELECT id, topic, prompt, options FROM practice_questions ORDER BY topic, sort_order, id');
  return rows.reduce((all, row) => {
    (all[row.topic] ||= []).push({ id: Number(row.id), q: row.prompt, options: row.options });
    return all;
  }, {});
}

const toeicScoreTable = [[0,5],[10,55],[20,105],[30,155],[40,205],[50,255],[60,305],[70,360],[80,415],[90,460],[100,495]];
function estimateToeicSection(correct, total=100) {
  const normalized = Math.max(0, Math.min(100, Math.round((correct / Math.max(1,total)) * 100)));
  const upperIndex = toeicScoreTable.findIndex(([raw]) => raw >= normalized);
  if (upperIndex <= 0) return 5;
  const [lowerRaw, lowerScore] = toeicScoreTable[upperIndex - 1];
  const [upperRaw, upperScore] = toeicScoreTable[upperIndex];
  const estimated = lowerScore + ((normalized - lowerRaw) / (upperRaw - lowerRaw)) * (upperScore - lowerScore);
  return Math.round(estimated / 5) * 5;
}

function mapToeicQuestion(row, reveal=false) {
  const item = {
    id:row.id, part:row.part, type:row.question_type, number:row.question_number,
    prompt:row.prompt, options:row.options, difficulty:row.difficulty, tags:row.tags,
    imageUrl:row.image_url || null,
    asset:row.asset_id ? {
      id:row.asset_id, type:row.asset_type, title:row.asset_title, content:row.asset_content,
      translation:row.asset_translation, mediaUrl:row.media_url, metadata:row.asset_metadata
    } : null
  };
  if (reveal) Object.assign(item, {
    correctIndex:row.correct_index, explanation:row.explanation, translation:row.translation,
    selectedIndex:row.selected_index, flagged:row.flagged
  });
  else Object.assign(item, { selectedIndex:row.selected_index, flagged:row.flagged });
  return item;
}

async function getToeicSession(db, sessionId, userId, reveal=false) {
  const sessionResult = await db.query(
    `SELECT s.*,t.code,t.title,t.target_score,t.duration_minutes,t.description
       FROM toeic_sessions s JOIN toeic_tests t ON t.id=s.test_id
      WHERE s.id=$1 AND s.user_id=$2`, [sessionId,userId]
  );
  const session = sessionResult.rows[0];
  if (!session) throw new HttpError(404, 'Không tìm thấy phiên thi TOEIC.');
  const questionResult = await db.query(
    `SELECT q.*,a.selected_index,(s.flagged_questions ? q.id) AS flagged,
            x.asset_type,x.title AS asset_title,x.content AS asset_content,x.translation AS asset_translation,x.media_url,x.metadata AS asset_metadata,
            img.media_url AS image_url
       FROM toeic_questions q
       LEFT JOIN toeic_answers a ON a.question_id=q.id AND a.session_id=$1
       LEFT JOIN toeic_assets x ON x.id=q.asset_id
       LEFT JOIN toeic_assets img ON img.id=x.metadata->>'imageAssetId'
       JOIN toeic_sessions s ON s.id=$1
      WHERE q.test_id=s.test_id AND (s.selected_part IS NULL OR q.part=s.selected_part)
      ORDER BY q.question_number`, [sessionId]
  );
  return {
    id:session.id, testId:session.test_id, code:session.code, title:session.title,
    mode:session.mode, selectedPart:session.selected_part, status:session.status,
    startedAt:session.started_at, expiresAt:session.expires_at, submittedAt:session.submitted_at,
    currentQuestion:session.current_question, result:session.result,
    durationMinutes:session.duration_minutes, description:session.description,
    questions:questionResult.rows.map(row => mapToeicQuestion(row,reveal))
  };
}

apiRouter.get('/health', async (_req, res) => {
  const started = Date.now();
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected', latencyMs: Date.now() - started });
});

apiRouter.get('/bootstrap', async (req, res) => {
  const userId = currentUserId(req);
  const [userResult, vocabResult, stats, grammar, practice, dashboard] = await Promise.all([
    pool.query('SELECT id, name, level, streak_count FROM users WHERE id = $1', [userId]),
    pool.query('SELECT * FROM vocabulary WHERE user_id = $1 ORDER BY created_at DESC, id DESC', [userId]),
    getStats(pool, userId), getGrammar(), getPractice(), getDashboard(pool, userId)
  ]);
  if (!userResult.rows[0]) throw new HttpError(404, 'Không tìm thấy tài khoản demo. Hãy chạy pnpm db:seed.');
  res.json({
    profile: userResult.rows[0], stats,
    vocabulary: vocabResult.rows.map(mapVocabulary), grammar, practice, dashboard
  });
});

apiRouter.get('/vocabulary', async (req, res) => {
  const userId = currentUserId(req);
  const values = [userId];
  let sql = 'SELECT * FROM vocabulary WHERE user_id = $1';
  if (req.query.status) { values.push(cleanStatus(req.query.status)); sql += ' AND status = $2'; }
  sql += ' ORDER BY created_at DESC, id DESC';
  const { rows } = await pool.query(sql, values);
  res.json({ items: rows.map(mapVocabulary) });
});

apiRouter.post('/vocabulary', async (req, res) => {
  assertObject(req.body);
  const userId = currentUserId(req);
  const word = cleanText(req.body.word, 'word', 80);
  const collocations = Array.isArray(req.body.collocations) ? req.body.collocations.slice(0, 10).map(v => cleanText(v, 'collocation', 120)) : [];
  try {
    const { rows } = await pool.query(
      `INSERT INTO vocabulary (user_id, word, ipa, word_type, meaning, definition, example, collocations, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,'new') RETURNING *`,
      [userId, word, String(req.body.ipa || '').slice(0,120), cleanText(req.body.type || 'word','type',40), cleanText(req.body.meaning,'meaning',500), String(req.body.definition || '').slice(0,1000), String(req.body.example || '').slice(0,1000), JSON.stringify(collocations)]
    );
    res.status(201).json({ item: mapVocabulary(rows[0]) });
  } catch (error) {
    if (error.code === '23505') throw new HttpError(409, 'Từ này đã có trong sổ tay.');
    throw error;
  }
});

apiRouter.patch('/vocabulary/:id/status', async (req, res) => {
  const userId = currentUserId(req), status = cleanStatus(req.body?.status), id = Number(req.params.id);
  if (!Number.isSafeInteger(id)) throw new HttpError(400, 'ID từ vựng không hợp lệ.');
  const delay = status === 'known' ? '14 days' : status === 'review' ? '1 day' : '0 days';
  const item = await withTransaction(async client => {
    const previousResult = await client.query('SELECT status FROM vocabulary WHERE id=$1 AND user_id=$2 FOR UPDATE', [id,userId]);
    if (!previousResult.rows[0]) throw new HttpError(404, 'Không tìm thấy từ vựng.');
    const previousStatus = previousResult.rows[0].status;
    const { rows } = await client.query(
      `UPDATE vocabulary SET status=$1, next_review_at=NOW()+$2::interval, updated_at=NOW()
        WHERE id=$3 AND user_id=$4 RETURNING *`, [status, delay, id, userId]
    );
    const learnedDelta = previousStatus !== 'known' && status === 'known' ? 1 : previousStatus === 'known' && status !== 'known' ? -1 : 0;
    await client.query(
      `UPDATE user_stats SET learned_count=GREATEST(0,learned_count+$2),updated_at=NOW() WHERE user_id=$1`, [userId,learnedDelta]
    );
    return mapVocabulary(rows[0]);
  });
  res.json({ item });
});

apiRouter.delete('/vocabulary/:id', async (req, res) => {
  const userId = currentUserId(req), id = Number(req.params.id);
  if (!Number.isSafeInteger(id)) throw new HttpError(400, 'ID từ vựng không hợp lệ.');
  const result = await pool.query('DELETE FROM vocabulary WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!result.rowCount) throw new HttpError(404, 'Không tìm thấy từ vựng.');
  res.status(204).end();
});

apiRouter.get('/grammar', async (_req, res) => res.json({ categories: await getGrammar() }));

apiRouter.get('/practice', async (req, res) => {
  const topic = req.query.topic ? cleanText(req.query.topic, 'topic', 100) : null;
  const params = topic ? [topic] : [];
  const where = topic ? 'WHERE topic=$1' : '';
  const { rows } = await pool.query(`SELECT id, topic, prompt, options FROM practice_questions ${where} ORDER BY topic, sort_order, id`, params);
  res.json({ questions: rows.map(r => ({ id:Number(r.id), topic:r.topic, q:r.prompt, options:r.options })) });
});

apiRouter.post('/practice/attempts', async (req, res) => {
  assertObject(req.body);
  const userId = currentUserId(req), questionId = cleanInteger(req.body.questionId, 'questionId', 1, Number.MAX_SAFE_INTEGER), selectedIndex = cleanInteger(req.body.selectedIndex, 'selectedIndex', 0, 10);
  const payload = await withTransaction(async (client) => {
    const questionResult = await client.query('SELECT correct_index, explanation, traps FROM practice_questions WHERE id=$1 FOR SHARE', [questionId]);
    const q = questionResult.rows[0]; if (!q) throw new HttpError(404, 'Không tìm thấy câu hỏi.');
    const isCorrect = selectedIndex === q.correct_index;
    await client.query('INSERT INTO practice_attempts(user_id,question_id,selected_index,is_correct) VALUES($1,$2,$3,$4)', [userId,questionId,selectedIndex,isCorrect]);
    await client.query(
      `UPDATE user_stats SET exercises_count=exercises_count+1, answer_count=answer_count+1,
       correct_count=correct_count+$2, updated_at=NOW() WHERE user_id=$1`, [userId,isCorrect?1:0]
    );
    await client.query(
      `INSERT INTO study_activity(user_id,activity_date,minutes,completed_items) VALUES($1,CURRENT_DATE,1,1)
       ON CONFLICT(user_id,activity_date) DO UPDATE SET minutes=study_activity.minutes+1, completed_items=study_activity.completed_items+1`, [userId]
    );
    await client.query(
      `UPDATE users SET streak_count=CASE
         WHEN last_study_date=CURRENT_DATE THEN streak_count
         WHEN last_study_date=CURRENT_DATE-1 THEN streak_count+1 ELSE 1 END,
       last_study_date=CURRENT_DATE,updated_at=NOW() WHERE id=$1`, [userId]
    );
    return {
      correct:isCorrect, correctIndex:q.correct_index, explanation:q.explanation, traps:q.traps,
      stats:await getStats(client,userId), dashboard:await getDashboard(client,userId)
    };
  });
  res.status(201).json(payload);
});

apiRouter.get('/toeic/tests', async (req, res) => {
  const userId = currentUserId(req);
  const { rows } = await pool.query(
    `SELECT t.id,t.code,t.title,t.target_score,t.duration_minutes,t.description,
            200 AS question_count,
            s.id AS session_id,s.status,s.result,s.started_at,s.submitted_at
       FROM toeic_tests t
       LEFT JOIN LATERAL (
         SELECT id,status,result,started_at,submitted_at FROM toeic_sessions
          WHERE test_id=t.id AND user_id=$1 AND mode='exam'
          ORDER BY created_at DESC LIMIT 1
       ) s ON TRUE
      WHERE t.is_published=TRUE ORDER BY t.created_at,t.code`, [userId]
  );
  res.json({ tests:rows.map(row => ({
    id:row.id,code:row.code,title:row.title,targetScore:row.target_score,
    durationMinutes:row.duration_minutes,description:row.description,questionCount:row.question_count,
    latestSession:row.session_id ? { id:row.session_id,status:row.status,result:row.result,startedAt:row.started_at,submittedAt:row.submitted_at } : null
  })) });
});

apiRouter.post('/toeic/sessions', async (req, res) => {
  assertObject(req.body);
  const userId=currentUserId(req);
  const testId=cleanText(req.body.testId,'testId',80);
  const mode=req.body.mode === 'practice' ? 'practice' : 'exam';
  const selectedPart=mode === 'practice' ? cleanInteger(req.body.part,'part',1,7) : null;
  const duration=mode === 'exam' ? 120 : Math.max(5,Math.min(60,Number(req.body.durationMinutes) || 20));
  const test=await pool.query('SELECT id FROM toeic_tests WHERE id=$1 AND is_published=TRUE',[testId]);
  if (!test.rows[0]) throw new HttpError(404,'Không tìm thấy đề TOEIC.');
  const id=randomUUID();
  await pool.query(
    `INSERT INTO toeic_sessions(id,user_id,test_id,mode,selected_part,expires_at)
     VALUES($1,$2,$3,$4,$5,NOW()+($6 || ' minutes')::interval)`,
    [id,userId,testId,mode,selectedPart,duration]
  );
  res.status(201).json({ session:await getToeicSession(pool,id,userId,false) });
});

apiRouter.get('/toeic/sessions/:id', async (req, res) => {
  const userId=currentUserId(req);
  res.json({ session:await getToeicSession(pool,req.params.id,userId,false) });
});

apiRouter.patch('/toeic/sessions/:id', async (req, res) => {
  assertObject(req.body);
  const userId=currentUserId(req), sessionId=req.params.id;
  await withTransaction(async client => {
    const sessionResult=await client.query('SELECT * FROM toeic_sessions WHERE id=$1 AND user_id=$2 FOR UPDATE',[sessionId,userId]);
    const session=sessionResult.rows[0];
    if (!session) throw new HttpError(404,'Không tìm thấy phiên thi TOEIC.');
    if (session.status !== 'in_progress') throw new HttpError(409,'Phiên thi này đã kết thúc.');
    if (req.body.questionId && req.body.selectedIndex !== undefined) {
      const selected=cleanInteger(req.body.selectedIndex,'selectedIndex',0,3);
      const valid=await client.query(
        `SELECT 1 FROM toeic_questions WHERE id=$1 AND test_id=$2 AND ($3::smallint IS NULL OR part=$3)`,
        [req.body.questionId,session.test_id,session.selected_part]
      );
      if (!valid.rows[0]) throw new HttpError(400,'Câu hỏi không thuộc phiên thi này.');
      await client.query(
        `INSERT INTO toeic_answers(session_id,question_id,selected_index) VALUES($1,$2,$3)
         ON CONFLICT(session_id,question_id) DO UPDATE SET selected_index=EXCLUDED.selected_index,answered_at=NOW()`,
        [sessionId,req.body.questionId,selected]
      );
    }
    const current=req.body.currentQuestion === undefined ? session.current_question : cleanInteger(req.body.currentQuestion,'currentQuestion',1,200);
    const flagged=Array.isArray(req.body.flagged) ? req.body.flagged.filter(v=>typeof v==='string').slice(0,200) : session.flagged_questions;
    await client.query('UPDATE toeic_sessions SET current_question=$1,flagged_questions=$2::jsonb WHERE id=$3',[current,JSON.stringify(flagged),sessionId]);
  });
  res.json({ saved:true });
});

apiRouter.post('/toeic/sessions/:id/submit', async (req, res) => {
  const userId=currentUserId(req), sessionId=req.params.id;
  const result=await withTransaction(async client => {
    const sessionResult=await client.query('SELECT * FROM toeic_sessions WHERE id=$1 AND user_id=$2 FOR UPDATE',[sessionId,userId]);
    const session=sessionResult.rows[0];
    if (!session) throw new HttpError(404,'Không tìm thấy phiên thi TOEIC.');
    if (session.status !== 'in_progress') return session.result;
    const { rows }=await client.query(
      `SELECT q.part,q.id,q.correct_index,a.selected_index
         FROM toeic_questions q LEFT JOIN toeic_answers a ON a.question_id=q.id AND a.session_id=$1
        WHERE q.test_id=$2 AND ($3::smallint IS NULL OR q.part=$3) ORDER BY q.question_number`,
      [sessionId,session.test_id,session.selected_part]
    );
    const parts={}; let correct=0,unanswered=0;
    for (const row of rows) {
      const stat=parts[row.part] ||= { total:0,correct:0,unanswered:0 };
      stat.total++;
      if (row.selected_index === null) { stat.unanswered++; unanswered++; }
      else if (row.selected_index === row.correct_index) { stat.correct++; correct++; }
    }
    Object.values(parts).forEach(p=>{p.accuracy=Math.round((p.correct/p.total)*100);});
    const listeningTotal=rows.filter(r=>r.part<=4).length;
    const readingTotal=rows.filter(r=>r.part>=5).length;
    const listeningCorrect=rows.filter(r=>r.part<=4&&r.selected_index===r.correct_index).length;
    const readingCorrect=rows.filter(r=>r.part>=5&&r.selected_index===r.correct_index).length;
    const listeningScore=listeningTotal ? estimateToeicSection(listeningCorrect,listeningTotal) : 0;
    const readingScore=readingTotal ? estimateToeicSection(readingCorrect,readingTotal) : 0;
    const elapsedSeconds=Math.max(0,Math.round((Date.now()-new Date(session.started_at).getTime())/1000));
    const payload={
      total:rows.length,correct,wrong:rows.length-correct-unanswered,unanswered,
      accuracy:Math.round((correct/rows.length)*100),listeningCorrect,readingCorrect,
      listeningScore,readingScore,estimatedScore:listeningScore+readingScore,parts,elapsedSeconds,
      disclaimer:'Điểm TOEIC là ước tính theo bảng quy đổi tham khảo, không phải điểm thi chính thức.'
    };
    await client.query(`UPDATE toeic_sessions SET status='completed',submitted_at=NOW(),result=$1::jsonb WHERE id=$2`,[JSON.stringify(payload),sessionId]);
    return payload;
  });
  res.json({ result });
});

apiRouter.get('/toeic/sessions/:id/review', async (req, res) => {
  const userId=currentUserId(req);
  const session=await getToeicSession(pool,req.params.id,userId,true);
  if (session.status === 'in_progress') throw new HttpError(409,'Hãy nộp bài trước khi xem đáp án.');
  // Bổ sung ảnh Part 1 từ metadata audio mà không trộn transcript giữa các nhóm.
  const imageIds=session.questions.map(q=>q.asset?.metadata?.imageAssetId).filter(Boolean);
  if (imageIds.length) {
    const { rows }=await pool.query('SELECT id,media_url FROM toeic_assets WHERE id=ANY($1::varchar[])',[imageIds]);
    const images=Object.fromEntries(rows.map(r=>[r.id,r.media_url]));
    session.questions.forEach(q=>{if(q.asset?.metadata?.imageAssetId) q.imageUrl=images[q.asset.metadata.imageAssetId];});
  }
  res.json({ session });
});

function mapToeicVocabulary(row) {
  return {
    id:row.id,word:row.word,slug:row.slug,ipa:row.ipa,partOfSpeech:row.part_of_speech,
    meaningVi:row.meaning_vi,meaningEn:row.meaning_en,topic:row.topic,subTopic:row.sub_topic,
    level:row.level,toeicPriority:row.toeic_priority,exampleEn:row.example_en,exampleVi:row.example_vi,
    collocations:row.collocations,wordFamily:row.word_family,synonyms:row.synonyms,antonyms:row.antonyms,
    commonMistakes:row.common_mistakes,audioUrl:row.audio_url,tags:row.tags,source:row.source,
    status:row.status || 'new',favorite:Boolean(row.is_favorite),mastery:Number(row.mastery || 0),
    lastStudiedAt:row.last_studied_at,nextReviewAt:row.next_review_at
  };
}

apiRouter.get('/toeic/vocabulary/stats', async (req,res) => {
  const userId=currentUserId(req);
  const [summary,topics]=await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER(WHERE p.status='known')::int AS known,
              COUNT(*) FILTER(WHERE p.status='learning')::int AS learning,
              COUNT(*) FILTER(WHERE p.status='review')::int AS review,
              COUNT(*) FILTER(WHERE p.last_studied_at::date=CURRENT_DATE)::int AS today,
              COUNT(*) FILTER(WHERE p.is_favorite)::int AS favorites
         FROM toeic_vocabulary v LEFT JOIN toeic_vocab_progress p ON p.vocabulary_id=v.id AND p.user_id=$1`,[userId]
    ),
    pool.query(
      `SELECT v.topic,COUNT(*)::int AS total,COUNT(*) FILTER(WHERE p.status='known')::int AS known
         FROM toeic_vocabulary v LEFT JOIN toeic_vocab_progress p ON p.vocabulary_id=v.id AND p.user_id=$1
        GROUP BY v.topic ORDER BY v.topic`,[userId]
    )
  ]);
  const s=summary.rows[0];
  res.json({stats:{...s,new:s.total-s.known-s.learning-s.review,progress:s.total?Math.round((s.known/s.total)*100):0,topics:topics.rows}});
});

apiRouter.get('/toeic/vocabulary/meta', async (_req,res) => {
  const [topics,parts,levels]=await Promise.all([
    pool.query('SELECT topic,COUNT(*)::int AS count FROM toeic_vocabulary GROUP BY topic ORDER BY topic'),
    pool.query('SELECT part_of_speech AS value,COUNT(*)::int AS count FROM toeic_vocabulary GROUP BY part_of_speech ORDER BY count DESC'),
    pool.query('SELECT level,COUNT(*)::int AS count FROM toeic_vocabulary GROUP BY level ORDER BY level')
  ]);
  res.json({topics:topics.rows,partsOfSpeech:parts.rows,levels:levels.rows});
});

apiRouter.get('/toeic/vocabulary', async (req,res) => {
  const userId=currentUserId(req),values=[userId],where=[];
  const add=(sql,value)=>{values.push(value);where.push(sql.replace('?',`$${values.length}`));};
  if(req.query.search){const q=cleanText(req.query.search,'search',80);add('(v.word ILIKE ? OR v.meaning_vi ILIKE ?)',`%${q}%`);values.push(`%${q}%`);where[where.length-1]=where[where.length-1].replace(`$${values.length-1}`,`$${values.length-1}`).replace('?',`$${values.length}`);}
  if(req.query.topic)add('v.topic=?',cleanText(req.query.topic,'topic',120));
  if(req.query.partOfSpeech)add('v.part_of_speech=?',cleanText(req.query.partOfSpeech,'partOfSpeech',120));
  if(req.query.level)add('v.level=?',cleanText(req.query.level,'level',8));
  if(req.query.status)add(`COALESCE(p.status,'new')=?`,cleanText(req.query.status,'status',16));
  if(req.query.favorite==='true')where.push('p.is_favorite=TRUE');
  const page=Math.max(1,Number(req.query.page)||1),limit=Math.max(10,Math.min(100,Number(req.query.limit)||30));
  const order=req.query.sort==='priority'?'CASE v.toeic_priority WHEN \'high\' THEN 0 WHEN \'medium\' THEN 1 ELSE 2 END,v.word':req.query.sort==='level'?'v.level,v.word':'v.word';
  const clause=where.length?`WHERE ${where.join(' AND ')}`:'';
  const count=await pool.query(`SELECT COUNT(*)::int AS total FROM toeic_vocabulary v LEFT JOIN toeic_vocab_progress p ON p.vocabulary_id=v.id AND p.user_id=$1 ${clause}`,values);
  values.push(limit,(page-1)*limit);
  const {rows}=await pool.query(
    `SELECT v.*,p.status,p.is_favorite,p.mastery,p.last_studied_at,p.next_review_at
       FROM toeic_vocabulary v LEFT JOIN toeic_vocab_progress p ON p.vocabulary_id=v.id AND p.user_id=$1
       ${clause} ORDER BY ${order} LIMIT $${values.length-1} OFFSET $${values.length}`,values
  );
  res.json({items:rows.map(mapToeicVocabulary),pagination:{page,limit,total:count.rows[0].total,pages:Math.ceil(count.rows[0].total/limit)}});
});

apiRouter.get('/toeic/vocabulary/:id', async (req,res) => {
  const userId=currentUserId(req);
  const {rows}=await pool.query(
    `SELECT v.*,p.status,p.is_favorite,p.mastery,p.last_studied_at,p.next_review_at
       FROM toeic_vocabulary v LEFT JOIN toeic_vocab_progress p ON p.vocabulary_id=v.id AND p.user_id=$1 WHERE v.id=$2`,[userId,req.params.id]
  );
  if(!rows[0])throw new HttpError(404,'Không tìm thấy mục từ TOEIC.');
  res.json({item:mapToeicVocabulary(rows[0])});
});

apiRouter.patch('/toeic/vocabulary/:id/progress', async (req,res) => {
  assertObject(req.body);const userId=currentUserId(req),id=req.params.id;
  const valid=await pool.query('SELECT 1 FROM toeic_vocabulary WHERE id=$1',[id]);
  if(!valid.rows[0])throw new HttpError(404,'Không tìm thấy mục từ TOEIC.');
  const allowed=['new','learning','review','known'];
  const status=req.body.status===undefined?null:String(req.body.status);
  if(status!==null&&!allowed.includes(status))throw new HttpError(400,'Trạng thái học không hợp lệ.');
  const result=await withTransaction(async client=>{
    await client.query(
      `INSERT INTO toeic_vocab_progress(user_id,vocabulary_id,status,is_favorite,mastery,last_studied_at,next_review_at,learned_at)
       VALUES($1,$2,COALESCE($3,'new'),COALESCE($4,FALSE),CASE $3 WHEN 'known' THEN 100 WHEN 'review' THEN 40 WHEN 'learning' THEN 20 ELSE 0 END,
              CASE WHEN $3 IS NULL THEN NULL ELSE NOW() END,
              CASE $3 WHEN 'known' THEN NOW()+INTERVAL '30 days' WHEN 'review' THEN NOW()+INTERVAL '1 day' WHEN 'learning' THEN NOW()+INTERVAL '3 days' ELSE NULL END,
              CASE WHEN $3='known' THEN NOW() ELSE NULL END)
       ON CONFLICT(user_id,vocabulary_id) DO UPDATE SET
         status=COALESCE($3,toeic_vocab_progress.status),is_favorite=COALESCE($4,toeic_vocab_progress.is_favorite),
         mastery=CASE COALESCE($3,toeic_vocab_progress.status) WHEN 'known' THEN 100 WHEN 'review' THEN 40 WHEN 'learning' THEN 20 ELSE 0 END,
         last_studied_at=CASE WHEN $3 IS NULL THEN toeic_vocab_progress.last_studied_at ELSE NOW() END,
         next_review_at=CASE COALESCE($3,toeic_vocab_progress.status) WHEN 'known' THEN NOW()+INTERVAL '30 days' WHEN 'review' THEN NOW()+INTERVAL '1 day' WHEN 'learning' THEN NOW()+INTERVAL '3 days' ELSE NULL END,
         learned_at=CASE WHEN $3='known' THEN COALESCE(toeic_vocab_progress.learned_at,NOW()) ELSE toeic_vocab_progress.learned_at END`,
      [userId,id,status,typeof req.body.favorite==='boolean'?req.body.favorite:null]
    );
    const {rows}=await client.query(`SELECT v.*,p.status,p.is_favorite,p.mastery,p.last_studied_at,p.next_review_at FROM toeic_vocabulary v JOIN toeic_vocab_progress p ON p.vocabulary_id=v.id AND p.user_id=$1 WHERE v.id=$2`,[userId,id]);
    return mapToeicVocabulary(rows[0]);
  });
  res.json({item:result});
});

apiRouter.get('/toeic/vocabulary-quiz', async (req,res) => {
  const limit=Math.max(5,Math.min(20,Number(req.query.limit)||10));
  const {rows}=await pool.query(`SELECT id,word,meaning_vi,part_of_speech,level FROM toeic_vocabulary WHERE meaning_vi<>'' ORDER BY RANDOM() LIMIT $1`,[limit*4]);
  const selected=rows.slice(0,limit),poolMeanings=rows.map(r=>r.meaning_vi);
  const questions=selected.map((row,index)=>{
    const wrong=poolMeanings.filter(x=>x!==row.meaning_vi).slice(index,index+3);
    while(wrong.length<3)wrong.push(poolMeanings[(index+wrong.length+1)%poolMeanings.length]);
    const correctIndex=index%4,options=[...wrong];options.splice(correctIndex,0,row.meaning_vi);
    return {id:row.id,prompt:`“${row.word}” có nghĩa là gì?`,word:row.word,partOfSpeech:row.part_of_speech,level:row.level,options,correctIndex};
  });
  res.json({questions});
});

apiRouter.post('/dictionary', async (req, res) => {
  const term = cleanText(req.body?.term, 'term', 40).toLowerCase();
  if (!/^[a-z][a-z '\-]{0,39}$/.test(term)) throw new HttpError(400, 'Từ cần tra không hợp lệ.');
  let { rows } = await pool.query(
    'SELECT word,ipa,word_type AS type,meaning,definition,example,collocations FROM dictionary_entries WHERE word=$1', [term]
  );
  if (!rows[0]) {
    const generated = {
      word:term, ipa:'/ˈwɜːd/', type:'word', meaning:'Từ mới do người học thêm',
      definition:`A useful English word. Connect a dictionary provider to enrich “${term}”.`,
      example:`I am learning how to use “${term}” in context.`, collocations:[`use ${term}`,`learn ${term}`,`understand ${term}`]
    };
    ({ rows } = await pool.query(
      `INSERT INTO dictionary_entries(word,ipa,word_type,meaning,definition,example,collocations,source)
       VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,'generated')
       ON CONFLICT(word) DO UPDATE SET updated_at=NOW()
       RETURNING word,ipa,word_type AS type,meaning,definition,example,collocations`,
      [generated.word,generated.ipa,generated.type,generated.meaning,generated.definition,generated.example,JSON.stringify(generated.collocations)]
    ));
  }
  res.json({ entry: rows[0] });
});

apiRouter.post('/tutor', async (req, res) => {
  const userId = currentUserId(req), message = cleanText(req.body?.message, 'message', 1000), questionId = req.body?.questionId ? cleanInteger(req.body.questionId,'questionId',1,Number.MAX_SAFE_INTEGER) : null;
  const questionResult = questionId ? await pool.query('SELECT options,correct_index,explanation,traps FROM practice_questions WHERE id=$1',[questionId]) : {rows:[]};
  const q = questionResult.rows[0];
  const answer = q ? `Đáp án đúng là “${q.options[q.correct_index]}”. ${q.explanation} Bẫy thường gặp: ${q.traps[0] || 'hãy chú ý dấu hiệu ngữ cảnh trong câu.'}` : 'Hãy gửi kèm một câu hỏi luyện tập để mình có thể giải thích chính xác theo ngữ cảnh.';
  await withTransaction(async client => {
    await client.query('INSERT INTO tutor_messages(user_id,question_id,role,content) VALUES($1,$2,\'user\',$3)',[userId,questionId,message]);
    await client.query('INSERT INTO tutor_messages(user_id,question_id,role,content) VALUES($1,$2,\'assistant\',$3)',[userId,questionId,answer]);
  });
  res.status(201).json({ answer });
});

apiRouter.use((error, _req, res, _next) => {
  const status = error instanceof HttpError ? error.status : 500;
  if (status === 500) console.error('[api]', error);
  res.status(status).json({ error: { message: status === 500 ? 'Máy chủ gặp lỗi. Vui lòng thử lại.' : error.message, details:error.details } });
});
