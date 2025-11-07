(function(){
  const API = 'https://aim-pay-bot-server-4c57.onrender.com';

  function getParam(name){ const u = new URL(window.location.href); return u.searchParams.get(name); }
  async function fetchText(url){ const r = await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status); return await r.text(); }
  async function fetchJson(url, opts){ const r = await fetch(url, opts); if(!r.ok) throw new Error('HTTP '+r.status); return await r.json(); }

  const cards = [

  ]

  function renderCard({ card, leadName, index, total, cardsWithExtra }){
    const host = document.getElementById('cardHost');
    const bar = document.getElementById('progressBar');
    const stepNote = document.getElementById('stepNote');
    const btnMore = document.getElementById('btnMore');
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

    document.getElementById('btnPrev').addEventListener('click', async () => {
      if (currentIndex === 0) return;
      currentIndex -= 1;
      renderCard({ card: cards[currentIndex], leadName: lead.name || '', index: currentIndex, total, cardsWithExtra });
      await window.AimQuestState.saveProgress({ stage:'longrid', stepKey: cards[currentIndex].id+':view', stepIndex: currentIndex, answer:null, meta:null });
    });

    document.getElementById('btnMore').addEventListener('click', async () => {
      const host = document.getElementById('cardHost');
      const extraId = 'extra_'+currentIndex;
      const btnMore = document.getElementById('btnMore');
      const extraEl = document.getElementById(extraId);
      if (!cardsWithExtra.has(currentIndex) && extraEl){
        extraEl.style.display = 'block';
        extraEl.className = 'note';
        extraEl.style.marginTop = '12px';
        extraEl.textContent = 'Расширенное объяснение: представьте, что мы раскладываем шаг на подзадачи и проверяем каждую — так надёжнее закрепляется понимание.';
        // Mark this card as having shown extra content
        cardsWithExtra.add(currentIndex);
        // Hide the button after showing extra content
        btnMore.style.display = 'none';
        await window.AimQuestState.saveProgress({ stage:'longrid', stepKey: cards[currentIndex].id+':more', stepIndex: currentIndex, answer:'more', meta:null });
      } else if (cardsWithExtra.has(currentIndex)) {
        // Extra content already shown, hide button
        btnMore.style.display = 'none';
      }
    });

    function renderCompletionScreen(){
      const host = document.getElementById('cardHost');
      const bar = document.getElementById('progressBar');
      const stepNote = document.getElementById('stepNote');
      const btnPrev = document.getElementById('btnPrev');
      const btnMore = document.getElementById('btnMore');
      const btnNext = document.getElementById('btnNext');
      
      bar.style.width = '100%';
      stepNote.textContent = 'Чек-лист завершён';
      
      // Hide previous and more buttons, show next button for final test
      btnPrev.style.display = 'none';
      btnMore.style.display = 'none';
      btnNext.textContent = 'Перейти к финальному тесту';
      btnNext.disabled = false;
      
      host.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px 20px;">
          <h2 style="margin: 20px 0;">Поздравляем! Чек-лист пройден 🎉</h2>
          <p style="font-size: 20px; margin: 20px 0; line-height: 1.6;">
            Хотите узнать как построить машинное обучение для компании на Уолл-стрит?<br><br>
            Вы пройдёте все 15 этапов в интерактивном режиме и узнаете какой стиль работы у инженера ML.
          </p>
        </div>
      `;
    }

    document.getElementById('btnNext').addEventListener('click', async () => {
      if (currentIndex < total-1){
        currentIndex += 1;
        renderCard({ card: cards[currentIndex], leadName: lead.name || '', index: currentIndex, total, cardsWithExtra });
        await window.AimQuestState.saveProgress({ stage:'longrid', stepKey: cards[currentIndex].id+':view', stepIndex: currentIndex, answer:null, meta:null });
        // Re-enable buttons if they were hidden
        document.getElementById('btnPrev').style.display = '';
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


