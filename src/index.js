import {
  ROOT_HTML_TEMPLATE, 
  PAGE_CSS, 
  KDAWG_USER_ID, 
  IS_DEV_MODE,
} from './helpers/consts.js';

document.body.innerHTML = ROOT_HTML_TEMPLATE;

(() => {
  const head = document.getElementsByTagName('head')[0];
  const s = document.createElement('style');
  s.setAttribute('type', 'text/css');
  s.appendChild(document.createTextNode(PAGE_CSS));
  head.appendChild(s);
})();

import {handleMessageEvent} from './eventHandlers/message.js';
import {loadElevenLabsVoices} from './helpers/speak.js';
import {initSessionData} from './helpers/sessionState.js';
import {loadTtsRedemptionEventIds} from './eventHandlers/redemption.js';
import {loadStreamerToken} from './helpers/fetch.js';

const sessionData = initSessionData();

window.addEventListener('onWidgetLoad', async event => {
  const {providerId, username} = event.detail.channel;
  // add streamer's ID to session data 
  sessionData.streamer.username = IS_DEV_MODE ? 'kdawg' : username;
  sessionData.streamer.id = IS_DEV_MODE ? KDAWG_USER_ID : providerId;

  // first get the streamer's access token and wait for it to load
  await loadStreamerToken(sessionData);
  console.log('sessionData: ', sessionData)
  // then load all the other necessary data (some of which requires the access token)
  await Promise.all([
    loadTtsRedemptionEventIds(sessionData),
    loadElevenLabsVoices(sessionData),
  ]);
});

window.addEventListener('onEventReceived', event => {
  switch(event.detail.listener) {
    case('message'):
      handleMessageEvent(event.detail.event, sessionData);
      break;
  }
});
