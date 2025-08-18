// ==UserScript==
// @name         GeoGamba
// @version      0.0.1
// @description  A mod for the wonderful overlap of GeoGuessr and gambling that you didn't know you needed.
// @author       tpebop
// @match        *://*.geoguessr.com/live-challenge*
// @icon         https://www.google.com/s2/favicons?domain=geoguessr.com
// @grant        none

// ==/UserScript==


console.log('GEO GAMBAAAAA');


// TODO
// - Detect round start via mutation observer, optionally? block additional bets
// - Automatically send the ante via chat
// - Pot display and total points on round and end-of-round screens
// - Action display (call, fold, raise, all-in)
// - Pop up input for raise


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

const USER_ACTIONS = {
    call: ['call'],
    fold: ['fold'],
    raise: ['raise'],
    allin: ['allin', 'all in', 'all-in'],
};

const MASTER_ACTIONS = {
    ante: ['ante'],
    max: ['max', 'maximum'],
    blink: ['blink'],
};

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


const parseChatMessage = (msg) => {
    const username = msg.querySelector('span[class^="chat-message_nick__"]').innerText.toLowerCase();
    const text = msg.querySelector('span[class^="chat-message_messageText__"]').innerText.toLowerCase();
    const isMaster = false; // TODO
};

const getAllChatMessages = () => {
    const chatLog = getChatLog();
    if (!chatLog) {
        return [];
    }
    return chatLog.querySelectorAll('div[class^="chat-message_normalMessageRoot__"');
};


const parseLiveChallenge = (data) => {
    const players = data.players.map(player => ({
        id: player.id,
        name: player.name,
        points: player.points,
    }));
    const rounds = data.rounds.map(round => ({
        id: round.id,
        ante: round.ante,
        pot: round.pot,
        actions: round.actions.map(action => ({
            playerId: action.playerId,
            type: action.type,
            amount: action.amount,
        })),
    }));
    return { players, rounds };
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

window.addEventListener('load', async () => {
    try {
        const data = await fetchMatchData();
        console.log(data);
    } catch (e) {
        console.error('Error fetching duel data:', e);
        return;
    }

    const chatLog = getChatLog();
    if (!chatLog) {
        return;
    }

    let lastMessageCount = getAllChatMessages().length;
    const callback = (mutationsList, observer) => {
        const currentCount = getAllChatMessages().length;
        if (currentCount !== lastMessageCount) {
            lastMessageCount = currentCount;
            debugger
        }
    };
    const observer = new MutationObserver(callback);
    observer.observe(chatLog, { childList: true, subtree: true });
});


