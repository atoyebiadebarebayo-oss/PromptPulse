// --- INITIAL STATE ---
let prompts = JSON.parse(localStorage.getItem('promptpulse_library')) || [
  {
    id: '1',
    title: 'Code Refactoring Specialist',
    tags: 'development, python, clean-code',
    system: 'You are a Senior Principal Software Engineer specializing in Python. Refactor code for speed, readability, and PEP8 compliance.',
    user: 'Refactor the following {{language}} code block:\n\n```\n{{code_block}}\n```\n\nEnsure you add detailed inline docstrings.',
    model: 'gpt-4o',
    temp: 0.3,
    topP: 0.9,
    maxTokens: 2048
  }
];

let activePromptId = '1';

// Model pricing rates per 1k input tokens
const modelRates = {
  'gpt-4o': 0.005,
  'gpt-4-turbo': 0.01,
  'claude-3-5-sonnet': 0.003,
  'gemini-1-5-pro': 0.0025
};

// --- DOM ELEMENTS ---
const promptList = document.getElementById('prompt-list');
const newPromptBtn = document.getElementById('new-prompt-btn');
const savePromptBtn = document.getElementById('save-prompt-btn');
const deletePromptBtn = document.getElementById('delete-prompt-btn');
const searchLibrary = document.getElementById('search-library');

const promptTitle = document.getElementById('prompt-title');
const promptTags = document.getElementById('prompt-tags');
const systemPrompt = document.getElementById('system-prompt');
const userPrompt = document.getElementById('user-prompt');

const variablesContainer = document.getElementById('variables-container');
const variableCountBadge = document.getElementById('variable-count-badge');

const paramModel = document.getElementById('param-model');
const paramTemp = document.getElementById('param-temp');
const paramTopP = document.getElementById('param-top-p');
const paramTokens = document.getElementById('param-tokens');

const tempVal = document.getElementById('temp-val');
const toppVal = document.getElementById('topp-val');
const tokensVal = document.getElementById('tokens-val');

const systemTokenCount = document.getElementById('system-token-count');
const userTokenCount = document.getElementById('user-token-count');
const costEstimateBadge = document.getElementById('cost-estimate-badge');
const compiledOutput = document.getElementById('compiled-output');

const copyPayloadBtn = document.getElementById('copy-payload-btn');
const testRunBtn = document.getElementById('test-run-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

const importBtn = document.getElementById('import-btn');
const exportBtn = document.getElementById('export-btn');
const importFileInput = document.getElementById('import-file-input');

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderSidebar();
  loadPrompt(activePromptId);
});

// --- THEME ---
function initTheme() {
  if (localStorage.getItem('promptpulse_theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.querySelector('span').innerText = 'Light Mode';
    themeToggleBtn.querySelector('i').className = 'fa-solid fa-sun';
  }
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('promptpulse_theme', isDark ? 'dark' : 'light');
  themeToggleBtn.querySelector('span').innerText = isDark ? 'Light Mode' : 'Dark Mode';
  themeToggleBtn.querySelector('i').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
});

// --- RENDER SIDEBAR ---
function renderSidebar() {
  const query = searchLibrary.value.toLowerCase();
  promptList.innerHTML = '';

  const filtered = prompts.filter(p => 
    p.title.toLowerCase().includes(query) || p.tags.toLowerCase().includes(query)
  );

  filtered.forEach(p => {
    const div = document.createElement('div');
    div.className = `prompt-item ${p.id === activePromptId ? 'active' : ''}`;
    div.onclick = () => { activePromptId = p.id; loadPrompt(p.id); renderSidebar(); };

    const tagsArr = p.tags ? p.tags.split(',').map(t => `<span class="tag-badge">${t.trim()}</span>`).join(' ') : '';
    div.innerHTML = `<h4>${escapeHTML(p.title || 'Untitled Prompt')}</h4><div>${tagsArr}</div>`;
    promptList.appendChild(div);
  });
}

// --- LOAD PROMPT ---
function loadPrompt(id) {
  const p = prompts.find(x => x.id === id);
  if (!p) return;

  promptTitle.value = p.title;
  promptTags.value = p.tags;
  systemPrompt.value = p.system;
  userPrompt.value = p.user;

  paramModel.value = p.model || 'gpt-4o';
  paramTemp.value = p.temp || 0.7;
  paramTopP.value = p.topP || 0.9;
  paramTokens.value = p.maxTokens || 2048;

  tempVal.innerText = paramTemp.value;
  toppVal.innerText = paramTopP.value;
  tokensVal.innerText = paramTokens.value;

  parseVariables();
  updateCalculations();
}

