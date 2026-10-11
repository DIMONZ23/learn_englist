// Ngân hàng TOEIC 200 câu. Audio được phát bằng Web Speech API từ transcript thật.
export const TOEIC_TEST_ID = '10000000-0000-4000-8000-000000000001';

const letters = ['A', 'B', 'C', 'D'];
const partNames = {
  1:'Photographs', 2:'Question–Response', 3:'Conversations', 4:'Talks',
  5:'Incomplete Sentences', 6:'Text Completion', 7:'Reading Comprehension'
};

function arranged(correct, wrong, position) {
  const options = [...wrong];
  options.splice(position % (wrong.length + 1), 0, correct);
  return { options, correctIndex:options.indexOf(correct) };
}

function svgScene(label, sky='#dff4ff', accent='#5548e8') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="430" viewBox="0 0 760 430"><rect width="760" height="430" fill="${sky}"/><rect y="310" width="760" height="120" fill="#d8e1e8"/><circle cx="650" cy="80" r="38" fill="#ffd166"/><rect x="80" y="115" width="600" height="205" rx="18" fill="#fff" stroke="#b9c6d3" stroke-width="5"/><rect x="115" y="155" width="170" height="125" rx="10" fill="${accent}" opacity=".85"/><circle cx="420" cy="190" r="34" fill="#f2b89f"/><path d="M370 300 Q420 220 470 300" fill="#26324a"/><rect x="510" y="165" width="120" height="18" rx="9" fill="#93a4b7"/><rect x="510" y="205" width="90" height="18" rx="9" fill="#93a4b7"/><text x="380" y="385" text-anchor="middle" font-family="Arial" font-size="24" fill="#26324a">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const assets = [];
const questions = [];
function asset(id, type, title, content, translation='', mediaUrl=null, metadata={}) {
  assets.push({ id, type, title, content, translation, mediaUrl, metadata });
  return id;
}
function question(part, number, prompt, answer, wrong, extra={}) {
  const placed = arranged(answer, wrong, number);
  questions.push({
    id:`T01-P${part}-Q${String(number).padStart(3,'0')}`, part,
    questionType:extra.questionType || partNames[part], questionNumber:number,
    assetId:extra.assetId || null, prompt, options:placed.options,
    correctIndex:placed.correctIndex,
    explanation:extra.explanation || `“${answer}” phù hợp chính xác với ngữ cảnh; các lựa chọn còn lại mâu thuẫn với thông tin được cung cấp.`,
    translation:extra.translation || '', difficulty:extra.difficulty || (number % 5 === 0 ? 'hard' : number % 2 ? 'medium' : 'easy'),
    tags:extra.tags || [partNames[part]]
  });
}

const photos = [
  ['office meeting','Several colleagues are discussing a chart.',['The room is being painted.','A woman is closing the curtains.','The chairs have been removed.'],'Một số đồng nghiệp đang thảo luận biểu đồ.'],
  ['train platform','Passengers are waiting beside a train.',['The train is crossing a bridge.','Tickets are scattered on the floor.','Everyone is carrying an umbrella.'],'Hành khách đang chờ bên cạnh tàu.'],
  ['restaurant kitchen','A chef is placing dishes on a counter.',['Customers are paying at the register.','The tables are being folded.','A waiter is sweeping the sidewalk.'],'Đầu bếp đang đặt món ăn lên quầy.'],
  ['construction site','Some workers are wearing protective helmets.',['A building has been completely demolished.','The workers are seated in a classroom.','Traffic is moving through a tunnel.'],'Một số công nhân đang đội mũ bảo hộ.'],
  ['city park','A cyclist is riding along a paved path.',['Boats are tied to a dock.','A crowd is entering a theater.','Snow is covering the benches.'],'Một người đi xe đạp đang chạy trên lối lát đá.'],
  ['retail store','Clothing has been arranged on display racks.',['Boxes are being loaded onto a truck.','The store windows are broken.','Shoppers are sitting at a dining table.'],'Quần áo đã được sắp xếp trên các giá trưng bày.']
];
photos.forEach((p, i) => {
  const n=i+1, audio=arranged(p[1],p[2],n);
  const id=asset(`t01-photo-${n}`,'image',p[0],'',p[3],svgScene(p[0],i%2?'#eef2ff':'#dff4ff',i%2?'#00a8b5':'#5548e8'));
  const aid=asset(`t01-audio-${n}`,'audio',`Part 1 question ${n}`,audio.options.map((x,j)=>`${letters[j]}. ${x}`).join(' '),p[3],null,{rate:.88,imageAssetId:id});
  questions.push({id:`T01-P1-Q${String(n).padStart(3,'0')}`,part:1,questionType:'Photographs',questionNumber:n,assetId:aid,prompt:'Select the statement that best describes the photograph.',options:audio.options,correctIndex:audio.correctIndex,explanation:`The image shows ${p[0]}; the matching statement is “${p[1]}”`,translation:p[3],difficulty:i<2?'easy':'medium',tags:['photograph',p[0]],imageAssetId:id});
});

