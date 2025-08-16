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
// - Detect round start via mutation observer
// - Automatically send the ante via chat
// - Make pot display
// - Make action display
// - Pop up input for raise


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

const _ACTIONS = {
    call: ['call'],
    fold: ['fold'],
    raise: ['raise'],
    allin: ['allin', 'all in', 'all-in'],
};

const parseChatMessage = (msg) => {
    const username = msg.querySelector('span[class^="chat-message_nick__"]').innerText.toLowerCase();
    const text = msg.querySelector('span[class^="chat-message_messageText__"]').innerText.toLowerCase();
};

const getAllChatMessages = () => {
    const chatLog = getChatLog();
    if (!chatLog) {
        return [];
    }
    return chatLog.querySelectorAll('div[class^="chat-message_normalMessageRoot__"');
    const messages = [];
    for (const message of messages) {
        const parsed = parseChatMessage(message);
        messages.push(parsed);
    }
    return messages;
};

async function fetchDuelData() {
    const parts = location.pathname.split('/');
    const duelId = parts[parts.length - 1];
    const resp = await fetch(
        `https://game-server.geoguessr.com/api/duels/${duelId}`,
        { method: 'GET', credentials: 'include' }
    );
    const data = await resp.json();
    console.log(data);
    debugger
};

window.addEventListener('load', async () => {
    try {
        const data = await fetchDuelData();
        console.log('Raw duel data:', data);
    } catch (e) {
        console.error('Error fetching duel data:', e);
    }

    const chatLog = getChatLog();
    if (!chatLog) return;
    let lastMessageCount = getAllChatMessages().length;
    const callback = (mutationsList, observer) => {
        const currentCount = getAllChatMessages().length;
        if (currentCount !== lastMessageCount) {
            lastMessageCount = currentCount;
            console.log('TODO');
        }
    };
    const observer = new MutationObserver(callback);
    observer.observe(chatLog, { childList: true, subtree: true });
});


