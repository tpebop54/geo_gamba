// ==UserScript==

// @name         Tpebop's GeoGuessr Mods (1.0.0)
// @description  Various mods to make the game interesting in various ways
// @version      1.0.0
// @author       tpebop
// @match        *://*.geoguessr.com/*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM.xmlHttpRequest
// @updateURL    https://raw.githubusercontent.com/tpebop54/geo_gamba/refs/heads/dev/user.js
// @downloadURL  https://raw.githubusercontent.com/tpebop54/geo_gamba/refs/heads/dev/user.js

// ==/UserScript==

// ENDPOINTS
// user - https://www.geoguessr.com/api/v3/users/68a233b3ed46b5cdaa0eba41
// live-challenge - https://game-server.geoguessr.com/api/live-challenge/40d4df74-bfe3-4f5b-93a4-0099ee427d3b
// maps - https://www.geoguessr.com/api/maps/world




const THE_WINDOW = unsafeWindow || window;


// Global state, which may be pulled from localStorage or will use defaults if not. =============================================
// localStorage holds the master values, and needs to stay in sync with other players and the game master.

const _GAMBA_ANTE_KEY = 'gamba_ante';
const _GAMBA_MAX_BET_KEY = 'gamba_max_bet';
const _GAMBA_POINTS_KEY = 'gamba_my_points';
const _GAMBA_POT_KEY = 'gamba_pot';

const _GAMBA_DEFAULT_ANTE = 50;
const _GAMBA_DEFAULT_MAX_BET = 300;
const _GAMBA_DEFAULT_POINTS = 1000;
const _GAMBA_DEFAULT_POT = 0; // TODO: fix this logic

// ------------------------------------------------------------------------------------------------------------------------------





// localStorage getters and setters. ============================================================================================

const getGambaPot = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_POT_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_POT;
};

const setGambaPot = (val) => {
    THE_WINDOW.localStorage.setItem(_GAMBA_POT_KEY, String(val));
    _GAMBA_POT = val;
};

const getGambaMaxBet = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_MAX_BET_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_MAX_BET;
};

const setGambaMaxBet = (val) => {
    THE_WINDOW.localStorage.setItem(_GAMBA_MAX_BET_KEY, String(val));
};

const getGambaAnte = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_ANTE_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_ANTE;
};

const setGambaAnte = (val) => {
    THE_WINDOW.localStorage.setItem(_GAMBA_ANTE_KEY, String(val));
};

const getGambaPoints = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_POINTS_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_POINTS;
};

const setGambaPoints = (val) => {
    THE_WINDOW.localStorage.setItem(_GAMBA_POINTS_KEY, String(val));
};

// ------------------------------------------------------------------------------------------------------------------------------





// Globals, which will be used to store the state for this session (will get reloaded from localStorage on page load). ==========

_GAMBA_ANTE = getGambaAnte();
_GAMBA_MAX_BET = getGambaMaxBet();
_GAMBA_POINTS = getGambaPoints();
_GAMBA_POT = getGambaPot();

// ------------------------------------------------------------------------------------------------------------------------------





// DOM utils ====================================================================================================================

const _tryMultiple = (selectors) => { // Different modes, different versions, GeoGuessr changing around stuff, etc.
    let element;
    for (const selector of selectors) {
        element = document.querySelector(selector);
        if (element) {
            return element;
        }
    }
    return null;
};

const getChatInput = () => document.querySelector('input[class^="chat-input_textInput__fb1xt"]');

const sendChat = (text) => {
    const chatInput = getChatInput();
    chatInput.value = text;
    chatInput.focus();
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
    chatInput.dispatchEvent(enterEvent);
};

const getChatLog = () => document.querySelector('div[class^="chat-log_scrollContainer__"]');

// ------------------------------------------------------------------------------------------------------------------------------------



// Player and game master info ========================================================================================================

const getUserInfo = async (userId) => {
    try {
        const response = await fetch(`https://www.geoguessr.com/api/v3/users/${userId}`);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error(err);
        return null;
    }
};

