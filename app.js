/* OfferTrack · 秋招进度管理 — local-first, no dependencies */
(function () {
  'use strict';

  /* ================= shared helpers ================= */
  function pad2(n) { return String(n).padStart(2, '0'); }
  function isoOf(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function todayISO() { return isoOf(new Date()); }
  function shiftISO(days) { var d = new Date(); d.setDate(d.getDate() + days); return isoOf(d); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  var storage = {
    read: function (key) {
      try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
      catch (e) { return null; }
    },
    write: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }
  };

  var SVG_BOX_EMPTY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M2.10001 12C2.10001 6.53224 6.53225 2.1 12 2.1C17.4678 2.1 21.9 6.53224 21.9 12C21.9 17.4678 17.4678 21.9 12 21.9C6.53225 21.9 2.10001 17.4678 2.10001 12ZM12 3.9C7.52636 3.9 3.90001 7.52635 3.90001 12C3.90001 16.4736 7.52636 20.1 12 20.1C16.4736 20.1 20.1 16.4736 20.1 12C20.1 7.52635 16.4736 3.9 12 3.9Z" fill="currentColor"/></svg>';
  var SVG_BOX_IN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M17.1363 8.56362C17.4878 8.91509 17.4878 9.48494 17.1363 9.83641L11.1489 15.8239C10.7974 16.1754 10.2275 16.1754 9.87606 15.8239L7.15447 13.1023C6.803 12.7508 6.803 12.181 7.15447 11.8295C7.50594 11.4781 8.07579 11.4781 8.42727 11.8295L10.5125 13.9147L15.8635 8.56362C16.215 8.21215 16.7849 8.21215 17.1363 8.56362Z" fill="currentColor"/></svg>';
  var SVG_CLOSE = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17.9542 4.77253C18.3056 4.42106 18.8761 4.42106 19.2276 4.77253C19.579 5.12401 19.579 5.69452 19.2276 6.04597L13.2735 12.0001L19.2276 17.9542C19.5791 18.3056 19.5791 18.8761 19.2276 19.2276C18.8761 19.5791 18.3056 19.5791 17.9542 19.2276L12.0001 13.2735L6.04595 19.2276C5.69451 19.5791 5.12399 19.579 4.77252 19.2276C4.42104 18.8761 4.42104 18.3056 4.77252 17.9542L10.7266 12.0001L4.77252 6.04597C4.42104 5.6945 4.42104 5.124 4.77252 4.77253C5.12399 4.42107 5.69448 4.42106 6.04595 4.77253L12.0001 10.7266L17.9542 4.77253Z" fill="currentColor"/></svg>';

  /* ================= Tracker（投递进度） ================= */
  var Tracker = (function () {
    var KEY = 'offertrack.tracker.v1';
    var STAGES = [
      { id: 'plan',      name: '待投递' },
      { id: 'applied',   name: '已投递' },
      { id: 'written',   name: '笔试' },
      { id: 'interview', name: '面试' },
      { id: 'offer',     name: 'Offer' },
      { id: 'closed',    name: '已结束' }
    ];
    var ui = { tabStage: 'applied', editingId: null, confirmDelete: false };

    function daysUntil(iso) {
      var a = new Date(todayISO() + 'T00:00:00'); var b = new Date(iso + 'T00:00:00');
      return Math.round((b - a) / 86400000);
    }
    function fmtDate(iso) { var p = iso.split('-'); return Number(p[1]) + '月' + Number(p[2]) + '日'; }
    function ddayText(n) { if (n <= 0) return '今天'; if (n === 1) return '明天'; if (n === 2) return '后天'; return n + ' 天后'; }

    function seed() {
      return { v: 1, companies: [
        { id: 'demo1', sample: true, name: '示例·华为', position: '结构与岩土工程师', stage: 'interview', event: { label: '专业二面', date: shiftISO(3) }, note: '', createdAt: shiftISO(-12) },
        { id: 'demo2', sample: true, name: '示例·中建三局', position: '基建管理岗', stage: 'written', event: { label: '在线笔试', date: shiftISO(1) }, note: '', createdAt: shiftISO(-9) },
        { id: 'demo3', sample: true, name: '示例·比亚迪', position: 'CAE 仿真工程师', stage: 'applied', event: null, note: '', createdAt: shiftISO(-6) },
        { id: 'demo4', sample: true, name: '示例·宁德时代', position: '结构仿真工程师', stage: 'offer', event: { label: 'Offer 沟通', date: shiftISO(6) }, note: '', createdAt: shiftISO(-20) },
        { id: 'demo5', sample: true, name: '示例·中铁设计院', position: '岩土设计岗', stage: 'plan', event: { label: '网申截止', date: shiftISO(9) }, note: '', createdAt: shiftISO(-2) }
      ] };
    }
    function normalize(raw) {
      var s = { v: 1, companies: [] };
      if (!raw || !Array.isArray(raw.companies)) return s;
      raw.companies.forEach(function (c) {
        if (!c || typeof c.name !== 'string' || !c.name.trim()) return;
        var stage = STAGES.some(function (x) { return x.id === c.stage; }) ? c.stage : 'plan';
        var ev = null;
        if (c.event && typeof c.event.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.event.date)) {
          ev = { label: String(c.event.label || '事件').slice(0, 30), date: c.event.date };
        }
        s.companies.push({
          id: String(c.id || ('c' + Math.random().toString(36).slice(2, 9))),
          sample: !!c.sample,
          name: c.name.trim().slice(0, 40),
          position: String(c.position || '').slice(0, 60),
          stage: stage,
          event: ev,
          note: String(c.note || '').slice(0, 200),
          createdAt: String(c.createdAt || todayISO())
        });
      });
      return s;
    }

    var state = normalize(storage.read(KEY)) ;
    if (!storage.read(KEY)) state = seed();
    function persist() { storage.write(KEY, state); }

    function stageIndex(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return i; return 0; }
    function counts() {
      var c = {}; STAGES.forEach(function (s) { c[s.id] = 0; });
      state.companies.forEach(function (co) { c[co.stage] = (c[co.stage] || 0) + 1; });
      return c;
    }
    function activeCount() { var c = counts(); var t = 0; STAGES.forEach(function (s) { if (s.id !== 'closed') t += c[s.id]; }); return t; }
    function futureEvents() {
      var t = todayISO(); var list = [];
      state.companies.forEach(function (co) {
        if (co.stage === 'closed' || !co.event) return;
        if (co.event.date < t) return;
        list.push({ company: co.name, label: co.event.label, date: co.event.date, d: daysUntil(co.event.date) });
      });
      list.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
      return list;
    }

    /* ----- render ----- */
    function renderP0() {
      document.getElementById('p0Active').textContent = String(activeCount());
      document.getElementById('p0Offer').textContent = String(counts().offer || 0);
      var next = futureEvents()[0];
      var nextEl = document.getElementById('p0Next');
      clear(nextEl);
      if (!next) { nextEl.textContent = '暂无近期笔试 / 面试安排'; }
      else {
        nextEl.appendChild(document.createTextNode('下一事件：' + next.company + ' · ' + next.label + '（' + fmtDate(next.date) + '）'));
        nextEl.appendChild(el('strong', null, ' ' + ddayText(next.d)));
      }
    }

    function renderFunnel() {
      var funnelEl = document.getElementById('funnel');
      clear(funnelEl);
      var c = counts();
      STAGES.forEach(function (s, i) {
        var seg = el('div', 'seg'); seg.dataset.stage = s.id;
        var head = el('div', 'seg-head');
        var name = el('span', 'seg-name');
        name.appendChild(el('span', 'mono', '0' + (i + 1)));
        name.appendChild(document.createTextNode(s.name));
        head.appendChild(name);
        head.appendChild(el('output', 'seg-count', String(c[s.id] || 0)));
        seg.appendChild(head);
        var cells = el('div', 'seg-cells'); cells.setAttribute('aria-hidden', 'true');
        var n = Math.min(c[s.id] || 0, 10);
        if (n === 0) { for (var g = 0; g < 3; g++) cells.appendChild(el('i', 'ghost')); }
        else { for (var k = 0; k < n; k++) cells.appendChild(el('i')); }
        seg.appendChild(cells);
        funnelEl.appendChild(seg);
      });
    }

    function renderEvents() {
      var eventRowEl = document.getElementById('eventRow');
      clear(eventRowEl);
      var list = futureEvents().slice(0, 4);
      if (!list.length) { eventRowEl.appendChild(el('p', 'upcoming-empty', '暂无待办事件，给公司卡片填上「下一事件」即可看到倒计时。')); return; }
      list.forEach(function (ev) {
        var chip = el('span', 'event-chip'); if (ev.d <= 2) chip.dataset.urgent = '1';
        chip.appendChild(el('span', 'event-date mono', fmtDate(ev.date)));
        chip.appendChild(el('span', 'event-name', ev.company + ' · ' + ev.label));
        chip.appendChild(el('span', 'event-dday', ddayText(ev.d)));
        eventRowEl.appendChild(chip);
      });
    }

    function eventChipNode(co) {
      if (!co.event) return null;
      var d = daysUntil(co.event.date);
      var chip = el('span', 'card-event', fmtDate(co.event.date) + ' ' + co.event.label + ' · ' + (d < 0 ? '已过' : ddayText(d)));
      if (d < 0) chip.dataset.past = '1'; else if (d <= 2) chip.dataset.urgent = '1';
      return chip;
    }

    function cardNode(co) {
      var card = el('div', 'job-card'); card.dataset.action = 'open'; card.dataset.id = co.id;
      card.setAttribute('role', 'button'); card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', co.name + '，' + STAGES[stageIndex(co.stage)].name + '，点击编辑');
      card.appendChild(el('span', 'card-name', co.name));
      if (co.position) card.appendChild(el('span', 'card-pos', co.position));
      var chip = eventChipNode(co); if (chip) card.appendChild(chip);
      var moves = el('span', 'card-moves');
      var idx = stageIndex(co.stage);
      var back = el('button', 'move-btn', '◀ 回退'); back.type = 'button'; back.dataset.action = 'move'; back.dataset.dir = '-1'; back.dataset.id = co.id;
      back.disabled = idx === 0; back.setAttribute('aria-label', '回退到上一阶段');
      var fwd = el('button', 'move-btn', '推进 ▶'); fwd.type = 'button'; fwd.dataset.action = 'move'; fwd.dataset.dir = '1'; fwd.dataset.id = co.id;
      fwd.disabled = idx === STAGES.length - 1; fwd.setAttribute('aria-label', '推进到下一阶段');
      moves.appendChild(back); moves.appendChild(fwd);
      card.appendChild(moves);
      return card;
    }

    function renderBoard() {
      var boardEl = document.getElementById('board');
      clear(boardEl);
      var c = counts();
      STAGES.forEach(function (s) {
        var col = el('div', 'col');
        var head = el('div', 'col-head');
        head.appendChild(el('span', 'col-name', s.name));
        head.appendChild(el('output', 'col-count', String(c[s.id] || 0)));
        col.appendChild(head);
        var list = el('ul', 'col-list');
        var items = state.companies.filter(function (co) { return co.stage === s.id; });
        if (!items.length) { col.appendChild(el('p', 'col-empty', '暂无')); }
        items.forEach(function (co) { var li = el('li'); li.appendChild(cardNode(co)); list.appendChild(li); });
        col.appendChild(list);
        boardEl.appendChild(col);
      });
    }

    function renderTabs() {
      var stageTabsEl = document.getElementById('stageTabs');
      var listSingleEl = document.getElementById('listSingle');
      clear(stageTabsEl);
      var c = counts();
      STAGES.forEach(function (s) {
        var b = el('button', null, s.name + ' ' + (c[s.id] || 0));
        b.type = 'button'; b.dataset.stage = s.id; b.setAttribute('role', 'tab');
        b.dataset.selected = ui.tabStage === s.id ? 'true' : 'false';
        b.setAttribute('aria-selected', ui.tabStage === s.id ? 'true' : 'false');
        stageTabsEl.appendChild(b);
      });
      clear(listSingleEl);
      var s = STAGES[stageIndex(ui.tabStage)];
      listSingleEl.appendChild(el('h2', 'section-title', s.name + '（' + (c[s.id] || 0) + '）'));
      var list = el('ul', 'col-list');
      var items = state.companies.filter(function (co) { return co.stage === s.id; });
      if (!items.length) listSingleEl.appendChild(el('p', 'col-empty', '该阶段暂无公司'));
      items.forEach(function (co) { var li = el('li'); li.appendChild(cardNode(co)); list.appendChild(li); });
      listSingleEl.appendChild(list);
    }

    function renderSampleBar() {
      var has = state.companies.some(function (co) { return co.sample; });
      document.getElementById('btnClearSamples').hidden = !has;
    }

    function renderAll() { renderP0(); renderFunnel(); renderEvents(); renderBoard(); renderTabs(); renderSampleBar(); }

    /* ----- inspector ----- */
    var inspector = document.getElementById('inspector');
    var form = document.getElementById('inspectorForm');
    var fStageSeg = document.getElementById('fStageSeg');
    var formStage = 'plan';

    function buildStageSeg() {
      clear(fStageSeg);
      STAGES.forEach(function (s) {
        var b = el('button', null, s.name); b.type = 'button'; b.dataset.stage = s.id;
        b.dataset.selected = formStage === s.id ? 'true' : 'false';
        fStageSeg.appendChild(b);
      });
    }
    function openInspector(co) {
      ui.editingId = co ? co.id : null;
      ui.confirmDelete = false;
      document.getElementById('inspectorTitle').textContent = co ? '编辑 · ' + co.name : '记录公司';
      document.getElementById('fName').value = co ? co.name : '';
      document.getElementById('fPos').value = co ? co.position : '';
      document.getElementById('fEventLabel').value = co && co.event ? co.event.label : '';
      document.getElementById('fEventDate').value = co && co.event ? co.event.date : '';
      document.getElementById('fNote').value = co ? co.note : '';
      document.getElementById('formError').textContent = '';
      var del = document.getElementById('btnDelete');
      del.hidden = !co; del.textContent = '删除';
      formStage = co ? co.stage : 'plan';
      buildStageSeg();
      inspector.hidden = false;
      document.getElementById('fName').focus();
    }
    function closeInspector() { inspector.hidden = true; ui.editingId = null; ui.confirmDelete = false; }

    fStageSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-stage]'); if (!b) return;
      formStage = b.dataset.stage; buildStageSeg();
    });
    document.getElementById('btnAdd').addEventListener('click', function () { openInspector(null); });
    document.getElementById('btnCloseInspector').addEventListener('click', closeInspector);
    document.getElementById('btnCancel').addEventListener('click', closeInspector);
    inspector.addEventListener('click', function (e) { if (e.target === inspector) closeInspector(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !inspector.hidden) closeInspector(); });

    document.getElementById('btnDelete').addEventListener('click', function () {
      if (!ui.editingId) return;
      var del = document.getElementById('btnDelete');
      if (!ui.confirmDelete) { ui.confirmDelete = true; del.textContent = '再点一次确认删除'; return; }
      state.companies = state.companies.filter(function (co) { return co.id !== ui.editingId; });
      persist(); closeInspector(); renderAll();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('fName').value.trim();
      var err = document.getElementById('formError');
      if (!name) { err.textContent = '请填写公司名称'; return; }
      var label = document.getElementById('fEventLabel').value.trim();
      var date = document.getElementById('fEventDate').value;
      if (label && !date) { err.textContent = '填写了下一事件，请同时选择日期'; return; }
      err.textContent = '';
      var ev = date ? { label: label || '事件', date: date } : null;
      if (ui.editingId) {
        var co = state.companies.find(function (x) { return x.id === ui.editingId; });
        if (co) {
          co.name = name; co.position = document.getElementById('fPos').value.trim();
          co.stage = formStage; co.event = ev; co.note = document.getElementById('fNote').value.trim();
          co.sample = false;
        }
      } else {
        state.companies.push({
          id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          sample: false, name: name, position: document.getElementById('fPos').value.trim(),
          stage: formStage, event: ev, note: document.getElementById('fNote').value.trim(), createdAt: todayISO()
        });
      }
      persist(); closeInspector(); renderAll();
    });

    /* ----- board actions ----- */
    function openCompanyById(id) {
      var target = state.companies.find(function (x) { return x.id === id; });
      if (target) openInspector(target);
    }
    var trackerCard = document.getElementById('trackerCard');
    trackerCard.addEventListener('click', function (e) {
      var moveBtn = e.target.closest('[data-action="move"]');
      if (moveBtn) {
        e.stopPropagation();
        var co = state.companies.find(function (x) { return x.id === moveBtn.dataset.id; });
        if (co) {
          var idx = stageIndex(co.stage) + Number(moveBtn.dataset.dir);
          if (idx >= 0 && idx < STAGES.length) { co.stage = STAGES[idx].id; co.sample = false; persist(); renderAll(); }
        }
        return;
      }
      var openBtn = e.target.closest('[data-action="open"]');
      if (openBtn) openCompanyById(openBtn.dataset.id);
    });
    trackerCard.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var openBtn = e.target.closest && e.target.closest('[data-action="open"]');
      if (!openBtn || e.target.closest('[data-action="move"]')) return;
      e.preventDefault();
      openCompanyById(openBtn.dataset.id);
    });
    document.getElementById('stageTabs').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-stage]'); if (!b) return;
      ui.tabStage = b.dataset.stage; renderTabs();
    });
    document.getElementById('btnClearSamples').addEventListener('click', function () {
      state.companies = state.companies.filter(function (co) { return !co.sample; });
      persist(); renderAll();
    });

    renderAll();

    return {
      exportData: function () { return state; },
      importData: function (raw) { state = normalize(raw); persist(); renderAll(); }
    };
  })();

  /* ================= Checkin（每周打卡） ================= */
  var Checkin = (function () {
    var KEY = 'offertrack.checkin.v2';

    function mondayOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
    function currentWeekId() { return isoOf(mondayOf(new Date())); }
    function shiftWeek(weekISO, n) { var d = new Date(weekISO + 'T00:00:00'); d.setDate(d.getDate() + 7 * n); return isoOf(d); }
    function weekRangeLabel(weekISO) {
      var a = new Date(weekISO + 'T00:00:00'); var b = new Date(a); b.setDate(b.getDate() + 6);
      return (a.getMonth() + 1) + '/' + a.getDate() + '–' + (b.getMonth() + 1) + '/' + b.getDate();
    }
    function weeksOfCurrentMonth() {
      var now = new Date(); var y = now.getFullYear(), m = now.getMonth();
      var first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
      var cursor = mondayOf(first); var weeks = [];
      while (cursor <= last) { weeks.push(isoOf(cursor)); cursor = new Date(cursor); cursor.setDate(cursor.getDate() + 7); }
      return weeks;
    }

    function defaults() {
      return { v: 2, items: [
        { id: 'i1', text: '刷行测 / 笔试题 3 次' },
        { id: 'i2', text: '复盘 2 家目标公司面经' },
        { id: 'i3', text: '专业基础复习' },
        { id: 'i4', text: '投递或跟进 3 家' },
        { id: 'i5', text: '运动 3 次' }
      ], weeks: {} };
    }
    function normalize(raw) {
      var s = { v: 2, items: [], weeks: {} };
      if (!raw) return s;
      if (Array.isArray(raw.items)) raw.items.forEach(function (it) {
        if (it && typeof it.text === 'string' && it.text.trim()) s.items.push({ id: String(it.id || Math.random().toString(36).slice(2, 9)), text: it.text.trim().slice(0, 30) });
      });
      if (raw.weeks && typeof raw.weeks === 'object') Object.keys(raw.weeks).forEach(function (k) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
        var marks = raw.weeks[k];
        if (marks && typeof marks === 'object') {
          var clean = {};
          Object.keys(marks).forEach(function (ik) { if (marks[ik] === true) clean[ik] = true; });
          if (Object.keys(clean).length) s.weeks[k] = clean;
        }
      });
      return s;
    }

    var state = normalize(storage.read(KEY));
    if (!storage.read(KEY)) state = defaults();
    if (!state.items.length && !Object.keys(state.weeks).length) state = defaults();
    function persist() { storage.write(KEY, state); }

    function marksOf(weekISO) { return state.weeks[weekISO] || {}; }
    function doneCount(weekISO) {
      var marks = marksOf(weekISO); var n = 0;
      state.items.forEach(function (it) { if (marks[it.id]) n++; });
      return n;
    }
    function isFull(weekISO) { return state.items.length > 0 && doneCount(weekISO) === state.items.length; }
    function streak() {
      var offset = isFull(currentWeekId()) ? 0 : -1; var n = 0;
      while (isFull(shiftWeek(currentWeekId(), offset))) { n++; offset--; }
      return n;
    }
    function totalChecks() {
      var n = 0;
      Object.keys(state.weeks).forEach(function (k) { n += Object.keys(state.weeks[k]).length; });
      return n;
    }

    function renderP0() {
      var w = currentWeekId();
      document.getElementById('p0Done').textContent = doneCount(w) + '/' + state.items.length;
      var s = streak();
      var streakEl = document.getElementById('p0Streak');
      clear(streakEl);
      streakEl.appendChild(document.createTextNode('连续全勤 '));
      streakEl.appendChild(el('strong', null, String(s) + ' 周'));
      streakEl.appendChild(document.createTextNode(s === 0 && doneCount(w) > 0 ? ' · 本周全部完成即可续上' : ''));
      document.getElementById('weekLabel').textContent = '本周 ' + weekRangeLabel(w);
      var now = new Date();
      var weekNo = weeksOfCurrentMonth().indexOf(w) + 1;
      document.getElementById('weekIndex').textContent = now.getFullYear() + '.' + pad2(now.getMonth() + 1) + ' · W' + pad2(Math.max(weekNo, 1));
    }

    function renderList() {
      var todoListEl = document.getElementById('todoList');
      clear(todoListEl);
      var w = currentWeekId();
      var marks = marksOf(w);
      state.items.forEach(function (it) {
        var li = el('li', 'todo'); li.dataset.done = marks[it.id] ? '1' : '0';
        var check = el('button', 'todo-check'); check.type = 'button';
        check.dataset.action = 'toggle'; check.dataset.id = it.id;
        check.setAttribute('aria-label', (marks[it.id] ? '取消打卡：' : '打卡：') + it.text);
        check.setAttribute('aria-pressed', marks[it.id] ? 'true' : 'false');
        check.innerHTML = marks[it.id] ? SVG_BOX_IN : SVG_BOX_EMPTY;
        li.appendChild(check);
        li.appendChild(el('span', 'todo-text', it.text));
        var del = el('button', 'todo-del'); del.type = 'button';
        del.dataset.action = 'del'; del.dataset.id = it.id;
        del.setAttribute('aria-label', '删除打卡项：' + it.text);
        del.innerHTML = SVG_CLOSE;
        li.appendChild(del);
        todoListEl.appendChild(li);
      });
    }

    function renderMonth() {
      var weekRowsEl = document.getElementById('weekRows');
      clear(weekRowsEl);
      var now = new Date();
      var cur = currentWeekId();
      var weeks = weeksOfCurrentMonth();
      document.getElementById('monthName').textContent = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月';
      var elapsed = weeks.filter(function (w) { return w <= cur; });
      var full = 0, doneSum = 0;
      weeks.forEach(function (w) {
        var done = doneCount(w);
        if (w <= cur) { doneSum += done; if (isFull(w)) full++; }
        var row = el('div', 'week-row');
        row.dataset.current = w === cur ? '1' : '0';
        row.dataset.future = w > cur ? '1' : '0';
        row.appendChild(el('span', 'week-range mono', weekRangeLabel(w)));
        var cells = el('span', 'week-cells'); cells.setAttribute('aria-hidden', 'true');
        state.items.forEach(function (it) {
          var c = el('i'); if (marksOf(w)[it.id]) c.className = 'on'; cells.appendChild(c);
        });
        row.appendChild(cells);
        var stateText = w > cur ? '未开始' : (isFull(w) ? '全勤' : done + '/' + state.items.length);
        row.appendChild(el('span', 'week-state' + (isFull(w) ? ' full' : ''), stateText));
        row.setAttribute('aria-label', weekRangeLabel(w) + ' 完成 ' + done + '/' + state.items.length + (isFull(w) ? '，全勤' : ''));
        weekRowsEl.appendChild(row);
      });
      var denom = state.items.length * Math.max(elapsed.length, 1);
      var rate = state.items.length ? Math.round(doneSum / denom * 100) : 0;
      document.getElementById('statFull').textContent = String(full);
      document.getElementById('statRate').textContent = rate + '%';
      document.getElementById('statTotal').textContent = String(totalChecks());
    }

    function renderAll() { renderP0(); renderList(); renderMonth(); }

    var checkinCard = document.getElementById('checkinCard');
    checkinCard.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var w = currentWeekId();
      if (btn.dataset.action === 'toggle') {
        var marks = state.weeks[w] || (state.weeks[w] = {});
        if (marks[btn.dataset.id]) delete marks[btn.dataset.id]; else marks[btn.dataset.id] = true;
        if (!Object.keys(marks).length) delete state.weeks[w];
        persist(); renderAll();
      } else if (btn.dataset.action === 'del') {
        state.items = state.items.filter(function (it) { return it.id !== btn.dataset.id; });
        persist(); renderAll();
      }
    });
    document.getElementById('addForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('addInput');
      var text = input.value.trim();
      if (!text) return;
      state.items.push({ id: 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), text: text.slice(0, 30) });
      input.value = '';
      persist(); renderAll();
    });

    renderAll();

    return {
      exportData: function () { return state; },
      importData: function (raw) { state = normalize(raw); persist(); renderAll(); }
    };
  })();

  /* ================= header：日期 / 导入 / 导出 ================= */
  (function () {
    var WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];
    var d = new Date();
    document.getElementById('todayLabel').textContent =
      d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()) + ' 周' + WEEK_CN[d.getDay()];

    function downloadJSON(obj, filename) {
      var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }

    document.getElementById('btnExport').addEventListener('click', function () {
      downloadJSON({
        app: 'OfferTrack',
        version: 1,
        exportedAt: new Date().toISOString(),
        tracker: Tracker.exportData(),
        checkin: Checkin.exportData()
      }, 'OfferTrack备份-' + todayISO() + '.json');
    });

    var fileInput = document.getElementById('importFile');
    document.getElementById('btnImport').addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(String(reader.result));
          var trackerRaw = data && data.tracker ? data.tracker : (data && data.companies ? data : null);
          var checkinRaw = data && data.checkin ? data.checkin : null;
          if (!trackerRaw && !checkinRaw) { window.alert('未识别的备份文件格式'); return; }
          if (!window.confirm('导入将覆盖当前浏览器中的数据，确定继续？')) return;
          if (trackerRaw) Tracker.importData(trackerRaw);
          if (checkinRaw) Checkin.importData(checkinRaw);
        } catch (e) {
          window.alert('备份文件解析失败：' + e.message);
        }
      };
      reader.readAsText(file);
    });
  })();

  /* ================= PWA ================= */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