const responses = [
  ['When will the quarterly report be ready?','By Friday afternoon.',['In the conference room.','Yes, I read newspapers.']],
  ['Who approved the new travel policy?','The finance director did.',['It starts next month.','I traveled by train.']],
  ['Could you send me the revised schedule?','Certainly, I will email it now.',['The meeting was revised.','At the main entrance.']],
  ['Where should I leave this package?','On the reception desk, please.',['It arrived yesterday.','The package is expensive.']],
  ['Why was the client meeting postponed?','The manager was delayed at the airport.',['At three o’clock.','Yes, I met the client.']],
  ['Haven’t you submitted the expense form yet?','No, I still need one receipt.',['The expenses are reasonable.','It is a new uniform.']],
  ['How often is the equipment inspected?','Once every three months.',['By the maintenance team.','In the storage area.']],
  ['Which design do you prefer?','The one with the blue border.',['I designed it yesterday.','Near the front door.']],
  ['Would you like me to reserve a table?','Yes, for six people at seven.',['The table is made of wood.','I already read it.']],
  ['Did Maria arrange the product demonstration?','No, Kevin handled it.',['The product is durable.','In the showroom.']],
  ['What time does the first bus leave?','At six fifteen.',['From the north terminal.','It left my bag.']],
  ['Why don’t we order more printer paper?','Good idea; we are almost out.',['The printer is beside the window.','I read the order.']],
  ['Where can I charge my phone?','There is an outlet by the sofa.',['The fee is twenty dollars.','I called this morning.']],
  ['Who is leading today’s orientation?','Ms. Patel from Human Resources.',['It lasts two hours.','In the training room.']],
  ['How did the customers react to the survey?','Most of them responded positively.',['The survey closes tomorrow.','At the customer desk.']],
  ['Is the cafeteria still open?','Yes, until eight o’clock.',['I opened the document.','The coffee tastes good.']],
  ['When are the replacement parts arriving?','They are scheduled for Tuesday.',['The mechanic replaced them.','At the loading dock.']],
  ['Could I borrow your calculator?','Of course, it is in my drawer.',['The calculation was correct.','I borrowed a novel.']],
  ['Where did you put the signed contract?','I filed it in the blue cabinet.',['The client signed yesterday.','It is a two-year agreement.']],
  ['Should we invite the regional manager?','Yes, her feedback would be useful.',['The region is growing quickly.','She manages three offices.']],
  ['How much does express delivery cost?','It is twelve dollars extra.',['The parcel weighs two kilos.','Delivery takes two days.']],
  ['Why is the lobby so crowded?','A conference has just finished.',['The lobby was renovated.','On the ground floor.']],
  ['Can you cover my shift on Saturday?','I can work after two o’clock.',['The shift was productive.','Saturday is the weekend.']],
  ['Which file contains the sales forecast?','The spreadsheet named Q4 Plan.',['Sales increased steadily.','I forecast rain.']],
  ['Would you mind closing the window?','Not at all; it is getting cold.',['The window faces the park.','The office closes at five.']]
];
responses.forEach((r,i)=>{const n=i+7, placed=arranged(r[1],r[2],n); const aid=asset(`t01-audio-${n}`,'audio',`Part 2 question ${n}`,`${r[0]} ${placed.options.map((x,j)=>`${letters[j]}. ${x}`).join(' ')}`,'',null,{rate:.92}); questions.push({id:`T01-P2-Q${String(n).padStart(3,'0')}`,part:2,questionType:'Question–Response',questionNumber:n,assetId:aid,prompt:'Choose the best response.',options:placed.options,correctIndex:placed.correctIndex,explanation:`The response “${r[1]}” answers the question naturally and directly.`,translation:'Chọn câu phản hồi phù hợp nhất.',difficulty:i<8?'easy':'medium',tags:['listening','response']});});

