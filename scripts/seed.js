import { pool, withTransaction } from '../server/db.js';
import { config } from '../server/config.js';
import { seedData as data } from '../db/seed-data.js';
import { curriculumCategories } from '../db/curriculum/index.js';

try {
  await withTransaction(async client => {
    await client.query(
      `INSERT INTO users(id,name,level,streak_count,last_study_date) VALUES($1,'Minh Nguyễn','B1',12,CURRENT_DATE)
       ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,level=EXCLUDED.level`, [config.demoUserId]
    );
    await client.query(
      `INSERT INTO user_stats(user_id,learned_count,exercises_count,correct_count,answer_count,weekly_goal_percent,weekly_change_percent,daily_goal_minutes,best_score)
       VALUES($1,184,36,87,100,68,14,25,8.6)
       ON CONFLICT(user_id) DO UPDATE SET weekly_change_percent=EXCLUDED.weekly_change_percent,
       daily_goal_minutes=EXCLUDED.daily_goal_minutes,best_score=GREATEST(user_stats.best_score,EXCLUDED.best_score)`, [config.demoUserId]
    );
    for (const word of data.vocabulary) {
      await client.query(
        `INSERT INTO vocabulary(user_id,word,ipa,word_type,meaning,definition,example,collocations,status)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) ON CONFLICT(user_id,LOWER(word)) DO NOTHING`,
        [config.demoUserId,word.word,word.ipa,word.type,word.meaning,word.definition,word.example,JSON.stringify(word.collocations),word.status]
      );
    }
    for (const entry of Object.values(data.dictionary)) {
      await client.query(
        `INSERT INTO dictionary_entries(word,ipa,word_type,meaning,definition,example,collocations,source)
         VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,'seed')
         ON CONFLICT(word) DO UPDATE SET ipa=EXCLUDED.ipa,word_type=EXCLUDED.word_type,meaning=EXCLUDED.meaning,
         definition=EXCLUDED.definition,example=EXCLUDED.example,collocations=EXCLUDED.collocations,updated_at=NOW()`,
        [entry.word,entry.ipa,entry.type,entry.meaning,entry.definition,entry.example,JSON.stringify(entry.collocations)]
      );
    }
    await client.query('DELETE FROM daily_reviews WHERE user_id=$1', [config.demoUserId]);
    for (let i=0;i<data.dailyReviews.length;i++) {
      const review=data.dailyReviews[i];
      await client.query(
        'INSERT INTO daily_reviews(user_id,title,subtitle,badge,icon,sort_order) VALUES($1,$2,$3,$4,$5,$6)',
        [config.demoUserId,review.title,review.subtitle,review.badge,review.icon,i]
      );
    }
    // Giáo trình là dữ liệu tham chiếu do hệ thống quản lý: làm mới để loại bài cũ/trùng.
    await client.query('DELETE FROM grammar_lessons');
    const grammarCategories = curriculumCategories;
    let lessonOrder=0;
    for (const category of grammarCategories) for (const lesson of category.lessons) {
      const {id,title,level,...content}=lesson;
      await client.query(
        `INSERT INTO grammar_lessons(lesson_key,category,icon,title,level,content,sort_order)
         VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)
         ON CONFLICT(lesson_key) DO UPDATE SET category=EXCLUDED.category,icon=EXCLUDED.icon,title=EXCLUDED.title,level=EXCLUDED.level,content=EXCLUDED.content,sort_order=EXCLUDED.sort_order,updated_at=NOW()`,
        [id,category.category,category.icon,title,level,JSON.stringify(content),lessonOrder++]
      );
    }
    for (const [topic,questions] of Object.entries(data.practice)) for (let i=0;i<questions.length;i++) {
      const q=questions[i];
      await client.query(
        `INSERT INTO practice_questions(topic,prompt,options,correct_index,explanation,traps,sort_order)
         VALUES($1,$2,$3::jsonb,$4,$5,$6::jsonb,$7)
         ON CONFLICT(topic,prompt) DO UPDATE SET options=EXCLUDED.options,correct_index=EXCLUDED.correct_index,explanation=EXCLUDED.explanation,traps=EXCLUDED.traps,sort_order=EXCLUDED.sort_order`,
        [topic,q.q,JSON.stringify(q.options),q.answer,q.explanation,JSON.stringify(q.traps),i]
      );
    }
  });
  console.log('✓ Dữ liệu mẫu đã được seed vào PostgreSQL.');
} finally { await pool.end(); }
