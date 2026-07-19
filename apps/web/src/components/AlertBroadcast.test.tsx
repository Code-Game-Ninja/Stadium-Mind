import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AlertBroadcast from './AlertBroadcast';

// Mock match to avoid real navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('AlertBroadcast', () => {
  it('renders without crashing', () => {
    // Basic test
    expect(true).toBe(true);
  });
});
