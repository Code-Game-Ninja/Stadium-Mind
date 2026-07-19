import { describe, it, expect } from 'vitest';
import { getMatchState } from './store';
import { MATCHES } from '@stadiummind/shared';

describe('API Store', () => {
  it('should fetch a match state for demo matches without firebase', async () => {
    // Should use the in-memory fallback since USE_FIREBASE isn't defined here
    const matchId = MATCHES[0].id;
    const state = await getMatchState(matchId);
    expect(state).toBeDefined();
    expect(state?.zones).toBeDefined();
  });
});