const usersFromLiveChallenge = async (data) => {
    const users = [];
    for (const userId of data.playerIds) {
        const user = await getUserInfo(userId);
        users.push({
            id: userId,
            name: user.nick,
        });
    }
    return users;
};

const fetchMatchData = async () => {
    const parts = location.pathname.split('/');
    const duelType = parts[parts.length - 2];
    const duelId = parts[parts.length - 1];
    const resp = await fetch(
        `https://game-server.geoguessr.com/api/${duelType}/${duelId}`,
        { method: 'GET', credentials: 'include' },
    );
    const data = await resp.json();
    return data;
};

const PLAYER_ACTIONS = {
    call: ['call'],
    fold: ['fold'],
    raise: ['raise'],
    allin: ['allin', 'all in', 'all-in'],
};

const GAME_MASTER_ACTIONS = {
    ante: ['ante'],
    max: ['max', 'maximum'],
    blink: ['blink'],
};

const parseChatMessage = (msg) => {
    const username = msg.querySelector('span[class^="chat-message_nick__"]').innerText.toLowerCase();
    const text = msg.querySelector('span[class^="chat-message_messageText__"]').innerText.toLowerCase();
    const parts = text.split(' ').map(part => part.trim()).filter(part => part.length > 0);
    return { username, text, parts };
};

const getChats = () => {
    const chatLog = getChatLog();
    if (!chatLog) {
        return [];
    }
    const msgElements = chatLog.querySelectorAll('div[class^="chat-message_normalMessageRoot__"');

    const chats = [];
    for (const element of msgElements) {
        const chat = parseChatMessage(element);
        chats.push(chat);
    }
    return chats
};

const setupGlobalKeyBindings = () => {
    document.addEventListener('keydown', (evt) => {
        if (evt.ctrlKey && evt.shiftKey && evt.key === '<') {
            (() => { debugger; })();
        }
    });
};

// ------------------------------------------------------------------------------------------------------------------------------




// Gamba gameplay ===============================================================================================================

let _GAMBA_USERS = null;
let _GAMBA_MATCH_DATA = null;
let _GAMBA_CHATS = null;
let _GAMBA_CHAT_LOG = null;
let _GAMBA_CHAT_LAST_READ = -Infinity;

const initGamba = async () => {
    setupGlobalKeyBindings();

    _GAMBA_MATCH_DATA = await fetchMatchData();
    console.log(_GAMBA_MATCH_DATA);

    _GAMBA_USERS = await usersFromLiveChallenge(_GAMBA_MATCH_DATA);
    console.log(_GAMBA_USERS);

    _GAMBA_CHATS = getChats();
    console.log(_GAMBA_CHATS);

    const readChat = () => {
        if (!_GAMBA_CHAT_LOG) {
            _GAMBA_CHAT_LOG = getChatLog();
            if (!_GAMBA_CHAT_LOG) {
                return;
            }
        }
        if (Date.now() - _GAMBA_CHAT_LAST_READ > 250) {
            _GAMBA_CHAT_LAST_READ = Date.now();
        } else {
            return;
        }
        if (_GAMBA_CHAT_LOG) {
            _GAMBA_CHATS = getChats();
            console.log(_GAMBA_CHATS);
        }
    };

    const observer = new MutationObserver(readChat);
    observer.observe(document.body, { childList: true, subtree: true });
};

if (document.readyState !== 'loading') {
    initGamba();
} else {
    document.addEventListener('DOMContentLoaded', async () => {
        initGamba();
    });
}

// ------------------------------------------------------------------------------------------------------------------------------




// Styling ======================================================================================================================

