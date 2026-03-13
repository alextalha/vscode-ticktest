import * as vscode from 'vscode'
import { Task } from '../types'

export function getWebviewHtml(_webview: vscode.Webview, tasks: Task[], template: string): string {
  const tasksJson = JSON.stringify(tasks).replace(/</g, '\\u003c')
  const templateJson = JSON.stringify(template).replace(/</g, '\\u003c')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${getStyles()}</style>
</head>
<body>
  <div id="app"></div>
  <script>${getScript(tasksJson, templateJson)}</script>
</body>
</html>`
}

function getStyles(): string {
  return `
    :root {
      --bg: var(--vscode-sideBar-background, #1e1e2e);
      --surface: var(--vscode-sideBarSectionHeader-background, #252526);
      --surface-hover: var(--vscode-list-hoverBackground, #2a2d2e);
      --border: var(--vscode-panel-border, #3a3a5c);
      --text: var(--vscode-foreground, #e0e0f0);
      --text-muted: var(--vscode-descriptionForeground, #8888aa);
      --accent: var(--vscode-textLink-foreground, #3794ff);
      --success: var(--vscode-testing-iconPassed, #4caf50);
      --danger: var(--vscode-testing-iconFailed, #f44336);
      --input-bg: var(--vscode-input-background, #1e1e1e);
      --input-fg: var(--vscode-input-foreground, #ccc);
      --input-border: var(--vscode-input-border, #444);
      --focus-border: var(--vscode-focusBorder, #007fd4);
      --btn-bg: var(--vscode-button-background, #0e639c);
      --btn-fg: var(--vscode-button-foreground, #fff);
      --btn-hover: var(--vscode-button-hoverBackground, #1177bb);
      --btn2-bg: var(--vscode-button-secondaryBackground, #333);
      --btn2-fg: var(--vscode-button-secondaryForeground, #ccc);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
      font-size: 13px;
      color: var(--text);
      background: var(--bg);
      padding: 8px;
      overflow-x: hidden;
    }

    /* ---- Header ---- */
    .view-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0 8px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 8px;
    }
    .view-header h2 {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-actions { display: flex; gap: 4px; }

    /* ---- Buttons ---- */
    .btn-icon {
      background: none; border: none; color: var(--text); cursor: pointer;
      width: 24px; height: 24px; display: flex; align-items: center;
      justify-content: center; border-radius: 4px; font-size: 16px;
    }
    .btn-icon:hover { background: var(--surface-hover); }

    .btn-icon-sm {
      background: none; border: none; color: var(--text-muted); cursor: pointer;
      width: 18px; height: 18px; display: flex; align-items: center;
      justify-content: center; border-radius: 3px; font-size: 11px;
      opacity: 0; transition: opacity 0.15s; flex-shrink: 0;
    }
    .btn-icon-sm:hover { color: var(--danger); }

    .btn-back {
      background: none; border: none; color: var(--accent);
      cursor: pointer; font-size: 12px; padding: 2px 0;
    }
    .btn-back:hover { text-decoration: underline; }

    .btn-primary {
      background: var(--btn-bg); color: var(--btn-fg); border: none;
      padding: 4px 12px; border-radius: 3px; cursor: pointer; font-size: 12px;
    }
    .btn-primary:hover { background: var(--btn-hover); }

    .btn-secondary {
      background: var(--btn2-bg); color: var(--btn2-fg); border: none;
      padding: 4px 12px; border-radius: 3px; cursor: pointer; font-size: 12px;
    }
    .btn-secondary:hover { opacity: 0.9; }

    .btn-full { width: 100%; margin-top: 8px; }

    .btn-copy {
      background: none; border: 1px solid var(--border); color: var(--text-muted);
      padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; margin-top: 6px;
    }
    .btn-copy:hover { background: var(--btn2-bg); }
    .btn-copy.copied { border-color: var(--success); color: var(--success); }

    /* ---- Task cards ---- */
    .task-list { display: flex; flex-direction: column; gap: 4px; }

    .task-card {
      padding: 8px 10px; border-radius: 4px; cursor: pointer; transition: background 0.15s;
    }
    .task-card:hover { background: var(--surface-hover); }
    .task-card:hover .btn-delete-task { opacity: 1; }

    .task-card-main {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;
    }
    .task-card-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .task-id { font-weight: 600; font-size: 13px; }
    .task-name {
      font-size: 11px; color: var(--text-muted);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .btn-delete-task { opacity: 0; transition: opacity 0.15s; }

    /* ---- Progress ---- */
    .task-progress, .task-progress-detail {
      display: flex; align-items: center; gap: 6px;
    }
    .progress-bar {
      flex: 1; height: 4px; background: rgba(255,255,255,0.1);
      border-radius: 2px; overflow: hidden;
    }
    .task-progress-detail .progress-bar { height: 6px; border-radius: 3px; }
    .progress-fill {
      height: 100%; background: var(--success);
      border-radius: inherit; transition: width 0.3s ease;
    }
    .progress-label { font-size: 11px; color: var(--text-muted); white-space: nowrap; }

    /* ---- Task detail header ---- */
    .task-header { margin-bottom: 12px; }
    .task-header h2 { font-size: 15px; font-weight: 600; }
    .task-subtitle { font-size: 12px; color: var(--text-muted); margin: 2px 0 6px; }
    .task-progress-detail { margin-top: 4px; }

    /* ---- Groups ---- */
    .group {
      margin-bottom: 6px; border: 1px solid var(--border);
      border-radius: 4px; overflow: hidden;
    }
    .group-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 8px; background: var(--surface); cursor: pointer; user-select: none;
    }
    .group-header:hover { background: var(--surface-hover); }
    .group-header:hover .btn-icon-sm { opacity: 1; }
    .group-title {
      font-weight: 600; font-size: 12px; display: flex; align-items: center; gap: 4px;
    }
    .collapse-icon {
      font-size: 9px; transition: transform 0.2s; display: inline-block;
    }
    .group.collapsed .collapse-icon { transform: rotate(-90deg); }
    .group-meta { display: flex; align-items: center; gap: 6px; }
    .group-progress { font-size: 11px; color: var(--text-muted); }
    .group-body { padding: 2px 0; }
    .group.collapsed .group-body { display: none; }

    /* ---- Test items ---- */
    .test-item {
      display: flex; align-items: flex-start; gap: 6px;
      padding: 4px 8px; transition: background 0.1s;
    }
    .test-item:hover { background: var(--surface-hover); }
    .test-item:hover .btn-icon-sm { opacity: 1; }

    .test-status {
      width: 16px; height: 16px; border-radius: 50%;
      border: 1.5px solid var(--text-muted); cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; margin-top: 2px; transition: all 0.15s;
    }
    .test-status.pending { border-color: var(--text-muted); color: transparent; }
    .test-status.passed { border-color: var(--success); background: var(--success); color: #fff; }
    .test-status.failed { border-color: var(--danger); background: var(--danger); color: #fff; }
    .test-status.skipped {
      border-color: var(--text-muted); background: var(--text-muted);
      color: var(--bg);
    }

    .test-content { flex: 1; min-width: 0; }
    .test-content.dimmed { opacity: 0.5; }
    .test-desc { font-size: 12px; line-height: 1.4; display: block; }
    .test-notes {
      font-size: 10px; color: var(--text-muted); font-style: italic;
      display: block; margin-top: 1px;
    }

    /* ---- Inline add ---- */
    .inline-add { padding: 4px 8px; }
    .inline-add input {
      width: 100%; background: var(--input-bg); color: var(--input-fg);
      border: 1px solid var(--input-border); padding: 3px 6px;
      font-size: 11px; border-radius: 3px; outline: none;
    }
    .inline-add input:focus { border-color: var(--focus-border); }
    .inline-add input::placeholder { color: var(--text-muted); }

    /* ---- Import / Export ---- */
    .import-section, .export-section { margin-bottom: 12px; }
    .import-section h3, .export-section h3 { font-size: 12px; font-weight: 600; margin-bottom: 6px; }
    .info-text { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }

    #import-textarea {
      width: 100%; min-height: 120px; background: var(--input-bg);
      color: var(--input-fg); border: 1px solid var(--input-border);
      padding: 6px; font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px; border-radius: 3px; resize: vertical; outline: none;
    }
    #import-textarea:focus { border-color: var(--focus-border); }

    .import-actions { display: flex; gap: 6px; margin-top: 6px; align-items: center; }
    .import-actions select {
      background: var(--input-bg); color: var(--input-fg);
      border: 1px solid var(--input-border); padding: 3px 6px;
      border-radius: 3px; font-size: 11px;
    }
    .error-msg {
      margin-top: 6px; padding: 6px 8px;
      background: rgba(190,17,0,0.15); border: 1px solid var(--danger);
      border-radius: 3px; font-size: 11px; color: var(--danger);
    }
    .code-block {
      background: var(--input-bg); border: 1px solid var(--border);
      border-radius: 3px; padding: 8px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 11px; overflow-x: auto; white-space: pre-wrap;
      word-wrap: break-word; max-height: 200px; overflow-y: auto;
    }
    .preview-summary {
      font-size: 11px; color: var(--success); margin-top: 6px; font-weight: 600;
    }

    /* ---- Empty state ---- */
    .empty-state {
      text-align: center; padding: 24px 8px; color: var(--text-muted);
    }
    .empty-state p { margin-bottom: 4px; font-size: 12px; }
  `
}

function getScript(tasksJson: string, templateJson: string): string {
  return `
    const vscode = acquireVsCodeApi();
    let tasks = ${tasksJson};
    const templateJson = ${templateJson};

    let currentView = 'task-list';
    let currentTaskId = null;
    let collapsedGroups = {};

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.command === 'importError') {
        const el = document.getElementById('import-error');
        if (el) { el.textContent = msg.error; el.style.display = 'block'; }
      }
      if (msg.command === 'taskCreated') {
        tasks.unshift({ taskId: msg.taskId, taskName: msg.taskName || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), groups: [] });
        render();
      }
      if (msg.command === 'groupCreated') {
        const task = tasks.find(t => t.taskId === msg.taskId);
        if (task) { task.groups.push({ id: msg.groupId, name: msg.name, tests: [] }); }
        render();
      }
    });

    function render() {
      const app = document.getElementById('app');
      switch (currentView) {
        case 'task-list': app.innerHTML = renderTaskList(); break;
        case 'task-detail': app.innerHTML = renderTaskDetail(); break;
        case 'import': app.innerHTML = renderImport(); break;
      }
      bindEvents();
    }

    function esc(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }

    // ===== TASK LIST =====
    function renderTaskList() {
      let html = '<div class="view-header">';
      html += '<h2>Tarefas</h2>';
      html += '<div class="header-actions">';
      html += '<button class="btn-icon" id="btn-detect" title="Detectar do branch">⎇</button>';
      html += '<button class="btn-icon" id="btn-add-task" title="Nova tarefa">+</button>';
      html += '</div></div>';

      if (tasks.length === 0) {
        html += '<div class="empty-state"><p>Nenhuma tarefa ainda.</p><p>Crie uma nova ou detecte do branch atual.</p></div>';
        return html;
      }

      html += '<div class="task-list">';
      for (const task of tasks) {
        let passed = 0, total = 0;
        for (const g of task.groups) {
          for (const t of g.tests) { total++; if (t.status === 'passed') passed++; }
        }
        const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

        html += '<div class="task-card" data-task-id="' + task.taskId + '">';
        html += '<div class="task-card-main">';
        html += '<div class="task-card-info">';
        html += '<span class="task-id">' + esc(task.taskId) + '</span>';
        if (task.taskName) html += '<span class="task-name">' + esc(task.taskName) + '</span>';
        html += '</div>';
        html += '<button class="btn-icon-sm btn-delete-task" data-task-id="' + task.taskId + '" title="Remover">✕</button>';
        html += '</div>';
        html += '<div class="task-progress">';
        html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
        html += '<span class="progress-label">' + passed + '/' + total + '</span>';
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';
      return html;
    }

    // ===== TASK DETAIL =====
    function renderTaskDetail() {
      const task = tasks.find(t => t.taskId === currentTaskId);
      if (!task) { currentView = 'task-list'; return renderTaskList(); }

      let passed = 0, total = 0;
      for (const g of task.groups) {
        for (const t of g.tests) { total++; if (t.status === 'passed') passed++; }
      }
      const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

      let html = '<div class="view-header">';
      html += '<button class="btn-back" id="btn-back">\\u2190 Voltar</button>';
      html += '<div class="header-actions">';
      html += '<button class="btn-icon" id="btn-import" title="Importar JSON">\\u2B07</button>';
      html += '</div></div>';

      html += '<div class="task-header">';
      html += '<h2>' + esc(task.taskId) + '</h2>';
      if (task.taskName) html += '<p class="task-subtitle">' + esc(task.taskName) + '</p>';
      html += '<div class="task-progress-detail">';
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
      html += '<span class="progress-label">' + passed + '/' + total + ' aprovados</span>';
      html += '</div></div>';

      if (task.groups.length === 0) {
        html += '<div class="empty-state"><p>Nenhum grupo de testes.</p><p>Adicione manualmente ou importe um JSON.</p></div>';
      } else {
        for (const group of task.groups) {
          const gPassed = group.tests.filter(t => t.status === 'passed').length;
          const gTotal = group.tests.length;
          const isCollapsed = collapsedGroups[group.id];

          html += '<div class="group' + (isCollapsed ? ' collapsed' : '') + '" data-group-id="' + group.id + '">';
          html += '<div class="group-header" data-group-id="' + group.id + '">';
          html += '<div class="group-title"><span class="collapse-icon">\\u25BC</span> ' + esc(group.name) + '</div>';
          html += '<div class="group-meta">';
          html += '<span class="group-progress">' + gPassed + '/' + gTotal + '</span>';
          html += '<button class="btn-icon-sm btn-delete-group" data-group-id="' + group.id + '" title="Remover grupo">\\u2715</button>';
          html += '</div></div>';

          html += '<div class="group-body">';
          for (const test of group.tests) {
            const icons = { pending: '', passed: '\\u2713', failed: '\\u2715', skipped: '\\u2014' };
            html += '<div class="test-item">';
            html += '<div class="test-status ' + test.status + '" data-test-id="' + test.id + '" data-status="' + test.status + '">' + (icons[test.status] || '') + '</div>';
            html += '<div class="test-content' + (test.status === 'skipped' ? ' dimmed' : '') + '">';
            html += '<span class="test-desc">' + esc(test.description) + '</span>';
            if (test.notes) html += '<span class="test-notes">' + esc(test.notes) + '</span>';
            html += '</div>';
            html += '<button class="btn-icon-sm btn-delete-test" data-group-id="' + group.id + '" data-test-id="' + test.id + '" title="Remover">\\u2715</button>';
            html += '</div>';
          }
          html += '<div class="inline-add"><input type="text" class="input-add-test" data-group-id="' + group.id + '" placeholder="Adicionar teste... (Enter)" /></div>';
          html += '</div></div>';
        }
      }

      html += '<button class="btn-secondary btn-full" id="btn-add-group">+ Adicionar Grupo</button>';
      return html;
    }

    // ===== IMPORT =====
    function renderImport() {
      const task = tasks.find(t => t.taskId === currentTaskId);
      let html = '<div class="view-header">';
      html += '<button class="btn-back" id="btn-back">\\u2190 Voltar</button>';
      html += '</div>';

      html += '<div class="import-section">';
      html += '<h3>Importar JSON</h3>';
      html += '<p class="info-text">Cole o JSON populado pela IA:</p>';
      html += '<textarea id="import-textarea" placeholder=\\'"taskId": "RH-XXXX", "groups": [...]}\\'></textarea>';
      html += '<div class="import-actions">';
      html += '<select id="import-mode"><option value="replace">Substituir</option><option value="merge">Adicionar</option></select>';
      html += '<button class="btn-primary" id="btn-do-import">Importar</button>';
      html += '</div>';
      html += '<div id="import-error" class="error-msg" style="display:none"></div>';
      html += '<div id="import-preview"></div>';
      html += '</div>';

      html += '<div class="export-section">';
      html += '<h3>Template (copiar para IA)</h3>';
      html += '<pre class="code-block" id="template-block">' + esc(templateJson) + '</pre>';
      html += '<button class="btn-copy" id="btn-copy-template">Copiar Template</button>';
      html += '</div>';

      if (task && task.groups.length > 0) {
        const exportData = {
          taskId: task.taskId,
          taskName: task.taskName,
          groups: task.groups.map(g => ({
            name: g.name,
            tests: g.tests.map(t => ({ description: t.description, status: t.status, notes: t.notes || undefined })),
          })),
        };
        html += '<div class="export-section">';
        html += '<h3>JSON Atual (backup)</h3>';
        html += '<pre class="code-block" id="current-block">' + esc(JSON.stringify(exportData, null, 2)) + '</pre>';
        html += '<button class="btn-copy" id="btn-copy-current">Copiar JSON</button>';
        html += '</div>';
      }

      return html;
    }

    // ===== EVENTS =====
    function bindEvents() {
      document.querySelectorAll('.task-card').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-task')) return;
          currentTaskId = el.dataset.taskId;
          currentView = 'task-detail';
          render();
        });
      });

      document.querySelectorAll('.btn-delete-task').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const taskId = el.dataset.taskId;
          vscode.postMessage({ command: 'deleteTask', taskId });
          tasks = tasks.filter(t => t.taskId !== taskId);
          render();
        });
      });

      const btnAddTask = document.getElementById('btn-add-task');
      if (btnAddTask) {
        btnAddTask.addEventListener('click', () => {
          vscode.postMessage({ command: 'requestCreateTask' });
        });
      }

      const btnDetect = document.getElementById('btn-detect');
      if (btnDetect) {
        btnDetect.addEventListener('click', () => {
          vscode.postMessage({ command: 'detectTask' });
        });
      }

      const btnBack = document.getElementById('btn-back');
      if (btnBack) {
        btnBack.addEventListener('click', () => {
          if (currentView === 'import') { currentView = 'task-detail'; }
          else { currentView = 'task-list'; currentTaskId = null; }
          render();
        });
      }

      const btnImport = document.getElementById('btn-import');
      if (btnImport) {
        btnImport.addEventListener('click', () => { currentView = 'import'; render(); });
      }

      // Group collapse
      document.querySelectorAll('.group-header').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.closest('.btn-delete-group')) return;
          const gid = el.dataset.groupId;
          collapsedGroups[gid] = !collapsedGroups[gid];
          el.closest('.group')?.classList.toggle('collapsed');
        });
      });

      document.querySelectorAll('.btn-delete-group').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          vscode.postMessage({ command: 'deleteGroup', taskId: currentTaskId, groupId: el.dataset.groupId });
          const task = tasks.find(t => t.taskId === currentTaskId);
          if (task) { task.groups = task.groups.filter(g => g.id !== el.dataset.groupId); }
          render();
        });
      });

      // Test status cycle: pending -> passed -> failed -> skipped -> pending
      document.querySelectorAll('.test-status').forEach(el => {
        el.addEventListener('click', () => {
          const order = ['pending', 'passed', 'failed', 'skipped'];
          const next = order[(order.indexOf(el.dataset.status) + 1) % order.length];
          vscode.postMessage({ command: 'updateTestStatus', taskId: currentTaskId, testId: el.dataset.testId, status: next });
          const task = tasks.find(t => t.taskId === currentTaskId);
          if (task) {
            for (const g of task.groups) {
              const test = g.tests.find(t => t.id === el.dataset.testId);
              if (test) { test.status = next; break; }
            }
          }
          render();
        });
      });

      document.querySelectorAll('.btn-delete-test').forEach(el => {
        el.addEventListener('click', () => {
          vscode.postMessage({ command: 'deleteTest', taskId: currentTaskId, groupId: el.dataset.groupId, testId: el.dataset.testId });
          const task = tasks.find(t => t.taskId === currentTaskId);
          if (task) {
            const group = task.groups.find(g => g.id === el.dataset.groupId);
            if (group) { group.tests = group.tests.filter(t => t.id !== el.dataset.testId); }
          }
          render();
        });
      });

      // Add test inline
      document.querySelectorAll('.input-add-test').forEach(el => {
        el.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter') return;
          const desc = el.value.trim();
          if (!desc) return;
          const groupId = el.dataset.groupId;
          vscode.postMessage({ command: 'addTest', taskId: currentTaskId, groupId, description: desc });
          const task = tasks.find(t => t.taskId === currentTaskId);
          if (task) {
            const group = task.groups.find(g => g.id === groupId);
            if (group) { group.tests.push({ id: 'temp-' + Date.now(), description: desc, status: 'pending' }); }
          }
          el.value = '';
          render();
        });
      });

      // Add group
      const btnAddGroup = document.getElementById('btn-add-group');
      if (btnAddGroup) {
        btnAddGroup.addEventListener('click', () => {
          vscode.postMessage({ command: 'requestAddGroup', taskId: currentTaskId });
        });
      }

      // Import preview
      const textarea = document.getElementById('import-textarea');
      if (textarea) {
        textarea.addEventListener('input', () => {
          const preview = document.getElementById('import-preview');
          const errorEl = document.getElementById('import-error');
          if (errorEl) errorEl.style.display = 'none';
          try {
            const data = JSON.parse(textarea.value);
            if (!data.groups || !Array.isArray(data.groups)) { if (preview) preview.innerHTML = ''; return; }
            let totalTests = 0;
            for (const g of data.groups) { totalTests += (g.tests?.length || 0); }
            if (preview) preview.innerHTML = '<div class="preview-summary">' + data.groups.length + ' grupos, ' + totalTests + ' testes</div>';
          } catch { if (preview) preview.innerHTML = ''; }
        });
      }

      const btnDoImport = document.getElementById('btn-do-import');
      if (btnDoImport) {
        btnDoImport.addEventListener('click', () => {
          const ta = document.getElementById('import-textarea');
          if (!ta || !ta.value || !ta.value.trim()) return;
          const mode = (document.getElementById('import-mode') || {}).value || 'replace';
          vscode.postMessage({ command: 'importJson', taskId: currentTaskId, json: ta.value, mode });
        });
      }

      // Copy buttons
      const btnCopyTemplate = document.getElementById('btn-copy-template');
      if (btnCopyTemplate) {
        btnCopyTemplate.addEventListener('click', () => copyText('template-block', btnCopyTemplate));
      }
      const btnCopyCurrent = document.getElementById('btn-copy-current');
      if (btnCopyCurrent) {
        btnCopyCurrent.addEventListener('click', () => copyText('current-block', btnCopyCurrent));
      }
    }

    function copyText(sourceId, btn) {
      const el = document.getElementById(sourceId);
      if (!el) return;
      navigator.clipboard.writeText(el.textContent).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
      });
    }

    // Initial render
    render();
  `
}
