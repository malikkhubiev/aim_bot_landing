(function(){
  const API = 'https://aim-pay-bot-server-4c57.onrender.com';
  function getParam(name){ const u = new URL(window.location.href); return u.searchParams.get(name); }
  async function fetchJson(url, opts){ const r = await fetch(url, opts); if(!r.ok) throw new Error('HTTP '+r.status); return await r.json(); }

  const questions = [
    { id:'q1', title:'Q1: Корреляция и причинность', text:'Мы заметили связь между числом пожарных и разрушениями. Нужно ли звать меньше пожарных?', choices:[ 'Да', 'Нет' ] },
    { id:'q2', title:'Q2: Мороженое и утопления', text:'Чем больше мороженого — тем больше утоплений. Запретить мороженое?', choices:[ 'Да', 'Нет' ] },
    { id:'q3', title:'Q3: Книги и учёба', text:'Чем больше книг, тем лучше учится ребёнок. Достаточно завалить дом книгами?', choices:[ 'Да', 'Нет' ] }
  ];

  function renderStep(idx){
    const q = questions[idx];
    const host = document.getElementById('quiz');
    const lead = window.leadData || {};
    const nameLine = lead.name ? `${lead.name}, смотри 👇` : 'Смотри 👇';
    const answers = q.choices.map((c,i)=>`<button class="right" data-i="${i}">${c}</button>`).join('');
    host.innerHTML = `
      <div class="question">
        <div class="hint">Шаг ${idx+1} из ${questions.length}</div>
        <h2>${q.title}</h2>
        <div class="myown">${nameLine}</div>
        <p>${q.text}</p>
        <div class="answers">${answers}</div>
      </div>
    `;
    host.querySelectorAll('button[data-i]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const answerIdx = Number(btn.getAttribute('data-i'));
        const answer = q.choices[answerIdx];
        await window.AimQuestState.saveProgress({ stage:'quiz', stepKey:q.id, stepIndex:idx, answer, meta:null });
        if (idx < questions.length-1){
          renderStep(idx+1);
        } else {
          renderCompleted();
        }
      });
    });
  }

  function renderCompleted(){
    const host = document.getElementById('quiz');
    const leadId = (window.leadData && window.leadData.id) || getParam('lead_id') || '';
    host.innerHTML = `
      <div class="question">
        <h2>Поздравляем! Тест на мышление пройден 🎉</h2>
        <p style="font-size: 20px; margin: 20px 0; line-height: 1.6;">
          Хотите узнать как построить машинное обучение для компании на Wall Street?<br><br>
          Вы пройдёте все 15 этапов в интерактивном режиме и узнаете какой стиль работы у инженера ML.
        </p>
        <div class="answers">
          <button id="openLongrid" class="right">Перейти к чек-листу Wall Street</button>
        </div>
      </div>
    `;
    document.getElementById('openLongrid').addEventListener('click', async () => {
      await window.AimQuestState.saveProgress({ stage:'quiz', stepKey:'completed', stepIndex:questions.length-1, answer:'done', meta:null });
      const url = window.AimQuestState.buildUrl('longrid.html', leadId ? { lead_id: leadId } : {});
      window.location.href = url;
    });
  }

  window.addEventListener('DOMContentLoaded', async () => {
    const leadId = getParam('lead_id');
    if (leadId) window.AimQuestState.setLeadContext({ leadId });
    // Attempt resume if user landed here directly
    try {
      const last = await window.AimQuestState.getLastProgress();
      if (last && last.stage === 'quiz' && typeof last.step_index === 'number'){
        renderStep(Math.min(questions.length-1, Math.max(0, last.step_index)));
        return;
      }
    } catch(_){ }
    renderStep(0);
  });
})();

const API_BASE = 'https://aim-pay-bot-server-4c57.onrender.com';

function getLeadId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('lead_id');
}

async function sendProgress(step, answer) {
  const leadId = getLeadId();
  if (!leadId) return; // тихо выходим, если не знаем лида
  try {
    const response = await fetch(`${API_BASE}/form_warm/clients/${leadId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, answer })
    });
    // Если ответ уже существует (409), обновляем его
    if (response.status === 409) {
      await fetch(`${API_BASE}/form_warm/clients/${leadId}/answers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, answer })
      });
    }
  } catch (_) {}
}

// Загружаем сохраненные ответы
let savedAnswers = {};
async function loadSavedAnswers() {
  const leadId = getLeadId();
  if (!leadId) return;
  try {
    const resp = await fetch(`${API_BASE}/form_warm/clients/${leadId}/progress`);
    const data = await resp.json();
    if (data.status === 'success' && data.progress) {
      data.progress.forEach(p => {
        savedAnswers[p.step] = p.answer;
      });
    }
  } catch (_) {}
}

