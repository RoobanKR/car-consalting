import { NextResponse } from 'next/server';
import { adminRoute } from '@/lib/server/http';
import { Car } from '@/lib/server/models/Car';
import { Enquiry } from '@/lib/server/models/Enquiry';

export const dynamic = 'force-dynamic';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Monday-based week, which is how a dealership counts "this week". */
function startOfWeek(now: Date) {
  const day = (now.getDay() + 6) % 7;
  const monday = startOfDay(now);
  monday.setDate(monday.getDate() - day);
  return monday;
}

const soldMatch = (from: Date, to: Date, salesperson?: string) => ({
  status: 'sold',
  'sale.soldAt': { $gte: from, $lte: to },
  ...(salesperson ? { 'sale.salespersonEmail': salesperson } : {})
});

/** Enquiries have no salesperson on them, so unlike sales they are only ever
 *  narrowed by date. The UI says as much when a person filter is active. */
const asked = (from: Date, to: Date) => ({ createdAt: { $gte: from, $lte: to } });

async function summarise(from: Date, to: Date, salesperson?: string) {
  const [row] = await Car.aggregate([
    { $match: soldMatch(from, to, salesperson) },
    { $group: { _id: null, carsSold: { $sum: 1 }, revenue: { $sum: '$sale.soldPrice' } } }
  ]);
  const carsSold = row?.carsSold || 0;
  const revenue = row?.revenue || 0;
  return { carsSold, revenue, averagePrice: carsSold ? Math.round(revenue / carsSold) : 0 };
}

