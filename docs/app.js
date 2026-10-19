'use strict';

const STORAGE_KEY = 'chik-focus-demo-v1';
const TODAY = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const $app = document.querySelector('#app');
const $modal = document.querySelector('#modal');
const weekNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const paths = {
  calendar:'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 10h2m4 0h2m-8 4h2',
  grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  clock:'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  user:'M20 21v-2a7 7 0 0 0-14 0v2M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  chevron:'m9 5 7 7-7 7', left:'m15 5-7 7 7 7', check:'m5 12 4 4L19 6', close:'m6 6 12 12M6 18 18 6',
  plus:'M12 5v14M5 12h14', link:'M10 13a5 5 0 0 0 7 .5l4-4a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.5l-4 4a5 5 0 0 0 7 7l2-2',
  copy:'M9 9h12v12H9zM5 15H3V3h12v2', arrow:'M5 12h14m-6-6 6 6-6 6',
  spark:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z',
  shield:'m12 3 8 4v6c0 4-8 8-8 8s-8-4-8-8V7l8-4zm-4 9 3 3 5-6',
  location:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  telegram:'m22 2-7 20-4-9L2 9l20-7zM11 13 22 2', bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4',
  refresh:'M3 11a9 9 0 0 1 16-6l2 2M21 3v4h-4M21 13a9 9 0 0 1-16 6l-2-2M3 21v-4h4',
  help:'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  edit:'m15 5 4 4M3 21l4-1L21 6l-4-4L3 16v5z', scissors:'M6 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm0 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM5 8l15 13M5 16 20 3',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.spark}"/></svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
const date = s => new Date(s + 'T12:00:00');
const dateId = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const addDays = (s,n) => { const d=date(s); d.setDate(d.getDate()+n); return dateId(d); };
const displayDate = (s,weekday=false) => date(s).toLocaleDateString('ru-RU',{day:'numeric',month:'long',...(weekday?{weekday:'long'}:{})});
const capitalize = s => s.charAt(0).toUpperCase()+s.slice(1);
const minutes = s => Number(s.split(':')[0])*60+Number(s.split(':')[1]);
const time = n => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const initials = name => name.split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('');
const service = id => state.services.find(s=>s.id===id);
const bookingService = b => b.serviceTitle || service(b.serviceId)?.title || 'Услуга';
const colors = ['sage','lilac','peach'];

function seed(){
  return {
    demoDate:TODAY,
    profile:{name:'Анна Ковалева',city:'Москва',address:'ул. Лесная, 12 · кабинет 4',speciality:'Мастер маникюра',slug:'anna'},
    services:[{id:'s1',title:'Маникюр с покрытием',duration:90,buffer:15,price:2500},{id:'s2',title:'Маникюр без покрытия',duration:60,buffer:15,price:1500}],
    hours:{days:[0,1,2,3,4],start:'10:00',end:'19:00',breakStart:'14:00',breakEnd:'15:00'},
    bookings:[
      {id:'b1',serviceId:'s1',day:TODAY,time:'10:00',duration:90,buffer:15,price:2500,name:'Елена Морозова',phone:'+7 (999) 000-00-01',status:'active',reminder:true},
      {id:'b2',serviceId:'s1',day:TODAY,time:'12:00',duration:90,buffer:15,price:2500,name:'Ольга Белова',phone:'+7 (999) 000-00-02',status:'active',reminder:true},
      {id:'b3',serviceId:'s2',day:TODAY,time:'15:00',duration:60,buffer:15,price:1500,name:'Дарья Соколова',phone:'+7 (999) 000-00-03',status:'active',reminder:false},
      {id:'b4',serviceId:'s1',day:TODAY,time:'17:00',duration:90,buffer:15,price:2500,name:'Виктория Орлова',phone:'+7 (999) 000-00-04',status:'active',reminder:true},
      {id:'b5',serviceId:'s2',day:addDays(TODAY,1),time:'10:00',duration:60,buffer:15,price:1500,name:'Елена Морозова',phone:'+7 (999) 000-00-01',status:'active',reminder:true},
      {id:'b6',serviceId:'s2',day:addDays(TODAY,1),time:'15:00',duration:60,buffer:15,price:1500,name:'Дарья Соколова',phone:'+7 (999) 000-00-03',status:'active',reminder:false},
    ],
    lastBookingId:null,
  };
}
let state;
try { state=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(!state?.profile || !Array.isArray(state.bookings) || !Array.isArray(state.services) || !state.hours || state.demoDate!==TODAY) state=seed(); } catch { state=seed(); }
const ui={mode:location.hash.startsWith('#client')?'client':location.hash.startsWith('#master')?'master':'welcome',nav:'day',day:TODAY,wizard:0,selectedDays:[...state.hours.days],clientStep:0,serviceId:null,clientDay:addDays(TODAY,1),clientTime:null,contact:{name:'Мария Соколова',phone:'+7 (999) 000-00-00'},consent:false,reschedule:null,serviceEdit:null};
if(ui.mode==='client' && state.lastBookingId) ui.clientStep=3;
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{toast('В этом браузере изменения сохраняются до закрытия страницы.');}}
let toastTimer;
function toast(message){ const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('visible'),4200); }
function brand(){return '<div class="brand chik-brand"><span class="chik-mark" aria-hidden="true">'+icon('check')+'</span>чик<span class="brand-bang">!</span></div>';}
function topbar(){return `<header class="demo-bar"><button class="chik-home" data-action="home" aria-label="Чик! На главную">чик! <span>демо</span></button><div class="mode-switch" aria-label="Сценарий"><button data-action="mode-master" class="${ui.mode==='master'?'active':''}" aria-pressed="${ui.mode==='master'}">${icon('grid')}Мастер</button><button data-action="mode-client" class="${ui.mode==='client'?'active':''}" aria-pressed="${ui.mode==='client'}">${icon('user')}Клиент</button></div><div class="demo-tools"><button class="tool-link focus-link" data-action="join-focus">${icon('people')}На фокус</button><button class="tool-link" data-action="guide" aria-label="Что попробовать">${icon('help')}</button><button class="tool-link" data-action="reset" aria-label="Сбросить тестовые данные">${icon('refresh')}</button></div></header>`;}
function render(){
  $app.innerHTML=topbar()+(ui.mode==='welcome'?welcome():ui.mode==='master'?masterShell():clientShell())+(ui.mode==='welcome'?'':focusFooter());
  document.title=ui.mode==='welcome'?'Чик! — запись без переписки':ui.mode==='master'?'Чик! — кабинет мастера':'Чик! · '+state.profile.name;
  window.ChikTelegram?.setBackHandler(goBack,ui.mode!=='welcome');
}
function welcome(){return `<main class="welcome-page fade-in"><section class="welcome-hero"><div class="welcome-copy">${brand()}<span class="pill welcome-badge"><span class="dot"></span>Ищем первых участников</span><h1>Записались.<br>Чик — и готово<span class="hero-dot">.</span></h1><p class="welcome-lead">Собираем сервис для мастеров, у которых руки заняты делом, а не перепиской о свободном времени.</p><p class="welcome-invitation">Нужен ваш честный взгляд. Попробуйте демо и расскажите, где удобно, а где хочется всё переделать.</p><div class="welcome-actions"><button class="btn primary" data-action="try-master">${icon('scissors')}Попробовать как мастер ${icon('arrow')}</button><button class="btn secondary" data-action="try-client">Я клиент — хочу записаться</button></div><div class="welcome-facts"><span>${icon('clock')}Пара минут</span><span>${icon('shield')}Без регистрации</span><span>${icon('spark')}Вымышленные данные</span></div></div><div class="welcome-visual" aria-label="Чик — календарик с улыбкой-галочкой"><img class="welcome-mascot" src="assets/chik-avatar.png" alt="Весёлый лаймовый календарик Чик"><span class="floating-note">Меньше «а во сколько?»</span><div class="floating-appointment"><span class="appointment-check">${icon('check')}</span><div><strong>Вы записаны. До встречи!</strong><p>Маникюр · завтра в 16:30</p></div><span class="pill">Чик!</span></div></div></section><section class="focus-invite"><div><span class="eyebrow">Фокус-группа Чик!</span><h2>Давайте соберём штуку, которой удобно пользоваться.</h2><p>Если вы мастер, репетитор или просто устали записываться в переписке — приходите потестить и поговорить.</p></div><button class="btn primary" data-action="join-focus">Хочу поучаствовать ${icon('arrow')}</button></section><p class="welcome-disclaimer">Это раннее демо. Записи сохраняются только на вашем устройстве. Оплаты и настоящих уведомлений пока нет.</p></main>`;}
function focusFooter(){return `<footer class="focus-footer"><p><strong>Как вам «Чик!»?</strong><span>Нужен честный фидбэк, в том числе «вот это бесит».</span></p><button class="btn secondary sm" data-action="join-focus">На фокус-группу ${icon('arrow')}</button></footer>`;}
function goHome(){ui.mode='welcome';ui.wizard=0;location.hash='welcome';render();window.scrollTo(0,0);}
function goBack(){
  if($modal.open){closeModal();return;}
  if(ui.mode==='master'&&ui.wizard>0){if(ui.wizard===4)ui.wizard=3;else ui.wizard--;render();return;}
  if(ui.mode==='master'&&ui.nav!=='day'){ui.nav='day';render();return;}
  if(ui.mode==='client'&&ui.clientStep>0&&ui.clientStep<3){const form=document.querySelector('#booking-form');if(form){const data=new FormData(form);ui.contact={name:String(data.get('clientName')),phone:String(data.get('clientPhone'))};ui.consent=data.has('consent');}ui.clientStep--;render();return;}
  goHome();
}
function showFocusInvite(){showModal('Хотите на фокус-группу?',`<p class="modal-text">Напишите Евгению <strong>«Фокус»</strong> в Telegram. Договоримся об удобном времени и вместе посмотрим, что работает, а что хочется переделать.</p><div class="focus-organizer"><span class="avatar">ЕП</span><div><strong>@${esc(window.CHIK_CONFIG.organizerUsername)}</strong><small>Автор проекта · личный контакт</small></div></div><div class="modal-note">Сообщение отправляете вы. Приложение ничего не пишет от вашего имени.</div>`,`<button class="btn secondary" data-action="close-modal">Ещё потыкаю</button><button class="btn primary" data-action="open-focus">Написать «Фокус» ${icon('telegram')}</button>`);}
function masterShell(){
  const nav=[['day','calendar','Мой день'],['services','scissors','Услуги'],['hours','clock','Расписание'],['clients','people','Клиенты']];
  return `<div class="shell"><aside class="sidebar"><div class="sidebar-top">${brand()}<button class="mobile-setup btn secondary sm" data-action="setup">${icon('edit')}Настройка</button></div><nav aria-label="Кабинет мастера">${nav.map(([id,i,label])=>`<button class="nav-btn ${ui.nav===id&&!ui.wizard?'active':''}" data-action="nav" data-value="${id}">${icon(i)}${label}</button>`).join('')}</nav><div class="sidebar-note">${icon('spark')} <strong>Всё начинается с услуги</strong><p>Несколько простых шагов — и у вас есть своя страница записи.</p><button data-action="setup">Пройти настройку ${icon('arrow')}</button></div><div class="profile-mini row"><div class="avatar">${esc(initials(state.profile.name))}</div><div><p>${esc(state.profile.name)}</p><small>${esc(state.profile.speciality)}</small></div><button class="icon-btn" data-action="setup" aria-label="Изменить профиль" style="border:0;width:27px">${icon('edit')}</button></div></aside><main class="main fade-in">${ui.wizard?wizard():({day:dashboard,services:servicesPage,hours:hoursPage,clients:clientsPage}[ui.nav]||dashboard)()}<p class="footer-note">Чик! · демо · изменения остаются на вашем устройстве</p></main></div>`;
}
function heading(title,subtitle,action=''){return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;}
function dashboard(){
  const bookings=state.bookings.filter(b=>b.day===ui.day).sort((a,b)=>a.time.localeCompare(b.time));
  const active=bookings.filter(b=>b.status!=='cancelled');
  const income=active.reduce((v,b)=>v+b.price,0);
  const duration=active.reduce((v,b)=>v+b.duration,0);
  return heading('Мой день',`${capitalize(displayDate(ui.day,true))} · ${ui.day===TODAY?'сегодня':ui.day===addDays(TODAY,1)?'завтра':'ваше расписание'}`,`<button class="btn primary" data-action="new-booking">${icon('plus')}Добавить запись</button>`)+`<div class="dashboard-grid"><section class="card"><div class="row between"><h2>${ui.day===TODAY?'Сегодня':capitalize(displayDate(ui.day))}</h2><div class="day-controls"><button class="icon-btn" data-action="prev-day" aria-label="Предыдущий день" ${ui.day===TODAY?'disabled':''}>${icon('left')}</button><button class="btn secondary sm" data-action="today">Сегодня</button><button class="icon-btn" data-action="next-day" aria-label="Следующий день">${icon('chevron')}</button></div></div><div class="stats-strip"><div class="stat"><span>Записей</span><strong>${active.length}</strong><small>на день</small></div><div class="stat"><span>План по выручке</span><strong>${money(income)}</strong></div><div class="stat"><span>В работе</span><strong>${Math.floor(duration/60)}</strong><small>ч ${duration%60?duration%60+' мин':''}</small></div></div>${bookings.length?bookings.map((b,i)=>appointment(b,i)).join(''):`<div class="empty-state">${icon('calendar')}<h3>День пока свободен</h3><p>Поделитесь страницей записи с клиентами.</p><button class="btn secondary" data-action="open-client">Открыть страницу записи ${icon('arrow')}</button></div>`}<div class="empty-window">${icon('spark')}<div><p>Пусть клиенты выбирают время сами</p><small>Свободные окна уже видны на вашей странице.</small></div></div></section><aside class="stack right-column">${miniCalendar()}${shareCard()}<div class="card hint-card">${icon('bell')}<div><h3>Меньше сообщений, больше времени</h3><p>Подключённый бот напомнит клиенту за сутки и за два часа до визита.</p></div></div></aside></div>`;
}
function appointment(b,i){
  const status=b.status==='completed'?'<span class="pill gray">'+icon('check')+'Пришла</span>':b.status==='cancelled'?'<span class="pill red">Отменена</span>':b.reminder?'<span class="pill"><span class="dot"></span>Напоминания</span>':'<span class="pill amber"><span class="dot"></span>Без напоминаний</span>';
  return `<article class="appointment ${b.status}" data-booking="${esc(b.id)}"><div class="appointment-time">${esc(b.time)}<small>${b.duration} мин</small></div><div class="appointment-body ${colors[i%3]}"><div class="appointment-title"><h3>${esc(bookingService(b))}</h3><span class="appointment-price">${money(b.price)}</span></div><p class="client-line">${esc(b.name)} · ${esc(b.phone)}</p><div class="appointment-actions">${status}${b.status==='active'?`<button class="btn secondary sm" data-action="complete" data-id="${esc(b.id)}">${icon('check')}Пришла</button><button class="btn quiet sm" data-action="reschedule" data-id="${esc(b.id)}">Перенести</button><button class="btn quiet sm" data-action="cancel" data-id="${esc(b.id)}">Отменить</button>`:''}</div></div></article>`;
}
function miniCalendar(){
  const d=date(ui.day), year=d.getFullYear(),month=d.getMonth();
  const first=new Date(year,month,1,12),offset=(first.getDay()+6)%7,count=new Date(year,month+1,0).getDate();
  let cells=weekNames.map(w=>`<small>${w}</small>`).join('')+Array(offset).fill('<span></span>').join('');
  for(let n=1;n<=count;n++){const day=dateId(new Date(year,month,n,12)); const occupied=state.bookings.some(b=>b.day===day&&b.status!=='cancelled'); cells+=`<button data-action="master-date" data-value="${day}" aria-label="${esc(displayDate(day))}" class="${day===ui.day?'selected':''} ${occupied?'has-booking':''}" ${day<TODAY?'disabled':''}>${n}</button>`;}
  return `<section class="card mini-calendar"><div class="month-title"><span>${capitalize(d.toLocaleDateString('ru-RU',{month:'long',year:'numeric'}).replace(' г.',''))}</span>${icon('calendar')}</div><div class="calendar-grid">${cells}</div><div class="calendar-legend"><span class="dot"></span>Есть записи</div></section>`;
}
function shareCard(){return `<section class="card share-card"><span class="eyebrow">Ваша страница</span><h2>Красивое время для новой записи</h2><p>Клиент выберет услугу и удобное окно. Всё остальное уже настроено.</p><button class="btn lime wide" data-action="open-client">Открыть страницу ${icon('arrow')}</button><button class="copy-btn" data-action="copy-link">${icon('copy')}Скопировать ссылку</button></section>`;}
function servicesPage(){return heading('Мои услуги','То, на что клиенты могут записаться самостоятельно.',`<button class="btn primary" data-action="add-service">${icon('plus')}Добавить услугу</button>`)+`<div class="service-list">${state.services.map(s=>`<article class="card service-item"><div class="service-symbol">${icon('scissors')}</div><div><h3>${esc(s.title)}</h3><p>${s.duration} минут · ${s.buffer} минут между клиентами</p></div><strong class="price">${money(s.price)}</strong><button class="btn secondary sm" data-action="edit-service" data-id="${esc(s.id)}">Изменить</button></article>`).join('')}<div class="card hint-card">${icon('clock')}<div><h3>Время на небольшую паузу</h3><p>Буфер после услуги оставляет время подготовить рабочее место. Клиенты на него не записываются.</p></div></div></div>`;}
function hoursPage(){return heading('Моё расписание','Клиенты видят только свободное время в ваши рабочие часы.',`<button class="btn primary" data-action="edit-hours">${icon('edit')}Изменить часы</button>`)+`<section class="card"><div class="row between"><div><span class="eyebrow">Рабочая неделя</span><h2 style="margin-top:8px">Время для клиентов и для себя</h2></div><span class="pill">Москва · UTC+3</span></div><div class="hours-grid">${weekNames.map((d,i)=>`<div class="hours-day ${state.hours.days.includes(i)?'':'closed'}"><strong>${d}</strong><span>${state.hours.days.includes(i)?esc(state.hours.start)+'–'+esc(state.hours.end):'Выходной'}</span></div>`).join('')}</div><hr class="divider"><div class="row muted small">${icon('clock')}Перерыв ${esc(state.hours.breakStart)}–${esc(state.hours.breakEnd)} · запись с шагом 30 минут</div></section>`;}
function clientsPage(){
  const grouped=new Map();
  state.bookings.filter(b=>b.status!=='cancelled').forEach(b=>{const key=b.phone.replace(/\D/g,'');if(!grouped.has(key))grouped.set(key,{name:b.name,phone:b.phone,bookings:[]});grouped.get(key).bookings.push(b);});
  return heading('Мои клиенты','История визитов рядом, когда она нужна.')+`<div class="client-list">${[...grouped.values()].map((c,i)=>`<button class="card client-row text-left" data-action="client-detail" data-value="${esc(c.phone)}"><span class="avatar ${colors[i%3]}">${esc(initials(c.name))}</span><span><h3>${esc(c.name)}</h3><p>${esc(c.phone)}</p></span><span class="right"><strong>${money(c.bookings.reduce((v,b)=>v+b.price,0))}</strong><small>${c.bookings.length} записей</small></span>${icon('chevron')}</button>`).join('')}</div>`;
}
function input(name,label,value,type='text',extra=''){return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;}
function hoursFields(){return `<label class="small" style="font-weight:550">Рабочие дни</label><div class="day-toggles">${weekNames.map((d,i)=>`<button type="button" class="day-toggle ${ui.selectedDays.includes(i)?'active':''}" data-action="toggle-day" data-value="${i}" aria-pressed="${ui.selectedDays.includes(i)}">${d}</button>`).join('')}</div><div class="fields-row">${input('start','Начало дня',state.hours.start,'time','required')}${input('end','Конец дня',state.hours.end,'time','required')}</div><div class="fields-row">${input('breakStart','Перерыв с',state.hours.breakStart,'time','required')}${input('breakEnd','Перерыв до',state.hours.breakEnd,'time','required')}</div><p class="small muted">Время указываем по Москве. Перерыв и паузы между услугами закрыты для записи.</p>`;}
function wizard(){
  if(ui.wizard===4)return `<div class="wizard-wrap"><section class="card setup-success"><div class="success-icon">${icon('check')}</div><h1>Ваша страница готова</h1><p>В демо можно выбрать время и попробовать запись глазами клиента. Изменения видны только вам.</p><div class="link-box"><div><p>${esc(state.profile.name)}</p><small>Страница записи · ${esc(state.profile.slug)}</small></div><button class="icon-btn" data-action="copy-link" aria-label="Скопировать ссылку">${icon('copy')}</button></div><button class="btn primary wide" data-action="open-client">Проверить запись как клиент ${icon('arrow')}</button><button class="btn quiet wide" data-action="finish-setup" style="margin-top:8px">Перейти в «Мой день»</button></section></div>`;
  const s=state.services[0];
  const contents={
    1:`<h2>Давайте познакомимся</h2><p>Так клиенты увидят вас на странице записи.</p>${input('name','Как вас зовут',state.profile.name,'text','required maxlength="60"')}${input('speciality','Ваша специализация',state.profile.speciality,'text','required maxlength="70"')}${input('address','Адрес приёма',state.profile.address,'text','required maxlength="120"')}<div class="field"><label for="timezone">Часовой пояс</label><select id="timezone" name="timezone"><option>Москва · UTC+3</option></select><small>Время на всех экранах будет одинаковым.</small></div>`,
    2:`<h2>Начнём с одной услуги</h2><p>Остальные можно добавить позже в кабинете.</p>${input('title','Название услуги',s.title,'text','required maxlength="90"')}<div class="fields-row">${input('duration','Длительность, минут',s.duration,'number','required min="5" max="600" step="5"')}${input('price','Цена, ₽',s.price,'number','required min="0" max="1000000"')}</div>${input('buffer','Пауза после клиента, минут',s.buffer,'number','required min="0" max="120" step="5"')}`,
    3:`<h2>Когда вы принимаете?</h2><p>Рабочие часы можно менять в любое время.</p>${hoursFields()}`
  };
  return `<div class="wizard-wrap"><button class="wizard-back" data-action="leave-setup">${icon('left')}В кабинет</button><div class="wizard-intro"><span class="eyebrow">Ваша ссылка на запись за 5 минут</span><h1 style="margin-top:10px">Больше времени на любимое дело</h1><p>Три небольших шага — и всё готово.</p></div><div class="steps" aria-label="Шаг ${ui.wizard} из 3">${[1,2,3].map(i=>`<span class="${i<ui.wizard?'done':i===ui.wizard?'active':''}"></span>`).join('')}</div><form class="card form-card" id="wizard-form">${contents[ui.wizard]}<div id="form-error" class="form-error" role="alert"></div><div class="form-actions"><button type="button" class="btn quiet" data-action="wizard-back">${ui.wizard===1?'Отмена':'Назад'}</button><span class="small muted">${ui.wizard} / 3</span><button type="submit" class="btn primary">${ui.wizard===3?'Получить ссылку':'Продолжить'} ${icon('arrow')}</button></div></form></div>`;
}
function clientShell(){return `<main class="client-page fade-in"><div class="client-top">${brand()}<span class="small">Без звонков и переписки</span></div>${ui.clientStep===3?confirmation():`<div class="booking-layout">${proCard()}<section class="booking-content"><div class="booking-steps">${['Услуга','Время','Контакты'].map((label,i)=>`<div class="booking-step ${i===ui.clientStep?'current':i<ui.clientStep?'done':''}"><b>${i<ui.clientStep?'✓':i+1}</b>${label}</div>`).join('')}</div>${ui.clientStep===0?chooseService():ui.clientStep===1?chooseTime():contactsForm()}</section></div>`}<p class="footer-note">Тестовые данные · ${displayDate(TODAY)} · сообщения не отправляются</p></main>`;}
function proCard(){return `<aside class="pro-card"><div class="avatar large">${esc(initials(state.profile.name))}</div><h1>${esc(state.profile.name)}</h1><p class="role">${esc(state.profile.speciality)} · ${esc(state.profile.city)}</p><div class="pro-detail"><div class="row">${icon('location')}${esc(state.profile.address)}</div><div class="row">${icon('clock')}Время по Москве · UTC+3</div><div class="row">${icon('spark')}Внимание к каждой детали</div></div><div class="quote"><div class="quote-mark">“</div>Красивые руки начинаются с заботы о себе. Буду рада нашей встрече.</div></aside>`;}
function chooseService(){return `<h2 class="booking-title">Время для себя</h2><p class="booking-subtitle">Выберите услугу, а я позабочусь об остальном.</p>${state.services.map(s=>`<button class="service-option" data-action="select-service" data-id="${esc(s.id)}"><div><h3>${esc(s.title)}</h3><p>${s.duration} минут · все материалы включены</p></div><span class="amount">${money(s.price)}</span>${icon('chevron')}</button>`).join('')}<p class="service-caption">${icon('shield')}Оплата услуги после визита. Здесь выбираем только время.</p>`;}
function selectionSummary(){const s=service(ui.serviceId);return `<div class="selection-summary"><div><p>${esc(s.title)}</p><small>${s.duration} минут · ${money(s.price)}</small></div><button data-action="back-service">Изменить</button></div>`;}
function getSlots(serviceId,day,excludeId=null){
  const s=service(serviceId);if(!s)return [];
  const wd=(date(day).getDay()+6)%7;
  if(!state.hours.days.includes(wd)||day<TODAY)return [];
  const h=state.hours,start=minutes(h.start),end=minutes(h.end),bs=minutes(h.breakStart),be=minutes(h.breakEnd),occupied=s.duration+s.buffer;
  const busy=state.bookings.filter(b=>b.day===day&&b.id!==excludeId&&b.status==='active');
  const result=[];
  for(let t=start;t+occupied<=end;t+=30){
    if(day===TODAY){const now=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());if(t<minutes(now)+120)continue;}
    if(t<be&&bs<t+occupied)continue;
    if(busy.some(b=>t<minutes(b.time)+b.duration+b.buffer&&minutes(b.time)<t+occupied))continue;
    result.push(time(t));
  }
  return result;
}
function dateTiles(selected,action,serviceId,excludeId=null){return `<div class="date-scroll" aria-label="День визита">${Array.from({length:14},(_,i)=>{const d=addDays(TODAY,i);const open=getSlots(serviceId,d,excludeId).length>0;return `<button type="button" class="date-tile ${selected===d?'active':''}" data-action="${action}" data-value="${d}" aria-label="${esc(displayDate(d))}${open?'':' — нет свободного времени'}" aria-pressed="${selected===d}" ${open?'':'disabled'}><span>${weekNames[(date(d).getDay()+6)%7]}</span><strong>${date(d).getDate()}</strong><span>${date(d).toLocaleDateString('ru-RU',{month:'short'}).replace('.','')}</span></button>`;}).join('')}</div>`;}
function timeGrid(serviceId,day,selected,action,excludeId=null){const slots=getSlots(serviceId,day,excludeId);return slots.length?`<div class="time-grid" aria-label="Свободное время">${slots.map(t=>`<button type="button" class="time-slot ${selected===t?'active':''}" data-action="${action}" data-value="${t}" aria-pressed="${selected===t}">${t}</button>`).join('')}</div>`:`<div class="empty-state" style="padding:24px 10px">${icon('calendar')}<h3>На этот день свободных окон нет</h3><p style="margin-bottom:0">Выберите другой день в календаре выше.</p></div>`;}
function chooseTime(){return `<h2 class="booking-title">Когда вам удобно?</h2><p class="booking-subtitle">Показываю только свободное время.</p>${selectionSummary()}${dateTiles(ui.clientDay,'select-day',ui.serviceId)}<h3 class="time-label">${capitalize(displayDate(ui.clientDay))}</h3>${timeGrid(ui.serviceId,ui.clientDay,ui.clientTime,'select-time')}<div class="booking-bottom"><button class="btn quiet" data-action="back-service">${icon('left')}Назад</button><button class="btn primary" data-action="to-contacts" ${ui.clientTime?'':'disabled'}>Продолжить ${icon('arrow')}</button></div>`;}
function contactsForm(){const s=service(ui.serviceId);return `<h2 class="booking-title">Осталось познакомиться</h2><p class="booking-subtitle">Проверьте время и оставьте контакты.</p><div class="selection-summary"><div><p>${esc(s.title)}</p><small>${displayDate(ui.clientDay)} в ${ui.clientTime} · ${money(s.price)}</small></div><button data-action="back-time">Изменить</button></div><form class="card form-card" id="booking-form"><div class="demo-contact-note">Это интервью-прототип. Используйте вымышленные имя и телефон — тестовый пример уже заполнен.</div>${input('clientName','Ваше имя',ui.contact.name,'text','required maxlength="60" autocomplete="off"')}${input('clientPhone','Номер телефона',ui.contact.phone,'tel','required maxlength="25" autocomplete="off" inputmode="tel"')}<label class="checkbox-field"><input name="consent" type="checkbox" ${ui.consent?'checked':''} required><span>Соглашаюсь на обработку контактных данных для записи и напоминаний. <button type="button" data-action="privacy">Об обработке данных</button></span></label><div id="form-error" class="form-error" role="alert"></div><div class="booking-bottom"><button type="button" class="btn quiet" data-action="back-time">${icon('left')}Назад</button><button class="btn primary" type="submit">Подтвердить запись ${icon('check')}</button></div></form>`;}
function confirmation(){
  const b=state.bookings.find(b=>b.id===state.lastBookingId);
  if(!b){ui.clientStep=0;return '<div class="empty-state"><h2>Начнём с выбора услуги</h2><button class="btn primary" data-action="new-client-booking">Выбрать услугу</button></div>';}
  const cancelled=b.status==='cancelled';
  return `<section class="confirmation ${cancelled?'booking-cancelled':''}"><div class="success-icon">${icon(cancelled?'close':'check')}</div><h1>${cancelled?'Запись отменена':'Вы записаны. До встречи!'}</h1><p class="muted">${cancelled?'Спасибо, что предупредили. Вы можете выбрать другое время.':'Всё готово. Осталось немного времени для себя.'}</p><div class="card ticket"><div class="ticket-top"><span class="eyebrow">${esc(state.profile.name)}</span><span class="pill ${cancelled?'red':''}">${cancelled?'Отменена':'Подтверждена'}</span></div><h2>${esc(bookingService(b))}</h2><span class="muted small">${b.duration} минут · ${money(b.price)}</span><div class="meta"><div class="row">${icon('calendar')}<strong>${capitalize(displayDate(b.day))}, ${b.time}</strong><span class="small muted">МСК</span></div><div class="row">${icon('location')}${esc(state.profile.address)}</div><div class="row">${icon('user')}${esc(b.name)}</div></div></div>${cancelled?`<button class="btn primary wide" data-action="new-client-booking">Выбрать другое время ${icon('arrow')}</button>`:`<div class="reminder-panel"><h3>${b.reminder?icon('check')+' Напоминания подключены':'Напомнить вам о визите?'}</h3><p>${b.reminder?'В настоящем сервисе бот напомнит за сутки и за два часа. В этом прототипе подключение демонстрационное.':'За сутки и за два часа — чтобы не держать всё в голове. Подключите напоминания в Telegram.'}</p><button class="btn ${b.reminder?'secondary':'primary'}" data-action="${b.reminder?'simulate-block':'connect-reminders'}" data-id="${esc(b.id)}">${icon(b.reminder?'bell':'telegram')}${b.reminder?'Проверить отключение бота':'Напомнить мне в Telegram'}</button><button class="calendar-link" data-action="download-ics" data-id="${esc(b.id)}">${icon('calendar')}${b.icsDownloaded?'Скачать событие ещё раз':'Добавить в календарь'}</button></div><div class="manage-actions"><button data-action="reschedule" data-id="${esc(b.id)}">Перенести запись</button><button data-action="cancel" data-id="${esc(b.id)}" class="danger-text">Отменить запись</button></div><button class="btn secondary wide" data-action="show-in-master">Посмотреть запись в кабинете мастера ${icon('arrow')}</button><button class="btn quiet wide" data-action="new-client-booking" style="margin-top:8px">Записаться ещё раз</button>`}<p class="booking-reference">Запись № ${esc(b.id.slice(-5).toUpperCase())} · демонстрационные данные</p></section>`;
}
function showModal(title,body,actions=''){ $modal.innerHTML=`<div class="modal-header"><h2>${title}</h2><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">${icon('close')}</button></div>${body}${actions?`<div class="modal-actions">${actions}</div>`:''}`; if(!$modal.open)$modal.showModal(); }
function closeModal(){ $modal.close();ui.reschedule=null;ui.serviceEdit=null; }
function setMode(mode){ ui.mode=mode; ui.wizard=0;if(mode==='client' && !state.lastBookingId)ui.clientStep=0;location.hash=mode==='client'?'client':'master'; render();window.scrollTo(0,0); }
function openClient(reset=true){if(reset){ui.clientStep=0;ui.serviceId=null;ui.clientTime=null;ui.consent=false;}setMode('client');}
function findBooking(id){return state.bookings.find(b=>b.id===id);}
function rescheduleModal(){
  const r=ui.reschedule,b=findBooking(r.id);
  showModal('Выберем другое время',`<p class="modal-text">${esc(b.name)} · ${esc(bookingService(b))}<br>Сейчас: ${displayDate(b.day)}, ${b.time}</p>${dateTiles(r.day,'reschedule-day',b.serviceId,b.id)}<p class="time-label">${capitalize(displayDate(r.day))}</p>${timeGrid(b.serviceId,r.day,r.time,'reschedule-time',b.id)}<div class="modal-note">После переноса прежнее окно снова станет свободным.</div>`,`<button class="btn secondary" data-action="close-modal">Оставить как есть</button><button class="btn primary" data-action="save-reschedule" ${r.time?'':'disabled'}>Перенести</button>`);
}
function serviceModal(id=null){
  const s=id?service(id):{title:'',duration:60,buffer:15,price:2000};ui.serviceEdit=id;
  showModal(id?'Изменить услугу':'Новая услуга',`<form id="service-form">${input('serviceTitle','Название',s.title,'text','required maxlength="90"')}<div class="fields-row">${input('serviceDuration','Длительность, минут',s.duration,'number','required min="5" max="600" step="5"')}${input('servicePrice','Цена, ₽',s.price,'number','required min="0" max="1000000"')}</div>${input('serviceBuffer','Пауза после клиента, минут',s.buffer,'number','required min="0" max="120" step="5"')}<div class="modal-actions"><button type="button" class="btn secondary" data-action="close-modal">Отмена</button><button type="submit" class="btn primary">Сохранить</button></div></form>`);
}
function parseHours(form){
  const h={days:[...ui.selectedDays].sort(),start:form.get('start'),end:form.get('end'),breakStart:form.get('breakStart'),breakEnd:form.get('breakEnd')};
  if(!h.days.length)throw Error('Выберите хотя бы один рабочий день.');
  if(minutes(h.end)<=minutes(h.start))throw Error('Конец рабочего дня должен быть позже начала.');
  if(minutes(h.breakStart)<minutes(h.start)||minutes(h.breakEnd)>minutes(h.end)||minutes(h.breakEnd)<=minutes(h.breakStart))throw Error('Перерыв должен находиться внутри рабочего дня и заканчиваться позже начала.');
  return h;
}
async function copyLink(){const url=location.href.split('#')[0]+'#client';try{await navigator.clipboard.writeText(url);toast('Демо-ссылка скопирована. У каждого участника свои тестовые данные.');}catch{showModal('Ссылка на тестовую страницу',`<p class="modal-text">Ссылка открывает клиентский сценарий. Изменения остаются на вашем устройстве.</p><div class="field" style="margin-top:16px"><label for="share-link">Ссылка</label><input id="share-link" readonly value="${esc(url)}" onclick="this.select()"></div>`);}}
function resetDemo(){state=seed();save();Object.assign(ui,{mode:'welcome',nav:'day',day:TODAY,wizard:0,selectedDays:[...state.hours.days],clientStep:0,serviceId:null,clientDay:addDays(TODAY,1),clientTime:null,contact:{name:'Мария Соколова',phone:'+7 (999) 000-00-00'},consent:false,reschedule:null,serviceEdit:null});location.hash='welcome';closeModal();render();toast('Готово. Можно снова потыкать Чик!');}
function downloadIcs(b){
  const start=new Date(`${b.day}T${b.time}:00+03:00`),end=new Date(start.getTime()+b.duration*60000);
  const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const safe=v=>String(v).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Zapis Interview//RU','BEGIN:VEVENT',`UID:${b.id}@zapis-demo.local`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:${safe(bookingService(b)+' · '+state.profile.name)}`,`LOCATION:${safe(state.profile.address)}`,...[24,2].flatMap(h=>['BEGIN:VALARM','ACTION:DISPLAY',`TRIGGER:-PT${h}H`,`DESCRIPTION:${safe(bookingService(b))}`,'END:VALARM']),'END:VEVENT','END:VCALENDAR'];
  const fold=line=>{let out='',part='';for(const c of line){if(new TextEncoder().encode(part+c).length>75){out+=part+'\r\n';part=' ';}part+=c;}return out+part;};
  const blob=new Blob([lines.map(fold).join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='zapis-test.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);b.icsDownloaded=true;save();render();toast('Тестовое событие скачано. Импорт выполняется в вашем календаре.');
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]'); if(!button||button.disabled)return;
  const action=button.dataset.action,id=button.dataset.id,value=button.dataset.value;
  switch(action){
    case 'home':goHome();break;
    case 'try-master':setMode('master');ui.wizard=1;ui.selectedDays=[...state.hours.days];render();break;
    case 'try-client':openClient();break;
    case 'join-focus':showFocusInvite();break;
    case 'open-focus':window.ChikTelegram.openOrganizer();break;
    case 'mode-master':setMode('master');break;
    case 'mode-client':setMode('client');break;
    case 'nav':ui.wizard=0;ui.nav=value;render();break;
    case 'setup':ui.wizard=1;ui.selectedDays=[...state.hours.days];render();break;
    case 'leave-setup':case 'finish-setup':ui.wizard=0;ui.nav='day';render();break;
    case 'wizard-back':ui.wizard=Math.max(0,ui.wizard-1);render();break;
    case 'toggle-day':{const n=Number(value);ui.selectedDays=ui.selectedDays.includes(n)?ui.selectedDays.filter(d=>d!==n):[...ui.selectedDays,n];button.classList.toggle('active',ui.selectedDays.includes(n));button.setAttribute('aria-pressed',String(ui.selectedDays.includes(n)));break;}
    case 'today':ui.day=TODAY;render();break;
    case 'prev-day':if(ui.day>TODAY)ui.day=addDays(ui.day,-1);render();break;
    case 'next-day':ui.day=addDays(ui.day,1);render();break;
    case 'master-date':ui.day=value;render();break;
    case 'open-client':case 'new-booking':case 'new-client-booking':openClient();break;
    case 'show-in-master':ui.day=findBooking(state.lastBookingId)?.day||TODAY;ui.nav='day';setMode('master');break;
    case 'copy-link':copyLink();break;
    case 'select-service':ui.serviceId=id;ui.clientStep=1;ui.clientTime=null;ui.clientDay=Array.from({length:14},(_,i)=>addDays(TODAY,i+1)).find(d=>getSlots(id,d).length)||addDays(TODAY,1);render();break;
    case 'select-day':ui.clientDay=value;ui.clientTime=null;render();break;
    case 'select-time':ui.clientTime=value;render();break;
    case 'to-contacts':if(ui.clientTime){ui.clientStep=2;render();}break;
    case 'back-service':ui.clientStep=0;ui.clientTime=null;render();break;
    case 'back-time':{const form=document.querySelector('#booking-form');if(form){const data=new FormData(form);ui.contact={name:String(data.get('clientName')),phone:String(data.get('clientPhone'))};ui.consent=data.has('consent');}ui.clientStep=1;render();break;}
    case 'complete':{const b=findBooking(id);if(b?.status==='active'){b.status='completed';save();render();toast('Визит отмечен: клиентка пришла.');}break;}
    case 'cancel':{const b=findBooking(id);showModal('Отменить запись?',`<p class="modal-text">${esc(bookingService(b))}<br><strong>${displayDate(b.day)}, ${b.time}</strong><br>Время снова станет доступным для записи.</p>`,`<button class="btn secondary" data-action="close-modal">Сохранить запись</button><button class="btn danger" data-action="confirm-cancel" data-id="${esc(id)}">Отменить запись</button>`);break;}
    case 'confirm-cancel':{const b=findBooking(id);b.status='cancelled';save();closeModal();render();toast('Запись отменена. Время снова свободно.');break;}
    case 'reschedule':{const b=findBooking(id);ui.reschedule={id,day:b.day,time:null};rescheduleModal();break;}
    case 'reschedule-day':ui.reschedule.day=value;ui.reschedule.time=null;rescheduleModal();break;
    case 'reschedule-time':ui.reschedule.time=value;rescheduleModal();break;
    case 'save-reschedule':{const r=ui.reschedule,b=findBooking(r.id);if(!r.time||!getSlots(b.serviceId,r.day,b.id).includes(r.time)){toast('Это время уже занято. Выберите другое.');break;}b.day=r.day;b.time=r.time;save();closeModal();render();toast('Запись перенесена. Прежнее время снова свободно.');break;}
    case 'connect-reminders':showModal('Напоминания в Telegram',`<div class="telegram-symbol">${icon('telegram')}</div><p class="modal-text">В настоящем сервисе здесь откроется Telegram-бот. После запуска он сможет напомнить о визите за сутки и за два часа.</p><div class="modal-note">Это демонстрация подключения. Сообщения не отправляются, доступ к Telegram не запрашивается.</div>`,`<button class="btn secondary" data-action="close-modal">Позже</button><button class="btn primary" data-action="confirm-reminders" data-id="${esc(id)}">Подключить в демо</button>`);break;
    case 'confirm-reminders':findBooking(id).reminder=true;save();closeModal();render();toast('Тестовое подключение выполнено. Сообщения не отправляются.');break;
    case 'simulate-block':showModal('Проверить отключение?',`<p class="modal-text">Смоделируем ситуацию, когда клиент заблокировал бота. В кабинете мастера появится отметка «Без напоминаний».</p>`,`<button class="btn secondary" data-action="close-modal">Оставить</button><button class="btn primary" data-action="confirm-block" data-id="${esc(id)}">Отключить в демо</button>`);break;
    case 'confirm-block':findBooking(id).reminder=false;save();closeModal();render();toast('Канал отключён в демо. Мастер видит отсутствие напоминаний.');break;
    case 'download-ics':if(window.ChikTelegram?.insideTelegram)showModal('Визит в календаре',`<p class="modal-text">Здесь можно будет сохранить визит и поставить будильники за сутки и за два часа.</p><div class="modal-note">В Telegram-демо показываем сценарий. Если открыть это демо в обычном браузере, можно скачать тестовое событие.</div>`);else downloadIcs(findBooking(id));break;
    case 'add-service':serviceModal();break;
    case 'edit-service':serviceModal(id);break;
    case 'edit-hours':ui.selectedDays=[...state.hours.days];showModal('Рабочие часы',`<form id="hours-form">${hoursFields()}<div id="hours-error" class="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="btn secondary" data-action="close-modal">Отмена</button><button type="submit" class="btn primary">Сохранить</button></div></form>`);break;
    case 'client-detail':{const bookings=state.bookings.filter(b=>b.phone===value),b=bookings[0];showModal(esc(b.name),`<p class="modal-text">${esc(b.phone)} · тестовая карточка</p><div class="stack" style="margin-top:20px">${bookings.map(v=>`<div class="link-box" style="margin:0"><div><p>${esc(bookingService(v))}</p><small>${displayDate(v.day)}, ${v.time} · ${v.status==='cancelled'?'отменена':v.status==='completed'?'визит состоялся':'запланирована'}</small></div><strong>${money(v.price)}</strong></div>`).join('')}</div>`);break;}
    case 'privacy':showModal('О тестовых данных',`<p class="modal-text">Прототип работает на этом компьютере. Введённые данные сохраняются только в браузере и не отправляются на сервер. Используйте вымышленные имя и телефон.</p><div class="modal-note">Это описание демонстрации, а не действующее согласие для рабочего сервиса. Кнопка «Сбросить» удаляет изменения и восстанавливает тестовые данные.</div>`);break;
    case 'guide':showModal('Что потыкать в Чик!',`<ol class="modal-list"><li><strong>Сначала реальный опыт.</strong> Как записался последний клиент? Что происходит при переносе или неявке?</li><li><strong>Сценарий мастера.</strong> Нажмите «Пройти настройку». Предложите настроить услугу и получить ссылку.</li><li><strong>Сценарий клиента.</strong> Откройте страницу записи. Предложите выбрать время и записаться с тестовыми контактами.</li><li><strong>Управление визитом.</strong> Подключите напоминания в демо, перенесите визит и найдите его в кабинете мастера.</li><li><strong>Проверка интереса.</strong> Что мешает попробовать это с реальными клиентами? Договоритесь о следующем шаге.</li></ol><div class="modal-note">Не подсказывайте, куда нажимать. Запишите места, где участник остановился. Перед следующим интервью нажмите «Сбросить». Оплата и реальные сообщения в прототип не входят.</div>`);break;
    case 'reset':showModal('Начать новое интервью?',`<p class="modal-text">Все изменения на этом компьютере будут заменены исходными тестовыми данными Анны. Новые записи и услуги будут удалены.</p>`,`<button class="btn secondary" data-action="close-modal">Продолжить интервью</button><button class="btn primary" data-action="confirm-reset">Сбросить данные</button>`);break;
    case 'confirm-reset':resetDemo();break;
    case 'close-modal':closeModal();break;
  }
});
document.addEventListener('submit',event=>{
  const form=event.target;if(!['wizard-form','booking-form','service-form','hours-form'].includes(form.id))return;
  event.preventDefault();const data=new FormData(form);
  try{
    if(form.id==='wizard-form'){
      if(ui.wizard===1){state.profile.name=String(data.get('name')).trim();state.profile.speciality=String(data.get('speciality')).trim();state.profile.address=String(data.get('address')).trim();if(!state.profile.name||!state.profile.speciality||!state.profile.address)throw Error('Заполните имя, специализацию и адрес.');}
      if(ui.wizard===2){const s=state.services[0];s.title=String(data.get('title')).trim();s.duration=Number(data.get('duration'));s.price=Number(data.get('price'));s.buffer=Number(data.get('buffer'));if(!s.title)throw Error('Укажите название услуги.');}
      if(ui.wizard===3)state.hours=parseHours(data);
      save();ui.wizard++;render();window.scrollTo(0,0);
    }else if(form.id==='booking-form'){
      const name=String(data.get('clientName')).trim(),phone=String(data.get('clientPhone')).trim();
      if(!name)throw Error('Укажите тестовое имя.');
      if(!/^([78])\d{10}$/.test(phone.replace(/\D/g,'')))throw Error('Укажите телефон из 11 цифр, начинающийся с +7 или 8.');
      if(!data.has('consent'))throw Error('Для подтверждения отметьте согласие.');
      if(!getSlots(ui.serviceId,ui.clientDay).includes(ui.clientTime))throw Error('Время уже занято. Вернитесь к выбору свободного окна.');
      const s=service(ui.serviceId),b={id:'b'+Date.now().toString(36),serviceId:s.id,serviceTitle:s.title,day:ui.clientDay,time:ui.clientTime,duration:s.duration,buffer:s.buffer,price:s.price,name,phone,status:'active',reminder:false};
      state.bookings.push(b);state.lastBookingId=b.id;ui.contact={name,phone};ui.consent=true;save();ui.clientStep=3;render();window.ChikTelegram?.success();window.scrollTo(0,0);
    }else if(form.id==='service-form'){
      const item={id:ui.serviceEdit||'s'+Date.now().toString(36),title:String(data.get('serviceTitle')).trim(),duration:Number(data.get('serviceDuration')),price:Number(data.get('servicePrice')),buffer:Number(data.get('serviceBuffer'))};
      if(!item.title)throw Error('Укажите название услуги.');
      if(ui.serviceEdit){state.bookings.filter(b=>b.serviceId===ui.serviceEdit).forEach(b=>{b.serviceTitle??=service(ui.serviceEdit).title;});Object.assign(service(ui.serviceEdit),item);}else state.services.push(item);
      save();closeModal();render();toast('Услуга сохранена. Клиенты видят её на странице записи.');
    }else if(form.id==='hours-form'){
      state.hours=parseHours(data);save();closeModal();render();toast('Рабочие часы обновлены. Свободные окна пересчитаны.');
    }
  }catch(error){const target=form.querySelector('#form-error,#hours-error');if(target)target.textContent=error.message;else toast(error.message);}
});
window.addEventListener('hashchange',()=>{const mode=location.hash.startsWith('#client')?'client':location.hash.startsWith('#master')?'master':'welcome';if(ui.mode!==mode){ui.mode=mode;ui.wizard=0;render();}});
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY&&event.newValue){try{state=JSON.parse(event.newValue);render();}catch{}}});
$modal.addEventListener('click',event=>{if(event.target===$modal){const rect=$modal.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}});
render();
