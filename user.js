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
const _GAMBA_MY_POINTS_KEY = 'gamba_my_points';
const _GAMBA_THEIR_POINTS_KEY = 'gamba_their_points';
const _GAMBA_POT_KEY = 'gamba_pot';

const _GAMBA_DEFAULT_ANTE = 50;
const _GAMBA_DEFAULT_MAX_BET = 300;
const _GAMBA_DEFAULT_POINTS = 1000;
const _GAMBA_DEFAULT_POT = 0; // TODO: fix this logic

// Whose turn logic
const _GAMBA_WHOSE_TURN_KEY = '_gamba_whose_turn';
const _GAMBA_DEFAULT_WHOSE_TURN = 'mine';

let _GAMBA_WHOSE_TURN = (function() {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_WHOSE_TURN_KEY);
    return val !== null ? val : _GAMBA_DEFAULT_WHOSE_TURN;
})();

const getGambaWhoseTurn = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_WHOSE_TURN_KEY);
    return val !== null ? val : _GAMBA_DEFAULT_WHOSE_TURN;
};

const setGambaWhoseTurn = (val) => {
    THE_WINDOW.localStorage.setItem(_GAMBA_WHOSE_TURN_KEY, val);
    _GAMBA_WHOSE_TURN = val;
};

const isMyTurn = () => {
    const turn = THE_WINDOW.localStorage.getItem(_GAMBA_WHOSE_TURN_KEY);
    return (turn !== null ? turn : _GAMBA_DEFAULT_WHOSE_TURN) === 'mine';
};

// ------------------------------------------------------------------------------------------------------------------------------





// localStorage getters and setters. ============================================================================================
const _GAMBA_MY_BET_KEY = 'gamba_my_bet';
const _GAMBA_their_BET_KEY = 'gamba_their_bet';

const _GAMBA_DEFAULT_MY_BET = 0;
const _GAMBA_DEFAULT_their_BET = 0;

const getGambaMyBet = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_MY_BET_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_MY_BET;
};

const setGambaMyBet = (val) => {
    THE_WINDOW.localStorage.setItem(_GAMBA_MY_BET_KEY, String(val));
};

const getGambTheirBet = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_their_BET_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_their_BET;
};

const setGambTheirBet = (val) => {
    THE_WINDOW.localStorage.setItem(_GAMBA_their_BET_KEY, String(val));
};

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

const getGambaMyPoints = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_MY_POINTS_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_POINTS;
};

const setGambaMyPoints = (val) => {
    THE_WINDOW.localStorage.setItem(_GAMBA_MY_POINTS_KEY, String(val));
};

const getGambTheirPoints = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_THEIR_POINTS_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_POINTS;
};

const setGambTheirPoints = (val) => { // Note: this will only change it for you. The same code is running on other clients.
    THE_WINDOW.localStorage.setItem(_GAMBA_THEIR_POINTS_KEY, String(val));
};

// ------------------------------------------------------------------------------------------------------------------------------





// Globals, which will be used to store the state for this session (will get reloaded from localStorage on page load). ==========

_GAMBA_ANTE = getGambaAnte();
_GAMBA_MAX_BET = getGambaMaxBet();
_GAMBA_MY_POINTS = getGambaMyPoints();
_GAMBA_their_POINTS  = getGambTheirPoints();
_GAMBA_POT = getGambaPot();
_GAMBA_MY_BET = getGambaMyBet();
_GAMBA_their_BET = getGambTheirBet();
_GAMBA_WHOSE_TURN = getGambaWhoseTurn();

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

const getChatInput = () => {
    return document.querySelector('input[class^="chat-input_textInput__fb1xt"]');
};

const getRoundStartingWrapper = () => {
    return document.querySelector(`div[class^="round-starting_wrapper__"]`);
};

const getNextRoundButton = () => { // Used to detect when the inter-round screen is active, for each screen that the players will see in different roles. TODO: add game master
    const selectors = [
        `button[data-qa="play-again-button"]`, // Player, in control of game.
        `div[class^="waiting-message_roundStatusMessage__"]`, // Player, not in control of game.
    ];
    return _tryMultiple(selectors);
};