const STYLING = `
    #gamba-menu {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 9999;
        background: rgba(30, 30, 30, 0.95);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        padding: 12px 16px 12px 16px;
        min-width: 220px;
        user-select: none;
        cursor: grab;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    #gamba-menu.grabbing {
        cursor: grabbing !important;
    }
    #gamba-menu-title {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 10px;
        color: #fff;
        cursor: inherit;
        text-align: center;
        width: 100%;
    }
    #gamba-menu-buttons {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 10px;
    }
    .gamba-menu-btn {
        border: none;
        border-radius: 4px;
        padding: 6px 14px;
        font-size: 15px;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s;
        color: #fff;
        outline: none;
    }
    .gamba-menu-btn:active {
        transform: scale(0.95);
        box-shadow: 0 0 0 2px #fff2 inset;
    }
    #gamba-btn-call {
        background: #1976d2;
    }
    #gamba-btn-call:hover {
        background: #1565c0;
    }
    #gamba-btn-raise {
        background: #43a047;
    }
    #gamba-btn-raise:hover {
        background: #388e3c;
    }
    #gamba-btn-fold {
        background: #e53935;
    }
    #gamba-btn-fold:hover {
        background: #b71c1c;
    }
    #gamba-btn-allin {
        background: #ffd700;
        color: #222;
    }
    #gamba-btn-allin:hover {
        background: #ffe066;
        color: #222;
    }
    #gamba-menu-points {
        color: #ffd700;
        font-weight: bold;
        margin-bottom: 0;
        text-align: center;
        width: 100%;
    }
    #gamba-menu-pot {
        color: #fff;
        font-weight: bold;
        font-size: 18px;
        margin-top: 10px;
        margin-bottom: 4px;
        border: 2px solid #ffd700;
        border-radius: 6px;
        padding: 6px 18px;
        background: rgba(30,30,30,0.85);
        text-align: center;
    }
    #gamba-menu-ante-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        margin-bottom: 2px;
    }
    #gamba-menu-ante, #gamba-menu-maxbet {
        color: #fff;
        font-size: 13px;
    }
`;

GM_addStyle(STYLING);

// ------------------------------------------------------------------------------------------------------------------------------




// User action menu =============================================================================================================

// Create draggable Gamba menu
let _GAMBA_MENU, _GAMBA_MENU_DRAGGING = false, _GAMBA_MENU_DRAGGING_OFFSET_X, _GAMBA_MENU_DRAGGING_OFFSET_Y;

