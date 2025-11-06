(function(){
  const API = 'https://aim-pay-bot-server-4c57.onrender.com';

  function getParam(name){ const u = new URL(window.location.href); return u.searchParams.get(name); }
  async function fetchText(url){ const r = await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status); return await r.text(); }
  async function fetchJson(url, opts){ const r = await fetch(url, opts); if(!r.ok) throw new Error('HTTP '+r.status); return await r.json(); }

  function detectThemeBlock(title){
    const t = (title || '').toLowerCase();
    if (t.includes('очистка')) return 'clean';
    if (t.includes('инженер') || t.includes('признак')) return 'eng';
    if (t.includes('прогноз') || t.includes('модел') || t.includes('градиент')) return 'forecast';
    if (t.includes('метрик') || t.includes('валидац') || t.includes('ошиб')) return 'metrics';
    return '';
  }

  function themeClass(theme){
    if (theme==='clean') return 'bg-clean';
    if (theme==='eng') return 'bg-eng';
    if (theme==='forecast') return 'bg-forecast';
    if (theme==='metrics') return 'bg-metrics';
    return '';
  }

  function splitIntoCards(raw){
    const lines = raw.split(/\r?\n/);
    // Find numbered section heads like "1. Очистка данных"...
    const cards = [];
    let current = { id:'intro', title:'Чек-лист по построению модели', chunks:[], theme:'' };
    for (const line of lines){
      const m = line.match(/^\s*(\d{1,2})\.\s+(.*)$/);
      if (m) {
        if (current.chunks.length) cards.push(current);
        const idx = Number(m[1]);
        const title = m[2].trim();
        current = { id: 'step_'+idx, title, chunks:[], theme: detectThemeBlock(title) };
        continue;
      }
      current.chunks.push(line);
    }
    if (current.chunks.length) cards.push(current);

    // Post-process: attach micro interactions to a few known steps
    const withUx = cards.map(c => ({ ...c, micro: microFor(c) }));
    return withUx;
  }

  function microFor(card){
    const t = card.title.toLowerCase();
    if (t.includes('корреляци')){
      return {
        question: 'Если два советника всегда говорят одно и то же — стоит ли платить обоим?',
        choices: [
          { key:'A', text:'Да, надёжнее вдвоём', correct:false, feedback:'Не совсем. Дубликаты не дают новой информации.' },
          { key:'B', text:'Нет, уволим одного', correct:true, feedback:'Правильно! Меньше дубликатов — быстрее и дешевле 👌' }
        ]
      };
    }
    if (t.includes('градиентного бустинга')){
      return {
        question: 'Как бустинг повышает точность?',
        choices: [
          { key:'A', text:'Повторяет один и тот же прогноз', correct:false, feedback:'Нет, он не зацикливается.' },
          { key:'B', text:'Учится на своих ошибках итеративно', correct:true, feedback:'Верно! Ошибки прошлого круга исправляются следующим.' }
        ]
      };
    }
    return null;
  }

  function renderCard({ card, leadName, index, total }){
    const host = document.getElementById('cardHost');
    const bar = document.getElementById('progressBar');
    const stepNote = document.getElementById('stepNote');
    const pct = Math.round(((index+1) / total) * 100);
    bar.style.width = pct + '%';

    const theme = themeClass(card.theme);
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
      <div class="card ${theme}">
        <div class="pill">Шаг ${index+1} из ${total}</div>
        <h2 style="margin:10px 0 6px">${escapeHtml(card.title)}</h2>
        <div class="personal">${escapeHtml(personal)}</div>
        ${contentHtml}
        ${microHtml}
      </div>
    `;

    stepNote.textContent = `Карточка ${index+1}/${total}`;

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
    if (!leadId) return { name: '' };
    try{
      const resp = await fetchJson(`${API}/form_warm/clients/${leadId}`);
      if (resp.status==='success') return resp.lead || { name:'' };
    }catch(_){ /* ignore */ }
    return { name: '' };
  }

  function updateLeadBanner(lead){
    const el = document.getElementById('leadInfo');
    if (!el) return;
    el.innerHTML = `<div><b>Имя:</b> ${lead.name || '-'} &nbsp; <b>Email:</b> ${lead.email || '-'} &nbsp; <b>Телефон:</b> ${lead.phone || '-'}</div>`;
  }

  window.addEventListener('DOMContentLoaded', async () => {
    const leadId = getParam('lead_id');
    if (leadId) window.AimQuestState.setLeadContext({ leadId });

    const lead = await loadLead(leadId);
    updateLeadBanner(lead);

    const raw = await fetchText('longrid.txt');
    const cards = splitIntoCards(raw);
    const total = cards.length;

    // Restore position
    let currentIndex = 0;
    const stepFromUrl = getParam('step_index');
    if (stepFromUrl && !isNaN(Number(stepFromUrl))) currentIndex = Math.min(total-1, Math.max(0, Number(stepFromUrl)));

    renderCard({ card: cards[currentIndex], leadName: lead.name || '', index: currentIndex, total });

    // Persist view event
    await window.AimQuestState.saveProgress({ stage:'longrid', stepKey: cards[currentIndex].id+':view', stepIndex: currentIndex, answer:null, meta:null });

    document.getElementById('btnPrev').addEventListener('click', async () => {
      if (currentIndex === 0) return;
      currentIndex -= 1;
      renderCard({ card: cards[currentIndex], leadName: lead.name || '', index: currentIndex, total });
      await window.AimQuestState.saveProgress({ stage:'longrid', stepKey: cards[currentIndex].id+':view', stepIndex: currentIndex, answer:null, meta:null });
    });

    document.getElementById('btnMore').addEventListener('click', async () => {
      const host = document.getElementById('cardHost');
      const extraId = 'extra_'+currentIndex;
      if (!document.getElementById(extraId)){
        const extra = document.createElement('div');
        extra.id = extraId;
        extra.className = 'note';
        extra.style.marginTop = '12px';
        extra.textContent = 'Расширенное объяснение: представьте, что мы раскладываем шаг на подзадачи и проверяем каждую — так надёжнее закрепляется понимание.';
        host.querySelector('.card').appendChild(extra);
        await window.AimQuestState.saveProgress({ stage:'longrid', stepKey: cards[currentIndex].id+':more', stepIndex: currentIndex, answer:'more', meta:null });
      }
    });

    document.getElementById('btnNext').addEventListener('click', async () => {
      if (currentIndex < total-1){
        currentIndex += 1;
        renderCard({ card: cards[currentIndex], leadName: lead.name || '', index: currentIndex, total });
        await window.AimQuestState.saveProgress({ stage:'longrid', stepKey: cards[currentIndex].id+':view', stepIndex: currentIndex, answer:null, meta:null });
      } else {
        // Completed longrid: route to final
        await window.AimQuestState.saveProgress({ stage:'longrid', stepKey:'completed', stepIndex: currentIndex, answer:'done', meta:null });
        const url = window.AimQuestState.buildUrl('final.html', leadId ? { lead_id: leadId } : {});
        window.location.href = url;
      }
    });
  });
})();


