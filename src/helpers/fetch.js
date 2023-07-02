import {
  MICROSOFT_SPEAKER_TEMPLATES, 
  UBERDUCK_VOICES,
} from './consts.js';
import {APPLICATION_ID, MICROSOFT_TTS_SUBSCRIPTION_KEY, ELEVEN_LABS_API_KEY, PROXY_URL} from '../keys.js';

const getRequestHeaders = (token) => new Headers({
  "Authorization": `Bearer ${token}`,
  "Client-Id": APPLICATION_ID,
});

export const twitchFetch = async (url, token) => {
  const res = await fetch(url, {headers: getRequestHeaders(token)});
  return res?.json() || {};
};

export const getRedemptions = (id, token) => twitchFetch(
  `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${id}`,
  token
);

export const fetchElevenLabsVoices = async () => {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: new Headers({
      accept: 'application/json',
      'xi-api-key': ELEVEN_LABS_API_KEY,
    })
  })
  return res.json()
};

const normalizedAudio = async (sessionData, res) => {
  if(typeof res?.blob !== 'function') {
    resolve(false);
    return;
  }
  const audioBlob = await res?.blob();
  if(!audioBlob) {
    resolve(false);
    return;
  }
  const audioDataUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioDataUrl);
  if(!audio) {
    resolve(false);
    return;
  }
  const audioCtx = new AudioContext();
  const src = audioCtx.createMediaElementSource(audio);
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 1.0;

  audio.addEventListener("play", () => {
    src.connect(gainNode);
    gainNode.connect(audioCtx.destination);
  }, true);
  audio.addEventListener("pause", () => {
    // disconnect the nodes on pause, otherwise all nodes always run
    src.disconnect(gainNode);
    gainNode.disconnect(audioCtx.destination);
  }, true);
  const buf = await audioBlob.arrayBuffer();
  const decodedData = await audioCtx.decodeAudioData(buf);

  const decodedBuffer = decodedData.getChannelData(0);
  const sliceLen = Math.floor(decodedData.sampleRate * 0.005);
  const averages = [];
  let sum = 0.0, i = 0;
  while(i < decodedBuffer.length) {
    sum += decodedBuffer[i] ** 2;
    if (i % sliceLen === 0) {
      sum = Math.sqrt(sum / sliceLen);
      averages.push(sum);
      sum = 0;
    }
    i += 1;
  };

  // Take the loudest from the volume averages at each tested interval
  const higestGain = Math.max(...averages);

  const gain = (sessionData.tts.volume / 5) / higestGain;
  // ensure gain isn't cranked aboved 5 and isnt' reduced below 1
  gainNode.gain.value = Math.max(Math.min(gain, 5), 1);

  return audio;
};

const playAudioResponse = (sessionData, res) => new Promise(async (resolve) => {
  if(sessionData.tts.shouldSkipNext) {
    resolve({success: true, duration: 0});
    return;
  }
  try {
    const audio = await normalizedAudio(sessionData, res);

    audio.volume = sessionData.tts.volume;
    let handleEndedEvent; 
    const handleEnded = (success) => {
      audio.removeEventListener('ended', handleEndedEvent);
      sessionData.tts.skip = null;
      resolve({success, duration: audio.duration});
    }
    handleEndedEvent = () => handleEnded(true);
    audio.addEventListener('ended', handleEndedEvent);
    if(sessionData.tts.shouldSkipNext) {
      handleEnded(true);
      return;
    }

    audio.play()
    .catch(err => {
      audio.pause();
      handleEnded(false);
    })
    .then(() => {
      sessionData.tts.skip = () => {
        audio.pause();
        handleEnded(true);
      };
    });
  } catch(err) {
    sessionData.tts.skip = null;
    resolve({success: false, duration: 0});
  }
});

export const fetchUberduckSpeech = (sessionData, text, voice, availableCredit) => new Promise(async (resolve) => {
  if(!availableCredit || availableCredit <= 0) {
    resolve(false);
    return;
  }
  const options = {
    method: 'POST',
    headers: new Headers({
      accept: 'application/json',
      'uberduck-id': 'anonymous',
      'content-type': 'application/json',
      Authorization: `Basic cHViX2F6YWd3Y251ZndqaGF6amt2ejpwa184ZjZkYTk2Ni01OTQ2LTQ2OWYtOTQ1NC02MDE5OThiNGZmOTA=`,
      "X-Requested-With": "XMLHttpRequest",
    }),
    body: JSON.stringify({voice: UBERDUCK_VOICES[voice] || UBERDUCK_VOICES.betty, pace: 1, speech: text})
  };

  const res = await fetch(
    `${PROXY_URL}/https://api.uberduck.ai/speak-synchronous`,
    options,
  );

  const {success, duration} = await playAudioResponse(sessionData, res);
  
  // Uberduck: $1 / 360 secs audio generated 
  // ---------> cost per second: ~0.0028 / second
  let estimatedCost = Math.ceil(duration) * 0.0027;
  setAvailableCredits(sessionData.streamer.id, availableCredit - estimatedCost);

  resolve(success);
});

