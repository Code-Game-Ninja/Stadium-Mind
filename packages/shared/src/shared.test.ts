import { describe, it, expect } from 'vitest';
import { loadFromOccupancy, STADIUMS, MATCHES } from './demo-data';

describe('Shared Utilities', () => {
  it('should calculate load from occupancy correctly', () => {
    expect(loadFromOccupancy(50)).toBe('green');
    expect(loadFromOccupancy(65)).toBe('yellow');
    expect(loadFromOccupancy(80)).toBe('yellow');
    expect(loadFromOccupancy(85)).toBe('red');
    expect(loadFromOccupancy(100)).toBe('red');
  });

  it('should export valid stadium and match demo data', () => {
    expect(STADIUMS.length).toBeGreaterThan(0);
    expect(MATCHES.length).toBeGreaterThan(0);
    expect(STADIUMS[0]).toHaveProperty('id');
    expect(MATCHES[0]).toHaveProperty('id');
  });
});
