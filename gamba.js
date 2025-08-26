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

const _GAMBA_WHOSE_TURN_KEY = 'gamba_whose_turn';
const _GAMBA_MY_STACK_KEY = 'gamba_my_stack';
const _GAMBA_THEIR_STACK_KEY = 'gamba_their_stack';
const _GAMBA_ANTE_KEY = 'gamba_ante';
const _GAMBA_MAX_STAKE_KEY = 'gamba_max_stake';
const _GAMBA_MY_STAKE_KEY = 'gamba_my_stake';
const _GAMBA_THEIR_STAKE_KEY = 'gamba_their_stake';
const _GAMBA_POT_KEY = 'gamba_pot';

const _GAMBA_DEFAULT_WHOSE_TURN = 'mine';
const _GAMBA_DEFAULT_ANTE = 50;
const _GAMBA_DEFAULT_STACK = 1000;
const _GAMBA_DEFAULT_STAKE = _GAMBA_DEFAULT_ANTE * 2; // TODO: revisit (team gamba)
const _GAMBA_DEFAULT_MAX_STAKE = 300;
const _GAMBA_DEFAULT_POT = 0;

// ------------------------------------------------------------------------------------------------------------------------------




// localStorage getters and setters. ============================================================================================

const _GAMBA_DEFAULT_MY_STAKE = 0;
const _GAMBA_DEFAULT_THEIR_STAKE = 0;

const getGambaMyStake = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_MY_STAKE_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_MY_STAKE;
};

const setGambaMyStake = (val) => {
    val = parseInt(Number(val));
    THE_WINDOW.localStorage.setItem(_GAMBA_MY_STAKE_KEY, val);
    _GAMBA_MY_STAKE = val;
};

const getGambaTheirStake = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_THEIR_STAKE_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_THEIR_STAKE;
};

const setGambaTheirStake = (val) => {
    val = parseInt(Number(val));
    THE_WINDOW.localStorage.setItem(_GAMBA_THEIR_STAKE_KEY, val);
    _GAMBA_THEIR_STAKE = val;
};

const getGambaPot = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_POT_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_POT;
};

const setGambaPot = (val) => {
    val = parseInt(Number(val));
    THE_WINDOW.localStorage.setItem(_GAMBA_POT_KEY, val);
    _GAMBA_POT = val;
};

const getGambaMaxStake = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_MAX_STAKE_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_MAX_STAKE;
};

const setGambaMaxStake = (val) => {
    val = parseInt(Number(val));
    THE_WINDOW.localStorage.setItem(_GAMBA_MAX_STAKE_KEY, val);
    _GAMBA_MAX_STAKE = val;
};

const getGambaAnte = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_ANTE_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_ANTE;
};

const setGambaAnte = (val) => {
    val = parseInt(Number(val));
    THE_WINDOW.localStorage.setItem(_GAMBA_ANTE_KEY, val);
    _GAMBA_ANTE = val;
};

const getGambaMyStack = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_MY_STACK_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_STACK;
};

const setGambaMyStack = (val) => {
    val = parseInt(Number(val));
    THE_WINDOW.localStorage.setItem(_GAMBA_MY_STACK_KEY, val);
    _GAMBA_MY_STACK = val;
};

const getGambaTheirStack = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_THEIR_STACK_KEY);
    return val !== null ? parseInt(val, 10) : _GAMBA_DEFAULT_STACK;
};

const setGambaTheirStack = (val) => { // Note: this will only change it for you. The same code is running on other clients.
    val = parseInt(Number(val));
    THE_WINDOW.localStorage.setItem(_GAMBA_THEIR_STACK_KEY, val);
    _GAMBA_THEIR_STACK = val;
};

const getGambaWhoseTurn = () => {
    const val = THE_WINDOW.localStorage.getItem(_GAMBA_WHOSE_TURN_KEY);
    return val !== null ? val : _GAMBA_DEFAULT_WHOSE_TURN;
};

const setGambaWhoseTurn = (val) => {
    THE_WINDOW.localStorage.setItem(_GAMBA_WHOSE_TURN_KEY, val); // String.
    _GAMBA_WHOSE_TURN = val;
};

const isMyTurn = () => {
    const turn = THE_WINDOW.localStorage.getItem(_GAMBA_WHOSE_TURN_KEY);
    return (turn !== null ? turn : _GAMBA_DEFAULT_WHOSE_TURN) === 'mine';
};

// ------------------------------------------------------------------------------------------------------------------------------




// Globals, which will be used to store the state for this session (will get reloaded from localStorage on page load). ==========