const getPlayAgainButton = () => {
    return document.querySelector(``);
};

const sendChat = (text) => {
    setTimeout(() => {
        const chatInput = getChatInput();
        chatInput.value = text;
        chatInput.focus();
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
        chatInput.dispatchEvent(enterEvent);
    }, 100);
};

const getChatLog = () => {
    return document.querySelector('div[class^="chat-log_scrollContainer__"]');
};

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




// User action menu =============================================================================================================
const _onKnock = (evt) => {
    const btn = evt.currentTarget;
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 120);
    sendChat('knock');
    console.log('Knock button clicked');
};

// Create draggable Gamba menu
let _GAMBA_MENU, _GAMBA_MENU_DRAGGING = false, _GAMBA_MENU_DRAGGING_OFFSET_X, _GAMBA_MENU_DRAGGING_OFFSET_Y;

const _onCall = (evt) => {
    const btn = evt.currentTarget;
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 120);
    const theirBet = getGambTheirBet();
    const myBet = getGambaMyBet();
    const myPoints = getGambaMyPoints();
    let diff = theirBet - myBet;
    if (diff <= 0) return;
    let toAdd = Math.min(diff, myPoints);
    setGambaMyBet(myBet + toAdd);
    setGambaPoints(myPoints - toAdd);
    const newPot = getGambaPot() + toAdd;
    setGambaPot(newPot);
    THE_WINDOW.updateGambaPotDisplay();
    THE_WINDOW.updateGambaMyBetDisplay();
    THE_WINDOW.updateGambTheirBetDisplay();
    THE_WINDOW.updateGambaPointsDisplay();
    sendChat('call');
};
const _onAnte = (evt) => {
    const btn = evt.currentTarget;
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 120);
    const anteAmount = _GAMBA_DEFAULT_ANTE;
    let myPoints = getGambaMyPoints();
    let actualAnte = Math.min(anteAmount, myPoints);
    setGambaMyPoints(myPoints - actualAnte);
    const newPot = getGambaPot() + actualAnte;
    setGambaPot(newPot);
    THE_WINDOW.updateGambaPointsDisplay();
    THE_WINDOW.updateGambaPotDisplay();
    sendChat(`ante ${actualAnte}`);
};
const _onRaise = (evt) => {
    const btn = evt.currentTarget;
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 120);

    const oldDiv = document.getElementById('gamba-raise-input-row');
    if (oldDiv) oldDiv.remove();

    const btnRow2 = document.getElementById('gamba-menu-buttons-row2');

    const raiseDiv = document.createElement('div');
    raiseDiv.id = 'gamba-raise-input-row';
    raiseDiv.style.display = 'flex';
    raiseDiv.style.gap = '8px';
    raiseDiv.style.marginTop = '8px';

    const input = document.createElement('input');
    input.id = 'gamba-raise-input';
    input.type = 'number';
    input.min = '1';
    input.placeholder = 'Raise by';
    input.style.width = '80px';
    raiseDiv.appendChild(input);

    const checkBtn = document.createElement('button');
    checkBtn.id = 'gamba-raise-check-btn';
    checkBtn.classList.add('gamba-raise-button');
    checkBtn.innerHTML = '&#x2713';
    checkBtn.style.background = 'gray';
    checkBtn.style.color = 'white';
    checkBtn.style.border = 'none';
    checkBtn.style.padding = '4px 10px';
    checkBtn.style.borderRadius = '4px';
    checkBtn.disabled = true;
    raiseDiv.appendChild(checkBtn);

    const xBtn = document.createElement('button');
    xBtn.id = 'gamba-raise-cancel-btn';
    xBtn.classList.add('gamba-raise-button');
    xBtn.innerHTML = '&#10006';
    xBtn.style.background = 'red';
    xBtn.style.color = 'white';
    xBtn.style.border = 'none';
    xBtn.style.padding = '4px 10px';
    xBtn.style.borderRadius = '4px';
    xBtn.onclick = () => {
        raiseDiv.remove();
    };
    raiseDiv.appendChild(xBtn);

    input.addEventListener('input', () => {
        const val = parseInt(input.value, 10);
    const myPoints = getGambaMyPoints();
    const myBet = getGambaMyBet();
    const maxBet = getGambaMaxBet();
    const maxRaise = Math.min(myPoints, maxBet - myBet);
    checkBtn.disabled = isNaN(val) || val < 1 || val > maxRaise;
    checkBtn.style.background = checkBtn.disabled ? 'gray' : 'green';
    });

    checkBtn.onclick = () => {
        const val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) return;
    let myPoints = getGambaMyPoints();
    let myBet = getGambaMyBet();
    let maxBet = getGambaMaxBet();
    let raiseAmount = Math.min(val, myPoints, maxBet - myBet);
    setGambaMyPoints(myPoints - raiseAmount);
    setGambaMyBet(myBet + raiseAmount);
    const newPot = getGambaPot() + raiseAmount;
    setGambaPot(newPot);
    THE_WINDOW.updateGambaPointsDisplay();
    THE_WINDOW.updateGambaMyBetDisplay();
    THE_WINDOW.updateGambaPotDisplay();
    sendChat(`raise ${raiseAmount}`);
    raiseDiv.remove();
    };

    btnRow2.parentNode.insertBefore(raiseDiv, btnRow2.nextSibling);
};

