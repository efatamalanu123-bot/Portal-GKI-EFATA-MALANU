import bibleLiturgyDeskImg from '../assets/images/bible_liturgy_desk_1794592565039.jpg';
import churchExteriorSorongImg from '../assets/images/church_exterior_sorong_1794592565582.jpg';
import churchSanctuaryHeroImg from '../assets/images/church_sanctuary_hero_1794592563502.jpg';
import congregationFellowshipImg from '../assets/images/congregation_fellowship_1794592564508.jpg';

export const CHURCH_IMAGES = {
  sanctuary: churchSanctuaryHeroImg,
  fellowship: congregationFellowshipImg,
  bibleDesk: bibleLiturgyDeskImg,
  exterior: churchExteriorSorongImg,
} as const;

const LEGACY_ASSET_MAP: Record<string, string> = {
  '/src/assets/images/church_sanctuary_hero_1794592563502.jpg': churchSanctuaryHeroImg,
  '/src/assets/images/congregation_fellowship_1794592564508.jpg': congregationFellowshipImg,
  '/src/assets/images/bible_liturgy_desk_1794592565039.jpg': bibleLiturgyDeskImg,
  '/src/assets/images/church_exterior_sorong_1794592565582.jpg': churchExteriorSorongImg,
};

export function resolveChurchAssetUrl(url: string): string {
  return LEGACY_ASSET_MAP[url] || url;
}
