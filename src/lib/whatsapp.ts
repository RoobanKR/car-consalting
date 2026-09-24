import type { Car } from './api';
import { carHref, money } from './api';

/** Business WhatsApp number in international format, digits only.
 *  6380528743 is an Indian mobile, so it carries the 91 country code. */
export const WHATSAPP_NUMBER = '916380528743';

export const WHATSAPP_DISPLAY = '+91 63805 28743';

/** Where the business can be reached, shown in the footer. */
export const CONTACT_EMAIL = 'bkdhivakar09@gmail.com';
export const CONTACT_ADDRESS = 'THIRUMURUGAN NAGAR, aaaaa, Musiri, Tamil Nadu 621211';

/** wa.me opens the chat with the text ready to send. WhatsApp itself will not
 *  send anything without the person tapping send — that is how the link works. */
export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Shown by the floating button when no particular car is in view. */
export const generalMessage = 'Hello KangaCars, I am looking for a used car and would like some help choosing one.';

/** The origin is passed in rather than read from `window`, because these messages
 *  are built during server rendering too, where `window` does not exist — reading it
 *  there silently dropped the link from the message. */
function carLink(car: Pick<Car, '_id' | 'slug'>, origin: string) {
  return origin ? `${origin}${carHref(car)}` : '';
}

export type EnquiryDetails = { name: string; phone: string; email: string; city: string; message: string };

/** Sent after the enquiry is saved, so the team gets the same details on WhatsApp
 *  alongside the car it relates to. */
export function enquiryMessage(car: Car, enquiry: EnquiryDetails, origin = '') {
  return [
    'Hello KangaCars, I have just sent an enquiry through your website.',
    '',
    'MY DETAILS',
    `Name: ${enquiry.name}`,
    `Phone: ${enquiry.phone}`,
    enquiry.email && `Email: ${enquiry.email}`,
    enquiry.city && `City: ${enquiry.city}`,
    '',
    'CAR I AM ASKING ABOUT',
    `${car.year} ${car.brand} ${car.model}`,
    `Price: ${money(car.price)}`,
    `${car.kmDriven.toLocaleString('en-IN')} km · ${car.fuelType} · ${car.transmission} · ${car.location}`,
    carLink(car, origin) && `Link: ${carLink(car, origin)}`,
    enquiry.message && '',
    enquiry.message && 'MY MESSAGE',
    enquiry.message
  ].filter(Boolean).join('\n');
}