const _onFold = (evt) => {
    const btn = evt.currentTarget;
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 120);
    sendChat('fold');
};

const createGambaMenu = () => {
    if (document.getElementById('gamba-menu')) return;
    _GAMBA_MENU = document.createElement('div');
    _GAMBA_MENU.id = 'gamba-menu';

    const titleDiv = document.createElement('div');
    titleDiv.id = 'gamba-menu-title';
    titleDiv.textContent = 'Geo Gamba';
    _GAMBA_MENU.appendChild(titleDiv);

    const myPointsDiv = document.createElement('div');
    myPointsDiv.id = 'gamba-menu-my-points';
    myPointsDiv.classList.add('gamba-menu-points');
    myPointsDiv.textContent = `Me: ${_GAMBA_MY_POINTS}`;
    _GAMBA_MENU.appendChild(myPointsDiv);

    const theirPointsDiv = document.createElement('div');
    theirPointsDiv.id = 'gamba-menu-their-points';
    theirPointsDiv.classList.add('gamba-menu-points');
    theirPointsDiv.textContent = `Their Points: ${_GAMBA_their_POINTS}`;

    const pointsRow = document.createElement('div');
    pointsRow.id = 'gamba-points-row';
    pointsRow.appendChild(myPointsDiv);
    pointsRow.appendChild(theirPointsDiv);

    _GAMBA_MENU.appendChild(pointsRow);

    const btnRow1 = document.createElement('div');
    btnRow1.id = 'gamba-menu-buttons-row1';
    btnRow1.style.display = 'flex';
    btnRow1.style.gap = '8px';
    btnRow1.style.justifyContent = 'center';
    btnRow1.style.marginBottom = '6px';

    const btnRow2 = document.createElement('div');
    btnRow2.id = 'gamba-menu-buttons-row2';
    btnRow2.style.display = 'flex';
    btnRow2.style.gap = '8px';
    btnRow2.style.justifyContent = 'center';
    btnRow2.style.marginBottom = '10px';

    [
        { label: 'Ante', id: 'gamba-btn-ante', callback: _onAnte },
        { label: 'Knock', id: 'gamba-btn-knock', callback: _onKnock },
        { label: 'Call', id: 'gamba-btn-call', callback: _onCall },
    ].forEach(({ label, id, callback }) => {
        const btn = document.createElement('button');
        btn.className = 'gamba-menu-btn';
        btn.id = id;
        btn.textContent = label;
        btn.onclick = callback;
        btnRow1.appendChild(btn);
    });

    [
        { label: 'Raise', id: 'gamba-btn-raise', callback: _onRaise },
        { label: 'Fold', id: 'gamba-btn-fold', callback: _onFold },
    ].forEach(({ label, id, callback }) => {
        const btn = document.createElement('button');
        btn.className = 'gamba-menu-btn';
        btn.id = id;
        btn.textContent = label;
        btn.onclick = callback;
        btnRow2.appendChild(btn);
    });

    _GAMBA_MENU.appendChild(btnRow1);
    _GAMBA_MENU.appendChild(btnRow2);

    // Turn indicator row
    const turnRow = document.createElement('div');
    turnRow.id = 'gamba-menu-turn-row';
    turnRow.classList.add('gamba-menu-round-row');
    turnRow.style.marginBottom = '8px';
    turnRow.style.fontWeight = 'bold';
    turnRow.style.fontSize = '16px';
    _GAMBA_MENU.appendChild(turnRow);

    const updateTurnRow = () => {
        turnRow.textContent = isMyTurn() ? 'My Turn' : 'Their Turn';
    };
    setInterval(updateTurnRow, 250);
    updateTurnRow();

    const roundRow1 = document.createElement('div');
    roundRow1.id = 'gamba-menu-round-row1';
        const updateBtnRowEnabled = () => {
            const enabled = isMyTurn();
            [btnRow1, btnRow2].forEach(row => {
                Array.from(row.children).forEach(btn => {
                    btn.disabled = !enabled;
                });
            });
        };
        setInterval(updateBtnRowEnabled, 250);
        updateBtnRowEnabled();
    roundRow1.classList.add('gamba-menu-round-row');

    const roundRow2 = document.createElement('div');
    roundRow2.id = 'gamba-menu-round-row2';
    roundRow2.classList.add('gamba-menu-round-row');

    const anteDiv = document.createElement('span');
    anteDiv.id = 'gamba-menu-ante';
    anteDiv.classList.add('gamba-round-info-div');
    anteDiv.textContent = `Ante: ${_GAMBA_ANTE}`;

    const maxBetDiv = document.createElement('span');
    maxBetDiv.id = 'gamba-menu-maxbet';
    maxBetDiv.classList.add('gamba-round-info-div');
    maxBetDiv.textContent = `Max. Bet: ${_GAMBA_MAX_BET}`;

    const myBetDiv = document.createElement('span');
    myBetDiv.id = 'gamba-menu-mybet';
    myBetDiv.classList.add('gamba-round-info-div');
    myBetDiv.textContent = `My Bet: ${_GAMBA_MY_BET}`;

    const theirBetDiv = document.createElement('span');
    theirBetDiv.id = 'gamba-menu-their-bet';
    theirBetDiv.classList.add('gamba-round-info-div');
    theirBetDiv.textContent = `Their Bet: ${_GAMBA_their_BET}`;

    roundRow1.appendChild(anteDiv);
    roundRow1.appendChild(maxBetDiv);
    roundRow2.appendChild(myBetDiv);
    roundRow2.appendChild(theirBetDiv);
    _GAMBA_MENU.appendChild(roundRow1);
    _GAMBA_MENU.appendChild(roundRow2);

    const potDiv = document.createElement('div');
    potDiv.id = 'gamba-menu-pot';
    potDiv.textContent = `Pot: ${_GAMBA_POT}`;
    _GAMBA_MENU.appendChild(potDiv);

    THE_WINDOW.updateGambaPointsDisplay = () => {
        _GAMBA_MY_POINTS = getGambaMyPoints();
        myPointsDiv.textContent = `My Points: ${_GAMBA_MY_POINTS}`;
    };
    THE_WINDOW.updateGambaAnteDisplay = () => {
        _GAMBA_ANTE = getGambaAnte();
        anteDiv.textContent = `Ante: ${_GAMBA_ANTE}`;
    };
    THE_WINDOW.updateGambaMaxBetDisplay = () => {
        _GAMBA_MAX_BET = getGambaMaxBet();
        maxBetDiv.textContent = `Max. Bet: ${_GAMBA_MAX_BET}`;
    };
    THE_WINDOW.updateGambaMyBetDisplay = () => {
        _GAMBA_MY_BET = getGambaMyBet();
        myBetDiv.textContent = `My Bet: ${_GAMBA_MY_BET}`;
    };
    THE_WINDOW.updateGambTheirBetDisplay = () => {
        _GAMBA_their_BET = getGambTheirBet();
        theirBetDiv.textContent = `Their Bet: ${_GAMBA_their_BET}`;
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





// Round events and watchers, done by watching DOM elements appear and disappear. ===============================================

let _ROUND_STARTING_WRAPPER = null;

const onRoundStart = () => {
    debugger;
};

const watchRoundEnd = () => {
    const prepNewRound = () => {
        const roundStartingWrapper = getRoundStartingWrapper();
        if (roundStartingWrapper) {
            _ROUND_STARTING_WRAPPER = roundStartingWrapper;
        } else if (_ROUND_STARTING_WRAPPER) {
            _ROUND_STARTING_WRAPPER = null; // Wrapper disappeared, new round starting.
            onRoundStart();
        }
    };

    const onEndGame = () => {
        console.log('onEndGame');
    };

    const observer = new MutationObserver(() => {
        onEndGame();
        prepNewRound();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
watchRoundEnd();

// ------------------------------------------------------------------------------------------------------------------------------





// Styling ======================================================================================================================

const _STYLING = `
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
        font-size: 24px !important;
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
    #gamba-points-row {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%; 
    }
    .gamba-menu-points {
        color: #ffd700;
        font-weight: bold;
        margin-bottom: 0;
        text-align: center;
        width: 100%;
        font-size: 18px;
        margin-bottom: 18px;
        color: #80e77d;
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
        width: 72px;
    }
    .gamba-menu-btn:active {
        transform: scale(0.95);
        box-shadow: 0 0 0 2px #fff2 inset;
    }
    #gamba-btn-ante {
        background: #beb80c;
    }
    #gamba-btn-ante:hover {
        background: #a49f09;
    }
    #gamba-btn-knock {
        background: #963edfff;
    }
    #gamba-btn-knock:hover {
        background: #702ea7ff;
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
    #gamba-raise-input-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        color: white;
        font-size: 12px;
        margin: 10px 0;
    }
    #gamba-raise-input {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        padding: 6px 12px;
        color: white;
        font-size: 12px;
        width: 120px;
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input[type=number] {
        -moz-appearance: textfield;
    }
    .gamba-raise-button {
        color: #fff;
        cursor: pointer;
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
    .gamba-menu-round-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        margin-bottom: 2px;
        color: white;
        font-size: 12px;
    }
    .gamba-round-info-div {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        color: white;
        font-size: 12px;
        width: 100px;
    }
`;

GM_addStyle(_STYLING);

// ------------------------------------------------------------------------------------------------------------------------------

const clearState = () => {
    setGambaAnte(_GAMBA_DEFAULT_ANTE);
    setGambaWhoseTurn(_GAMBA_DEFAULT_WHOSE_TURN);
    setGambaMyPoints(_GAMBA_DEFAULT_POINTS);
    setGambTheirPoints(_GAMBA_DEFAULT_POINTS);
    setGambaMaxBet(_GAMBA_DEFAULT_MAX_BET);
    setGambaMyBet(_GAMBA_DEFAULT_MY_BET);
    setGambTheirBet(_GAMBA_DEFAULT_their_BET);
    setGambaPot(_GAMBA_DEFAULT_POT);
};

document.addEventListener('keydown', (evt) => {
    // Nuclear option to reset if things get messed up.
    if (evt.ctrlKey && evt.shiftKey && evt.key === '>') {
        console.log('Full reset');
        clearState();
        THE_WINDOW.location.reload();
    }

    // Open debugger.
    if (evt.ctrlKey && evt.shiftKey && evt.key === '<') {
        debugger
    }
});