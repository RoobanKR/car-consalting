import type { HeroMediaDoc } from './models/HeroMedia';

type HeroLean = HeroMediaDoc & { _id: unknown; createdAt?: Date };

export const publicShape = (media: HeroLean) => ({
  _id: String(media._id), type: media.type, url: media.url, posterUrl: media.posterUrl || '',
  label: media.label || '', width: media.width, height: media.height, duration: media.duration
});

export const adminShape = (media: HeroLean) => ({
  ...publicShape(media),
  publicId: media.publicId, format: media.format, bytes: media.bytes,
  active: media.active, createdAt: media.createdAt
});