const createGambaMenu = () => {
    if (document.getElementById('gamba-menu')) return;
    _GAMBA_MENU = document.createElement('div');
    _GAMBA_MENU.id = 'gamba-menu';

    const titleDiv = document.createElement('div');
    titleDiv.id = 'gamba-menu-title';
    titleDiv.textContent = 'Geo Gamba';
    _GAMBA_MENU.appendChild(titleDiv);

    const pointsDiv = document.createElement('div');
    pointsDiv.id = 'gamba-menu-points';
    pointsDiv.textContent = `Your Points: ${_GAMBA_POINTS}`;
    _GAMBA_MENU.appendChild(pointsDiv);

    const btnRow = document.createElement('div');
    btnRow.id = 'gamba-menu-buttons';

    // Unique callbacks for each button
    const onCallClick = (evt) => {
        const btn = evt.currentTarget;
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 120);
        console.log('Call button clicked');
        // Add custom logic here
    };
    const onRaiseClick = (evt) => {
        const btn = evt.currentTarget;
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 120);
        console.log('Raise button clicked');
        // Add custom logic here
    };
    const onFoldClick = (evt) => {
        const btn = evt.currentTarget;
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 120);
        console.log('Fold button clicked');
        // Add custom logic here
    };
    const onAllInClick = (evt) => {
        const btn = evt.currentTarget;
        btn.classList.add('clicked');
        setTimeout(() => btn.classList.remove('clicked'), 120);
        console.log('All-in button clicked');
        // Add custom logic here
    };

    const actions = [
        { label: 'Call', id: 'gamba-btn-call', callback: onCallClick },
        { label: 'Raise', id: 'gamba-btn-raise', callback: onRaiseClick },
        { label: 'Fold', id: 'gamba-btn-fold', callback: onFoldClick },
        { label: 'All-in', id: 'gamba-btn-allin', callback: onAllInClick }
    ];
    actions.forEach(({ label, id, callback }) => {
        const btn = document.createElement('button');
        btn.className = 'gamba-menu-btn';
        btn.id = id;
        btn.textContent = label;
        btn.onclick = callback;
        btnRow.appendChild(btn);
    });
    _GAMBA_MENU.appendChild(btnRow);

    const anteRowDiv = document.createElement('div');
    anteRowDiv.id = 'gamba-menu-ante-row';

    const anteDiv = document.createElement('span');
    anteDiv.id = 'gamba-menu-ante';
    anteDiv.textContent = `Ante: ${_GAMBA_ANTE}`;

    const maxBetDiv = document.createElement('span');
    maxBetDiv.id = 'gamba-menu-maxbet';
    maxBetDiv.textContent = `Max. Bet: ${_GAMBA_MAX_BET}`;

    anteRowDiv.appendChild(anteDiv);
    anteRowDiv.appendChild(maxBetDiv);
    _GAMBA_MENU.appendChild(anteRowDiv);

    const potDiv = document.createElement('div');
    potDiv.id = 'gamba-menu-pot';
    potDiv.textContent = `Pot: ${_GAMBA_POT}`;
    _GAMBA_MENU.appendChild(potDiv);

    THE_WINDOW.updateGambaPointsDisplay = () => {
        _GAMBA_POINTS = getGambaPoints();
        pointsDiv.textContent = `Your Points: ${_GAMBA_POINTS}`;
    };
    THE_WINDOW.updateGambaAnteDisplay = () => {
        _GAMBA_ANTE = getGambaAnte();
        anteDiv.textContent = `Ante: ${_GAMBA_ANTE}`;
    };
    THE_WINDOW.updateGambaMaxBetDisplay = () => {
        _GAMBA_MAX_BET = getGambaMaxBet();
        maxBetDiv.textContent = `Max. Bet: ${_GAMBA_MAX_BET}`;
    };
    THE_WINDOW.updateGambaPotDisplay = () => {
        _GAMBA_POT = getGambaPot();
        potDiv.textContent = `Pot: ${_GAMBA_POT}`;
    };
    THE_WINDOW.setPot = setGambaPot;

    document.body.appendChild(_GAMBA_MENU);

    _GAMBA_MENU.addEventListener('mousedown', (evt) => {
        if (evt.button !== 0 || evt.target.classList.contains('gamba-menu-btn')) return;
        _GAMBA_MENU_DRAGGING = true;
        _GAMBA_MENU.classList.add('grabbing');
        _GAMBA_MENU_DRAGGING_OFFSET_X = evt.clientX - _GAMBA_MENU.offsetLeft;
        _GAMBA_MENU_DRAGGING_OFFSET_Y = evt.clientY - _GAMBA_MENU.offsetTop;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (evt) => {
        if (_GAMBA_MENU_DRAGGING) {
            _GAMBA_MENU.style.left = (evt.clientX - _GAMBA_MENU_DRAGGING_OFFSET_X) + 'px';
            _GAMBA_MENU.style.top = (evt.clientY - _GAMBA_MENU_DRAGGING_OFFSET_Y) + 'px';
        }
    });
    document.addEventListener('mouseup', () => {
        if (_GAMBA_MENU_DRAGGING) {
            _GAMBA_MENU_DRAGGING = false;
            _GAMBA_MENU.classList.remove('grabbing');
            _GAMBA_MENU_DRAGGING_OFFSET_X = undefined;
            _GAMBA_MENU_DRAGGING_OFFSET_Y = undefined;
            document.body.style.userSelect = '';
        }
    });
};

if (document.readyState !== 'loading') {
        createGambaMenu();
} else {
        document.addEventListener('DOMContentLoaded', createGambaMenu);
}

// ------------------------------------------------------------------------------------------------------------------------------
