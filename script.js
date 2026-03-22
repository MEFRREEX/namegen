const DOM = {
    startSequence: document.getElementById('startSequence'),
    minLength: document.getElementById('minLength'),
    maxLength: document.getElementById('maxLength'),
    count: document.getElementById('count'),
    caseMode: document.getElementById('caseMode'),
    results: document.getElementById('results'),
    bookmarksList: document.getElementById('bookmarksList'),
    bookmarkCount: document.getElementById('bookmarkCount')
};

const DEFAULT_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

const DEFAULT_SCHEMES = {
    'default': { name: 'English (a-z)', alphabet: DEFAULT_ALPHABET, isDefault: true },
    'russian': { name: 'Russian (а-я)', alphabet: 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя', isDefault: true },
    'ukrainian': { name: 'Ukrainian (а-я)', alphabet: 'абвгдеєжзиіїйклмнопрстуфхцчшщьюя', isDefault: true }
};

let state = {
    generated: [],
    bookmarks: [],
    caseMode: 'lowercase',
    schemes: { ...DEFAULT_SCHEMES },
    currentScheme: 'default'
};

let currentAlphabet = DEFAULT_ALPHABET;
let schemeToDelete = null;
const MAX_TOASTS = 3;

function showToast(message, type = 'error') {
    const container = document.getElementById('toastContainer');
    
    const toasts = container.querySelectorAll('.toast');
    if (toasts.length >= MAX_TOASTS) {
        toasts[0].remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('active');
    });

    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function loadState() {
    const saved = localStorage.getItem('data');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.generated = parsed.generated || [];
        state.bookmarks = parsed.bookmarks || [];
        state.caseMode = parsed.caseMode || 'lowercase';
        state.schemes = parsed.schemes ? { ...DEFAULT_SCHEMES, ...parsed.schemes } : { ...DEFAULT_SCHEMES };
        state.currentScheme = parsed.currentScheme || 'default';
        currentAlphabet = state.schemes[state.currentScheme]?.alphabet || DEFAULT_ALPHABET;
        
        DOM.startSequence.value = parsed.startSequence || '';
        DOM.minLength.value = parsed.minLength || 5;
        DOM.maxLength.value = parsed.maxLength || 10;
        DOM.count.value = parsed.count || 10;
        renderNames();
    }
    renderBookmarks();
    initDropdown();
    initSchemeDropdown();
}

function saveState() {
    const dataToSave = {
        ...state,
        startSequence: DOM.startSequence.value,
        minLength: DOM.minLength.value,
        maxLength: DOM.maxLength.value,
        count: DOM.count.value,
        caseMode: DOM.caseMode.value,
        schemes: state.schemes,
        currentScheme: state.currentScheme
    };
    localStorage.setItem('data', JSON.stringify(dataToSave));
}

function toggleBookmarks() {
    const list = DOM.bookmarksList;
    const chev = document.getElementById('chevron');
    list.classList.toggle('active');
    chev.textContent = list.classList.contains('active') ? '▲' : '▼';
}

function openDeleteAllModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

function closeDeleteAllModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

function deleteAllBookmarks() {
    state.bookmarks = [];
    saveState();
    renderBookmarks();
    renderNames();
    closeDeleteAllModal();
}

function initDropdown() {
    const dropdown = document.getElementById('caseModeDropdown');
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');
    const selected = document.getElementById('dropdownSelected');
    const hiddenInput = document.getElementById('caseMode');
    const items = dropdown.querySelectorAll('.dropdown-item');

    trigger.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
        trigger.classList.toggle('active');
    };

    items.forEach(item => {
        item.onclick = (e) => {
            e.stopPropagation();
            const value = item.dataset.value;
            const label = item.querySelector('.dropdown-item-label').textContent;
            
            hiddenInput.value = value;
            selected.textContent = label;
            
            items.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            menu.classList.remove('active');
            trigger.classList.remove('active');
            
            saveState();
        };
    });

    document.addEventListener('click', () => {
        menu.classList.remove('active');
        trigger.classList.remove('active');
    });

    const savedValue = hiddenInput.value;
    const savedItem = dropdown.querySelector(`.dropdown-item[data-value="${savedValue}"]`);
    if (savedItem) {
        const savedLabel = savedItem.querySelector('.dropdown-item-label').textContent;
        selected.textContent = savedLabel;
        savedItem.classList.add('selected');
    }
}

