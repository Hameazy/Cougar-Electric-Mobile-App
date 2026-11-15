// Where the browser map gets its street pictures ("tiles").
//
// The defaults are free, need no API key, and are fine for a class project:
// map data from OpenStreetMap, styled by CARTO. If the team ever launches for
// real, use a paid tile provider (MapTiler, Stadia, Mapbox...) by putting its URL
// in .env. The key goes inside that URL in .env, never in the code:
//   EXPO_PUBLIC_MAP_TILE_URL=https://api.example.com/tiles/{z}/{x}/{y}.png?key=YOUR_KEY
//   EXPO_PUBLIC_MAP_TILE_ATTRIBUTION=© Example Maps © OpenStreetMap
// (Heads up: anything named EXPO_PUBLIC_ ends up inside the app, so use a key
// that is restricted to your website's address.)
import type { MapTheme } from './ServiceMapTypes';

const cartoKey = process.env.EXPO_PUBLIC_CARTO_BASEMAP_KEY;
const OSM_CREDIT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const CARTO_CREDIT = `${OSM_CREDIT} &copy; <a href="https://carto.com/attributions">CARTO</a>`;

type TileLayerInfo = { url: string; attribution: string; subdomains: string };

const customUrl = process.env.EXPO_PUBLIC_MAP_TILE_URL;
const customCredit = process.env.EXPO_PUBLIC_MAP_TILE_ATTRIBUTION;

export const TILE_LAYERS: Record<MapTheme, TileLayerInfo> = customUrl
  ? {
      dark: { url: customUrl, attribution: customCredit ?? OSM_CREDIT, subdomains: 'abc' },
      streets: { url: customUrl, attribution: customCredit ?? OSM_CREDIT, subdomains: 'abc' },
    }
  : {
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
    };
