export const KDAWG_USER_ID = '221785400';
export const FATED_USER_ID = '184426448';
export const ZULII_USER_ID = '238086975';

export const DEV_MODE = 'dev';
export const PROD_MODE = 'prod';
export const MODE = DEV_MODE;
export const IS_DEV_MODE = MODE === DEV_MODE;

const SHOUT_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-DavisNeural"><s /><mstts:express-as style="shouting">${text}</mstts:express-as><s /></voice></speak>
`;
const ANGRY_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-DavisNeural"><s /><mstts:express-as style="angry">${text}</mstts:express-as><s /></voice></speak>
`;
const BRITISH_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-GB-RyanNeural"><mstts:express-as style="chat">${text}</mstts:express-as><s /> </voice></speak>
`;
const SWEDISH_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="sv-SE-MattiasNeural"><s />${text}</voice></speak>
`;
const IRISH_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-IE"><voice name="en-IE-ConnorNeural">${text}</voice></speak>
`;
const MALE_ASMR_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-JasonNeural"><s /><mstts:express-as style="whispering">${text}</mstts:express-as><s /></voice></speak>
`;
const NEW_ZEALAND_TEMPLATE = text => `
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-NZ"><voice name="en-NZ-MitchellNeural"><prosody pitch="-10.00%">${text}</prosody></voice></speak>
`;

export const MICROSOFT_SPEAKER_TEMPLATES = {
	british: BRITISH_TEMPLATE,
	charles: BRITISH_TEMPLATE,

	swedish: SWEDISH_TEMPLATE,
	felix: SWEDISH_TEMPLATE,

	irish: IRISH_TEMPLATE,
	murphy: IRISH_TEMPLATE,

	kiwi: NEW_ZEALAND_TEMPLATE,
	oliver: NEW_ZEALAND_TEMPLATE,

	shout: SHOUT_TEMPLATE,
	tim: SHOUT_TEMPLATE,

	mad: ANGRY_TEMPLATE,
	andy: ANGRY_TEMPLATE,

	asmr: MALE_ASMR_TEMPLATE,
	ari: MALE_ASMR_TEMPLATE,
};

export const ELEVEN_LABS_VOICE_NAMES = new Set(['biden', 'ranger', 'nerd']);

export const UBERDUCK_VOICES = {
	betty: 'betty-white',
	shrek: 'shrek',
	plankton: 'plankton',
	sandy: 'sandy-cheeks',
	spongebob: 'spongebob-squarepants',
	patrick: 'patrick',
};

export const ROOT_HTML_TEMPLATE = `
	<div id="tts_timer_container">
		<canvas id="tts_timer" width="100" height="100"></canvas>
	</div>
	<div id="available_tts_credit" class="invisible">
		<h1>
			Available TTS credit: $
			<span id="available_tts_credit_value"/>
		</h1>
	</div>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500&display=swap" rel="stylesheet">
`;

export const PAGE_CSS = `
	html, body {
		margin: 0px;
		position: relative;
		font-family: 'Fredoka', sans-serif;
	}
	.invisible {
		opacity: 0;
		transition: opacity 1s;
	}
	.visible {
		opacity: 1;
		transition: opacity 1s;
	}
	#tts_timer_container {
		position: absolute;
		opacity: 0;
		transition: opacity 1s;
		bottom: 10px;
		right: 10px;
		background-color: transparent;
		width: min-content;
		height: min-content;
	}
	#available_tts_credit {
		padding: 8px 16px;
		color: white;
		background-color: #3F3F3F;
		border-radius: 4px;
		position: absolute;
		top: 10px;
		right: 10px;
	}
`;