const quizData = [
  {
    type: 'reveal',
    title: '1. Закономерность 🔥',
    question: 'Мы заметили прямую связь между Числом пожарных🚒 и Величиной разрушений💥.<br>Значит ли это, что для тушения пожара нужно звать как можно меньше пожарных?🔥✅🔥',
    answer: 'Ответ: Ущерб не из-за пожарных.<br><br>Есть 3-ий фактор, который:<br>1. Вызывает ущерб<br>2. Из-за которого приходится звать много пожарных.<br><br>Этот фактор - ОГРОМНЫЙ ПОЖАР 🔥🔥🔥.<br><br>Не звать пожарных - большая глупость.'
  },
  {
    type: 'reveal',
    title: '2. Закономерность 🍧',
    question: 'Чем больше продают мороженого, тем больше людей утонуло. Запретить мороженое?',
    answer: 'Ответ: Есть третий фактор, который является причиной обоих явлений - ЖАРА 🌅.<br><br>Жара → люди больше покупают мороженого и чаще купаются → увеличивается вероятность утоплений.<br><br>А мороженое - это вкусно)'
  },
  {
    type: 'reveal',
    title: '3. Закономерность 📖',
    question: 'Чем больше книг в доме, тем лучше учится ребёнок. Достаточно завалить дом книгами?',
    answer: 'Ответ: Есть третий фактор, который является причиной обоих явлений - социально-экономический статус и вовлеченность родителей. 💎🎓<br><br>Образованные, обеспеченные родители склонны иметь много книг и больше внимания уделять образованию детей. 👩‍👧‍👦🧠'
  },
  {
    type: 'reveal',
    title: '4. Медицина 🧑‍⚕️',
    question: 'Модель поставила диагноз «рак». Можно ли так и сказать пациенту без объяснений?',
    answer: 'Ответ: Нет.<br><br>Врачу нужно объяснение: «Модель выделила вот этот участок на снимке с такими-то характеристиками (неровные края, высокая плотность), что с высокой вероятностью указывает на злокачественность».<br><br>Дальше это можно перепроверить и, если ошибок нет, тогда ставим диагноз.'
  },
  {
    type: 'reveal',
    title: '5. Инвестиции 💸',
    question: 'Модель говорит не покупать акции. Можно ли слепо следовать предсказанию?',
    answer: 'Ответ: Нет.<br><br>Разумный инвестор не следует слепо чужим указаниям.<br><br>Ему нужны аргументы: "У компании высокое соотношения долга к доходу, нет стабильного потока клиентов, им один раз выделили деньги, но они не доказали, что умеют ими эффективно распоряжаться."'
  },
  {
    type: 'reveal',
    title: '6. Смещение выборки 🗽',
    question: 'Опрос 1936 года предсказал неверного победителя. Почему?',
    answer: 'Ответ: Всё дело в смещении выборки.<br><br>Опрашивали владельцев телефонов/подписчиков — в основном богатых, не репрезентативно.<br><br>Если в дорогом отеле в Дубае 0% опрошенных едят быстрорастворимую лапшу, это не значит, что в 2025 году её больше не покупают.'
  },
  {
    type: 'choice',
    title: '7. Оцените ваш интерес к ML (1–10)',
    options: Array.from({ length: 10 }, (_, i) => String(i + 1))
  },
  {
    type: 'choice',
    title: '8. Насколько готовы изучать ML (1–10)',
    options: Array.from({ length: 10 }, (_, i) => String(i + 1))
  },
  {
    type: 'choice',
    title: '9. Вы умеете пользоваться Телеграмом?',
    options: ['Нет ❌', 'Да ✅']
  },
  {
    type: 'choice',
    title: '10. Решение о курсе',
    options: ['Хочу купить курс сейчас 💰', 'Хочу изучить программу подробнее 📖']
  }
];