const conversations = [
  ['hotel front desk','change a reservation','send a confirmation email','Woman: I need to move my reservation from Thursday to Friday. Man: No problem. The same room is available, and I will email a new confirmation.','quầy lễ tân khách sạn'],
  ['marketing office','review a campaign draft','add customer testimonials','Man: The campaign draft looks clear, but the director asked for more evidence. Woman: I can add two customer testimonials before our afternoon review.','văn phòng marketing'],
  ['car repair shop','discuss a delayed repair','call when the part arrives','Woman: Is my car ready to collect? Man: Not yet. The replacement sensor arrives tomorrow, and I will call you as soon as we install it.','xưởng sửa xe'],
  ['conference center','find a presentation room','follow signs to Hall B','Man: Excuse me, where is the software seminar? Woman: It was moved from Hall A to Hall B. Follow the blue signs past the café.','trung tâm hội nghị'],
  ['company cafeteria','plan a team lunch','reserve a large table','Woman: Twelve people are joining the team lunch on Wednesday. Man: I will ask the cafeteria to reserve the long table near the windows.','nhà ăn công ty'],
  ['shipping department','correct a delivery address','print a new label','Man: This order shows the old warehouse address. Woman: Thanks for noticing. I will update the system and print a new shipping label.','bộ phận giao hàng'],
  ['medical clinic','reschedule an appointment','check the doctor’s calendar','Woman: I cannot attend my appointment at ten. Man: Let me check whether the doctor has an opening later this afternoon.','phòng khám'],
  ['electronics store','ask about a warranty','bring the receipt to service desk','Man: My tablet stopped charging after two weeks. Woman: It is covered by warranty. Bring your receipt to the service desk for a replacement.','cửa hàng điện tử'],
  ['airport gate','announce a gate change','walk to Gate 24','Woman: The screen says our flight leaves from Gate 18. Man: There was a change. The airline app says we should go to Gate 24.','cổng sân bay'],
  ['property office','inspect an apartment','meet the agent on Saturday','Man: I am interested in the apartment on King Street. Woman: The tenant leaves Friday, so our agent can show it to you Saturday morning.','văn phòng bất động sản'],
  ['print shop','order business cards','approve the digital proof','Woman: We need five hundred business cards by Monday. Man: I will prepare a digital proof today. Please approve it before we print.','cửa hàng in'],
  ['museum office','organize a guided tour','confirm the group size','Man: Our school would like a guided tour next month. Woman: Certainly. Email me the date and final number of students.','văn phòng bảo tàng'],
  ['IT help desk','restore network access','restart the router','Woman: Our department cannot connect to the network. Man: I see a router error. Please restart it while I monitor the connection.','bộ phận hỗ trợ IT']
];
conversations.forEach((c,i)=>{const first=32+i*3, aid=asset(`t01-conv-${i+1}`,'audio',`Conversation ${i+1}`,c[3],`Hội thoại tại ${c[4]}.`,null,{speakers:2,rate:.94}); question(3,first,'Where most likely are the speakers?',c[0],['at a sports stadium','in a public library','at a bank'],{assetId:aid,translation:'Người nói có khả năng đang ở đâu?',tags:['place']}); question(3,first+1,'What are the speakers mainly discussing?',c[1],['a staff celebration','a monthly invoice','a training certificate'],{assetId:aid,translation:'Họ chủ yếu thảo luận điều gì?',tags:['purpose']}); question(3,first+2,'What will one of the speakers most likely do next?',c[2],['cancel the project','contact a newspaper','request a refund'],{assetId:aid,translation:'Một người có khả năng sẽ làm gì tiếp theo?',tags:['next action']});});

