import { pool, withTransaction } from '../server/db.js';
import { readFileSync } from 'node:fs';
import { config } from '../server/config.js';
import { seedData as data } from '../db/seed-data.js';
import { curriculumCategories } from '../db/curriculum/index.js';
import { toeicData } from '../db/toeic-data.js';

const toeicVocabulary = JSON.parse(readFileSync(new URL('../db/toeic-vocabulary.json', import.meta.url), 'utf8'));

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
    await client.query(
      `INSERT INTO toeic_tests(id,code,title,target_score,duration_minutes,description)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT(id) DO UPDATE SET code=EXCLUDED.code,title=EXCLUDED.title,target_score=EXCLUDED.target_score,
       duration_minutes=EXCLUDED.duration_minutes,description=EXCLUDED.description,is_published=TRUE`,
      [toeicData.test.id,toeicData.test.code,toeicData.test.title,toeicData.test.targetScore,toeicData.test.durationMinutes,toeicData.test.description]
    );
    await client.query('DELETE FROM toeic_assets WHERE test_id=$1', [toeicData.test.id]);
    for (const item of toeicData.assets) {
      await client.query(
        `INSERT INTO toeic_assets(id,test_id,asset_type,title,content,translation,media_url,metadata)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
        [item.id,toeicData.test.id,item.type,item.title,item.content,item.translation,item.mediaUrl,JSON.stringify(item.metadata)]
      );
    }
    for (const q of toeicData.questions) {
      await client.query(
        `INSERT INTO toeic_questions(id,test_id,part,question_type,question_number,asset_id,prompt,options,correct_index,explanation,translation,difficulty,tags)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13::jsonb)
         ON CONFLICT(id) DO UPDATE SET part=EXCLUDED.part,question_type=EXCLUDED.question_type,question_number=EXCLUDED.question_number,
         asset_id=EXCLUDED.asset_id,prompt=EXCLUDED.prompt,options=EXCLUDED.options,correct_index=EXCLUDED.correct_index,
         explanation=EXCLUDED.explanation,translation=EXCLUDED.translation,difficulty=EXCLUDED.difficulty,tags=EXCLUDED.tags`,
        [q.id,toeicData.test.id,q.part,q.questionType,q.questionNumber,q.assetId,q.prompt,JSON.stringify(q.options),q.correctIndex,q.explanation,q.translation,q.difficulty,JSON.stringify(q.tags)]
      );
    }
    for (const item of toeicVocabulary.entries) {
      await client.query(
        `INSERT INTO toeic_vocabulary(id,word,slug,ipa,part_of_speech,meaning_vi,meaning_en,topic,sub_topic,level,toeic_priority,
          example_en,example_vi,collocations,word_family,synonyms,antonyms,common_mistakes,audio_url,tags,source)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16::jsonb,$17::jsonb,$18,$19,$20::jsonb,$21)
         ON CONFLICT(id) DO UPDATE SET word=EXCLUDED.word,slug=EXCLUDED.slug,ipa=EXCLUDED.ipa,part_of_speech=EXCLUDED.part_of_speech,
          meaning_vi=EXCLUDED.meaning_vi,meaning_en=EXCLUDED.meaning_en,topic=EXCLUDED.topic,sub_topic=EXCLUDED.sub_topic,
          level=EXCLUDED.level,toeic_priority=EXCLUDED.toeic_priority,example_en=EXCLUDED.example_en,example_vi=EXCLUDED.example_vi,
          collocations=EXCLUDED.collocations,word_family=EXCLUDED.word_family,synonyms=EXCLUDED.synonyms,antonyms=EXCLUDED.antonyms,
          common_mistakes=EXCLUDED.common_mistakes,audio_url=EXCLUDED.audio_url,tags=EXCLUDED.tags,updated_at=NOW()`,
        [item.id,item.word,item.slug,item.ipa,item.partOfSpeech,item.meaningVi,item.meaningEn,item.topic,item.subTopic,item.level,item.toeicPriority,
         item.exampleEn,item.exampleVi,JSON.stringify(item.collocations),JSON.stringify(item.wordFamily),JSON.stringify(item.synonyms),JSON.stringify(item.antonyms),
         item.commonMistakes,item.audioUrl,JSON.stringify(item.tags),'Oxford list + minhqnd Dictionary (CC BY-SA 4.0)']
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
