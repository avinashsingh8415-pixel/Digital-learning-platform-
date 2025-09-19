/* Digital Learning Prototype - main JS
   Saves progress to localStorage, supports English & Punjabi,
   renders lessons and teacher dashboard.
*/

const LESSONS = [
    {
      id: 'l1',
      title: { en: 'Intro to Computers', pa: 'ਕੰਪਿਊਟਰ ਜਾਣ-ਪਛਾਣ' },
      body: {
        en: `A computer is an electronic device that processes data. Basic parts: CPU, Memory, Storage.\n\nQuick quiz below tests your understanding.`,
        pa: `ਕੰਪਿਊਟਰ ਇਕ ਇਲੈਕਟ੍ਰੌਨਿਕ ਡਿਵਾਇਸ ਹੈ ਜੋ ਡੇਟਾ ਪ੍ਰੋਸੈੱਸ ਕਰਦਾ ਹੈ। ਮੁੱਖ ਹਿੱਸੇ: CPU, ਮੈਮੋਰੀ, ਸਟੋਰੇਜ।\n\nਨਿਮ্নਲਿਖਤ ਪ੍ਰਸ਼ਨ ਤੁਹਾਡੀ ਸਮਝ ਨੂੰ ਜਾਂਚੇਗਾ।`
      }
    },
    {
      id: 'l2',
      title: { en: 'Internet Basics', pa: 'ਇੰਟਰਨੈੱਟ ਬੁਨਿਆਦੀ' },
      body: {
        en: `Internet connects computers worldwide. It helps access information, communicate, and learn. Be careful with personal data.`,
        pa: `ਇੰਟਰਨੈੱਟ ਦੁਨੀਆ ਭਰ ਵਿੱਚ ਕੰਪਿਊਟਰਾਂ ਨੂੰ ਜੋੜਦਾ ਹੈ। ਇਹ ਜਾਣਕਾਰੀ ਪ੍ਰਾਪਤ ਕਰਨ, ਸੰਚਾਰ ਕਰਨ ਅਤੇ ਸਿੱਖਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ। ਨਿੱਜੀ ਜਾਣਕਾਰੀ ਸਾਂਝੀ ਕਰਨ ਵਿੱਚ ਸਾਵਧਾਨ ਰਹੋ।`
      }
    }
  ];
  
  const $ = id => document.getElementById(id);
  const ls = window.localStorage;
  const LANG_KEY = 'dl_lang';
  const PROG_KEY = 'dl_progress';
  const STUDENTS_KEY = 'dl_students';
  
  // UI elements
  const navHome = $('nav-home');
  const navLessons = $('nav-lessons');
  const navTeacher = $('nav-teacher');
  const ctaLessons = $('cta-lessons');
  const ctaTeacher = $('cta-teacher');
  const langSel = $('lang');
  
  const homeSec = $('home-section');
  const lessonsSec = $('lessons-section');
  const teacherSec = $('teacher-section');
  
  const lessonsListEl = $('lessons');
  const contentArea = $('content-area');
  const sectionTitle = $('section-title');
  const progressBar = $('progress-bar');
  const progressText = $('progress-text');
  
  const teacherTableBody = document.querySelector('#teacher-table tbody');
  const btnAddSample = $('btn-add-sample');
  const btnReset = $('reset-data');
  
  // Initialization
  function init() {
    // default language
    if (!ls.getItem(LANG_KEY)) ls.setItem(LANG_KEY, 'en');
    langSel.value = ls.getItem(LANG_KEY);
  
    // nav events
    navHome.addEventListener('click', () => showSection('home'));
    navLessons.addEventListener('click', () => { showSection('lessons'); renderLessons(); });
    navTeacher.addEventListener('click', () => { showSection('teacher'); renderTeacher(); });
    ctaLessons.addEventListener('click', () => { showSection('lessons'); renderLessons(); });
    ctaTeacher.addEventListener('click', () => { showSection('teacher'); renderTeacher(); });
  
    // language change
    langSel.addEventListener('change', () => {
      ls.setItem(LANG_KEY, langSel.value);
      // rerender visible areas
      const active = (lessonsSec.style.display !== 'none') ? 'lessons' : (teacherSec.style.display !== 'none' ? 'teacher' : 'home');
      if (active === 'lessons') { renderLessons(); renderContent(); } else if (active === 'teacher') renderTeacher();
    });
  
    btnAddSample.addEventListener('click', addSampleStudent);
    btnReset.addEventListener('click', resetStorage);
  
    // initial render
    showSection('home');
    renderLessons();
    renderContent();
    renderTeacher();
  
    // register service worker (for offline caching)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(()=>{ /* ignore errors */ });
    }
  }
  
  // show one section
  function showSection(name) {
    homeSec.style.display = (name === 'home') ? 'block' : 'none';
    lessonsSec.style.display = (name === 'lessons') ? 'block' : 'none';
    teacherSec.style.display = (name === 'teacher') ? 'block' : 'none';
  }
  
  // render lesson list
  function renderLessons() {
    lessonsListEl.innerHTML = '';
    const lang = ls.getItem(LANG_KEY) || 'en';
    LESSONS.forEach(l => {
      const div = document.createElement('div');
      div.className = 'lesson-item';
      div.innerHTML = `
        <div>
          <div class="title">${escapeHtml(l.title[lang])}</div>
          <div class="small-muted" style="font-size:0.85rem">${l.id}</div>
        </div>
        <div>
          <button class="small-btn" data-id="${l.id}">Open</button>
        </div>
      `;
      div.querySelector('button').addEventListener('click', () => openLesson(l.id));
      lessonsListEl.appendChild(div);
    });
  }
  
  // open a lesson (render content + quiz)
  function openLesson(id) {
    showSection('lessons');
    renderContent(id);
    // scroll to content on narrow screens
    if (window.innerWidth < 880) window.scrollTo({ top: contentArea.offsetTop - 80, behavior: 'smooth' });
  }
  
  function renderContent(lessonId) {
    const lang = ls.getItem(LANG_KEY) || 'en';
    if (!lessonId) {
      sectionTitle.textContent = (lang === 'en') ? 'Welcome' : 'ਸਵਾਗਤ ਹੈ';
      contentArea.innerHTML = `<p class="small-muted">${lang === 'en' ? 'Select a lesson from the left to begin.' : 'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਖੱਬੇ ਪਾਸੇੋਂ ਪਾਠ ਚੁਣੋ।'}</p>`;
      updateProgressUI();
      return;
    }
  
    const lesson = LESSONS.find(x => x.id === lessonId);
    if (!lesson) return;
  
    sectionTitle.textContent = lesson.title[lang];
  
    contentArea.innerHTML = `
      <div class="lesson-content-inner">
        <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(lesson.body[lang])}</pre>
        <div class="quiz" style="margin-top:14px">
          <h4 class="small-muted">${lang === 'en' ? 'Quick Quiz' : 'ਛੋਟਾ ਪ੍ਰਸ਼ਨ'}</h4>
          <div class="small-muted">${lang === 'en' ? 'Question: What part stores data even when the power is off?' : 'ਸਵਾਲ: ਕਿਹੜਾ ਹਿੱਸਾ ਡਾਟਾ ਨੂੰ ਬਿਜਲੀ ਬੰਦ ਹੋਣ ' + "ਤੇ ਵੀ ਸਟੋਰ ਕਰਦਾ ਹੈ?"}</div>
          <div style="margin-top:8px;display:flex;gap:8px">
            <button id="opt1" class="small-btn">RAM</button>
            <button id="opt2" class="small-btn">Storage</button>
          </div>
          <div id="quiz-result" class="small-muted" style="margin-top:10px"></div>
        </div>
      </div>
    `;
  
    // attach quiz handlers
    document.getElementById('opt1').addEventListener('click', () => submitAnswer(lessonId, false));
    document.getElementById('opt2').addEventListener('click', () => submitAnswer(lessonId, true));
  }
  
  // quiz submission
  function submitAnswer(lessonId, correct) {
    const lang = ls.getItem(LANG_KEY) || 'en';
    const resEl = document.getElementById('quiz-result');
    if (correct) {
      resEl.textContent = (lang === 'en') ? 'Correct! Progress saved.' : 'ਸਹੀ! ਪ੍ਰਗਤੀ ਸੇਵ ਕੀਤੀ ਗਈ।';
      saveProgress(lessonId, 100);
    } else {
      resEl.textContent = (lang === 'en') ? 'Try again.' : 'ਫਿਰ ਕੋਸ਼ਿਸ਼ ਕਰੋ।';
      saveProgress(lessonId, 20);
    }
    updateProgressUI();
    renderTeacher();
  }
  
  // save progress (global, not per-student in this prototype)
  function saveProgress(lessonId, percent) {
    const now = new Date().toISOString();
    const prog = JSON.parse(ls.getItem(PROG_KEY) || '{}');
    prog[lessonId] = { percent, updated: now };
    ls.setItem(PROG_KEY, JSON.stringify(prog));
  }
  
  // compute overall percent
  function computeOverallProgress() {
    const prog = JSON.parse(ls.getItem(PROG_KEY) || '{}');
    let sum = 0, count = 0;
    LESSONS.forEach(l => { count++; sum += (prog[l.id]?.percent || 0); });
    return Math.round(count ? (sum / count) : 0);
  }
  
  // progress bar UI
  function updateProgressUI() {
    const p = computeOverallProgress();
    progressBar.style.width = p + '%';
    progressText.textContent = p + '% complete';
  }
  
  // teacher dashboard render
  function renderTeacher() {
    teacherTableBody.innerHTML = '';
    const students = JSON.parse(ls.getItem(STUDENTS_KEY) || '[]');
    const prog = JSON.parse(ls.getItem(PROG_KEY) || '{}');
    // if no students, show message
    if (students.length === 0) {
      teacherTableBody.innerHTML = `<tr><td colspan="3" class="small-muted">No students found. Click "Add Sample Student" to populate demo data.</td></tr>`;
      return;
    }
  
    // overall best and last updated (prototype-level)
    const overallBest = Object.keys(prog).length ? Math.max(...Object.values(prog).map(x => x.percent || 0)) : 0;
    const lastActive = Object.keys(prog).length ? (Object.values(prog)[0].updated || '-') : '-';
  
    students.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(s.name)}</td>
        <td>
          <div style="width:140px">
            <div class="progress" aria-hidden><i style="width:${overallBest}%"></i></div>
            <div class="small-muted">${overallBest}%</div>
          </div>
        </td>
        <td class="small-muted">${lastActive}</td>
      `;
      teacherTableBody.appendChild(tr);
    });
  }
  
  // add sample student (for demo)
  function addSampleStudent() {
    const arr = JSON.parse(ls.getItem(STUDENTS_KEY) || '[]');
    arr.push({ name: 'Student ' + (arr.length + 1) });
    ls.setItem(STUDENTS_KEY, JSON.stringify(arr));
    renderTeacher();
  }
  
  // reset storage (dangerous - clears demo data)
  function resetStorage() {
    if (!confirm('Reset demo data? This clears saved progress and students.')) return;
    ls.removeItem(PROG_KEY);
    ls.removeItem(STUDENTS_KEY);
    renderTeacher();
    updateProgressUI();
    alert('Reset complete.');
  }
  
  // small escape
  function escapeHtml(s) {
    return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }
  
  document.addEventListener('DOMContentLoaded', init);
  