export const GET = adminRoute(async request => {
  const params = new URL(request.url).searchParams;
  const now = new Date();
  const salesperson = params.get('salesperson')?.trim() || undefined;

  // The selected range drives the headline figures, the table and the breakdowns.
  const parsed = {
    from: params.get('from') ? new Date(`${params.get('from')}T00:00:00`) : null,
    to: params.get('to') ? new Date(`${params.get('to')}T23:59:59.999`) : null
  };
  const period = params.get('period') || 'month';
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const presets: Record<string, [Date, Date]> = {
    week: [startOfWeek(now), now],
    month: [new Date(now.getFullYear(), now.getMonth(), 1), now],
    year: [yearStart, now],
    all: [new Date(2000, 0, 1), now]
  };
  const [presetFrom, presetTo] = presets[period] || presets.month;
  const from = parsed.from || presetFrom;
  const to = parsed.to || presetTo;

  // Which year the month-by-month breakdown covers. This takes the END of the
  // range: "All time" starts in 2000, and charting that year showed twelve empty
  // months next to a non-zero total.
  const chartYear = to.getFullYear();
  const chartStart = new Date(chartYear, 0, 1);
  const chartEnd = new Date(chartYear, 11, 31, 23, 59, 59, 999);

  const [selected, week, month, year, allTime, byMonth, bySalesperson, buyers, people, activeCars, totalCars,
    askedByStatus, askedWeek, askedMonth, askedYear, askedAll, askedByMonth, askedTopCars, askedRecent] = await Promise.all([
    summarise(from, to, salesperson),
    summarise(presets.week[0], presets.week[1], salesperson),
    summarise(presets.month[0], presets.month[1], salesperson),
    summarise(presets.year[0], presets.year[1], salesperson),
    summarise(presets.all[0], presets.all[1], salesperson),
    Car.aggregate([
      { $match: soldMatch(chartStart, chartEnd, salesperson) },
      { $group: { _id: { $month: '$sale.soldAt' }, carsSold: { $sum: 1 }, revenue: { $sum: '$sale.soldPrice' } } },
      { $sort: { _id: 1 } }
    ]),
    Car.aggregate([
      { $match: soldMatch(from, to) },
      { $group: {
          _id: { $ifNull: ['$sale.salespersonEmail', ''] },
          name: { $first: '$sale.salespersonName' },
          carsSold: { $sum: 1 },
          revenue: { $sum: '$sale.soldPrice' },
          lastSale: { $max: '$sale.soldAt' }
      } },
      { $sort: { carsSold: -1, revenue: -1 } }
    ]),
    Car.find(soldMatch(from, to, salesperson))
      .select('brand model year slug sale')
      .sort({ 'sale.soldAt': -1 })
      .limit(200)
      .lean(),
    // Every salesperson on record, so the filter lists people with no sales this period too.
    Car.aggregate([
      { $match: { status: 'sold', 'sale.salespersonEmail': { $nin: [null, ''] } } },
      { $group: { _id: '$sale.salespersonEmail', name: { $first: '$sale.salespersonName' } } },
      { $sort: { name: 1 } }
    ]),
    Car.countDocuments({ status: 'active' }),
    Car.countDocuments({}),

    // --- enquiries, over the same range ---
    Enquiry.aggregate([{ $match: asked(from, to) }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Enquiry.countDocuments(asked(presets.week[0], presets.week[1])),
    Enquiry.countDocuments(asked(presets.month[0], presets.month[1])),
    Enquiry.countDocuments(asked(presets.year[0], presets.year[1])),
    Enquiry.countDocuments(asked(presets.all[0], presets.all[1])),
    Enquiry.aggregate([
      { $match: asked(chartStart, chartEnd) },
      { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    // Which cars people are actually asking about.
    Enquiry.aggregate([
      { $match: asked(from, to) },
      { $group: { _id: '$carId', count: { $sum: 1 }, lastAt: { $max: '$createdAt' } } },
      { $sort: { count: -1, lastAt: -1 } },
      { $limit: 8 },
      { $lookup: { from: 'cars', localField: '_id', foreignField: '_id', as: 'car' } },
      { $unwind: { path: '$car', preserveNullAndEmptyArrays: true } }
    ]),
    Enquiry.find(asked(from, to))
      .populate('carId', 'brand model year slug')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const statusCount = (name: string) => askedByStatus.find(entry => entry._id === name)?.count || 0;
  const askedTotal = askedByStatus.reduce((sum, entry) => sum + entry.count, 0);
  const askedMonthly = monthNames.map((label, index) => ({
    month: index + 1, label, count: askedByMonth.find(entry => entry._id === index + 1)?.count || 0
  }));
  type PopulatedCar = { brand?: string; model?: string; year?: number; slug?: string } | null;
  const monthly = monthNames.map((label, index) => {
    const found = byMonth.find(entry => entry._id === index + 1);
    return { month: index + 1, label, carsSold: found?.carsSold || 0, revenue: found?.revenue || 0 };
  });

  const enquiries = {
    selected: { total: askedTotal, new: statusCount('new'), contacted: statusCount('contacted'), closed: statusCount('closed') },
    quick: { week: askedWeek, month: askedMonth, year: askedYear, allTime: askedAll },
    monthly: askedMonthly,
    topCars: askedTopCars.map(entry => ({
      carId: String(entry._id),
      car: entry.car ? `${entry.car.year} ${entry.car.brand} ${entry.car.model}` : 'Car removed',
      slug: entry.car?.slug || '',
      count: entry.count as number,
      lastAt: entry.lastAt
    })),
    recent: askedRecent.map(entry => {
      const car = entry.carId as PopulatedCar;
      return {
        _id: String(entry._id),
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        city: entry.city || '',
        message: entry.message || '',
        status: entry.status,
        car: car?.brand ? `${car.year} ${car.brand} ${car.model}` : 'Car removed',
        slug: car?.slug || '',
        createdAt: entry.createdAt
      };
    })
  };

  return NextResponse.json({
    range: { from: from.toISOString(), to: to.toISOString(), period, salesperson: salesperson || '', chartYear },
    selected,
    quick: { week, month, year, allTime },
    inventory: { activeCars, totalCars, soldCars: allTime.carsSold },
    monthly,
    bySalesperson: bySalesperson.map(entry => ({
      email: entry._id || '',
      name: entry.name || 'Unassigned',
      carsSold: entry.carsSold,
      revenue: entry.revenue,
      averagePrice: entry.carsSold ? Math.round(entry.revenue / entry.carsSold) : 0,
      lastSale: entry.lastSale
    })),
    people: people.map(entry => ({ email: entry._id as string, name: (entry.name as string) || (entry._id as string) })),
    enquiries,
    buyers: buyers.map(car => ({
      carId: String(car._id),
      car: `${car.year} ${car.brand} ${car.model}`,
      slug: car.slug || '',
      buyerName: car.sale?.buyerName || '',
      buyerPhone: car.sale?.buyerPhone || '',
      buyerEmail: car.sale?.buyerEmail || '',
      soldPrice: car.sale?.soldPrice || 0,
      soldAt: car.sale?.soldAt,
      salespersonName: car.sale?.salespersonName || '',
      salespersonEmail: car.sale?.salespersonEmail || ''
    }))
  });
});
