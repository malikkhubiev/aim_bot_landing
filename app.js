(function(){
  const API = 'https://aim-pay-bot-server-4c57.onrender.com';
  function getParam(name){ const u = new URL(window.location.href); return u.searchParams.get(name); }
  async function fetchJson(url, opts){ const r = await fetch(url, opts); if(!r.ok) throw new Error('HTTP '+r.status); return await r.json(); }
  // Старая функция renderStep удалена, используем функцию renderStep ниже (239-338)
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
    answer: 'Ответ: Ущерб не из-за пожарных. Есть 3-ий фактор, который:<br>1. Вызывает ущерб<br>2. Из-за которого приходится звать много пожарных.<br>Этот фактор - ОГРОМНЫЙ ПОЖАР 🔥🔥🔥.<br>Не звать пожарных - большая глупость.'
  },
  {
    type: 'reveal',
    title: '2. Закономерность 🍧',
    question: 'Чем больше продают мороженого, тем больше людей утонуло.<br>Запретить мороженое 🍨?',
    answer: 'Ответ: Есть третий фактор, который является причиной обоих явлений - ЖАРА 🌅.<br>Жара → люди больше покупают мороженого и чаще купаются → увеличивается вероятность утоплений.<br>А мороженое - это вкусно).'
  },
  {
    type: 'reveal',
    title: '3. Закономерность 📖',
    question: 'Чем больше книг в доме, тем лучше учится ребёнок 👶.<br>Достаточно завалить дом книгами 📖?',
    answer: 'Ответ: Есть третий фактор, который является причиной обоих явлений - социально-экономический статус и вовлеченность родителей. 💎🎓<br>Образованные, обеспеченные родители склонны иметь много книг и больше внимания уделять образованию детей. 👩‍👧‍👦🧠'
  },
  {
    type: 'reveal',
    title: '4. Медицина 🧑‍⚕️',
    question: 'Модель поставила диагноз «рак».<br>Можно ли так и сказать пациенту без объяснений?',
    answer: 'Ответ: Нет. Врачу 💉 нужно объяснение: «Модель выделила вот этот участок на снимке 🩻 с такими-то характеристиками (неровные края, высокая плотность), что с высокой вероятностью указывает на злокачественность 💀».<br>Дальше это можно перепроверить и, если ошибок нет, тогда ставим диагноз ✅.'
  },
  {
    type: 'reveal',
    title: '5. Инвестиции 💸',
    question: 'Модель говорит не покупать акции.<br>Можно ли слепо следовать предсказанию?',
    answer: 'Ответ: Нет. Разумный инвестор 🧑‍💼💼🤑 не следует слепо чужим указаниям.<br>Ему нужны аргументы: "У компании 🌇 высокое соотношения долга к доходу, нет стабильного потока клиентов 💵💶💴, им один раз выделили деньги, но они не доказали, что умеют ими эффективно 🧠 распоряжаться."'
  },
  {
    type: 'reveal',
    title: '6. Смещение выборки 🗽',
    question: 'Опрос Журнала Literary Digest 📰 1936 года предсказал неверного победителя 👑. Почему?',
    answer: 'Ответ: Выборка была смещена: опрашивали только подписчиков — в основном богатых 🏌️⛳, не репрезентативно. Если в дорогом отеле в Дубае 🏖️ 0% опрошенных едят быстрорастворимую лапшу 🍜, это не значит, что в 2025 году её больше не покупают.'
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
    title: '9. Умеете пользоваться Телеграмом?',
    options: ['Нет ❌', 'Да ✅']
  },
  {
    type: 'choice',
    title: '10. Решение о курсе',
    options: [ 'Хочу изучить программу подробнее 📖', 'Хочу купить курс сейчас 💖']
  }
];

function renderStep(container, stepIndex, onDone) {
  console.log(`[app.js] renderStep called: stepIndex=${stepIndex}, total=${quizData.length}`);
  container.innerHTML = '';
  if (stepIndex >= quizData.length) {
    console.log('[app.js] All steps completed, showing completion screen');
    const done = document.createElement('div');
    done.className = 'question';
    const h = document.createElement('h3');
    h.innerHTML = 'Поздравляем!<br>Вы прошли тест 🎉';
    const p = document.createElement('p');
    p.innerHTML = 'Хочешь узнать как построить модель для компании на Уолл-стрит 🐺?<br><br>Вы пройдёте все 15 этапов ✅ в интерактивном режиме и узнаете какой стиль работы у инженера ML.';
    p.classList.add("thanks");
    p.style.fontSize = '20px';
    p.style.margin = '20px 0';
    p.style.lineHeight = '1.6';
    
    const leadId = getLeadId();
    const btn = document.createElement('button');
    btn.className = 'right';
    btn.textContent = 'Перейти к чек-листу Уолл-стрит 🐺';
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
    console.log(`[app.js] Rendering reveal question: ${item.title}`);
    const q = document.createElement('p');
    q.innerHTML = item.question;
    const reveal = document.createElement('button');
    reveal.classList.add("right")
    reveal.textContent = '✅ Правильный ответ';
    reveal.addEventListener('click', () => {
      console.log(`[app.js] Reveal button clicked for step ${stepIndex + 1}: ${item.title}`);
      reveal.disabled = true;
      const ans = document.createElement('div');
      ans.className = 'answer';
      ans.innerHTML = item.answer;
      body.appendChild(ans);
      next.disabled = false;
      // фиксируем клик по кнопке ответа для шагов 1-6
      sendProgress(stepIndex + 1, '✅');
    });
    body.appendChild(q);
    body.appendChild(reveal);
  } else if (item.type === 'choice') {
    console.log(`[app.js] Rendering choice question: ${item.title}`);
    const btns = document.createElement('div');
    btns.className = 'answers';
    const currentAnswer = savedAnswers[(stepIndex + 1).toString()];
    
    item.options.forEach(opt => {
      const b = document.createElement('button');
      b.textContent = opt;
      if (currentAnswer === opt) {
        b.classList.add('selected_button');
      }
      b.addEventListener('click', () => {
        console.log(`[app.js] Choice selected for step ${stepIndex + 1}: ${opt}`);
        // Разрешаем изменить выбор
        btns.querySelectorAll('button').forEach(x => {
          x.classList.remove('selected_button');
          x.disabled = false;
        });
        b.classList.add('selected_button');
        next.disabled = false;
        // Отправляем выбранный вариант (может обновиться, если уже был ответ)
        let indProgress = stepIndex + 1
        if  (indProgress == 7) sendProgress("7: Интерес к ML", opt)
        else if  (indProgress == 8) sendProgress("8: Готов изучать", opt)
        else if  (indProgress == 9) sendProgress("9: Умеете пользоватья TG", opt)
        else if  (indProgress == 10) sendProgress("10: Готов купить", opt)
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
  console.log('[app.js] Initializing quiz application');
  await loadSavedAnswers();
  const root = document.getElementById('quiz');
  if (!root) {
    console.error('[app.js] Quiz container not found!');
    return;
  }
  let step = 0;
  const next = () => {
    step += 1;
    console.log(`[app.js] Moving to next step: ${step}`);
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


