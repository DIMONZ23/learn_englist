const colors = ['blue', 'purple', 'cyan', 'orange'];

// Chuẩn hóa mọi bài học về cùng một cấu trúc 13 phần để UI tái sử dụng.
export function lesson(spec) {
  const formulaText = spec.formula.join(' + ');
  return {
    id: spec.id,
    title: spec.title,
    level: spec.level,
    summary: spec.summary,
    definition: spec.definition || spec.summary,
    role: spec.role,
    formula: spec.formula.map((text, index) => ({ t:text, c:colors[index % colors.length] })),
    positions: spec.positions,
    recognition: spec.recognition,
    rules: spec.rules,
    exceptions: spec.exceptions,
    examplesTranslated: [{ en:spec.good, vi:spec.translation }],
    examples: [{ good:spec.good, bad:spec.bad, note:spec.note }],
    commonMistakes: spec.mistakes,
    comparisons: spec.comparisons,
    mnemonic: spec.mnemonic,
    summaryPoints: [spec.summary, `Cấu trúc: ${formulaText}`, spec.mnemonic],
    quiz: [
      { ...spec.quiz, explanation:spec.quiz.explanation || spec.note },
      {
        q:`Cấu trúc trọng tâm của “${spec.title}” là gì?`,
        options:[formulaText, spec.bad, 'Không có quy tắc cố định', 'Luôn dùng V-ing'],
        answer:0,
        explanation:`Cấu trúc cốt lõi cần nhớ: ${formulaText}.`
      },
      {
        q:`Câu nào minh họa đúng “${spec.title}”?`,
        options:[spec.good, spec.bad, 'She very likes it.', 'He can to swim.'],
        answer:0,
        explanation:spec.note
      }
    ]
  };
}

export function category(category, icon, lessons) {
  return { category, icon, lessons:lessons.map(lesson) };
}
