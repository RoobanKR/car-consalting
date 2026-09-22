export function slugify(text: unknown) {
  return String(text || '').toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

type SlugParts = { brand?: unknown; model?: unknown; year?: unknown; bodyType?: unknown; fuelType?: unknown; transmission?: unknown; location?: unknown };

export function buildCarSlug(car: SlugParts) {
  return slugify([car.brand, car.model, car.year, car.bodyType, car.fuelType, car.transmission, car.location].filter(Boolean).join(' '));
}

/** Structurally typed so any mongoose model can be passed without fighting its generics. */
type ExistsCheck = { exists(filter: Record<string, unknown>): Promise<unknown> };

export async function uniqueCarSlug(CarModel: ExistsCheck, base: string, excludeId?: string) {
  const query = excludeId ? { _id: { $ne: excludeId } } : {};
  let slug = base;
  let suffix = 2;
  while (await CarModel.exists({ ...query, slug })) slug = `${base}-${suffix++}`;
  return slug;
}
