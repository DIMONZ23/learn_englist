import { Router } from 'express';
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
