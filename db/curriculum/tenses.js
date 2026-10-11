import { category } from './helpers.js';

function tense(spec) {
  return {
    positions:['Trợ động từ đứng sau chủ ngữ','Not đứng sau trợ động từ trong câu phủ định','Trợ động từ đảo lên trước chủ ngữ trong câu hỏi'],
    recognition:spec.signals,
    role:'Định vị hành động theo thời gian và thể hiện nó là thói quen, đang diễn ra, đã hoàn tất hay kéo dài.',
    rules:[`Khẳng định: ${spec.affirmative}`,`Phủ định: ${spec.negative}`,`Nghi vấn: ${spec.question}`],
    exceptions:spec.exceptions || ['Chú ý động từ bất quy tắc','Một số trạng từ chỉ là dấu hiệu gợi ý, không quyết định thì nếu ngữ cảnh khác'],
    mistakes:[spec.note,'Chọn thì chỉ theo từ khóa mà bỏ qua ngữ cảnh','Quên chia trợ động từ theo chủ ngữ'],
    comparisons:spec.comparisons,
    mnemonic:spec.mnemonic,
    ...spec
  };
}

export const tenseCategories = [category('12 thì & Tương lai', '◷', [
  tense({
    id:'present-simple',title:'Present Simple – Hiện tại đơn',level:'A1',summary:'Thói quen, sự thật, lịch trình và trạng thái ổn định.',
    formula:['S','V(s/es)'],affirmative:'S + V(s/es)',negative:'S + do/does not + V',question:'Do/Does + S + V?',signals:['always, usually, often, every day','facts and schedules'],
    good:'The train leaves at 6:30 every morning.',translation:'Tàu rời ga lúc 6:30 mỗi sáng.',bad:'The train is leave at 6:30.',note:'Hiện tại đơn không dùng be trước động từ thường.',
    comparisons:['Present Simple: thói quen; Present Continuous: đang diễn ra/tạm thời.'],mnemonic:'Đều đặn, sự thật, lịch trình — hiện tại đơn.',
    quiz:{q:'She usually ___ to work by bus.',options:['go','goes','is going','went'],answer:1,explanation:'Usually chỉ thói quen; she dùng goes.'}
  }),
  tense({
    id:'present-continuous',title:'Present Continuous – Hiện tại tiếp diễn',level:'A1',summary:'Hành động đang diễn ra, tình huống tạm thời, thay đổi hoặc kế hoạch đã sắp xếp.',
    formula:['S','am/is/are','V-ing'],affirmative:'S + am/is/are + V-ing',negative:'S + am/is/are not + V-ing',question:'Am/Is/Are + S + V-ing?',signals:['now, right now, at the moment','Look!, Listen!'],
    exceptions:['Stative verbs như know, believe, own thường không dùng tiếp diễn','Một số stative verbs đổi nghĩa khi dùng tiếp diễn: think, have, see'],
    good:'I am meeting the client tomorrow.',translation:'Tôi sẽ gặp khách hàng vào ngày mai theo lịch đã sắp xếp.',bad:'I am knowing the answer.',note:'Know là stative verb nên thường dùng Present Simple.',
    comparisons:['Present Continuous: đang/tạm thời; Present Simple: thường xuyên/ổn định.'],mnemonic:'Be + ing: hành động đang chuyển động.',
    quiz:{q:'Look! It ___.',options:['rains','is raining','rained','has rained'],answer:1,explanation:'Look! báo hiệu hành động đang diễn ra.'}
  }),
  tense({
    id:'present-perfect',title:'Present Perfect – Hiện tại hoàn thành',level:'B1',summary:'Trải nghiệm, kết quả hiện tại hoặc hành động bắt đầu trong quá khứ còn tiếp diễn.',
    formula:['S','have/has','V3'],affirmative:'S + have/has + V3',negative:'S + have/has not + V3',question:'Have/Has + S + V3?',signals:['already, just, yet, ever, never','since, for, so far'],
    good:'She has worked here since 2020.',translation:'Cô ấy làm việc ở đây từ năm 2020 đến nay.',bad:'I have seen him yesterday.',note:'Yesterday là mốc đã kết thúc nên dùng Past Simple.',
    comparisons:['Present Perfect không đi với mốc quá khứ đã kết thúc; Past Simple có mốc rõ.'],mnemonic:'Đã xảy ra, không chốt lúc, kết quả còn đây.',
    quiz:{q:'___ you ever visited Singapore?',options:['Did','Have','Do','Are'],answer:1,explanation:'Ever hỏi trải nghiệm dùng Present Perfect.'}
  }),
  tense({
    id:'present-perfect-continuous',title:'Present Perfect Continuous – Hiện tại hoàn thành tiếp diễn',level:'B2',summary:'Nhấn mạnh quá trình bắt đầu trong quá khứ, kéo dài đến hiện tại hoặc vừa dừng và còn dấu vết.',
    formula:['S','have/has been','V-ing'],affirmative:'S + have/has been + V-ing',negative:'S + have/has not been + V-ing',question:'Have/Has + S + been + V-ing?',signals:['for, since, all day','lately, recently'],
    exceptions:['Không dùng với nhiều stative verbs','Nhấn quá trình; Present Perfect thường nhấn kết quả/số lượng'],
    good:'They have been studying for three hours.',translation:'Họ đã học liên tục trong ba giờ.',bad:'I have been knowing her for years.',note:'Know là stative verb; dùng have known.',
    comparisons:['I have read three books (kết quả); I have been reading (quá trình).'],mnemonic:'Have been + ing: kéo dài và còn hơi thở.',
    quiz:{q:'He is tired because he ___ all morning.',options:['ran','has run','has been running','runs'],answer:2,explanation:'Nhấn quá trình vừa diễn ra và để lại kết quả mệt.'}
  }),
  tense({
    id:'past-simple',title:'Past Simple – Quá khứ đơn',level:'A2',summary:'Hành động hoặc chuỗi sự kiện đã kết thúc tại thời điểm xác định trong quá khứ.',
    formula:['S','V2/V-ed'],affirmative:'S + V2/V-ed',negative:'S + did not + V',question:'Did + S + V?',signals:['yesterday, ago, last...','in 2020, when I was...'],
    good:'We signed the contract last Friday.',translation:'Chúng tôi đã ký hợp đồng thứ Sáu tuần trước.',bad:'Did you went there?',note:'Sau did dùng động từ nguyên mẫu go.',
    comparisons:['Past Simple: đã kết thúc; Present Perfect: còn liên hệ hiện tại.'],mnemonic:'Có mốc quá khứ đã khép — dùng V2.',
    quiz:{q:'They ___ the office two hours ago.',options:['leave','left','have left','are leaving'],answer:1,explanation:'Ago là dấu hiệu quá khứ đơn.'}
  }),
  tense({
    id:'past-continuous',title:'Past Continuous – Quá khứ tiếp diễn',level:'A2',summary:'Hành động đang diễn ra tại một thời điểm quá khứ hoặc làm nền cho hành động khác.',
    formula:['S','was/were','V-ing'],affirmative:'S + was/were + V-ing',negative:'S + was/were not + V-ing',question:'Was/Were + S + V-ing?',signals:['at 8 p.m. yesterday','while, when'],
    good:'I was driving when she called.',translation:'Tôi đang lái xe thì cô ấy gọi.',bad:'I drove when she was calling me.',note:'Hành động nền dài dùng Past Continuous; sự kiện chen vào dùng Past Simple.',
    comparisons:['While thường đi với quá trình; when thường giới thiệu sự kiện chen vào.'],mnemonic:'Was/were + ing dựng phông quá khứ.',
    quiz:{q:'At nine last night, we ___ dinner.',options:['had','were having','have had','are having'],answer:1,explanation:'Một thời điểm cụ thể trong quá khứ dùng Past Continuous.'}
  }),
  tense({
    id:'past-perfect',title:'Past Perfect – Quá khứ hoàn thành',level:'B1',summary:'Hành động hoàn tất trước một hành động hoặc mốc khác trong quá khứ.',
    formula:['S','had','V3'],affirmative:'S + had + V3',negative:'S + had not + V3',question:'Had + S + V3?',signals:['by the time, before, after','already, never before'],
    good:'The film had started before we arrived.',translation:'Bộ phim đã bắt đầu trước khi chúng tôi đến.',bad:'The film has started before we arrived.',note:'Cả hai mốc ở quá khứ; hành động xảy ra trước dùng had started.',
    comparisons:['Past Perfect là “quá khứ của quá khứ”; Past Simple là sự kiện sau.'],mnemonic:'Hai việc quá khứ: việc trước dùng had + V3.',
    quiz:{q:'By the time I arrived, they ___.',options:['left','have left','had left','were leave'],answer:2,explanation:'Rời đi xảy ra trước lúc tôi đến.'}
  }),
  tense({
    id:'past-perfect-continuous',title:'Past Perfect Continuous – Quá khứ hoàn thành tiếp diễn',level:'B2',summary:'Nhấn mạnh quá trình kéo dài trước một thời điểm/sự kiện trong quá khứ.',
    formula:['S','had been','V-ing'],affirmative:'S + had been + V-ing',negative:'S + had not been + V-ing',question:'Had + S + been + V-ing?',signals:['for... before','since... when','all day before'],
    exceptions:['Không dùng với nhiều stative verbs','Có thể dùng Past Perfect khi cần nhấn kết quả thay vì quá trình'],
    good:'She had been working for hours before the system failed.',translation:'Cô ấy đã làm việc nhiều giờ trước khi hệ thống lỗi.',bad:'She was working for hours before it failed.',note:'Khi cần nhấn khoảng thời gian kéo dài trước mốc khác, dùng had been working.',
    comparisons:['Past Continuous: đang tại một mốc; Past Perfect Continuous: kéo dài trước mốc.'],mnemonic:'Had been + ing: quá trình dài trước một quá khứ khác.',
    quiz:{q:'He was exhausted because he ___ all night.',options:['worked','was working','had been working','has worked'],answer:2,explanation:'Quá trình làm việc kéo dài trước trạng thái kiệt sức.'}
  }),
  tense({
    id:'future-simple',title:'Future Simple – Tương lai đơn',level:'A2',summary:'Quyết định tức thời, lời hứa, đề nghị và dự đoán dựa trên ý kiến.',
    formula:['S','will','V'],affirmative:'S + will + V',negative:'S + will not + V',question:'Will + S + V?',signals:['tomorrow, next...','I think, probably, perhaps'],
    good:'I think sales will improve next month.',translation:'Tôi nghĩ doanh số sẽ cải thiện tháng tới.',bad:'I will to call you.',note:'Sau will dùng bare infinitive, không có to.',
    comparisons:['Will: quyết định tức thời/dự đoán ý kiến; be going to: kế hoạch hoặc bằng chứng.'],mnemonic:'Nghĩ, hứa, quyết ngay — will đi cùng V.',
    quiz:{q:'The phone is ringing. I ___ it.',options:['answer','am answering yesterday','will answer','answered'],answer:2,explanation:'Quyết định ngay lúc nói dùng will.'}
  }),
  tense({
    id:'future-continuous',title:'Future Continuous – Tương lai tiếp diễn',level:'B1',summary:'Hành động sẽ đang diễn ra tại một thời điểm tương lai hoặc câu hỏi lịch sự về kế hoạch.',
    formula:['S','will be','V-ing'],affirmative:'S + will be + V-ing',negative:'S + will not be + V-ing',question:'Will + S + be + V-ing?',signals:['this time tomorrow','at 8 p.m. next...'],
    good:'This time tomorrow, I will be flying to Bangkok.',translation:'Giờ này ngày mai, tôi sẽ đang bay đến Bangkok.',bad:'I will be fly at noon.',note:'Sau will be cần V-ing.',
    comparisons:['Future Simple nhìn sự kiện; Future Continuous nhìn quá trình tại mốc tương lai.'],mnemonic:'Tại giờ tương lai, will be + ing đang chạy.',
    quiz:{q:'At 10 tomorrow, she ___ the test.',options:['takes','will take','will be taking','has taken'],answer:2,explanation:'Hành động đang diễn ra tại mốc tương lai.'}
  }),
  tense({
    id:'future-perfect',title:'Future Perfect – Tương lai hoàn thành',level:'B2',summary:'Hành động sẽ hoàn tất trước một mốc trong tương lai.',
    formula:['S','will have','V3'],affirmative:'S + will have + V3',negative:'S + will not have + V3',question:'Will + S + have + V3?',signals:['by, by the time','before + future point'],
    good:'By Friday, we will have completed the audit.',translation:'Trước thứ Sáu, chúng tôi sẽ hoàn tất kiểm toán.',bad:'By Friday, we will completed it.',note:'Future Perfect cần will have + V3.',
    comparisons:['Future Perfect nhấn hoàn tất trước mốc; Future Continuous nhấn đang diễn ra tại mốc.'],mnemonic:'By + mốc tới: will have + V3 xong trước.',
    quiz:{q:'By 2030, the company ___ ten branches.',options:['opens','will open','will have opened','will be open'],answer:2,explanation:'By 2030 yêu cầu kết quả hoàn tất trước mốc.'}
  }),
  tense({
    id:'future-perfect-continuous',title:'Future Perfect Continuous – Tương lai hoàn thành tiếp diễn',level:'C1',summary:'Nhấn mạnh độ dài của quá trình kéo dài đến một mốc tương lai.',
    formula:['S','will have been','V-ing'],affirmative:'S + will have been + V-ing',negative:'S + will not have been + V-ing',question:'Will + S + have been + V-ing?',signals:['for... by + future time','by then for...'],
    exceptions:['Ít dùng với stative verbs','Trong giao tiếp có thể thay bằng Future Perfect nếu không cần nhấn quá trình'],
    good:'By June, she will have been working here for ten years.',translation:'Đến tháng Sáu, cô ấy sẽ làm việc ở đây tròn mười năm.',bad:'By June, she will be working here since ten years.',note:'Khoảng thời gian dùng for và cấu trúc will have been working.',
    comparisons:['Future Perfect nhấn kết quả; Future Perfect Continuous nhấn thời lượng.'],mnemonic:'For bao lâu đến mốc tới: will have been + ing.',
    quiz:{q:'By noon, we ___ for six hours.',options:['drive','will drive','will have driven','will have been driving'],answer:3,explanation:'Nhấn thời lượng sáu giờ kéo dài đến noon.'}
  }),
  tense({
    id:'future-forms',title:'Future Forms – Các cách diễn đạt tương lai',level:'B1',summary:'Phân biệt will, be going to, Present Continuous và Present Simple khi nói về tương lai.',
    formula:['Evidence/Plan/Schedule','Choose future form'],affirmative:'will / be going to / am-is-are V-ing / Present Simple',negative:'will not / am-is-are not going to',question:'Will...? / Are...going to?',signals:['evidence and prior intention','arrangement and timetable'],
    good:'The train leaves at 7, and I am meeting Lan at the station.',translation:'Tàu chạy lúc 7 giờ và tôi đã hẹn gặp Lan ở ga.',bad:'Look at those clouds! It will rain.',note:'Có bằng chứng hiện tại rõ ràng, “is going to rain” tự nhiên hơn.',
    comparisons:['Will: quyết định/dự đoán; going to: ý định/bằng chứng; Continuous: lịch hẹn; Simple: lịch trình.'],mnemonic:'Will nghĩ ngay; going to có dấu; V-ing đã hẹn; Simple lịch chạy.',
    quiz:{q:'The timetable says the flight ___ at 9.',options:['will leave','leaves','is going leave','leaving'],answer:1,explanation:'Lịch trình chính thức dùng Present Simple.'}
  })
])];
