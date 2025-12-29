// Shared state utilities for quest progress persistence (API + localStorage)
// Usage:
//  - setLeadContext({ leadId, sessionId }) once on page load
//  - await saveProgress({ stage, stepKey, stepIndex, answer, meta }) to persist
//  - const s = await getLastProgress() to route/restore

(function(){
  const GLOBAL = (typeof window !== 'undefined') ? window : globalThis;
  const API = 'https://aim-pay-bot-server.onrender.com';

  const STORAGE_KEY = 'aim_quest_progress';
  const CONTEXT_KEY = 'aim_quest_context';

  function nowIso(){ return new Date().toISOString(); }

  function safeParse(json, fallback){
    try { return JSON.parse(json); } catch (_){ return fallback; }
  }

  function getContext(){
    const raw = localStorage.getItem(CONTEXT_KEY);
    return safeParse(raw, {});
  }

  function setLeadContext(ctx){
    const cur = getContext();
    const next = { ...cur, ...ctx };
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(next));
    return next;
  }

  function getLocalProgress(){
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw, { items: [] });
    // Ensure we always return an object with items array
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
      return { items: [] };
    }
    return parsed;
  }

  function setLocalProgress(items){
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  }

  function upsertLocalProgress(entry){
    const store = getLocalProgress();
    const items = Array.isArray(store.items) ? store.items : [];
    items.push(entry);
    setLocalProgress(items);
  }

  async function fetchJson(url, opts){
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }

  function computeLast(items){
    if (!items || items.length === 0) return null;
    // Pick last by created_at
    const sorted = [...items].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    return sorted[sorted.length-1] || null;
  }

  async function saveProgress({ stage, stepKey, stepIndex, answer, meta }){
    const ctx = getContext();
    const createdAt = nowIso();
    const isSandbox = !ctx || !ctx.leadId || String(ctx.leadId).trim() === '' || (new URL(window.location.href).searchParams.get('sandbox') === '1');
    const entry = {
      stage,           // 'quiz' | 'longrid' | 'final'
      step: stepKey,   // string identifier
      step_index: stepIndex ?? null,
      answer: answer ?? null,
      meta: meta ?? null,
      created_at: createdAt
    };

    // Track progress in unified tracking system
    if (window.AimTracking) {
      window.AimTracking.trackProgress(stage, stepKey, stepIndex, answer, meta);
    }

    // Sandbox: do not persist anywhere
    if (isSandbox) {
      return entry;
    }

    // Local first (optimistic). If you need to disable localStorage, pass sandbox=1 in URL.
    upsertLocalProgress(entry);

    // Best-effort API persist
    try {
      if (ctx.leadId) {
        await fetchJson(`${API}/form_warm/clients/${ctx.leadId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage, step: stepKey, step_index: stepIndex ?? null, answer })
        });
      }
    } catch (_){ /* ignore network/API issues, localStorage remains */ }

    // Update last activity
    try {
      if (ctx.leadId) {
        await fetchJson(`${API}/form_warm/clients/${ctx.leadId}/touch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage, step: stepKey, step_index: stepIndex ?? null })
        });
      }
    } catch (_){ /* optional */ }

    return entry;
  }

  async function getServerProgress(){
    const ctx = getContext();
    const isSandbox = !ctx || !ctx.leadId || String(ctx.leadId).trim() === '' || (new URL(window.location.href).searchParams.get('sandbox') === '1');
    if (isSandbox) return [];
    if (!ctx || !ctx.leadId) return [];
    try {
      const resp = await fetchJson(`${API}/form_warm/clients/${ctx.leadId}/progress`);
      return Array.isArray(resp.progress) ? resp.progress : [];
    } catch (_){
      return [];
    }
  }

  async function getLastProgress(){
    const local = getLocalProgress().items || [];
    const remote = await getServerProgress();
    const combined = [...local, ...remote];
    const last = computeLast(combined);
    return last;
  }

  function resolveRouteFromProgress(progress){
    if (!progress) return { page: 'index.html', params: {} };
    const ctx = getContext();
    const leadParam = (ctx && ctx.leadId) ? { lead_id: ctx.leadId } : {};
    // Priority by stage: final > longrid > quiz
    const stage = progress.stage;
    const step = progress.step;
    const stepIndex = progress.step_index;

    if (stage === 'final') {
      return { page: 'final.html', params: { ...leadParam, step: step || '', step_index: stepIndex ?? '' } };
    }
    if (stage === 'longrid') {
      return { page: 'longrid.html', params: { ...leadParam, step: step || '', step_index: stepIndex ?? '' } };
    }
    // default to quiz
    return { page: 'quest.html', params: { ...leadParam, step: step || '', step_index: stepIndex ?? '' } };
  }

  function buildUrl(page, params){
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([k,v])=>{ if (v !== undefined && v !== null && v !== '') sp.set(k, String(v)); });
    return `${page}?${sp.toString()}`;
  }

  async function routeToCurrent(){
    const last = await getLastProgress();
    const route = resolveRouteFromProgress(last);
    const url = buildUrl(route.page, route.params);
    window.location.replace(url);
  }

  // Export
  GLOBAL.AimQuestState = {
    setLeadContext,
    getContext,
    saveProgress,
    getLastProgress,
    routeToCurrent,
    buildUrl
  };
})();


