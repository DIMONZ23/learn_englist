import { category } from './helpers.js';

const common = {
  positions:['Đầu câu làm chủ ngữ','Sau động từ hoặc giới từ tùy chức năng','Trong cụm từ theo trật tự tự nhiên'],
  recognition:['Nhìn hậu tố thường gặp','Xác định từ đứng trước và sau','Đặt từ vào ngữ cảnh thay vì học riêng lẻ'],
  exceptions:['Một từ có thể thuộc nhiều từ loại theo ngữ cảnh','Không suy đoán chỉ dựa vào hậu tố'],
  comparisons:['Từ loại là bản chất của từ; chức năng ngữ pháp là nhiệm vụ của từ trong câu.']
};

export const partsOfSpeechCategories = [category('Từ loại toàn diện', 'Aa', [
  {
    ...common, id:'pos-nouns', title:'Noun – Danh từ', level:'A1–B2',
    summary:'Danh từ gọi tên người, vật, nơi chốn, ý tưởng; gồm danh từ chung/riêng, đếm được/không đếm được, cụ thể/trừu tượng, tập hợp và ghép.',
    role:'Làm chủ ngữ, tân ngữ, bổ ngữ hoặc thành phần của cụm danh từ.', formula:['Determiner','Adjective','Noun'],
    rules:['Danh từ đếm được số ít cần từ hạn định','Thêm -s/-es cho số nhiều thông thường','Dùng ’s hoặc of để diễn đạt sở hữu'],
    good:'The experienced engineers solved the problem.', translation:'Những kỹ sư giàu kinh nghiệm đã giải quyết vấn đề.',
    bad:'She gave me an useful advice.', note:'Advice không đếm được; dùng “some useful advice”, không dùng an.',
    mistakes:['Đếm advice/information/equipment','Quên số nhiều sau many/several','Nhầm people với person'],
    mnemonic:'Tên người, nơi, vật, ý tưởng — gọi được tên thì nghĩ đến noun.',
    quiz:{q:'We need more ___ before deciding.',options:['informations','information','an information','informative'],answer:1,explanation:'Information là danh từ không đếm được.'}
  },
  {
    ...common, id:'pos-pronouns', title:'Pronoun – Đại từ', level:'A1–B2',
    summary:'Đại từ thay thế danh từ: nhân xưng, chủ ngữ/tân ngữ, sở hữu, phản thân, chỉ định, quan hệ, nghi vấn, bất định và tương hỗ.',
    role:'Tránh lặp danh từ và thể hiện ngôi, số, sở hữu hoặc quan hệ.', formula:['Subject pronoun','Verb','Object pronoun'],
    positions:['Đại từ chủ ngữ trước động từ','Đại từ tân ngữ sau động từ/giới từ','Đại từ sở hữu đứng độc lập'],
    rules:['I/he/she/we/they làm chủ ngữ','me/him/her/us/them làm tân ngữ','my + noun nhưng mine đứng một mình'],
    good:'Lan called me because she needed help.', translation:'Lan gọi cho tôi vì cô ấy cần giúp đỡ.',
    bad:'Me and Nam are classmates.', note:'Ở vị trí chủ ngữ phải dùng “Nam and I”.',
    mistakes:['Dùng me ở vị trí chủ ngữ','Nhầm your và yours','Dùng themself thay themselves trong văn phong chuẩn'],
    mnemonic:'Ai làm dùng subject; ai nhận tác động dùng object.',
    comparisons:['My là possessive determiner cần danh từ; mine là possessive pronoun đứng độc lập.'],
    quiz:{q:'This laptop is not mine; it is ___.',options:['her','hers','she','herself'],answer:1,explanation:'Hers là đại từ sở hữu và không cần danh từ theo sau.'}
  },
  {
    ...common, id:'pos-verbs', title:'Verb – Động từ', level:'A1–C1',
    summary:'Động từ biểu thị hành động, trạng thái hoặc liên kết; gồm main/auxiliary, transitive/intransitive, regular/irregular, modal, phrasal và causative verbs.',
    role:'Tạo vị ngữ và mang thông tin về thì, thể, thái và sự hòa hợp.', formula:['Subject','Auxiliary','Main verb'],
    positions:['Sau chủ ngữ trong mệnh đề','Sau modal dùng bare infinitive','Sau to thường dùng nguyên mẫu'],
    rules:['Chia động từ theo chủ ngữ và thời','Ngoại động từ cần tân ngữ','Stative verbs thường không dùng tiếp diễn'],
    good:'She has completed the report.', translation:'Cô ấy đã hoàn thành báo cáo.',
    bad:'He can to drive.', note:'Sau modal can dùng động từ nguyên mẫu không “to”: can drive.',
    mistakes:['Quên -s ngôi thứ ba','Dùng did + V2','Dùng know/like ở tiếp diễn không phù hợp'],
    mnemonic:'Modal không “to”, did kéo động từ về nguyên mẫu.',
    quiz:{q:'She ___ English every day.',options:['study','studies','studying','is study'],answer:1,explanation:'Chủ ngữ ngôi ba số ít ở hiện tại đơn dùng studies.'}
  },
  {
    ...common, id:'pos-adjectives', title:'Adjective – Tính từ', level:'A1–B2',
    summary:'Tính từ mô tả đặc điểm, số lượng hoặc trạng thái; gồm descriptive, quantitative, demonstrative, possessive, comparative và participial adjectives.',
    role:'Bổ nghĩa danh từ hoặc làm bổ ngữ sau linking verb.', formula:['Opinion','Size/Age','Color/Origin','Noun'],
    positions:['Trước danh từ','Sau be/seem/become/feel','Sau something/anything'],
    rules:['Tuân theo thứ tự OSASCOMP khi có nhiều tính từ','Dùng -ed cho cảm xúc, -ing cho tác nhân','Không thêm -ly cho tính từ'],
    good:'She bought a beautiful small Italian bag.', translation:'Cô ấy mua một chiếc túi Ý nhỏ xinh.',
    bad:'The lesson was bored.', note:'Bài học gây cảm giác chán nên dùng boring; người học mới bored.',
    mistakes:['Nhầm bored/boring','Dùng beautifully trước danh từ','Sai thứ tự tính từ'],
    mnemonic:'Opinion trước, noun sau; người -ed, vật -ing.',
    quiz:{q:'The movie was so ___ that everyone cried.',options:['moved','moving','move','movingly'],answer:1,explanation:'Bộ phim gây cảm xúc nên dùng tính từ -ing.'}
  },
  {
    ...common, id:'pos-adverbs', title:'Adverb – Trạng từ', level:'A2–B2',
    summary:'Trạng từ bổ nghĩa động từ, tính từ, trạng từ khác hoặc cả câu: manner, time, place, frequency, degree, sentence và focusing adverbs.',
    role:'Cho biết cách thức, thời gian, nơi chốn, tần suất, mức độ hoặc thái độ người nói.', formula:['Subject','Frequency adverb','Verb','Manner'],
    positions:['Trạng từ tần suất trước động từ thường, sau be','Manner thường cuối câu','Sentence adverb thường đầu câu'],
    rules:['Nhiều trạng từ cách thức = adjective + ly','Hard và hardly khác nghĩa','Fast vừa là tính từ vừa là trạng từ'],
    good:'She usually speaks English confidently.', translation:'Cô ấy thường nói tiếng Anh một cách tự tin.',
    bad:'He drives very careful.', note:'Bổ nghĩa động từ drives phải dùng carefully.',
    mistakes:['Dùng adjective sau động từ hành động','Nhầm hard/hardly','Đặt always trước be'],
    mnemonic:'Trạng từ chăm động từ; be đứng trước trạng từ tần suất.',
    quiz:{q:'He completed the task ___.',options:['successful','success','successfully','succeed'],answer:2,explanation:'Cần trạng từ bổ nghĩa completed.'}
  },
  {
    ...common, id:'pos-prepositions', title:'Preposition – Giới từ', level:'A1–B2',
    summary:'Giới từ thể hiện quan hệ thời gian, nơi chốn, hướng, chuyển động, cách thức, nguyên nhân và mục đích.',
    role:'Mở đầu cụm giới từ bổ nghĩa cho danh từ, động từ hoặc cả mệnh đề.', formula:['Preposition','Noun / Pronoun / V-ing'],
    positions:['Trước danh từ/đại từ/V-ing','Cuối câu hỏi trong giao tiếp tự nhiên','Trong cụm cố định với verb/adjective/noun'],
    rules:['At + giờ/điểm; on + ngày/bề mặt; in + tháng/năm/không gian','Since + mốc; for + khoảng','By + hạn chót; during + danh từ chỉ giai đoạn'],
    good:'The meeting starts at nine on Monday.', translation:'Cuộc họp bắt đầu lúc chín giờ vào thứ Hai.',
    bad:'I have lived here since five years.', note:'Khoảng thời gian dùng for five years; since cần mốc bắt đầu.',
    mistakes:['in Monday','married with','discuss about'],
    mnemonic:'At điểm nhỏ, on bề mặt/ngày, in không gian dài rộng.',
    quiz:{q:'We have worked here ___ 2020.',options:['for','since','during','by'],answer:1,explanation:'2020 là mốc thời gian nên dùng since.'}
  },
  {
    ...common, id:'pos-conjunctions', title:'Conjunction – Liên từ', level:'A2–B2',
    summary:'Liên từ nối từ, cụm hoặc mệnh đề; gồm coordinating, subordinating và correlative conjunctions.',
    role:'Biểu thị quan hệ bổ sung, tương phản, nguyên nhân, kết quả, điều kiện hoặc lựa chọn.', formula:['Clause','Conjunction','Clause'],
    positions:['Giữa hai thành phần ngang hàng','Đầu mệnh đề phụ','Theo cặp both…and, either…or'],
    rules:['FANBOYS nối hai mệnh đề độc lập','Although không đi cùng but','Because + clause; because of + noun/V-ing'],
    good:'Although it rained, we continued the trip.', translation:'Mặc dù trời mưa, chúng tôi vẫn tiếp tục chuyến đi.',
    bad:'Although it rained, but we continued.', note:'Không dùng đồng thời although và but.',
    mistakes:['Although...but','Because...so','Nhầm however là conjunction'],
    mnemonic:'Một quan hệ chỉ cần một cầu nối.',
    quiz:{q:'I stayed home ___ I was sick.',options:['because','because of','although but','however'],answer:0,explanation:'Sau chỗ trống là mệnh đề nên dùng because.'}
  },
  {
    ...common, id:'pos-interjections', title:'Interjection – Thán từ', level:'A1–B1',
    summary:'Thán từ biểu đạt cảm xúc hoặc phản ứng tức thời như wow, oh, ouch, hey, well.',
    role:'Tạo sắc thái giao tiếp nhưng không giữ vai trò cú pháp chính trong câu.', formula:['Interjection',', / !','Sentence'],
    positions:['Thường ở đầu phát ngôn','Đứng độc lập hoặc ngăn bằng dấu phẩy/chấm than'],
    rules:['Dùng phù hợp mức độ trang trọng','Chấm than tăng cường cảm xúc','Không lạm dụng trong văn học thuật'],
    good:'Wow! That presentation was impressive.', translation:'Ồ! Bài thuyết trình đó thật ấn tượng.',
    bad:'Dear manager, wow, I need leave.', note:'Wow không phù hợp email trang trọng.',
    mistakes:['Lạm dụng trong TOEIC Writing','Nhầm well là trạng từ trong mọi ngữ cảnh'],
    mnemonic:'Thán từ bật cảm xúc, đứng ngoài bộ khung câu.',
    quiz:{q:'Từ nào là thán từ thể hiện đau đớn?',options:['Ouch!','Therefore','Quickly','Because'],answer:0,explanation:'Ouch! là phản ứng khi đau.'}
  },
  {
    ...common, id:'pos-determiners', title:'Determiners – Từ hạn định', level:'A1–B2',
    summary:'Từ hạn định giới hạn danh từ: articles, demonstratives, possessives, quantifiers, distributives và numbers.',
    role:'Cho biết danh từ nào, của ai, bao nhiêu hoặc mức độ xác định.', formula:['Predeterminer','Central determiner','Number','Noun'],
    positions:['Đầu cụm danh từ','Trước adjective + noun','Không dùng hai central determiners cùng lúc'],
    rules:['A/an với danh từ đếm được số ít chưa xác định','Many/few với countable; much/little với uncountable','Each + singular noun'],
    good:'Every employee received an email.', translation:'Mỗi nhân viên đều nhận được một email.',
    bad:'Every employees received email.', note:'Sau every dùng danh từ số ít; email số ít cần mạo từ.',
    mistakes:['Every people','Much books','The my car'],
    mnemonic:'Determiner đứng gác cổng trước noun.',
    quiz:{q:'There are ___ seats available.',options:['a little','much','a few','every'],answer:2,explanation:'Seats đếm được số nhiều nên dùng a few.'}
  },
  {
    ...common, id:'pos-numerals', title:'Numerals – Số từ', level:'A1–B1',
    summary:'Số từ gồm số đếm, số thứ tự, phân số, thập phân và cách đọc số trong ngày tháng, tiền, điện thoại.',
    role:'Xác định số lượng hoặc thứ tự của danh từ.', formula:['Cardinal / Ordinal','Noun'],
    positions:['Trước danh từ','Sau the trong số thứ tự','Trong biểu thức đo lường'],
    rules:['Two hundred không thêm s khi có số cụ thể','Hundreds of có -s','Twenty-first có gạch nối'],
    good:'She finished in second place.', translation:'Cô ấy về đích ở vị trí thứ hai.',
    bad:'The project cost two hundreds dollars.', note:'Sau số cụ thể dùng two hundred, không thêm -s.',
    mistakes:['Two hundreds','The three floor','Sai cách đọc 1.5'],
    mnemonic:'Có số cụ thể: hundred không s; ước lượng: hundreds of.',
    quiz:{q:'Choose the correct phrase.',options:['three hundreds people','three hundred people','three hundreds of people','third hundred people'],answer:1,explanation:'Sau số cụ thể, hundred không thêm s.'}
  },
  {
    ...common, id:'pos-question-words', title:'Question words – Từ để hỏi', level:'A1–B2',
    summary:'Who, whom, whose, what, which, when, where, why và how tạo câu hỏi trực tiếp hoặc mệnh đề nghi vấn gián tiếp.',
    role:'Yêu cầu thông tin về người, vật, lựa chọn, thời gian, nơi chốn, lý do hoặc cách thức.', formula:['Wh-word','Auxiliary','Subject','Verb'],
    positions:['Đầu câu hỏi trực tiếp','Đầu mệnh đề danh từ','Wh-word có thể tự làm chủ ngữ'],
    rules:['Câu hỏi tân ngữ cần trợ động từ','Câu hỏi chủ ngữ không dùng do/does/did','Câu hỏi gián tiếp dùng trật tự khẳng định'],
    good:'Could you tell me where the station is?', translation:'Bạn có thể cho tôi biết nhà ga ở đâu không?',
    bad:'Could you tell me where is the station?', note:'Câu hỏi gián tiếp dùng trật tự subject + verb.',
    mistakes:['Đảo trợ động từ trong câu hỏi gián tiếp','Nhầm what/which','Dùng who cho sở hữu'],
    mnemonic:'Hỏi trực tiếp thì đảo; hỏi gián tiếp thì trả trật tự về thẳng.',
    quiz:{q:'Do you know ___?',options:['where does he live','where he lives','where lives he','he lives where'],answer:1,explanation:'Mệnh đề hỏi gián tiếp dùng trật tự khẳng định.'}
  },
  {
    ...common, id:'pos-particles-word-families', title:'Particles, Collocations & Word Families', level:'B1–C1',
    summary:'Tiểu từ tạo phrasal verbs; collocations là kết hợp từ tự nhiên; word families liên kết noun–verb–adjective–adverb.',
    role:'Tạo nghĩa mới, giúp diễn đạt tự nhiên và nhận diện loại từ trong TOEIC.', formula:['Root','Affix / Particle','New meaning'],
    positions:['Particle sau verb hoặc sau object tùy loại','Collocation theo mẫu verb+noun/adjective+noun','Affix gắn trước/sau gốc từ'],
    rules:['Tra phrasal verb như một đơn vị nghĩa','Học collocation theo cụm','Nhận diện -tion/-ment, -ive/-al, -ly'],
    good:'The company carried out extensive research.', translation:'Công ty đã tiến hành nghiên cứu sâu rộng.',
    bad:'The company made an extensive research.', note:'Collocation tự nhiên là conduct/carry out research; research thường không đếm được.',
    mistakes:['Dịch từng từ phrasal verb','Kết hợp make/do tùy ý','Dùng sai dạng từ trong TOEIC Part 5'],
    mnemonic:'Đừng học từ cô đơn: học cả gia đình và bạn đồng hành.',
    quiz:{q:'The suffix “-ment” thường tạo ___.',options:['noun','verb','adverb','preposition'],answer:0,explanation:'-ment thường tạo danh từ: develop → development.'}
  }
])];