function initSchemeDropdown() {
    const dropdown = document.getElementById('schemeDropdown');
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = document.getElementById('schemeMenu');
    const selected = document.getElementById('schemeSelected');
    const addSchemeItem = document.getElementById('addSchemeItem');

    renderSchemeMenu();

    trigger.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
        trigger.classList.toggle('active');
    };

    addSchemeItem.onclick = (e) => {
        e.stopPropagation();
        menu.classList.remove('active');
        trigger.classList.remove('active');
        openAddSchemeModal();
    };

    document.addEventListener('click', () => {
        menu.classList.remove('active');
        trigger.classList.remove('active');
    });
}

function openAddSchemeModal() {
    const modal = document.getElementById('addSchemeModal');
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    document.getElementById('newSchemeName').value = '';
    document.getElementById('newSchemeChars').value = '';
    document.getElementById('newSchemeName').focus();
}

function closeAddSchemeModal() {
    const modal = document.getElementById('addSchemeModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
}

function confirmAddScheme() {
    const nameInput = document.getElementById('newSchemeName');
    const charsInput = document.getElementById('newSchemeChars');

    const name = nameInput.value.trim();
    const chars = charsInput.value.trim();

    if (!name || !chars) {
        showToast('Please enter both scheme name and characters');
        return;
    }

    const schemeId = 'custom_' + Date.now();
    state.schemes[schemeId] = { name: `${name} (${chars})`, alphabet: chars, isDefault: false };
    state.currentScheme = schemeId;
    currentAlphabet = chars;

    renderSchemeMenu();
    saveState();
    closeAddSchemeModal();
}

function renderSchemeMenu() {
    const menu = document.getElementById('schemeMenu');
    const selected = document.getElementById('schemeSelected');
    const addSchemeItem = document.getElementById('addSchemeItem');
    const trigger = document.querySelector('#schemeDropdown .dropdown-trigger');

    menu.innerHTML = '';

    Object.keys(state.schemes).forEach(schemeId => {
        const scheme = state.schemes[schemeId];
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.dataset.value = schemeId;
        item.dataset.alphabet = scheme.alphabet;

        const deleteBtn = scheme.isDefault ? '' : `
            <button class="scheme-delete-btn" data-scheme="${schemeId}" title="Delete scheme">
                <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12z"/>
                </svg>
            </button>
        `;

        item.innerHTML = `
            <div class="dropdown-item-content">
                <span class="dropdown-item-label">${scheme.name}</span>
                <span class="dropdown-item-desc">${scheme.alphabet}</span>
            </div>
            <div class="dropdown-item-actions">
                ${deleteBtn}
            </div>
        `;

        if (schemeId === state.currentScheme) {
            item.classList.add('selected');
            selected.textContent = scheme.name;
        }

        item.onclick = (e) => {
            if (e.target.closest('.scheme-delete-btn')) return;
            e.stopPropagation();
            state.currentScheme = schemeId;
            currentAlphabet = scheme.alphabet;
            selected.textContent = scheme.name;
            menu.classList.remove('active');
            trigger.classList.remove('active');
            renderSchemeMenu();
            saveState();
        };

        const deleteBtnEl = item.querySelector('.dropdown-item-actions .scheme-delete-btn');
        if (deleteBtnEl) {
            deleteBtnEl.onclick = (e) => {
                e.stopPropagation();
                const schemeIdToDelete = e.target.closest('.scheme-delete-btn').dataset.scheme;
                deleteScheme(schemeIdToDelete);
            };
        }

        menu.appendChild(item);
    });

    menu.appendChild(addSchemeItem);
}

function deleteScheme(schemeId) {
    if (state.schemes[schemeId]?.isDefault) {
        showToast('Cannot delete the default scheme');
        return;
    }

    schemeToDelete = schemeId;
    const modal = document.getElementById('deleteSchemeModal');
    modal.classList.add('active');
    document.body.classList.add('modal-open');
}

function closeDeleteSchemeModal() {
    const modal = document.getElementById('deleteSchemeModal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    schemeToDelete = null;
}

function confirmDeleteScheme() {
    if (schemeToDelete) {
        delete state.schemes[schemeToDelete];
        if (state.currentScheme === schemeToDelete) {
            state.currentScheme = 'default';
            currentAlphabet = DEFAULT_ALPHABET;
        }
        renderSchemeMenu();
        saveState();
    }
    closeDeleteSchemeModal();
}

function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('copied');
        }, 1000);
    });
}

function addBookmark(name) {
    if (!state.bookmarks.includes(name)) {
        state.bookmarks.unshift(name);
        saveState();
        renderBookmarks();
        renderNames();
    }
}

function removeBookmark(name) {
    state.bookmarks = state.bookmarks.filter(b => b !== name);
    saveState();
    renderBookmarks();
    renderNames();
}

