(function(){
  const API = 'https://aim-pay-bot-server-4c57.onrender.com';

  function getParam(name){ const u = new URL(window.location.href); return u.searchParams.get(name); }
  async function fetchText(url){ const r = await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status); return await r.text(); }
  async function fetchJson(url, opts){ const r = await fetch(url, opts); if(!r.ok) throw new Error('HTTP '+r.status); return await r.json(); }

  const cards = [
    {
      id: 'data_cleaning',
      title: '1. Очистка данных 🫧',
      chunks: [
        'У нас есть куча отчетов с полезными данными 💖, но там иногда есть опечатки, пропущенные значения (как будто мы вообще ничего не заработали) и странные цифры (самый взрослый сотрудник живёт 620 лет 👴).',
        'Как будто кто-то пролил кофе на часть документов ☕. Нам нужно всё почистить — дописать пропущенные значения, исправить ошибки. Наверное сотруднику всё-таки 62 ✅.'
      ]
    },
    {
      id: 'feature_engineering',
      title: '2. Инженерия признаков 🧠',
      chunks: [
        'Данные прикольные, но просто [Дата сделки] 📅 нам мало, что даёт. Я магическим образом сделаю из неё [Растёт ли количество сделок] 💸.',
        'Это мне сильнее поможет узнать сколько мы планируем заработать.'
      ]
    },
    {
      id: 'correlation_elimination',
      title: '3. Уничтожение предикторов с корреляцией 🧑‍💼🧑‍💼',
      chunks: [
        'Boss, представьте, что вы платите двум советникам, чтобы узнать стоит ли брать акции такой-то компании 🏣. Они одновременно отвечают Да✅ или Нет❌. Всегда одинаково.',
        'Вы платите каждому советнику 30K$ 💵, может одного из них уволить, раз они дают одинаковые советы? 💡',
        'С данными то же самое. Чем проще, без потери качества, тем лучше.'
      ]
    },
    {
      id: 'data_transformation',
      title: '4. Преобразование данных 🐲🐢',
      chunks: [
        'У нас данные в разных «валютах»: где-то тысячи, где-то миллионы, где-то проценты.',
        'Давайте переведём всё в один понятный для компьютера язык — как будто переведём все иностранные слова в словаре на русский 🌍 (мы на Уолл-стрит 🐺 тащимся со всего русского).'
      ]
    },
    {
      id: 'data_splitting',
      title: '5. Разделение данных 🔬',
      chunks: [
        'Наши данные сейчас - произведение искусства 🎨.',
        'Самое важное уже сделано. (В демо-версии курса плейлист Scikit-learn) 😉.',
        'Проведём эксперимент 🧑‍🔬. Нашей будущей модели дадим не все данные, а только 80%. На остальных 20% будем проверять, сможет она правильно прогнозировать прибыль 🤑 или она просто зубрилка, которая выучила ответы, а в реальной жизни ничего не может.'
      ]
    },
    {
      id: 'class_imbalance',
      title: '6. Обработка дисбаланса классов ⚖️',
      chunks: [
        'Смотрите, Босс, у нас 95% записей — про обычные дни, и только 5% — про супер-прибыльные дни! Если так оставить, модель станет лентяйкой, будет всегда предсказывать «обычный день» 😴 и очень часто будет права.',
        'Это как предсказывать, что завтра не будет конца света. Ты будешь прав миллион раз каждый день, но не в последний 🌏🔥',
        'Нужно сделать так, чтобы она училась видеть и те, и другие случаи. (Говорила, когда нам может упасть огромный чек 💎)'
      ]
    },
    {
      id: 'model_selection',
      title: '7. Выбор модели в соответствии с задачей',
      chunks: [
        'Есть 3 вида моделей:',
        '1. Спрогнозировать число (сколько денюшек заработаем 💵💵💵) - Регрессия',
        '2. Угадать типаж нового клиента [Супер ответственная компания, амбициозные работники, высокий потенциал] 🚀 или [У всех понахватают денег, снимут дорогой офис, ничего не заработают и банкротство] 😭 - Классификация',
        '3. Поделить наших клиентов на несколько групп. Например, модель скажет, что наши клиенты в основном: байкеры 🏍️, сёрферы 🏄 и одинокие мамы за 30 👩‍🍼. Значит сделаем 3 разные рекламные компании. - Кластеризация'
      ]
    },
    {
      id: 'complex_models',
      title: '8. Сложные модели классификации и регрессии',
      chunks: [
        'Если данные очень сложные, запутанные, с странными закономерностями, нам нужно будет взять модели покруче 💪.',
        'Они дольше тренируются, зато могут заметить такие крутые механизмы, которые мы бы никогда не смогли. 🔬🧬'
      ]
    },
    {
      id: 'gradient_boosting',
      title: '9. Методы Градиентного Бустинга',
      chunks: [
        'А теперь возьмём самый современный и мощный инструмент! 🏎️',
        'Он учится на своих же ошибках: сначала делает черновой прогноз, смотрит, где ошибся, и на следующем круге становится точнее 🎯.',
        'Он очень быстро ошибается, сразу учится и всегда движется вперёд 🏆'
      ]
    },
    {
      id: 'metrics',
      title: '10. Метрики оценки',
      chunks: [
        'Модель подумала, что мы заработаем 2.3B$, а мы заработали на 500К$ больше.',
        'Нас это устраивает? Мы счастливы, если он показывает нам минимум или максимум? Или среднее? Надо подумать 🤔'
      ]
    },
    {
      id: 'pipeline',
      title: '11. Построение пайплайна 🤖🤖',
      chunks: [
        'Мы уже сделали 10 шагов!!! 🎉',
        'Теперь, когда к нам придут новые данные, чтобы не делать 10 шагов с нуля, мы построим пайплайн - автоматический конвеер, который сам будет пропускать новые данные, чтобы из лимона 🍋 получался лимонад 🍹'
      ]
    },
    {
      id: 'cross_validation',
      title: '12. Кросс-валидация 🧪',
      chunks: [
        'Сейчас сделаем мощную проверку нашей модельке.',
        'Поделим наши данные на сотни маленьких кусочков и проверим её на каждом 🤯.',
        'Справится одинаково отлично ✅ - умничка 💖'
      ]
    },
    {
      id: 'hyperparameter_tuning',
      title: '13. Подбор гиперпараметров',
      chunks: [
        'Надо выжать результаты близкие к 100%!',
        'Для этого сделаем тонкую настройку гиперпараметров 🦋 - крутилки, которые могут улучшить или ухудшить модельку.'
      ]
    },
    {
      id: 'ensembling',
      title: '14. Ансамблирование (если не включено в пайплайн)',
      chunks: [
        'Теперь, как истинный руководитель, мы не можем полагаться только на один источник прогноза.',
        '1. Построим команду из нескольких моделек 👨‍👩‍👧‍👦',
        '2. Каждая моделька подготовит прогноз 💫',
        '3. Сделаем комбо из результатов и получим взвешенное решение 🧠'
      ]
    },
    {
      id: 'error_analysis',
      title: '15. Анализ ошибок модели',
      chunks: [
        'Теперь посмотрим, где же мы всё-таки ошиблись.',
        'Почему модель постоянно занижает прогноз в конце года? Или не видит бурные росты в кризис?',
        'Это поможет нам стать ещё умнее в следующий раз💡!',
        'Всё пофиксили, Jeremy приносит прогноз 💎'
      ]
    }
  ]

  function renderCard({ card, leadName, index, total, cardsWithExtra }){
    const host = document.getElementById('cardHost');
    const bar = document.getElementById('progressBar');
    const stepNote = document.getElementById('stepNote');
    const btnNext = document.getElementById('btnNext');
    const pct = Math.round(((index+1) / total) * 100);
    bar.style.width = pct + '%';

    const personal = leadName ? `${leadName}, смотри, вот тут важный момент 👇` : 'Смотри, вот тут важный момент 👇';

    const contentHtml = card.chunks
      .map(p=>p.trim())
      .filter(Boolean)
      .map(p=>`<p style="text-align:left;margin:8px 0">${escapeHtml(p)}</p>`)
      .join('');

    let microHtml = '';
    if (card.micro){
      microHtml += `<div class="micro">`;
      microHtml += `<div style="flex:1 1 100%">${escapeHtml(card.micro.question)}</div>`;
      card.micro.choices.forEach(ch => {
        microHtml += `<button class="choice" data-key="${ch.key}">${escapeHtml(ch.text)}</button>`;
      });
      microHtml += `</div>`;
      microHtml += `<div id="microFeedback" class="note"></div>`;
    }

    host.innerHTML = `
      <div class="card">
        <div class="pill">Шаг ${index+1} из ${total}</div>
        <h2 style="margin:10px 0 6px">${escapeHtml(card.title)}</h2>
        <div class="personal">${escapeHtml(personal)}</div>
        ${contentHtml}
        ${microHtml}
      </div>
    `;

    stepNote.textContent = `Карточка ${index+1}/${total}`;

    // Ensure "Next" button is always enabled
    btnNext.disabled = false;

    if (card.micro){
      host.querySelectorAll('.choice').forEach(btn => {
        btn.addEventListener('click', async () => {
          const key = btn.getAttribute('data-key');
          const chosen = card.micro.choices.find(c=>c.key===key);
          const fb = document.getElementById('microFeedback');
          fb.textContent = chosen ? chosen.feedback : '';
          await window.AimQuestState.saveProgress({
            stage:'longrid',
            stepKey: card.id+':micro',
            stepIndex: index,
            answer: key,
            meta: { correct: !!(chosen && chosen.correct) }
          });
        });
      });
    }
  }

  function escapeHtml(s){
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  async function loadLead(leadId){
    console.log(`[longrid.js] Loading lead: ${leadId}`);
    if (!leadId) {
      console.log('[longrid.js] No leadId provided');
      return { name: '' };
    }
    try{
      const resp = await fetchJson(`${API}/form_warm/clients/${leadId}`);
      console.log(`[longrid.js] Lead loaded:`, resp);
      if (resp.status==='success') return resp.lead || { name:'' };
    }catch(e){ 
      console.error('[longrid.js] Error loading lead:', e);
    }
    return { name: '' };
  }

  function updateLeadBanner(lead){
    const el = document.getElementById('leadInfo');
    if (!el) return;
    el.innerHTML = `<div><b>Имя:</b> ${lead.name || '-'} &nbsp; <b>Email:</b> ${lead.email || '-'} &nbsp; <b>Телефон:</b> ${lead.phone || '-'}</div>`;
  }

  window.addEventListener('DOMContentLoaded', async () => {
    console.log('[longrid.js] DOMContentLoaded, initializing longrid');
    const leadId = getParam('lead_id');
    console.log(`[longrid.js] leadId from URL: ${leadId}`);
    if (leadId) window.AimQuestState.setLeadContext({ leadId });

    const lead = await loadLead(leadId);
    console.log(`[longrid.js] Lead data:`, lead);
    updateLeadBanner(lead);

    const raw = await fetchText('longrid.txt');
    const total = cards.length;

    // Restore position
    let currentIndex = 0;
    const stepFromUrl = getParam('step_index');
    if (stepFromUrl && !isNaN(Number(stepFromUrl))) currentIndex = Math.min(total-1, Math.max(0, Number(stepFromUrl)));

    // Track which cards have shown extra content
    const cardsWithExtra = new Set();

    renderCard({ card: cards[currentIndex], leadName: lead.name || '', index: currentIndex, total, cardsWithExtra });

    // Persist view event
    await window.AimQuestState.saveProgress({ stage:'longrid', stepKey: cards[currentIndex].id+':view', stepIndex: currentIndex, answer:null, meta:null });

    function renderCompletionScreen(){
      const host = document.getElementById('cardHost');
      const bar = document.getElementById('progressBar');
      const stepNote = document.getElementById('stepNote');
      const btnNext = document.getElementById('btnNext');
      
      bar.style.width = '100%';
      stepNote.textContent = 'Чек-лист завершён';
      
      // Show next button for final test
      btnNext.textContent = 'Перейти к финальному тесту';
      btnNext.disabled = false;
      
      host.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px;">
          <h2 style="margin: 20px 0;">Поздравляем! Чек-лист пройден 🎉</h2>
          <p style="font-size: 20px; margin: 20px 0; line-height: 1.6;">
            Мы подготовили для тебя Финальный тест!<br><br>
            Как только ты его завершишь, ты узнаешь сможешь ты справиться с курсом или не стоит тратить деньги)
          </p>
        </div>
      `;
    }

    document.getElementById('btnNext').addEventListener('click', async () => {
      console.log(`[longrid.js] Next button clicked, currentIndex=${currentIndex}, total=${total}`);
      if (currentIndex < total-1){
        currentIndex += 1;
        console.log(`[longrid.js] Moving to card ${currentIndex + 1}/${total}: ${cards[currentIndex].title}`);
        renderCard({ card: cards[currentIndex], leadName: lead.name || '', index: currentIndex, total, cardsWithExtra });
        await window.AimQuestState.saveProgress({ stage:'longrid', stepKey: cards[currentIndex].id+':view', stepIndex: currentIndex, answer:null, meta:null });
      } else {
        // Check if we're on completion screen or last card
        const host = document.getElementById('cardHost');
        if (host.querySelector('.card h2') && host.querySelector('.card h2').textContent.includes('Поздравляем')) {
          // Already showing completion screen, navigate to final
          await window.AimQuestState.saveProgress({ stage:'longrid', stepKey:'completed', stepIndex: currentIndex, answer:'done', meta:null });
          const url = window.AimQuestState.buildUrl('final.html', leadId ? { lead_id: leadId } : {});
          window.location.href = url;
        } else {
          // Show completion screen
          await window.AimQuestState.saveProgress({ stage:'longrid', stepKey:'completed', stepIndex: currentIndex, answer:'done', meta:null });
          renderCompletionScreen();
        }
      }
    });
  });
})();


