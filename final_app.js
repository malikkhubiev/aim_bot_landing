const API_BASE = 'https://aim-pay-bot-server-4c57.onrender.com';

function getLeadId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('lead_id');
}

async function sendProgress(step, answer) {
  const leadId = getLeadId();
  if (!leadId) return;
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
    type: 'choice',
    title: 'Вопрос 1: Ты смотришь видео. Твоя любимая скорость просмотра — это...',
    options: [
      'а) x1.25 | x1.5 | x2.<br><br>Мой мозг может усваивать информацию быстрее, а лекторы любят говорить банальные вещи.',
      'б) Обычная скорость (x1.0).<br><br>Люблю вникать в детали, даже если это медленнее.',
      'в) Меня должно зацепить с первых секунд.<br><br>Если этого не произошло, то дальше неинтересно.'
    ],
    scores: { 'а': 3, 'б': 2, 'в': 1 }
  },
  {
    type: 'choice',
    title: 'Вопрос 2: Ты в гараже с новой Lamborghini и у тебя набор инструментов.<br>Что делаешь в первую очередь?',
    options: [
      'а) Попробую посмотреть какие функции есть на панели в салоне.<br><br> Поразмышляю как это могло быть построено. <br><br> Затем, полезу под капот и буду ковыряться, чтобы изучить каждую деталь по отдельности (анализ) и иметь полное представление о всей системе (синтез).',
      'б) Открою капот, увижу, что там много всего.<br><br>Начну откручивать, начнёт получаться, потом случайно могу отвлечься и забыть что за чем идёт.<br><br>На этом хватит, дальше нет смысла пытаться, положу на место, лучше посижу в салоне.',
      'в) Я под капот лезть не собираюсь.<br><br> А вдруг я там сломаю что-нибудь. Что мне голову забивать как работает машина?<br><br>Похожу по гаражу, посчитаю количество шагов.'
    ],
    scores: { 'а': 3, 'б': 2, 'в': 1 }
  },
  {
    type: 'choice',
    title: 'Вопрос 3: Почему ты вообще хочешь учиться Machine Learning?',
    options: [
      'а) Мне ИНТЕРЕСНО, как это работает.<br><br>Хочу понимать в чём идея, освоить новые инструменты, развивать свой интеллект.<br><br>Если там реально круто, то продолжить изучать и стать выдающимся профессионалом через несколько лет.',
      'б) Это перспективно и за это хорошо платят.<br><br>НАДО осваивать новые навыки, чтобы быть в теме.<br><br>Плюс, зп хочу побольше, а в IT вроде платят.',
      'в) Я потерян.<br><br>Я вроде хочу что-то изучать, но не знаю что.<br><br>Хочу кому-то заплатить, чтобы получить ощущение, что я начал принимать smart решения, а там меня за ручку доведут до денег.'
    ],
    scores: { 'а': 3, 'б': 2, 'в': 1 }
  }
];

function calculateScore(answers) {
  let total = 0;
  answers.forEach((answer, idx) => {
    if (answer && quizData[idx]) {
      const firstChar = answer.charAt(0).toLowerCase();
      total += quizData[idx].scores[firstChar] || 0;
    }
  });
  return total;
}

