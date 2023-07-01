import {
  MICROSOFT_SPEAKER_TEMPLATES,
  FATED_USER_ID,
} from '../helpers/consts.js';
import {speak} from '../helpers/speak.js';
import {fetchAvailableCredits} from '../helpers/fetch.js';

export const handleMessageEvent = async (event, sessionData) => {
  const {userId, msgId, text, tags} = event.data;
  const isMod = tags?.mod === '1';
  const isStreamer = userId === sessionData.streamer.id;
  const isDeveloper = userId === FATED_USER_ID;
  if(isMod || isStreamer || isDeveloper) {
    handleAdminMessage(text, sessionData, event.data);
  }

  if(
    sessionData.tts.isEnabled && 
    tags && 
    tags['custom-reward-id'] && 
    sessionData.tts.eventIds.includes(tags['custom-reward-id'])
  ) {
    speak(sessionData, text, msgId, userId);
  } 
}

/*
ADMIN WIDGET COMMANDS
---------------------
** TTS **

!disabletts
!enabletts
!skiptts
!setVoiceVolume VOLUME
!updateVoice VOICE
!ttsSetDelay SECONDS
!ttsShowBalance
*/

const handleAdminMessage = (message, sessionData, data) => {
  const words = message.trim().split(' ');

  switch(words[0].toLowerCase()) {
    case('!enabletts'):
      setTtsEnabled(sessionData, true);
      break;
    case('!disabletts'):
      setTtsEnabled(sessionData, false);
      break;
    case('!!skip'):
    case('!skiptts'):
      handleSkipTts(sessionData);
      break;
    case('!setttsvolume'):
      handleSetVoiceVolume(sessionData, words[1]);
      break;
    case('!updatedefaultttsvoice'):
      handleUpdateVoice(sessionData, words[1]);
      break;
    case('!setttsdelay'):
      handleSetDelay(sessionData, words[1]);
      break;
    case('!showttsbalance'):
      handleShowBalance(sessionData);
      break;
    case('!say'):
      handleAdminTts(sessionData, words.slice(1).join(' '), data);
    default:
      break;
  }
};

const handleAdminTts = async (sessionData, message, data) => {
  if(!sessionData.tts.isEnabled) {
    return;
  }
  speak(sessionData, message, data.msgId, data.userId);
};

const handleShowBalance = async (sessionData) => {
  const balanceContainer = document.getElementById('available_tts_credit');
  const balanceContainerValue = document.getElementById('available_tts_credit_value');
  const availableCredit = await fetchAvailableCredits(sessionData.streamer.id);
  balanceContainerValue.innerHTML = availableCredit;
  balanceContainer.classList.add('visible');
  setTimeout(() => {
    balanceContainer.classList.remove('visible')
  }, 10000)
};

const handleSetDelay = (sessionData, delayString) => {
  const newDelay = Number(delayString.trim());
  if(
    typeof newDelay === 'number' && 
    !isNaN(newDelay) &&
    newDelay >= 0
  ) {
    sessionData.tts.delay = newDelay;
  }
};

const handleUpdateVoice = (sessionData, voice) => {
  const lowerVoice = voice.toLowerCase();
  if(Boolean(MICROSOFT_SPEAKER_TEMPLATES[lowerVoice])) {
    sessionData.tts.voice = lowerVoice;
  }
};

const handleSetVoiceVolume = (sessionData, volume) => {
  const newVolume = Number(volume.trim());
  if(
    typeof newVolume === 'number' && 
    !isNaN(newVolume) && 
    newVolume >= 0 && 
    newVolume <= 1
  ) {
    sessionData.tts.volume = newVolume;
  }
}

const handleSkipTts = (sessionData) => {
  if(sessionData.tts.skip) {
    sessionData.tts.skip();
  } else {
    setTimeout(() => {
      if(sessionData.tts.skip) {
        sessionData.tts.skip();
      } 
    }, 0);
  }
};

const setTtsEnabled = (sessionData, enabled) => {
  sessionData.tts.isEnabled = enabled;
};