let _GAMBA_WHOSE_TURN = getGambaWhoseTurn();
let _GAMBA_ANTE = getGambaAnte();
let _GAMBA_MY_STACK = getGambaMyStack();
let _GAMBA_THEIR_STACK = getGambaTheirStack();
let _GAMBA_MAX_STAKE = getGambaMaxStake();
let _GAMBA_POT = getGambaPot();
let _GAMBA_MY_STAKE = getGambaMyStake();
let _GAMBA_THEIR_STAKE = getGambaTheirStake();

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
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    setTimeout(() => {
        const chatInput = getChatInput();

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; // Specific to React apps.
        nativeInputValueSetter.call(chatInput, text);

        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        chatInput.focus();

        setTimeout(() => {
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true,
                cancelable: true
            });
            chatInput.dispatchEvent(enterEvent);
        }, 100);
    }, 100);
};

const getChatLog = () => {
    return document.querySelector('div[class^="chat-log_scrollContainer__"]');
};

// ------------------------------------------------------------------------------------------------------------------------------------



// Game and player info ===============================================================================================================

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


// ------------------------------------------------------------------------------------------------------------------------------




// User action menu =============================================================================================================

// Create draggable Gamba menu
let _GAMBA_MENU, _GAMBA_MENU_DRAGGING = false, _GAMBA_MENU_DRAGGING_OFFSET_X, _GAMBA_MENU_DRAGGING_OFFSET_Y;

const _clickBtn = (evt) => {
    const btn = evt.currentTarget;
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 120);
    return btn;
};

const updateMine = (diff) => {
    setGambaMyStack(getGambaMyStack() + diff);
    setGambaMyStake(getGambaMyStake() - diff);
    setGambaPot(getGambaPot() - diff);
    THE_WINDOW.updateGambaMyStackDisplay();
    THE_WINDOW.updateGambaMyStakeDisplay();
    THE_WINDOW.updateGambaPotDisplay();
};

const updateTheirs = (diff) => {
    setGambaTheirStack(getGambaTheirStack() + diff);
    setGambaTheirStake(getGambaTheirStake() - diff);
    setGambaPot(getGambaPot() - diff);
    THE_WINDOW.updateGambaTheirStackDisplay();
    THE_WINDOW.updateGambaTheirStakeDisplay();
    THE_WINDOW.updateGambaPotDisplay();
};

const onAnte = (evt) => {
    _clickBtn(evt);
    const anteAmount = _GAMBA_DEFAULT_ANTE;
    let ante = Math.min(anteAmount, getGambaMyStack());
    updateMine(-ante);
    sendChat(`ante ${ante}`);
};

const onKnock = (evt) => {
    const btn = evt.currentTarget;
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 120);
    sendChat('knock');
    console.log('Knock button clicked');
};

const onCall = (evt) => {
    _clickBtn(evt);
    const theirStake = getGambaTheirStake();
    const myStake = getGambaMyStake();
    const myStack = getGambaMyStack();
    let diff = theirStake - myStake;
    if (diff <= 0) return;
    let toAdd = Math.min(diff, myStack);
    setGambaMyStake(myStake + toAdd);
    setGambaMyStack(myStack - toAdd);
    const newPot = getGambaPot() + toAdd;
    setGambaPot(newPot);
    THE_WINDOW.updateGambaMyStakeDisplay();
    THE_WINDOW.updateGambaMyStackDisplay();
    THE_WINDOW.updateGambaPotDisplay();
    sendChat('call');
};

