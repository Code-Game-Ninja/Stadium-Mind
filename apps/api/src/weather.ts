// Live weather from Open-Meteo (free, no API key) at the stadium coordinates.
// The simulation scenarios can still override weather ('rain_starts'); a
// scenario override wins until an organizer applies the weather recommendation.

import type { Stadium, StadiumMetrics, WeatherInfo } from '@stadiummind/shared';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes — weather doesn't move faster
const cache = new Map<string, { info: WeatherInfo; expires: number }>();

// WMO weather interpretation codes → our 3-state condition
function mapWmoCode(code: number): { condition: StadiumMetrics['weather']; description: string } {
  if (code === 0) return { condition: 'clear', description: 'Clear sky' };
  if (code <= 3) return { condition: 'clear', description: 'Partly cloudy' };
  if (code === 45 || code === 48) return { condition: 'clear', description: 'Fog' };
  if (code <= 57) return { condition: 'rain', description: 'Drizzle' };
  if (code <= 67) return { condition: 'rain', description: 'Rain' };
  if (code <= 77) return { condition: 'rain', description: 'Snow' };
  if (code <= 82) return { condition: 'rain', description: 'Rain showers' };
  if (code <= 86) return { condition: 'rain', description: 'Snow showers' };
  return { condition: 'storm', description: 'Thunderstorm' };
}

export async function fetchLiveWeather(stadium: Stadium): Promise<WeatherInfo | null> {
  if (stadium.lat == null || stadium.lon == null) return null;

  const key = stadium.id;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.info;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${stadium.lat}&longitude=${stadium.lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const json = await res.json();
    const current = json.current;
    if (!current) return null;

    const { condition, description } = mapWmoCode(Number(current.weather_code ?? 0));
    const info: WeatherInfo = {
      source: 'live',
      condition,
      tempC: typeof current.temperature_2m === 'number' ? Math.round(current.temperature_2m) : undefined,
      windKmh: typeof current.wind_speed_10m === 'number' ? Math.round(current.wind_speed_10m) : undefined,
      description: `${description} in ${stadium.hostCity}`,
    };
    cache.set(key, { info, expires: Date.now() + CACHE_TTL });
    return info;
  } catch (err) {
    console.warn('Open-Meteo fetch failed:', err);
    return cached?.info ?? null;
  }
}