function renderNames() {
    DOM.results.innerHTML = state.generated.length ? '' : '<div class="empty-state">Click generate to start</div>';
    state.generated.forEach(name => {
        const item = document.createElement('div');
        item.className = 'result-item';
        const isBookmarked = state.bookmarks.includes(name);
        item.innerHTML = `
            <span>${name}</span>
            <div class="action-btns">
                <button class="btn-small btn-copy">Copy</button>
                <button class="btn-small ${isBookmarked ? 'btn-delete' : 'btn-save'}">${isBookmarked ? 'Delete' : 'Save'}</button>
            </div>
        `;
        item.querySelector('.btn-copy').onclick = (e) => copyToClipboard(name, e.target);
        const actionBtn = item.querySelector(isBookmarked ? '.btn-delete' : '.btn-save');
        actionBtn.onclick = () => isBookmarked ? removeBookmark(name) : addBookmark(name);
        DOM.results.appendChild(item);
    });
}

function renderBookmarks() {
    DOM.bookmarkCount.textContent = state.bookmarks.length;
    DOM.bookmarksList.innerHTML = state.bookmarks.length ? '' : '<div class="empty-state">No bookmarks saved</div>';
    state.bookmarks.forEach(name => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <span>${name}</span>
            <div class="action-btns">
                <button class="btn-small btn-copy">Copy</button>
                <button class="btn-small btn-delete">Delete</button>
            </div>
        `;
        item.querySelector('.btn-copy').onclick = (e) => copyToClipboard(name, e.target);
        item.querySelector('.btn-delete').onclick = () => removeBookmark(name);
        DOM.bookmarksList.appendChild(item);
    });
}

function generateNames(prefix, min, max, count, caseMode, alphabet) {
    const names = [];
    for (let i = 0; i < count; i++) {
        const targetLen = Math.max(prefix.length, Math.floor(Math.random() * (max - min + 1)) + min);
        let word = prefix;
        while (word.length < targetLen) {
            word += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        if (caseMode === 'lowercase') {
            word = word.toLowerCase();
        } else if (caseMode === 'capitalize') {
            word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        names.push(word);
    }
    return names;
}

document.getElementById('generateBtn').onclick = () => {
    const generateBtn = document.getElementById('generateBtn');

    generateBtn.classList.add('generating');
    setTimeout(() => generateBtn.classList.remove('generating'), 750);

    let min = parseInt(DOM.minLength.value) || 1;
    let max = parseInt(DOM.maxLength.value) || 1;
    const count = parseInt(DOM.count.value) || 1;
    const prefix = DOM.startSequence.value.trim();
    const caseMode = DOM.caseMode.value;

    if (min > max) [min, max] = [max, min];

    state.generated = generateNames(prefix, min, max, count, caseMode, currentAlphabet);
    renderNames();
    saveState();
};

[DOM.startSequence, DOM.minLength, DOM.maxLength, DOM.count].forEach(el => {
    el.oninput = saveState;
});

document.getElementById('resetBtn').onclick = function() {
    const resetBtn = this;
    resetBtn.classList.add('spinning');

    DOM.startSequence.value = '';
    DOM.minLength.value = 5;
    DOM.maxLength.value = 10;
    DOM.count.value = 10;
    DOM.caseMode.value = 'lowercase';
    document.getElementById('dropdownSelected').textContent = 'Lower';
    document.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
    document.querySelector('.dropdown-item[data-value="lowercase"]').classList.add('selected');

    state.generated = generateNames('', 5, 10, 10, 'lowercase', currentAlphabet);
    renderNames();
    saveState();

    setTimeout(() => resetBtn.classList.remove('spinning'), 500);
};

document.getElementById('clearAllBookmarksBtn').onclick = openDeleteAllModal;

document.getElementById('modalCancelBtn').onclick = closeDeleteAllModal;
document.getElementById('modalConfirmBtn').onclick = deleteAllBookmarks;

document.getElementById('closeAddSchemeModal').onclick = closeAddSchemeModal;
document.getElementById('confirmAddSchemeBtn').onclick = confirmAddScheme;

document.getElementById('closeDeleteSchemeModal').onclick = closeDeleteSchemeModal;
document.getElementById('confirmDeleteSchemeBtn').onclick = confirmDeleteScheme;

document.getElementById('confirmModal').onclick = (e) => {
    if (e.target.id === 'confirmModal') {
        closeDeleteAllModal();
    }
};

document.getElementById('addSchemeModal').onclick = (e) => {
    if (e.target.id === 'addSchemeModal') {
        closeAddSchemeModal();
    }
};

document.getElementById('deleteSchemeModal').onclick = (e) => {
    if (e.target.id === 'deleteSchemeModal') {
        closeDeleteSchemeModal();
    }
};

loadState();