const talks = [
  ['station announcement','inform passengers of a platform change','proceed to platform nine','Attention passengers for the 8:40 express to Brighton. Because of maintenance, the train will depart from platform nine instead of platform six. Please proceed there now; boarding begins in ten minutes.'],
  ['voicemail','update a client about an order','call back before 4 P.M.','Hello Ms. Gomez, this is Arun from City Office Supply. Your chairs are ready, but the desks will arrive one day late. Please call me before four if you prefer separate deliveries.'],
  ['store advertisement','promote a weekend sale','visit the second floor','This weekend, Northgate Department Store is offering thirty percent off all winter coats. Loyalty members receive an additional coupon at the customer service desk on the second floor.'],
  ['office announcement','explain a temporary closure','use the east entrance','The main lobby will be closed Tuesday while the floor is repaired. Employees and visitors should use the east entrance and wear their identification badges.'],
  ['tour guide','introduce a historic building','meet near the fountain','The building ahead was the city’s first post office and now houses an art gallery. You have twenty minutes to explore; then meet me near the fountain.'],
  ['weather report','warn commuters about heavy rain','allow extra travel time','Heavy rain will reach the northern districts before the morning commute. Drivers should allow extra travel time, and ferry passengers should check for cancellations.'],
  ['training introduction','explain a software workshop','open the practice file','Welcome to the inventory software workshop. First, open the practice file on your desktop. After a short demonstration, you will enter a sample order.'],
  ['restaurant message','confirm a private event','submit menu choices','This message confirms your private dinner for twenty guests next Friday. Please submit your menu choices by Monday so our chef can order ingredients.'],
  ['radio advertisement','promote a fitness membership','register online today','Join Harbor Fitness this month and pay no registration fee. New members receive two sessions with a personal trainer when they register online today.'],
  ['company briefing','report quarterly performance','review the regional figures','Our quarterly revenue rose eight percent, led by online sales in the western region. After this overview, each manager will review the figures for their area.']
];
talks.forEach((t,i)=>{const first=71+i*3, aid=asset(`t01-talk-${i+1}`,'audio',`Talk ${i+1}`,t[3],`Bài nói dạng ${t[0]}.`,null,{rate:.92}); question(4,first,'What is the purpose of the talk?',t[1],['to introduce a new employee','to request a payment','to describe a complaint'],{assetId:aid,tags:['purpose']}); question(4,first+1,'What detail is mentioned?',t[3].split('. ')[1]?.replace('.','') || t[3].split('.')[0],['A fee has increased','A meeting was canceled','A document was lost'],{assetId:aid,tags:['detail']}); question(4,first+2,'What are listeners asked to do?',t[2],['wait for a mailed survey','replace their equipment','speak to a security officer'],{assetId:aid,tags:['next action']});});

