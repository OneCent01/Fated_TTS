import {getRedemptions, getRedemptionEvets} from '../helpers/fetch.js';

export const getTtsRedemptionEventIds = async () => {
	const {data: redemptions} = await getRedemptions();
	return redemptions?.filter(
		redemption => redemption.title.toLowerCase().includes('tts')
	).map(redemption => redemption.id);
};

export const loadTtsRedemptionEventIds = async (sessionData) => {
	sessionData.tts.eventIds = await getTtsRedemptionEventIds();
}