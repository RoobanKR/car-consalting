import { NextResponse } from 'next/server';
import { adminRoute } from '@/lib/server/http';
import { Car } from '@/lib/server/models/Car';

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

  // Which year the month-by-month breakdown covers.
  const chartYear = from.getFullYear();
  const chartStart = new Date(chartYear, 0, 1);
  const chartEnd = new Date(chartYear, 11, 31, 23, 59, 59, 999);

  const [selected, week, month, year, allTime, byMonth, bySalesperson, buyers, people, activeCars, totalCars] = await Promise.all([
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
    Car.countDocuments({})
  ]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = monthNames.map((label, index) => {
    const found = byMonth.find(entry => entry._id === index + 1);
    return { month: index + 1, label, carsSold: found?.carsSold || 0, revenue: found?.revenue || 0 };
  });

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
