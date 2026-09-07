import { WifiIcon, SnowflakeIcon, TvIcon, BedIcon, BathIcon, CupIcon, BuildingIcon, CheckIcon } from './icons';

// Amenities are free-text labels stored per room type (room_types.amenities).
// Match common keywords to a nicer icon; anything else falls back to a
// generic check mark rather than guessing.
const ICON_RULES = [
  [/wi-?fi/i, WifiIcon],
  [/air ?con|\bac\b/i, SnowflakeIcon],
  [/\btv\b|television/i, TvIcon],
  [/bed/i, BedIcon],
  [/bath/i, BathIcon],
  [/minibar|drink|coffee|tea/i, CupIcon],
  [/view|living room|city|suite/i, BuildingIcon],
];

function iconFor(label) {
  const match = ICON_RULES.find(([pattern]) => pattern.test(label));
  return match ? match[1] : CheckIcon;
}

// `amenities` is an array of label strings (from the API). Returns the shape
// AmenityList expects: [{ icon, label }].
export function toAmenityList(amenities) {
  if (!amenities || amenities.length === 0) return [];
  return amenities.map((label) => ({ icon: iconFor(label), label }));
}
