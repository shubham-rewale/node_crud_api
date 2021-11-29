import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe('PLACE-HOLDER');

export const bookTour = async (tourId) => {
	try {
		// get the session object from api endpoint
		const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
		// create checkout form
		await stripe.redirectToCheckout({ sessionId: session.data.session.id });	
	} catch (err) {
		console.log(err);
		showAlert('error', err);
	}
}