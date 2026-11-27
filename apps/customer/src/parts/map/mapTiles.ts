// Where the browser map gets its street pictures ("tiles").
//
// For light local development the no-key fallback uses OpenStreetMap's standard
// tile server. Browser requests provide a normal User-Agent/Referer and Leaflet
// leaves browser caching enabled, as required by OSM's tile usage policy. For a
// production launch, configure a hosted provider by putting its URL in .env.
// The key goes inside that URL in .env, never in the code:
//   EXPO_PUBLIC_MAP_TILE_URL=https://api.example.com/tiles/{z}/{x}/{y}.png?key=YOUR_KEY
//   EXPO_PUBLIC_MAP_TILE_ATTRIBUTION=© Example Maps © OpenStreetMap
// (Heads up: anything named EXPO_PUBLIC_ ends up inside the app, so use a key
// that is restricted to your website's address.)
import type { MapTheme } from './ServiceMapTypes';

const cartoKey = process.env.EXPO_PUBLIC_CARTO_BASEMAP_KEY;
const mapTilerKey = process.env.EXPO_PUBLIC_MAPTILER_API_KEY;
const OSM_CREDIT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
const CARTO_CREDIT = `${OSM_CREDIT} &copy; <a href="https://carto.com/attributions">CARTO</a>`;
const MAPTILER_CREDIT = '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

type TileLayerInfo = { url: string; attribution: string; subdomains: string };

type StyledTileLayerInfo = TileLayerInfo & {
  darkFilter?: boolean;
  showMapTilerLogo?: boolean;
};
type CustomerMapTheme = Exclude<MapTheme, 'navigation-light'>;

const customUrl = process.env.EXPO_PUBLIC_MAP_TILE_URL;
const customCredit = process.env.EXPO_PUBLIC_MAP_TILE_ATTRIBUTION;

const osmTiles: Record<CustomerMapTheme, StyledTileLayerInfo> = {
  dark: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_CREDIT,
    subdomains: '',
    darkFilter: true,
  },
  streets: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_CREDIT,
    subdomains: '',
  },
};

const cartoTiles: Record<CustomerMapTheme, StyledTileLayerInfo> | undefined = cartoKey
  ? {
      dark: {
        url: `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
        attribution: CARTO_CREDIT,
        subdomains: 'abcd',
      },
      streets: {
        url: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
        attribution: CARTO_CREDIT,
        subdomains: 'abcd',
      },
    }
  : undefined;

const customerTileLayers: Record<CustomerMapTheme, StyledTileLayerInfo> = customUrl
  ? {
      dark: { url: customUrl, attribution: customCredit ?? OSM_CREDIT, subdomains: 'abc' },
      streets: { url: customUrl, attribution: customCredit ?? OSM_CREDIT, subdomains: 'abc' },
    }
  : cartoTiles ?? osmTiles;

// CE-44 web navigation gets a clean light basemap without changing customer
// map themes. MapTiler is opt-in; OSM remains the no-key development fallback.
const navigationLightTiles: StyledTileLayerInfo = mapTilerKey
  ? {
      url: `https://api.maptiler.com/maps/streets-v4-light/256/{z}/{x}/{y}.png?key=${encodeURIComponent(mapTilerKey)}`,
      attribution: MAPTILER_CREDIT,
      subdomains: '',
      showMapTilerLogo: true,
    }
  : {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: OSM_CREDIT,
      subdomains: '',
    };

export const TILE_LAYERS: Record<MapTheme, StyledTileLayerInfo> = {
  ...customerTileLayers,
  'navigation-light': navigationLightTiles,
};
