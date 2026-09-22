import { NextResponse } from 'next/server';
import { adminRoute } from '@/lib/server/http';
import { Enquiry } from '@/lib/server/models/Enquiry';
import '@/lib/server/models/Car';

export const dynamic = 'force-dynamic';

// The Car model import above registers the schema that populate('carId') resolves.
export const GET = adminRoute(async () => NextResponse.json(await Enquiry.find().populate('carId', 'brand model year').sort({ createdAt: -1 }).lean()));