const onRaise = (evt) => {
    _clickBtn(evt);

    const oldDiv = document.getElementById('gamba-raise-input-row');
    if (oldDiv) oldDiv.remove();

    const btnRow2 = document.getElementById('gamba-menu-buttons-row2');

    const raiseDiv = document.createElement('div');
    raiseDiv.id = 'gamba-raise-input-row';

    const input = document.createElement('input');
    input.id = 'gamba-raise-input';
    input.type = 'number';
    input.min = '1';
    input.placeholder = 'Raise by';
    raiseDiv.appendChild(input);

    const checkBtn = document.createElement('button');
    checkBtn.id = 'gamba-raise-confirm-btn';
    checkBtn.classList.add('gamba-raise-button');
    checkBtn.innerHTML = '&#x2713';
    checkBtn.disabled = true;
    raiseDiv.appendChild(checkBtn);

    const xBtn = document.createElement('button');
    xBtn.id = 'gamba-raise-cancel-btn';
    xBtn.classList.add('gamba-raise-button');
    xBtn.innerHTML = '&#10006';
    xBtn.onclick = () => {
        raiseDiv.remove();
    };
    raiseDiv.appendChild(xBtn);

    input.addEventListener('input', () => {
        const val = parseInt(input.value, 10);
        const myStack = getGambaMyStack();
        const myStake = getGambaMyStake();
        const maxStake = getGambaMaxStake();
        const maxRaise = Math.min(myStack, maxStake - myStake);
        checkBtn.disabled = isNaN(val) || val < 1 || val > maxRaise;
        checkBtn.style.background = checkBtn.disabled ? 'gray' : 'green';
    });

    checkBtn.onclick = () => {
        const val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) return;
        let myStack = getGambaMyStack();
        let myStake = getGambaMyStake();
        let maxStake = getGambaMaxStake();
        let raiseAmount = Math.min(val, myStack, maxStake - myStake);
        setGambaMyStack(myStack - raiseAmount);
        setGambaMyStake(myStake + raiseAmount);
        const newPot = getGambaPot() + raiseAmount;
        setGambaPot(newPot);
        THE_WINDOW.updateGambaMyStackDisplay();
        THE_WINDOW.updateGambaMyStakeDisplay();
        THE_WINDOW.updateGambaPotDisplay();
        sendChat(`raise ${raiseAmount}`);
        raiseDiv.remove();
    };

    btnRow2.parentNode.insertBefore(raiseDiv, btnRow2.nextSibling);
};

const onFold = (evt) => {
    _clickBtn(evt);
    sendChat('fold');
};

