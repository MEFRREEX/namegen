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

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

let state = {
    generated: [],
    bookmarks: [],
    caseMode: 'lowercase'
};

function loadState() {
    const saved = localStorage.getItem('data');
    if (saved) {
        state = JSON.parse(saved);
        DOM.startSequence.value = state.startSequence || '';
        DOM.minLength.value = state.minLength || 5;
        DOM.maxLength.value = state.maxLength || 10;
        DOM.count.value = state.count || 10;
        DOM.caseMode.value = state.caseMode || 'lowercase';
        renderNames();
        renderBookmarks();
    }
    initDropdown();
}

function saveState() {
    const dataToSave = {
        ...state,
        startSequence: DOM.startSequence.value,
        minLength: DOM.minLength.value,
        maxLength: DOM.maxLength.value,
        count: DOM.count.value,
        caseMode: DOM.caseMode.value
    };
    localStorage.setItem('data', JSON.stringify(dataToSave));
}

function toggleBookmarks() {
    const list = DOM.bookmarksList;
    const chev = document.getElementById('chevron');
    list.classList.toggle('active');
    chev.textContent = list.classList.contains('active') ? '▲' : '▼';
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

function generateNames(prefix, min, max, count, caseMode) {
    const names = [];
    for (let i = 0; i < count; i++) {
        const targetLen = Math.max(prefix.length, Math.floor(Math.random() * (max - min + 1)) + min);
        let word = prefix;
        while (word.length < targetLen) {
            word += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
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

    state.generated = generateNames(prefix, min, max, count, caseMode);
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

    state.generated = generateNames('', 5, 10, 10, 'lowercase');
    renderNames();
    saveState();

    setTimeout(() => resetBtn.classList.remove('spinning'), 500);
};

loadState();
