import {
	fetchElevenLabsVoices,
	fetchBrianSpeech,
	fetchElevenLabsSpeech,
	fetchMicrosoftSpeech,
	fetchUberduckSpeech,
	fetchAvailableCredits,
} from './fetch.js';
import {
	MICROSOFT_SPEAKER_TEMPLATES, 
	ELEVEN_LABS_VOICE_NAMES, 
	UBERDUCK_VOICES,
} from './consts.js';
import {runTimer} from './timer.js';

export const sanitizeSpeechText = text => {
	let finalString = '';

	// first split each letter up to get rid of excessive puntuation and repeated characters
	text.split('').forEach(letter => {
		if(!finalString) {
			// Only add if it's a letter. 
			// We'll accomplish that by check if it's a punctionation mark or whitespace
			if(!(/(\p{P}|\s)/u.test(letter))) {
				finalString += letter;
			}
		} else {
			const lastCharacter = finalString[finalString.length - 1];
			if (/\s/.test(lastCharacter)) {
				// last character was a space so only add non-space chatacters now
				if(!(/\s/.test(letter))) {
					// check if it's a not whitespace character.
					// this means it's a letter. Allow it!
					finalString += letter;
				}
			} else {
				finalString += letter;
			}
		}
	});

	return finalString;
};

export const nativeSpeech = (sessionData, text) => new Promise(async (resolve) => {
	if(sessionData.tts.shouldSkipNext) {
		resolve(true);
		return;
	}
	const utterance = new SpeechSynthesisUtterance();
	utterance.volume = sessionData.tts.volume;
	utterance.text = text;
	
	let handleEndedEvent;
	const handleEnded = (success) => {
		utterance.removeEventListener('end', handleEndedEvent);
		sessionData.tts.skip = null;
		resolve(success);
	};
	
	handleEndedEvent = () => handleEnded(true);
	utterance.addEventListener('end', handleEndedEvent);
	
	sessionData.tts.skip = () => {
		if(speechSynthesis?.speaking) {
			speechSynthesis.cancel();
		}
		
		handleEnded(true);
	}
	
	try {
		window.speechSynthesis.speak(utterance);
	} catch(err) {
		handleEnded(false);
	}
});

const getTargetVoice = (sessionData, text) => {
	let speechText = text;
	const lowerText = text.toLowerCase();
	
	let targetVoice = lowerText.startsWith('brian::') ? 'brian' : null;

	// check if it's the microsoft voices
	if(!targetVoice) {
		targetVoice = Object.keys(MICROSOFT_SPEAKER_TEMPLATES).find(
			voice => lowerText.startsWith(`${voice}::`)
		);
	}

	// check to see if it's one of the elevenlab voices
	if(!targetVoice) {
		targetVoice = Object.keys(sessionData.tts.elevenLabsVoices).find(
			voice => lowerText.startsWith(`${voice}::`)
		);
	}
	
	// check to see it if't one of the uberduck voices
	if(!targetVoice) {
		targetVoice = Object.keys(UBERDUCK_VOICES).find(
			voice => lowerText.startsWith(`${voice}::`)
		);
	}

	// otherwise it doesn't match any of the voices. User the default
	if(!targetVoice) {
		targetVoice = sessionData.tts.voice;
	} else {
		speechText = speechText.slice(targetVoice.length + 2);
	}
	
	targetVoice = targetVoice.toLowerCase();
	return [targetVoice, speechText]
}

export const fetchSpeech = async (sessionData, text) => {
	const speechFallbackOrder = [
		fetchBrianSpeech, 
		nativeSpeech,
	];
	const [targetVoice, _text] = getTargetVoice(sessionData, text);
	const speechText = sanitizeSpeechText(_text.slice());
	
	if(Boolean(UBERDUCK_VOICES[targetVoice])) {
		speechFallbackOrder.unshift(fetchUberduckSpeech);
	} else if(ELEVEN_LABS_VOICE_NAMES.has(targetVoice)) {
		speechFallbackOrder.unshift(fetchElevenLabsSpeech);
	} else if(MICROSOFT_SPEAKER_TEMPLATES[targetVoice]) {
		speechFallbackOrder.unshift(fetchMicrosoftSpeech);
	}

	const availableCredit = await fetchAvailableCredits(sessionData.streamer.id);
	
	let ttsComplete = false,
		index = 0;
	
	while(!ttsComplete) {
		const speechFn = speechFallbackOrder[index];
		if(speechFn) {
			ttsComplete = await speechFn(sessionData, speechText, targetVoice, availableCredit)
		} else {
			ttsComplete = true;
		}
		index++;
	}

};

export const loadElevenLabsVoices = async (sessionData) => {
	const res = await fetchElevenLabsVoices();
	res?.voices.forEach(voice => {
		const lowerVoice = voice.name.toLowerCase();
		if(ELEVEN_LABS_VOICE_NAMES.has(lowerVoice)) {
		  sessionData.tts.elevenLabsVoices[lowerVoice] = voice.voice_id;
		}
	});
};

const fetchNextSpeech = async (sessionData) => {
	sessionData.tts.timer.container.style.opacity = '0';
	const nextText = sessionData.tts.msgIdToTextMap[sessionData.tts.currentMsgId];
	if(!nextText) {
		return;
	}
	await fetchSpeech(sessionData, nextText);
	return;
}

const speakNext = (sessionData) => new Promise(async (resolve) => {
	sessionData.tts.shouldSkipNext = false;
	sessionData.tts.timer.container.style.opacity = '1';
	const msgId = sessionData.tts.queue.shift();
	sessionData.tts.currentMsgId = msgId;
	if(!sessionData.tts.msgIdToTextMap[msgId]) {
		resolve();
		return;
	};

	if(
		typeof sessionData.tts.delay !== 'number' && 
		sessionData.tts.delay <= 0
	) {
		await fetchNextSpeech(sessionData);
		resolve();
		return;
	}

	const {pause, resume, end} = runTimer(sessionData, {
		onComplete: async () => {
			if(sessionData.tts.shouldSkipNext) {
				sessionData.tts.timer.container.style.opacity = '0';
				resolve();
				return;
			}
			await fetchNextSpeech(sessionData);
			resolve();
		},
		canvas: sessionData.tts.timer.canvas,
		seconds: sessionData.tts.delay,
	});

	sessionData.tts.skip = () => {
		sessionData.tts.shouldSkipNext = true;

		const newMap = {};

		Object.entries(sessionData.tts.msgIdToTextMap).map(([msgId, msgText]) => {
			if(sessionData.tts.queue.includes(msgId)) {
				newMap[msgId] = msgText
			}
		});

		sessionData.tts.msgIdToTextMap = newMap;

		sessionData.tts.timer.container.style.opacity = '0';
		end();
		resolve();
	}
});

export const speak = async (sessionData, text, msgId, userId) => {
	sessionData.tts.queue.push(msgId);

	sessionData.tts.msgIdToTextMap[msgId] = text;

	if(!sessionData.tts.userMsgIds[userId]) {
		sessionData.tts.userMsgIds[userId] = [];
	}
	sessionData.tts.userMsgIds[userId].push(msgId);

	if(!sessionData.tts.isSpeaking) {
		sessionData.tts.isSpeaking = true;
		
		while(sessionData.tts.queue.length) {
			await speakNext(sessionData);
		};

		sessionData.tts.isSpeaking = false;
	}
};