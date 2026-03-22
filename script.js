const DOM = {
    startSequence: document.getElementById('startSequence'),
    minLength: document.getElementById('minLength'),
    maxLength: document.getElementById('maxLength'),
    count: document.getElementById('count'),
    results: document.getElementById('results'),
    bookmarksList: document.getElementById('bookmarksList'),
    bookmarkCount: document.getElementById('bookmarkCount')
};

let state = {
    generated: [],
    bookmarks: []
};

function loadState() {
    const saved = localStorage.getItem('data');
    if (saved) {
        state = JSON.parse(saved);
        DOM.startSequence.value = state.startSequence || '';
        DOM.minLength.value = state.minLength || 5;
        DOM.maxLength.value = state.maxLength || 10;
        DOM.count.value = state.count || 10;
        renderNames();
        renderBookmarks();
    }
}

function saveState() {
    const dataToSave = {
        ...state,
        startSequence: DOM.startSequence.value,
        minLength: DOM.minLength.value,
        maxLength: DOM.maxLength.value,
        count: DOM.count.value
    };
    localStorage.setItem('data', JSON.stringify(dataToSave));
}

function toggleBookmarks() {
    const list = DOM.bookmarksList;
    const chev = document.getElementById('chevron');
    list.classList.toggle('active');
    chev.textContent = list.classList.contains('active') ? '▲' : '▼';
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

document.getElementById('generateBtn').onclick = () => {
    let min = parseInt(DOM.minLength.value) || 1;
    let max = parseInt(DOM.maxLength.value) || 1;
    const count = parseInt(DOM.count.value) || 1;
    const prefix = DOM.startSequence.value.trim();

    if (min > max) [min, max] = [max, min];

    state.generated = [];
    const alphabet = "abcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < count; i++) {
        const targetLen = Math.max(prefix.length, Math.floor(Math.random() * (max - min + 1)) + min);

        let word = prefix;
        while (word.length < targetLen) {
            word += alphabet[Math.floor(Math.random() * alphabet.length)];
        }

        state.generated.push(word);
    }
    renderNames();
    saveState();
};

[DOM.startSequence, DOM.minLength, DOM.maxLength, DOM.count].forEach(el => {
    el.oninput = saveState;
});

loadState();