function getVerdict(score) {
  if (score >= 7 && score <= 9) {
    return {
      title: 'Вердикт 1: «Будущий Профи» (7-9 баллов)',
      subtitle: 'Ты с очень большой вероятностью сможешь освоить курс. Мы очень рады, что встретили такого человека!',
      content: `
        <p><strong>Твой портрет:</strong> Ты любознателен до глубины души. Тебе не просто «надо», тебе <strong>интересно</strong>. Ты не боишься залезть под капот, чтобы понять суть, и твой мозг требует скорости и эффективности. Ты смотришь в долгосрочную перспективу — стать профессионалом, а не просто «получить скилл».</p>
        <p><strong>Почему курс тебе подходит:</strong> Курс для тебя — это ключ к миру, который ты искренне хочешь понять. Ты будешь не «проходить» уроки, а погружаться в них, задавать вопросы и получать настоящее удовольствие от того, как складывается общая картина. Ты — идеальный студент.</p>
      `
    };
  } else if (score >= 5 && score <= 6) {
    return {
      title: 'Вердикт 2: «Мотивированный Исполнитель» (5-6 баллов)',
      subtitle: 'Тебе нужно будет приложить средние усилия, и мы считаем, что ты сможешь освоить курс полностью.',
      content: `
        <p><strong>Твой портрет:</strong> Ты прагматичен и амбициозен. Деньги и карьера — сильные мотиваторы. Ты готов браться за сложное, но твой энтузиазм может угаснуть, если результат не приходит быстро. Ты можешь начать разбирать двигатель, но, столкнувшись с трудностями, отступить.</p>
        <p><strong>Почему тебе нужно подумать:</strong> Тебе может не хватить того самого «исследовательского» задора, который помогает пробиваться через сложные темы. Твоя успешность будет напрямую зависеть от твоей способности <strong>создать себе дисциплину</strong>, когда первоначальный интерес ослабнет. Если готов к этому — добро пожаловать!</p>
      `
    };
  } else {
    return {
      title: 'Вердикт 3: «Искатель Лёгких Путей» (3-4 балла)',
      subtitle: 'Тебе нужно будет приложить сверхусилия, чтобы освоить курс. Хорошо подумай перед покупкой: готов ли ты направить на обучение свой фокус и концентрацию?',
      content: `
        <p><strong>Твой портрет:</strong> Ты находишься в поиске «волшебной таблетки». Ты хочешь перемен, но не готов глубоко погружаться. Ты легко отвлекаешься, и твоя мотивация очень хрупкая — она держится на внешних факторах (обещаниях, хайпе), а не на внутреннем интересе.</p>
        <p><strong>Почему купить AiM-курс - это риск:</strong> Машинное обучение, даже без углубленной математики, требует системного подхода и упорства. Ты рискуешь быстро разочароваться, потому что тебе будет «скучно» или «сложно», и ты бросишь обучение, так и не дойдя до результата. Покупать курс стоит, только если ты готов <strong>кардинально изменить свой подход</strong> и серьезно сконцентрироваться.</p>
      `
    };
  }
}

function renderStep(container, stepIndex, answers, onDone) {
  container.innerHTML = '';
  if (stepIndex >= quizData.length) {
    const score = calculateScore(answers);
    const verdict = getVerdict(score);
    const done = document.createElement('div');
    done.className = 'verdict';
    done.innerHTML = `
      <h3>${verdict.title}</h3>
      <p style="font-weight: bold; margin-top: 10px;">${verdict.subtitle}</p>
      <div class="verdict-content">
        ${verdict.content}
      </div>
      <p style="margin-top: 20px; text-align: center;">Ваш результат: ${score} баллов</p>
      <div class="answers" style="margin-top: 20px;">
        <button id="buyFull" class="right" style="background-color: #E83141;">Купить полную версию</button>
      </div>
    `;
    container.appendChild(done);
    // Отправляем итоговый результат
    sendProgress('final_score', score.toString());
    sendProgress('final_verdict', verdict.title);
    
    // Добавляем обработчик для кнопки "Купить полную версию"
    const buyBtn = document.getElementById('buyFull');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        // Отправляем цель go_to_bot в Яндекс Метрику
        if (window.ym && typeof window.ym === 'function') {
          try {
            window.ym(window.YANDEX_METRIKA_ID, 'reachGoal', 'go_to_bot');
          } catch (e) {
            console.error('Yandex Metrika error:', e);
          }
        }
        window.location.href = 'https://t.me/AiM_Pay_Bot?start=me';
      });
    }
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
  next.classList.add("right");
  next.disabled = !answers[stepIndex];
  next.addEventListener('click', () => onDone());

  if (item.type === 'choice') {
    const btns = document.createElement('div');
    btns.className = 'answers';
    const currentAnswer = answers[stepIndex] || savedAnswers[`final_q${stepIndex + 1}`];
    
    item.options.forEach(opt => {
      const b = document.createElement('button');
      b.innerHTML = opt;
      b.classList.add("ans")
      if (currentAnswer === opt) {
        b.classList.add('selectedd');
      }
      b.addEventListener('click', () => {
        // Разрешаем изменить выбор
        btns.querySelectorAll('button').forEach(x => x.classList.remove('selectedd'));
        b.classList.add('selectedd');
        answers[stepIndex] = opt;
        next.disabled = false;
        // Отправляем ответ сразу
        sendProgress(`final_q${stepIndex + 1}`, opt);
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
  const answers = [];
  
  // Загружаем сохраненные ответы в массив
  quizData.forEach((_, idx) => {
    const saved = savedAnswers[`final_q${idx + 1}`];
    if (saved) {
      answers[idx] = saved;
    }
  });
  
  const next = () => {
    step += 1;
    renderStep(root, step, answers, next);
  };
  renderStep(root, step, answers, next);
})();


