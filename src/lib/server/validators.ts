import mongoose from 'mongoose';
import { z } from 'zod';

const cleanText = z.string().trim();

/** A full http(s) URL, or a Drive file served through our own /api/media/<id> route. */
const mediaUrl = z.string().trim().refine(
  value => /^\/api\/media\/[\w-]{10,}$/.test(value) || z.string().url().safeParse(value).success,
  'Invalid url'
);

export const saleInput = z.object({
  soldPrice: z.coerce.number().positive().max(1000000000),
  soldAt: z.coerce.date(),
  buyerName: cleanText.min(2).max(100),
  // Optional: kept so older sales that captured it still validate.
  buyerEmail: z.string().trim().email().max(254).or(z.literal('')).optional().default(''),
  buyerPhone: cleanText.min(7).max(25),
  // The sell route overwrites these from the signed-in account.
  salespersonName: cleanText.max(100).optional().default(''),
  salespersonEmail: z.string().trim().email().max(254).or(z.literal('')).optional().default('')
});

export const carInput = z.object({
  brand: cleanText.min(1).max(80), model: cleanText.min(1).max(80),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive().max(1000000000),
  fuelType: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']),
  transmission: z.enum(['Manual', 'Automatic']),
  kmDriven: z.coerce.number().int().min(0).max(2000000),
  bodyType: cleanText.max(50).default('Other'), location: cleanText.min(1).max(100),
  description: cleanText.max(5000).default(''),
  features: z.array(cleanText.max(100)).max(30).default([]),
  images: z.array(z.object({
    url: mediaUrl, publicId: z.string().optional(),
    illustrative: z.boolean().optional(), sourceUrl: z.string().url().optional(),
    attribution: z.string().max(300).optional(), license: z.string().max(100).optional(),
    licenseUrl: z.string().url().optional()
  })).min(1, 'Add at least 1 photo.').max(7, 'Use no more than 7 photos.'),
  status: z.enum(['active', 'sold', 'hidden']).default('active'),
  sale: saleInput.optional(),
  postedBy: z.object({
    name: cleanText.max(100).default('KangaCars Admin'),
    email: z.string().trim().email().max(254).or(z.literal('')).default(''),
    phone: cleanText.max(25).default('')
  }).default({ name: 'KangaCars Admin', email: '', phone: '' })
}).superRefine((car, context) => {
  if (car.status === 'sold' && !car.sale) context.addIssue({ code: 'custom', path: ['sale'], message: 'Sale details are required for sold cars.' });
});

export const enquiryInput = z.object({
  carId: z.string().refine(mongoose.isValidObjectId, 'Invalid car'),
  name: cleanText.min(2).max(100), email: z.string().trim().email().max(254),
  phone: cleanText.min(7).max(25), city: cleanText.max(100).default(''),
  message: cleanText.max(2000).default('')
});

export const enquiryStatusInput = z.object({ status: z.enum(['new', 'contacted', 'closed']) });

// NOTE: a 3-character minimum only exists so the seeded demo account works.
// Raise this to 8+ before putting real accounts behind it.
const password = cleanText.min(3, 'Use at least 3 characters.').max(200);

export const userInput = z.object({
  firstName: cleanText.min(1).max(80),
  lastName: cleanText.min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password,
  phone: cleanText.min(7).max(25),
  address: cleanText.max(300).default(''),
  role: z.enum(['admin', 'superadmin']).default('admin')
});

/** Same as userInput but the password is only changed when one is supplied. */
export const userUpdateInput = userInput.extend({ password: password.optional().or(z.literal('')) });

export const feedbackInput = z.object({
  name: cleanText.min(2, 'Enter a name.').max(80),
  message: cleanText.min(4, 'Write a few words.').max(1500),
  rating: z.coerce.number().int().min(1, 'Pick 1 to 5 stars.').max(5),
  image: z.object({
    url: mediaUrl.or(z.literal('')).default(''),
    publicId: z.string().max(200).default('')
  }).default({ url: '', publicId: '' }),
  published: z.boolean().default(true)
});
