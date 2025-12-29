// Unified tracking system for all pages
// Generates unique user ID and tracks all actions with timestamps

(function() {
  const API = 'https://aim-pay-bot-server.onrender.com';
  const USER_ID_KEY = 'aim_user_id';
  const PAGE_VISIT_KEY = 'aim_page_visits';
  const ACTION_HISTORY_KEY = 'aim_action_history';
  
  // Generate or retrieve unique user ID
  function getUserId() {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  }
  
  // Get current page name
  function getPageName() {
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) return 'index';
    if (path.includes('quest.html')) return 'quest';
    if (path.includes('longrid.html')) return 'longrid';
    if (path.includes('final.html')) return 'final';
    return 'unknown';
  }
  
  // Track page visit - используем существующий track_visit endpoint
  function trackPageVisit() {
    const userId = getUserId();
    const pageName = getPageName();
    const timestamp = new Date().toISOString();
    
    // Save visit in localStorage
    const visits = JSON.parse(localStorage.getItem(PAGE_VISIT_KEY) || '[]');
    const visit = {
      userId,
      page: pageName,
      timestamp,
      url: window.location.href,
      referrer: document.referrer
    };
    visits.push(visit);
    localStorage.setItem(PAGE_VISIT_KEY, JSON.stringify(visits));
    
    // Отправляем только для главной страницы через существующий track_visit
    // Для других страниц трекинг идет через progress endpoint когда есть lead_id
    if (pageName === 'index') {
      const urlParams = new URLSearchParams(window.location.search);
      const utmParams = {
        utm_source: urlParams.get('utm_source') || urlParams.get('utm') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_term: urlParams.get('utm_term') || '',
        utm_content: urlParams.get('utm_content') || '',
        session_id: userId
      };
      
      fetch(`${API}/track_visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(utmParams),
        keepalive: true
      }).catch(err => console.error('Error tracking page visit:', err));
    }
  }
  
  // Track user action - сохраняем только в localStorage, отправка на сервер через progress endpoint
  function trackAction(actionType, actionData = {}) {
    const userId = getUserId();
    const pageName = getPageName();
    const timestamp = new Date().toISOString();
    
    const action = {
      userId,
      page: pageName,
      actionType,
      actionData,
      timestamp,
      url: window.location.href
    };
    
    // Save in localStorage only
    const history = JSON.parse(localStorage.getItem(ACTION_HISTORY_KEY) || '[]');
    history.push(action);
    localStorage.setItem(ACTION_HISTORY_KEY, JSON.stringify(history));
    
    // Не отправляем на сервер отдельно - все действия фиксируются через progress endpoint
  }
  
  // Track stage entry - сохраняем только в localStorage, отправка через progress endpoint
  function trackStageEntry(stage, stepKey = null, stepIndex = null) {
    const userId = getUserId();
    const pageName = getPageName();
    const timestamp = new Date().toISOString();
    
    const stageData = {
      userId,
      page: pageName,
      stage,
      stepKey,
      stepIndex,
      timestamp,
      action: 'stage_entry'
    };
    
    // Save in localStorage only
    const history = JSON.parse(localStorage.getItem(ACTION_HISTORY_KEY) || '[]');
    history.push(stageData);
    localStorage.setItem(ACTION_HISTORY_KEY, JSON.stringify(history));
    
    // Отправка на сервер происходит через saveProgress в state.js
  }
  
  // Track stage exit - сохраняем только в localStorage
  function trackStageExit(stage, stepKey = null, timeSpent = null) {
    const userId = getUserId();
    const pageName = getPageName();
    const timestamp = new Date().toISOString();
    
    const stageData = {
      userId,
      page: pageName,
      stage,
      stepKey,
      timeSpent,
      timestamp,
      action: 'stage_exit'
    };
    
    // Save in localStorage only
    const history = JSON.parse(localStorage.getItem(ACTION_HISTORY_KEY) || '[]');
    history.push(stageData);
    localStorage.setItem(ACTION_HISTORY_KEY, JSON.stringify(history));
  }
  
  // Track email submission - сохраняем только в localStorage
  // Отправка на сервер происходит через save_source_and_chat_history или submit_final_email
  function trackEmailSubmission(email, source = 'unknown') {
    const userId = getUserId();
    const timestamp = new Date().toISOString();
    
    const emailData = {
      userId,
      email,
      source,
      timestamp,
      page: getPageName()
    };
    
    // Save in localStorage only
    const history = JSON.parse(localStorage.getItem(ACTION_HISTORY_KEY) || '[]');
    history.push({ ...emailData, actionType: 'email_submission' });
    localStorage.setItem(ACTION_HISTORY_KEY, JSON.stringify(history));
    
    // Отправка на сервер происходит через существующие endpoints при отправке формы
  }
  
  // Track progress - сохраняем только в localStorage
  // Отправка на сервер происходит через saveProgress в state.js, который использует существующий endpoint
  function trackProgress(stage, stepKey, stepIndex, answer, meta = null) {
    const userId = getUserId();
    const timestamp = new Date().toISOString();
    
    const progressData = {
      userId,
      stage,
      stepKey,
      stepIndex,
      answer,
      meta,
      timestamp,
      page: getPageName()
    };
    
    // Save in localStorage only
    const history = JSON.parse(localStorage.getItem(ACTION_HISTORY_KEY) || '[]');
    history.push({ ...progressData, actionType: 'progress' });
    localStorage.setItem(ACTION_HISTORY_KEY, JSON.stringify(history));
    
    // Отправка на сервер происходит через saveProgress в state.js
    // который использует /form_warm/clients/{lead_id}/progress
  }
  
  // Get user's action history
  function getUserHistory() {
    return JSON.parse(localStorage.getItem(ACTION_HISTORY_KEY) || '[]');
  }
  
  // Get user's visit history
  function getUserVisits() {
    return JSON.parse(localStorage.getItem(PAGE_VISIT_KEY) || '[]');
  }
  
  // Initialize tracking on page load
  function init() {
    // Track page visit
    trackPageVisit();
    
    // Track page visibility changes
    let pageStartTime = Date.now();
    let lastActiveTime = Date.now();
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const timeSpent = Date.now() - lastActiveTime;
        trackAction('page_hidden', { timeSpent });
      } else {
        lastActiveTime = Date.now();
        trackAction('page_visible');
      }
    });
    
    // Track before unload
    window.addEventListener('beforeunload', () => {
      const totalTimeSpent = Date.now() - pageStartTime;
      trackAction('page_unload', { totalTimeSpent, page: getPageName() });
    });
  }
  
  // Export to global scope
  window.AimTracking = {
    getUserId,
    trackAction,
    trackStageEntry,
    trackStageExit,
    trackEmailSubmission,
    trackProgress,
    getUserHistory,
    getUserVisits,
    getPageName
  };
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