export const fetchElevenLabsSpeech = (sessionData, text, voice, availableCredit) => new Promise(async (resolve) => {
  if(!availableCredit || availableCredit <= 0) {
    resolve(false);
    return;
  }
  const voiceId = sessionData.tts.elevenLabsVoices[voice.toLowerCase()] || sessionData.tts.elevenLabsVoices.biden;
  if(!voiceId) {
    resolve(false);
    return;
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=0`, {
    method: 'POST',
    headers: new Headers({
      Accept: 'audio/mpeg',
      'xi-api-key': ELEVEN_LABS_API_KEY,
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      "text": text,
      "model_id": "eleven_monolingual_v1",
      "voice_settings": {
        "stability": 0.05,
        "similarity_boost": 0.80,
      }
    }),
  });

  const {success} = await playAudioResponse(sessionData, res);
  
  // Elevenlabs: $3 / 10k chars
  // ------> cost per char: 0.0003
  let estimatedCost = text.length * 0.0003;
  setAvailableCredits(sessionData.streamer.id, availableCredit - estimatedCost);

  resolve(success);
});

export const fetchMicrosoftSpeech = (sessionData, text, voice, availableCredit) => new Promise(async (resolve) => {
  if(!availableCredit || availableCredit <= 0) {
    resolve(false);
    return;
  }
  const speakerTemplate = MICROSOFT_SPEAKER_TEMPLATES[voice] || MICROSOFT_SPEAKER_TEMPLATES.charles;
  const requestBody = speakerTemplate(text);
  const res = await fetch(
    'https://southcentralus.tts.speech.microsoft.com/cognitiveservices/v1',
    {
      method: 'POST',
      headers: new Headers({
        "Content-Type": "application/ssml+xml",
        "Ocp-Apim-Subscription-Key": MICROSOFT_TTS_SUBSCRIPTION_KEY,
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
      }),
      body: requestBody,
    }
  );
  const {success} = await playAudioResponse(sessionData, res);
  
  // Microsoft: $1.50 / 10k chars
  // ------> cost per char: 0.00015
  let estimatedCost = text.length * 0.00015;
  setAvailableCredits(sessionData.streamer.id, availableCredit - estimatedCost);
  
  resolve(success);
});

export const fetchBrianSpeech = (sessionData, text, voice, availableCredit) => new Promise(async (resolve) => {
  const res = await fetch(
    'https://api.streamelements.com/kappa/v2/speech?voice=Brian&text='
    + encodeURIComponent(text.trim())
  );
  const {success} = await playAudioResponse(sessionData, res);
  resolve(success);
});

export const fetchAvailableCredits = async (id) => {
  const getCreditsUrl = `https://get-fated-tts-credits.pennney.workers.dev?id=${id}`;
  const res = await fetch(
    `${PROXY_URL}/${getCreditsUrl}`
  );

  const resText = await res?.text();
  let availableCredit = Number(resText);

  if(typeof availableCredit !== 'number' || isNaN(availableCredit)) {
    availableCredit = 0;
  }
  return availableCredit;
};

export const setAvailableCredits = async (id, value) => {
  if(typeof value !== 'number' || isNaN(value)) {
    return;
  }
  const val = Math.max(value, 0).toFixed(4);
  const setCreditsUrl = `https://set-fated-tts-credits.pennney.workers.dev?id=${id}&value=${val}`;
  const res = await fetch(
    `${PROXY_URL}/${setCreditsUrl}`
  );

  return true;
};

export const getStreamerToken = (id) => fetch(
  `${PROXY_URL}/https://get-fated-tts-token.pennney.workers.dev?id=${id}`
);

export const loadStreamerToken = async (sessionData) => {
  const res = await getStreamerToken(sessionData.streamer.id);
  const token = await res.text();
  if(token) {
    sessionData.streamer.token = token;
    return true;
  }
  return false;
}