// --- PARSE DYNAMIC VARIABLES ---
function parseVariables() {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = [...userPrompt.value.matchAll(regex)].map(m => m[1].trim());
  const uniqueVars = [...newSet(matches)];

  variableCountBadge.innerText = `${uniqueVars.length} Found`;

  if (uniqueVars.length === 0) {
    variablesContainer.innerHTML = `<p class="placeholder-text">Type <code>{{variable_name}}</code> in the template to create dynamic input fields.</p>`;
    return;
  }

  // Preserve previous values
  const currentInputs = {};
  variablesContainer.querySelectorAll('input').forEach(input => {
    currentInputs[input.dataset.varName] = input.value;
  });

  variablesContainer.innerHTML = '';
  uniqueVars.forEach(v => {
    const row = document.createElement('div');
    row.className = 'var-row';
    row.innerHTML = `
      <label>{{${escapeHTML(v)}}}</label>
      <input type="text" data-var-name="${escapeHTML(v)}" value="${escapeHTML(currentInputs[v] || '')}" placeholder="Value for ${escapeHTML(v)}...">
    `;
    row.querySelector('input').addEventListener('input', updateCalculations);
    variablesContainer.appendChild(row);
  });
}

// --- TOKEN & COST CALCULATIONS ---
function updateCalculations() {
  const sysTokens = Math.ceil(systemPrompt.value.length / 4);
  const userTokens = Math.ceil(userPrompt.value.length / 4);

  systemTokenCount.innerText = `${sysTokens} Tokens`;
  userTokenCount.innerText = `${userTokens} Tokens`;

  // Compile prompt payload
  let compiledUser = userPrompt.value;
  variablesContainer.querySelectorAll('input').forEach(input => {
    const varName = input.dataset.varName;
    const val = input.value || `[${varName}]`;
    compiledUser = compiledUser.replaceAll(`{{${varName}}}`, val);
  });

  const payload = {
    model: paramModel.value,
    temperature: parseFloat(paramTemp.value),
    top_p: parseFloat(paramTopP.value),
    max_tokens: parseInt(paramTokens.value),
    messages: [
      { role: 'system', content: systemPrompt.value },
      { role: 'user', content: compiledUser }
    ]
  };

  compiledOutput.innerText = JSON.stringify(payload, null, 2);

  // Estimate total input cost
  const totalTokens = sysTokens + Math.ceil(compiledUser.length / 4);
  const rate = modelRates[paramModel.value] || 0.005;
  const estimatedCost = (totalTokens / 1000) * rate;
  costEstimateBadge.innerText = `Est. Cost: $${estimatedCost.toFixed(5)}`;
}

// --- EVENT LISTENERS ---
[systemPrompt, userPrompt].forEach(el => el.addEventListener('input', () => { parseVariables(); updateCalculations(); }));

paramTemp.addEventListener('input', (e) => { tempVal.innerText = e.target.value; updateCalculations(); });
paramTopP.addEventListener('input', (e) => { toppVal.innerText = e.target.value; updateCalculations(); });
paramTokens.addEventListener('input', (e) => { tokensVal.innerText = e.target.value; updateCalculations(); });
paramModel.addEventListener('change', updateCalculations);
searchLibrary.addEventListener('input', renderSidebar);

// Save Prompt
savePromptBtn.addEventListener('click', () => {
  const idx = prompts.findIndex(p => p.id === activePromptId);
  const updatedData = {
    id: activePromptId,
    title: promptTitle.value.trim() || 'Untitled Prompt',
    tags: promptTags.value.trim(),
    system: systemPrompt.value,
    user: userPrompt.value,
    model: paramModel.value,
    temp: parseFloat(paramTemp.value),
    topP: parseFloat(paramTopP.value),
    maxTokens: parseInt(paramTokens.value)
  };

  if (idx > -1) prompts[idx] = updatedData;
  else prompts.push(updatedData);

  localStorage.setItem('promptpulse_library', JSON.stringify(prompts));
  renderSidebar();
  alert('Prompt saved successfully!');
});

// New Prompt
newPromptBtn.addEventListener('click', () => {
  activePromptId = Date.now().toString();
  const newP = {
    id: activePromptId,
    title: 'New Prompt Template',
    tags: 'draft',
    system: '',
    user: '',
    model: 'gpt-4o',
    temp: 0.7,
    topP: 0.9,
    maxTokens: 2048
  };
  prompts.push(newP);
  renderSidebar();
  loadPrompt(activePromptId);
});

// Delete Prompt
deletePromptBtn.addEventListener('click', () => {
  if (prompts.length <= 1) { alert('You must keep at least one prompt in your library.'); return; }
  prompts = prompts.filter(p => p.id !== activePromptId);
  localStorage.setItem('promptpulse_library', JSON.stringify(prompts));
  activePromptId = prompts[0].id;
  renderSidebar();
  loadPrompt(activePromptId);
});

// Copy Payload
copyPayloadBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(compiledOutput.innerText);
  alert('Compiled JSON payload copied to clipboard!');
});

// Simulate Run
testRunBtn.addEventListener('click', () => {
  alert('Simulating API request...\n\nPayload compiled and verified ready for OpenAI/Claude API execution.');
});

// JSON Export
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'PromptPulse_Library.json';
  a.click();
});

// JSON Import
importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        prompts = imported;
        localStorage.setItem('promptpulse_library', JSON.stringify(prompts));
        activePromptId = prompts[0].id;
        renderSidebar();
        loadPrompt(activePromptId);
        alert('Prompt library imported successfully!');
      }
    } catch (err) {
      alert('Invalid JSON file format.');
    }
  };
  reader.readAsText(file);
});

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}