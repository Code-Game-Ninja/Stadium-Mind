import { describe, it, expect } from 'vitest';
import { cn, healthTone, loadLabel } from './utils';

describe('Web Utilities', () => {
  it('cn: should concatenate classes and filter out falsy values', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('class1', false, 'class3', null, undefined)).toBe('class1 class3');
  });

  it('healthTone: should return correct tone based on score', () => {
    expect(healthTone(90).label).toBe('Healthy');
    expect(healthTone(70).label).toBe('Watch');
    expect(healthTone(40).label).toBe('Critical');
  });

  it('loadLabel: should return correct label for ZoneLoad', () => {
    expect(loadLabel['green']).toBe('Normal');
    expect(loadLabel['yellow']).toBe('Busy');
    expect(loadLabel['red']).toBe('Congested');
  });
});