const p5 = [
  ['All employees must submit _____ travel receipts by Friday.','their',['they','them','theirs'],'possessive determiner'],
  ['The new software is considerably _____ than the previous version.','faster',['fast','fastest','more fast'],'comparison'],
  ['Ms. Lee _____ the contract before the client arrived.','had reviewed',['reviews','has reviewed','will review'],'past perfect'],
  ['The workshop was postponed _____ the instructor was ill.','because',['although','unless','despite'],'conjunction'],
  ['Please speak _____ so everyone in the auditorium can hear.','clearly',['clear','clearness','cleared'],'adverb'],
  ['The committee will make a decision _____ the end of the week.','by',['among','during','since'],'preposition'],
  ['Customers are advised _____ copies of their receipts.','to keep',['keep','kept','keeping'],'infinitive'],
  ['The factory has operated _____ 1998.','since',['for','during','until'],'time expression'],
  ['Neither the manager nor the assistants _____ available today.','are',['is','was','be'],'agreement'],
  ['Our consultant provided several _____ recommendations.','practical',['practice','practically','practiced'],'word form'],
  ['The shipment will leave as soon as the inspection _____.','is completed',['will complete','completed','completing'],'time clause'],
  ['Applications received after June 30 will not be _____.','considered',['consider','considering','consideration'],'passive'],
  ['Mr. Ortiz is responsible _____ coordinating the annual conference.','for',['to','with','at'],'dependent preposition'],
  ['The restaurant expanded its menu _____ attract more customers.','to',['so that','because of','despite'],'purpose'],
  ['There are _____ parking spaces behind the building.','several',['much','every','a little'],'quantifier'],
  ['The report, _____ was published yesterday, predicts steady growth.','which',['who','where','what'],'relative clause'],
  ['We appreciate your _____ in completing the survey.','assistance',['assist','assisted','assistively'],'word form'],
  ['The director requested that the proposal _____ revised.','be',['is','was','being'],'subjunctive'],
  ['If demand continues to rise, the company _____ more staff.','will hire',['hired','would hire','has hired'],'conditional'],
  ['The conference room is not large _____ for fifty guests.','enough',['too','very','so'],'enough'],
  ['_____ the weather was unfavorable, the outdoor event continued.','Although',['Because of','Therefore','In spite'],'contrast'],
  ['The technician checked the device _____ before returning it.','thoroughly',['thorough','thoroughness','more thorough'],'adverb'],
  ['A copy of the invoice is attached for your _____.','reference',['refer','referring','referential'],'collocation'],
  ['By next month, the team _____ the first phase.','will have completed',['completes','completed','is completing'],'future perfect'],
  ['The company offers flexible hours _____ free transportation.','as well as',['but','instead','whereas'],'connector'],
  ['Only authorized personnel may _____ the laboratory.','enter',['entering','entered','entrance'],'modal verb'],
  ['The warranty remains valid _____ the product is used correctly.','provided that',['even though','because of','in contrast'],'condition'],
  ['Sales increased _____ following the advertising campaign.','dramatically',['dramatic','drama','dramatize'],'word form'],
  ['We regret _____ you that your application was unsuccessful.','to inform',['inform','informed','informing'],'verb pattern'],
  ['The furniture will be delivered at no additional _____.','cost',['costly','costing','costs'],'collocation']
];
p5.forEach((x,i)=>question(5,101+i,x[0],x[1],x[2],{explanation:`This item tests ${x[3]}. “${x[1]}” is the only option that fits both grammar and meaning.`,translation:'Chọn từ hoặc cụm từ phù hợp nhất để hoàn thành câu.',tags:[x[3]]}));

const p6docs = [
  ['Staff Training Notice','All new supervisors must attend the leadership workshop on 14 May. The session will begin at 9 A.M. in Room 402. Participants should bring a laptop because several activities are completed online. _____, lunch will be provided in the staff lounge.',[
    ['The workshop is designed _____ practical management skills.','to develop',['developed','developing','development'],'infinitive'],
    ['Employees should arrive _____ 8:45 A.M.','by',['since','among','during'],'preposition'],
    ['Attendance is _____ for all new supervisors.','mandatory',['option','mandate','mandatorily'],'word form'],
    ['Choose the best sentence for the blank.','In addition,',['However, the building is closed.','For example, no food is available.','Otherwise, cancel your reservation.'],'cohesion']]],
  ['Customer Delivery Update','Thank you for purchasing a Riverside desk. Demand has been higher than expected, so delivery will take seven to ten business days. Our team will contact you one day before arrival. _____ You may change the delivery date through your online account.',[
    ['Your order _____ carefully before shipment.','will be inspected',['inspects','has inspecting','to inspect'],'passive'],
    ['Drivers cannot leave furniture _____ no adult is present.','if',['unless','despite','therefore'],'condition'],
    ['Please ensure that the entrance is _____.','accessible',['access','accessibly','accessing'],'word form'],
    ['Choose the best sentence for the blank.','Someone must be available to receive the item.',['The showroom won an award.','Our desks are made overseas.','Prices may change without notice.'],'cohesion']]],
  ['Library Renovation','The Westfield Library will close from 3 to 12 August while new lighting is installed. Digital services will remain available throughout the closure. _____ Reserved books can be collected from the mobile library beside City Hall.',[
    ['Members _____ return borrowed items at any branch.','may',['must to','are','have'],'modal'],
    ['The project is expected to finish _____.','on schedule',['in schedule','at scheduling','scheduled'],'collocation'],
    ['Updates will be posted _____ on our website.','regularly',['regular','regulation','regularity'],'adverb'],
    ['Choose the best sentence for the blank.','During this period, staff will answer inquiries by phone.',['All membership cards expired yesterday.','The café serves breakfast.','No books have ever been borrowed.'],'cohesion']]],
  ['Supplier Agreement','Brighton Foods has renewed its supply agreement with Green Farm Produce for another two years. Under the agreement, vegetables will be delivered each weekday morning. _____ Both companies also plan to introduce reusable shipping containers.',[
    ['The supplier was selected _____ its reliable service.','because of',['although','whereas','unless'],'cause'],
    ['Prices will be reviewed _____.','annually',['annual','annualize','annuity'],'adverb'],
    ['Green Farm has worked with Brighton Foods _____ 2019.','since',['for','during','from'],'time'],
    ['Choose the best sentence for the blank.','This schedule helps the restaurant use fresher ingredients.',['The restaurant closes every winter.','No agreement was signed.','Vegetables are never used there.'],'cohesion']]]
];
p6docs.forEach((d,di)=>{const aid=asset(`t01-p6-${di+1}`,'passage',d[0],d[1],`Văn bản: ${d[0]}`); d[2].forEach((x,qi)=>question(6,131+di*4+qi,x[0],x[1],x[2],{assetId:aid,explanation:`“${x[1]}” creates the correct ${x[3]} and keeps the paragraph coherent.`,translation:'Hoàn thành đoạn văn bằng lựa chọn phù hợp nhất.',tags:[x[3]]}));});