function renderStep(container, stepIndex, onDone) {
  container.innerHTML = '';
  if (stepIndex >= quizData.length) {
    const done = document.createElement('div');
    done.className = 'question';
    const h = document.createElement('h3');
    h.innerHTML = 'Поздравляем!<br>Вы прошли тест 🎉';
    const p = document.createElement('p');
    p.innerHTML = 'Хотите узнать как построить машинное обучение для компании на Wall Street?<br><br>Вы пройдёте все 15 этапов в интерактивном режиме и узнаете какой стиль работы у инженера ML.';
    p.classList.add("thanks");
    p.style.fontSize = '20px';
    p.style.margin = '20px 0';
    p.style.lineHeight = '1.6';
    
    const leadId = getLeadId();
    const btn = document.createElement('button');
    btn.className = 'right';
    btn.textContent = 'Перейти к чек-листу Wall Street';
    btn.style.marginTop = '20px';
    btn.addEventListener('click', async () => {
      const url = window.AimQuestState ? 
        window.AimQuestState.buildUrl('longrid.html', leadId ? { lead_id: leadId } : {}) :
        `longrid.html${leadId ? '?lead_id=' + leadId : ''}`;
      window.location.href = url;
    });
    
    done.appendChild(h);
    done.appendChild(p);
    done.appendChild(btn);
    container.appendChild(done);
    return;
  }

  const item = quizData[stepIndex];
  const wrap = document.createElement('div');
  wrap.className = 'question';

  const title = document.createElement('h3');
  title.innerHTML = item.title;
  wrap.appendChild(title);

  const body = document.createElement('div');
  const next = document.createElement('button');
  next.textContent = 'Далее →';
  next.classList.add("right")
  next.disabled = true;
  next.addEventListener('click', () => onDone());

  if (item.type === 'reveal') {
    const q = document.createElement('p');
    q.innerHTML = item.question;
    const reveal = document.createElement('button');
    reveal.classList.add("right")
    reveal.textContent = '✅ Правильный ответ';
    reveal.addEventListener('click', () => {
      reveal.disabled = true;
      const ans = document.createElement('div');
      ans.className = 'answer';
      ans.innerHTML = item.answer;
      body.appendChild(ans);
      next.disabled = false;
      // фиксируем клик по кнопке ответа для шагов 1-6
      sendProgress(stepIndex + 1, 'reveal_clicked');
    });
    body.appendChild(q);
    body.appendChild(reveal);
  } else if (item.type === 'choice') {
    const btns = document.createElement('div');
    btns.className = 'answers';
    const currentAnswer = savedAnswers[(stepIndex + 1).toString()];
    
    item.options.forEach(opt => {
      const b = document.createElement('button');
      b.textContent = opt;
      if (currentAnswer === opt) {
        b.classList.add('selected');
      }
      b.addEventListener('click', () => {
        // Разрешаем изменить выбор
        btns.querySelectorAll('button').forEach(x => {
          x.classList.remove('selected');
          x.disabled = false;
        });
        b.classList.add('selected');
        next.disabled = false;
        // Отправляем выбранный вариант (может обновиться, если уже был ответ)
        sendProgress(stepIndex + 1, opt);
      });
      btns.appendChild(b);
    });
    body.appendChild(btns);
  }

  wrap.appendChild(body);
  const footer = document.createElement('div');
  footer.className = 'footer';
  footer.appendChild(next);
  wrap.appendChild(footer);
  container.appendChild(wrap);
}

(async function init() {
  await loadSavedAnswers();
  const root = document.getElementById('quiz');
  let step = 0;
  const next = () => {
    step += 1;
    renderStep(root, step, next);
  };
  renderStep(root, step, next);
  
  // Отслеживание закрытия вкладки для отправки финального теста
  const leadId = getLeadId();
  if (leadId) {
    // Сохраняем время начала теста
    const testStartTime = Date.now();
    localStorage.setItem('testStartTime', testStartTime.toString());
    localStorage.setItem('leadId', leadId);
    
    // Отслеживаем закрытие/уход со страницы
    window.addEventListener('beforeunload', () => {
      // Отмечаем что тест был закрыт
      localStorage.setItem('testClosed', 'true');
      localStorage.setItem('testClosedTime', Date.now().toString());
      
      // Отправляем запрос на сервер для отправки финального теста через 30 секунд
      // Используем fetch с keepalive для надежной отправки даже при закрытии страницы
      const data = {
        lead_id: leadId,
        delay_seconds: 30
      };
      
      // Используем fetch с keepalive, так как sendBeacon не поддерживает JSON body
      fetch(`${API_BASE}/form_warm/schedule_final_test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true // Гарантирует отправку даже при закрытии страницы
      }).catch(err => {
        console.error('Error scheduling final test:', err);
      });
    });
    
    // Также отслеживаем просто уход со страницы (не обязательно закрытие)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Страница скрыта - пользователь переключился или закрыл
        localStorage.setItem('testClosed', 'true');
        localStorage.setItem('testClosedTime', Date.now().toString());
      }
    });
  }
})();


