const initTtsData = () => ({
  eventIds: [],
  elevenLabsVoices: {},
  msgIdToTextMap: {},
  userMsgIds: {},
  currentMsgId: null,
  queue: [],
  isEnabled: true,
  isSpeaking: false,
  skip: null,
  shouldSkipNext: false,
  delay: 3,
  volume: 1,
  voice: 'brian',
  timer: {
    container: document.getElementById('tts_timer_container'),
    canvas: document.getElementById('tts_timer'),
  }
});

export const initSessionData = () => {
  const state = {
    streamer: {
      id: null,
      username: null,
      token: null,
    },
    tts: initTtsData(),
  };

  return state;
};