const p7docs = [
  ['Email: Project Kickoff','To: Design Team\nFrom: Nina Cole\nOur kickoff meeting for the Harbor mobile app will be Tuesday at 10 A.M. in Studio 3. Please review the client notes before attending. Omar will demonstrate the latest prototype, and we will assign usability-testing tasks afterward.','organize the Harbor app kickoff','Tuesday at 10 A.M.','review the client notes'],
  ['Notice: Parking Changes','Beginning 1 June, the west parking lot will be reserved for construction vehicles. Employees should use the south garage and scan their staff cards at the entrance. Visitors may obtain a temporary pass from reception.','announce temporary parking arrangements','the south garage','obtain a pass from reception'],
  ['Advertisement: Lakeside Hotel','Book a two-night weekend stay before 30 September and receive breakfast plus a late checkout at 2 P.M. The offer applies to direct reservations only and cannot be combined with conference rates.','promote a weekend accommodation offer','breakfast and late checkout','book directly with the hotel'],
  ['Schedule: Business Forum','09:00 Registration — Main Lobby\n09:30 Opening Address — Hall A\n11:00 Supply Chain Panel — Hall C\n13:30 Networking Lunch — Terrace\n15:00 Digital Security Workshop — Lab 2','provide the forum timetable','the Terrace','the digital security workshop'],
  ['Memo: Printer Replacement','The third-floor printer will be replaced Friday after 5 P.M. Save all pending jobs before leaving. During installation, use the device near Conference Room B. Normal service resumes Monday morning.','explain a planned equipment replacement','near Conference Room B','save pending print jobs'],
  ['Customer Review Response','Dear Mr. Khan, thank you for telling us about the delayed meal at our Oak Street restaurant. We have discussed the issue with the kitchen manager and added a $20 credit to your account, valid for six months.','respond to a service complaint','a $20 account credit','the meal arrived late'],
  ['Job Posting: Event Coordinator','River Arts Center seeks an event coordinator with two years of experience. Duties include scheduling performers, managing vendor contracts, and supervising events. Applications with a résumé and cover letter are due 18 March.','recruit an event coordinator','two years of experience','submit a résumé and cover letter'],
  ['Invoice Message','Your invoice 4481 covers website hosting from January through March. Payment of $360 is due by 10 April. To update billing details, sign in to the client portal or call the accounts team.','request payment for hosting','10 April','use the client portal'],
  ['News Brief: Factory Expansion','Marlow Tools will add a production line at its Leeds factory, creating 45 jobs. Construction begins in July and is expected to finish in November. The company said growing overseas demand led to the decision.','report a factory expansion','45 jobs','growing overseas demand'],
  ['Travel Alert','Flights using Terminal 2 may experience delays Monday because the north runway will be inspected. Travelers should check flight status before leaving home and allow additional time for security screening.','warn travelers about possible delays','a runway inspection','check flight status'],
  ['Double Passage: Order and Reply','ORDER: Vista Café ordered 24 ceramic cups, requested by 6 May.\nREPLY: The supplier has 18 cups ready now; the remaining six will ship on 8 May at no extra delivery charge.','update a customer about an order','18 cups','receive a second shipment'],
  ['Double Passage: Seminar and Note','SEMINAR: “Writing for Global Teams,” Thursday 2 P.M., Room 8. Registration closes Tuesday.\nNOTE: Priya, I registered us both. Please bring the revised handbook; the presenter wants to use it in an exercise.','coordinate attendance at a seminar','Thursday at 2 P.M.','bring the revised handbook'],
  ['Double Passage: Rental and Email','LISTING: Furnished studio, $1,100 monthly, utilities included, available 1 October.\nEMAIL: I can view the studio Wednesday after work. Does the building offer bicycle storage? — Leon','inquire about a rental property','utilities are included','bicycle storage'],
  ['Double Passage: Menu and Message','MENU: Lunch set includes soup, main course, and tea for $18. Vegetarian pasta is available.\nMESSAGE: Reserve the garden table for four at 12:30. One guest does not eat meat. — Ana','arrange a lunch reservation','four people','vegetarian pasta'],
  ['Triple Passage: Conference Trip','AGENDA: Sales Summit, 7–8 June, Orion Center.\nHOTEL: Check-in 6 June; breakfast included.\nMESSAGE: The morning flight is canceled, so I changed our booking to the 3:20 P.M. service.','coordinate travel for a sales summit','6 June','take the 3:20 P.M. flight'],
  ['Triple Passage: Product Launch','PRESS RELEASE: Nova X camera launches 12 August.\nRETAIL MEMO: Displays must be installed by 10 August.\nEMAIL: Training videos are ready; all sales staff should view them before Friday.','prepare for a product launch','12 August','watch training videos'],
  ['Triple Passage: Community Event','POSTER: River Cleanup, Saturday 8 A.M., East Bridge.\nWEATHER: Light rain until 9 A.M.\nTEXT: Gloves are provided, but bring waterproof shoes.','give information about a community event','East Bridge','bring waterproof shoes'],
  ['Triple Passage: Office Move','NOTICE: Finance moves to Floor 6 on 22 November.\nMAP: Elevators B and C serve Floor 6.\nEMAIL: Pack personal items by Thursday; movers will handle labeled files Friday.','explain an office relocation','Floor 6','pack personal items by Thursday']
];
p7docs.forEach((d,i)=>{const first=147+i*3, type=i<10?'single':i<14?'double':'triple', aid=asset(`t01-p7-${i+1}`,'passage',d[0],d[1],`Tài liệu ${type}: ${d[0]}`,null,{passageType:type}); question(7,first,'What is the main purpose of the document?',d[2],['announce an employee retirement','compare several products','request technical support'],{assetId:aid,tags:[type,'main idea']}); question(7,first+1,'According to the document, what detail is mentioned?',d[3],['a refund is required','the office is permanently closed','attendance is optional'],{assetId:aid,tags:[type,'detail']}); question(7,first+2,'What will a reader most likely do?',d[4],['cancel every reservation','contact a local newspaper','purchase new machinery'],{assetId:aid,tags:[type,'inference']});});

if (questions.length !== 200) throw new Error(`TOEIC seed phải có 200 câu, hiện có ${questions.length}.`);

export const toeicData = {
  test: {
    id:TOEIC_TEST_ID, code:'TOEIC-LR-001', title:'TOEIC Practice Test 01', targetScore:750,
    durationMinutes:120,
    description:'Đề mô phỏng TOEIC Listening & Reading đủ 7 Parts: 100 câu nghe và 100 câu đọc.'
  },
  assets,
  questions
};