const createGambaMenu = () => {
    if (document.getElementById('gamba-menu')) return;
    _GAMBA_MENU = document.createElement('div');
    _GAMBA_MENU.id = 'gamba-menu';

    const headerDiv = document.createElement('div');
    headerDiv.id = 'gamba-menu-header';

    const titleDiv = document.createElement('div');
    titleDiv.id = 'gamba-menu-title';
    titleDiv.textContent = 'Geo Gamba';

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'gamba-menu-toggle';
    toggleBtn.className = 'gamba-menu-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Toggle menu');
    toggleBtn.innerHTML = '&#9654;'; // right triangle

    headerDiv.appendChild(titleDiv);
    headerDiv.appendChild(toggleBtn);
    _GAMBA_MENU.appendChild(headerDiv);

    const contentDiv = document.createElement('div');
    contentDiv.id = 'gamba-menu-content';

    const myStackDiv = document.createElement('div');
    myStackDiv.id = 'gamba-menu-my-stack';
    myStackDiv.classList.add('gamba-menu-stack');
    myStackDiv.textContent = `My Points: ${_GAMBA_MY_STACK}`;

    const theirStackDiv = document.createElement('div');
    theirStackDiv.id = 'gamba-menu-their-stack';
    theirStackDiv.classList.add('gamba-menu-stack');
    theirStackDiv.textContent = `Their Points: ${_GAMBA_THEIR_STACK}`;

    const stackRow = document.createElement('div');
    stackRow.id = 'gamba-stack-row';
    stackRow.appendChild(myStackDiv);
    stackRow.appendChild(theirStackDiv);

    contentDiv.appendChild(stackRow);

    const btnRow1 = document.createElement('div');
    btnRow1.id = 'gamba-menu-buttons-row1';
    btnRow1.classList.add('gamba-menu-buttons');

    const btnRow2 = document.createElement('div');
    btnRow2.id = 'gamba-menu-buttons-row2';
    btnRow2.classList.add('gamba-menu-buttons');

    const buttons = [
        { label: 'Ante', id: 'gamba-btn-ante', callback: onAnte, row: 1 },
        { label: 'Knock', id: 'gamba-btn-knock', callback: onKnock, row: 1 },
        { label: 'Call', id: 'gamba-btn-call', callback: onCall, row: 1 },
        { label: 'Raise', id: 'gamba-btn-raise', callback: onRaise, row: 2 },
        { label: 'Fold', id: 'gamba-btn-fold', callback: onFold, row: 2 },
    ];
    for (const { label, id, callback, row } of buttons) {
        const btn = document.createElement('button');
        btn.className = 'gamba-menu-btn';
        btn.id = id;
        btn.textContent = label;
        btn.onclick = callback;
        (row === 1 ? btnRow1 : btnRow2).appendChild(btn);
    };
    contentDiv.appendChild(btnRow1);
    contentDiv.appendChild(btnRow2);

    const updateButtonsEnabled = () => {
        const enabled = isMyTurn();
        for (const btnRow of [btnRow1, btnRow2]) {
            for (const button of btnRow.children) {
                button.disabled = !enabled;
            }
        }
    };
    updateButtonsEnabled();
    setInterval(updateButtonsEnabled, 250);

    const turnRow = document.createElement('div');
    turnRow.id = 'gamba-menu-turn-row';
    turnRow.classList.add('gamba-menu-round-row');
    contentDiv.appendChild(turnRow);

    const updateTurnRow = () => {
        turnRow.textContent = isMyTurn() ? 'My Turn' : 'Their Turn';
    };
    updateTurnRow();
    setInterval(updateTurnRow, 250);

    const roundRow = document.createElement('div');
    roundRow.id = 'gamba-menu-round-row';

    const anteDiv = document.createElement('span');
    anteDiv.id = 'gamba-menu-ante';
    anteDiv.classList.add('gamba-round-info-div');
    anteDiv.textContent = `Ante: ${_GAMBA_ANTE}`;

    const maxStakeDiv = document.createElement('span');
    maxStakeDiv.id = 'gamba-menu-maxsteak';
    maxStakeDiv.classList.add('gamba-round-info-div');
    maxStakeDiv.textContent = `Max. Stake: ${_GAMBA_MAX_STAKE}`;

    const myStakeDiv = document.createElement('span');
    myStakeDiv.id = 'gamba-menu-mystake';
    myStakeDiv.classList.add('gamba-round-info-div');
    myStakeDiv.textContent = `My Stake: ${_GAMBA_MY_STAKE}`;

    const theirStakeDiv = document.createElement('span');
    theirStakeDiv.id = 'gamba-menu-their-stake';
    theirStakeDiv.classList.add('gamba-round-info-div');
    theirStakeDiv.textContent = `Their Stake: ${_GAMBA_THEIR_STAKE}`;

    roundRow.appendChild(anteDiv);
    roundRow.appendChild(maxStakeDiv);
    roundRow.appendChild(myStakeDiv);
    roundRow.appendChild(theirStakeDiv);
    contentDiv.appendChild(roundRow);

    const potDiv = document.createElement('div');
    potDiv.id = 'gamba-menu-pot';
    potDiv.textContent = `Pot: ${_GAMBA_POT}`;
    contentDiv.appendChild(potDiv);

    THE_WINDOW.updateGambaMyStackDisplay = () => {
        _GAMBA_MY_STACK = getGambaMyStack();
        myStackDiv.textContent = `My Stack:\n${_GAMBA_MY_STACK}`;
    };
    THE_WINDOW.updateGambaAnteDisplay = () => {
        _GAMBA_ANTE = getGambaAnte();
        anteDiv.textContent = `Ante: ${_GAMBA_ANTE}`;
    };
    THE_WINDOW.updateGambaMaxStakeDisplay = () => {
        _GAMBA_MAX_STAKE = getGambaMaxStake();
        maxStakeDiv.textContent = `Max. Stake: ${_GAMBA_MAX_STAKE}`;
    };
    THE_WINDOW.updateGambaMyStakeDisplay = () => {
        _GAMBA_MY_STAKE = getGambaMyStake();
        myStakeDiv.textContent = `My Stake: ${_GAMBA_MY_STAKE}`;
    };
    THE_WINDOW.updateGambaTheirStakeDisplay = () => {
        _GAMBA_THEIR_STAKE = getGambaTheirStake();
        theirStakeDiv.textContent = `Their Stake: ${_GAMBA_THEIR_STAKE}`;
    };
    THE_WINDOW.updateGambaPotDisplay = () => {
        _GAMBA_POT = getGambaPot();
        potDiv.textContent = `Pot: ${_GAMBA_POT}`;
    };
    THE_WINDOW.setPot = setGambaPot;

    _GAMBA_MENU.appendChild(contentDiv);

    // Toggle logic
    let expanded = true;
    toggleBtn.onclick = () => {
        expanded = !expanded;
        if (expanded) {
            contentDiv.style.display = '';
            toggleBtn.innerHTML = '&#9660;'; // down triangle
        } else {
            contentDiv.style.display = 'none';
            toggleBtn.innerHTML = '&#9654;'; // right triangle
        }
    };
    // Set initial state
    toggleBtn.innerHTML = '&#9660;'; // down triangle

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

// ------------------------------------------------------------------------------------------------------------------------------



// Gamba gameplay and chat parsing ==============================================================================================

let _GAMBA_USERS = null;
let _GAMBA_MATCH_DATA = null;
let _GAMBA_CHAT_LAST_READ = -Infinity;

