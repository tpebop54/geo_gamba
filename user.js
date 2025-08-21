// ==UserScript==
// @name         Tpebop's GeoGuessr Mods (DEV 1.2.3)
// @description  Various mods to make the game interesting in various ways
// @version      1.2.3
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


console.log('GEO GAMBAAAAA');


// TODO
// - Detect round start via mutation observer, optionally? block additional bets
// - Automatically send the ante via chat
// - Pot display and total points on round and end-of-round screens
// - Action display (call, fold, raise, all-in)
// - Pop up input for raise
// - Chat history erases on page refresh, need to send to localStorage



// ENDPOINTS
// user - https://www.geoguessr.com/api/v3/users/68a233b3ed46b5cdaa0eba41
// live-challenge - https://game-server.geoguessr.com/api/live-challenge/40d4df74-bfe3-4f5b-93a4-0099ee427d3b
// maps - https://www.geoguessr.com/api/maps/world



// DOM utils =========================================================================================================================

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

const getChatInput = () => {
    return document.querySelector('input[class^="chat-input_textInput__fb1xt"]');
};

const sendChat = (text) => {
    const chatInput = getChatInput();
    chatInput.value = text;
    chatInput.focus();
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
    chatInput.dispatchEvent(enterEvent);
};

const getChatLog = () => {
    return document.querySelector('div[class^="chat-log_scrollContainer__"]');
};

// ------------------------------------------------------------------------------------------------------------------------------------

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
            () => {
                debugger;
            };
        }
    });
};

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
        align-items: flex-start;
    }
    #gamba-menu-title {
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 10px;
        color: #fff;
        cursor: grab;
    }
    #gamba-menu-buttons {
        display: flex;
        gap: 8px;
    }
    .gamba-menu-btn {
        background: #222;
        color: #fff;
        border: none;
        border-radius: 4px;
        padding: 6px 14px;
        font-size: 15px;
        cursor: pointer;
        transition: background 0.2s;
    }
    .gamba-menu-btn:hover {
        background: #444;
    }
`;

GM_addStyle(STYLING);

// Create draggable Gamba menu
let _GAMBA_MENU, _GAMBA_MENU_DRAGGING = false, _GAMBA_MENU_DRAGGING_OFFSET_X, _GAMBA_MENU_DRAGGING_OFFSET_Y;

function createGambaMenu() {
        if (document.getElementById('gamba-menu')) return;
        _GAMBA_MENU = document.createElement('div');
        _GAMBA_MENU.id = 'gamba-menu';

        const titleDiv = document.createElement('div');
        titleDiv.id = 'gamba-menu-title';
        titleDiv.textContent = 'Gamba Actions';
        _GAMBA_MENU.appendChild(titleDiv);

        const btnRow = document.createElement('div');
        btnRow.id = 'gamba-menu-buttons';

        const actions = [
                { label: 'Call', value: 'call' },
                { label: 'Raise', value: 'raise' },
                { label: 'Fold', value: 'fold' },
                { label: 'All-in', value: 'all-in' }
        ];
        actions.forEach(({ label, value }) => {
                const btn = document.createElement('button');
                btn.className = 'gamba-menu-btn';
                btn.textContent = label;
                btn.onclick = () => {
                        // You can hook up your action logic here
                        sendChat(label);
                };
                btnRow.appendChild(btn);
        });
        _GAMBA_MENU.appendChild(btnRow);

        document.body.appendChild(_GAMBA_MENU);

        // Drag logic
        titleDiv.addEventListener('mousedown', (evt) => {
                _GAMBA_MENU_DRAGGING = true;
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
                        _GAMBA_MENU_DRAGGING_OFFSET_X = undefined;
                        _GAMBA_MENU_DRAGGING_OFFSET_Y = undefined;
                        document.body.style.userSelect = '';
                }
        });
}

if (document.readyState !== 'loading') {
        createGambaMenu();
} else {
        document.addEventListener('DOMContentLoaded', createGambaMenu);
}