const _GAMBA_PLAYER_ACTIONS = new Set(['ante', 'knock', 'call', 'fold', 'raise']);
const _GAMBA_MASTER_ACTIONS = new Set(['set ante', 'set max', 'set blink']);

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
    return chats;
};

const initGamba = async () => {
    _GAMBA_MATCH_DATA = await fetchMatchData();
    console.log(_GAMBA_MATCH_DATA);

    _GAMBA_USERS = await usersFromLiveChallenge(_GAMBA_MATCH_DATA);
    console.log(_GAMBA_USERS);
};

// ------------------------------------------------------------------------------------------------------------------------------




// Round events and watchers, done by watching DOM elements appear and disappear. ===============================================

let _ROUND_STARTING_WRAPPER = null;

const onGameStart = () => {
    console.log('onGameStart');
};

const onRoundStart = () => {
    console.log('onRoundStart');
};

const onRoundEnd = () => {
    console.log('onRoundEnd');
};

const onGameEnd = () => {
    console.log('onGameEnd');
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

    const observer = new MutationObserver(() => {
        onRoundStart();
        onGameEnd();
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
        width: 350px;
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
    #gamba-menu-header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        width: 100%;
        position: relative;
        height: 48px;
        min-height: 40px;
        top: -5px;
    }
    #gamba-menu-title {
        font-size: 24px !important;
        font-weight: bold;
        color: white;
        cursor: inherit;
        text-align: center;
        width: 100%;
        margin-bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 40px;
        padding-left: 14px;
    }
    #gamba-menu-toggle {
        position: static;
        background: none;
        border: none;
        color: white;
        font-size: 22px;
        cursor: pointer;
        padding: 0 6px;
        z-index: 1;
    }
    #gamba-menu-content {
        width: 100%;
    }
    .gamba-menu-buttons {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 10px;
    }
    #gamba-stack-row {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%; 
        position: relative;
        top: -6px;
    }
    .gamba-menu-stack {
        color: #ffd700;
        font-weight: bold;
        margin-bottom: 0;
        text-align: center;
        width: 100%;
        font-size: 18px;
        margin-bottom: 6px;
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
        color: white;
        outline: none;
        width: 72px;
    }
    .gamba-menu-btn:active {
        transform: scale(0.95);
        box-shadow: 0 0 0 2px white2 inset;
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
        border: none;
        border-radius: 10px;
        width: 26px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        margin: 0 4px;
        color: white;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s, box-shadow 0.1s;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        outline: none;
    }
    #gamba-raise-input-row {
        margin-left: 10px;
    }
    .gamba-raise-button:active {
        transform: scale(0.92);
        box-shadow: 0 0 0 2px #fff2 inset;
        filter: brightness(0.95);
    }
    #gamba-raise-confirm-btn {
        background: #43a047;
    }
    #gamba-raise-confirm-btn:active {
        background: #388e3c;
    }
    #gamba-raise-cancel-btn {
        background: #e53935;
    }
    #gamba-raise-cancel-btn:active {
        background: #b71c1c;
    }
    #gamba-menu-turn-row {
        color: lightgreen;
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 10px;
        display: flex;
        justify-content: center;
    }
    #gamba-menu-pot {
        color: lightgreen;
        font-weight: bold;
        font-size: 24px;
        margin-top: 10px;
        margin-bottom: 4px;
        border-radius: 6px;
        padding: 6px 18px;
        background: rgba(30,30,30,0.85);
        text-align: center;
        text-shadow: 
            0 0 1px #fff,
            0 0 0px #F3B,
            0 0px 6px #F3C,
            0 0 1px #FE8
    }
    #gamba-menu-round-row {
        display: flex;
        justify-content: center;
        align-items: center;
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





// Global event handling ========================================================================================================

const clearState = () => {
    setGambaAnte(_GAMBA_DEFAULT_ANTE);
    setGambaWhoseTurn(_GAMBA_DEFAULT_WHOSE_TURN);
    setGambaMyStack(_GAMBA_DEFAULT_STACK);
    setGambaTheirStack(_GAMBA_DEFAULT_STACK);
    setGambaMaxStake(_GAMBA_DEFAULT_MAX_STAKE);
    setGambaMyStake(_GAMBA_DEFAULT_MY_STAKE);
    setGambaTheirStake(_GAMBA_DEFAULT_THEIR_STAKE);
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

if (document.readyState !== 'loading') {
    initGamba();
    createGambaMenu();
} else {
    document.addEventListener('DOMContentLoaded', async () => {
        initGamba();
        createGambaMenu();
    });
}