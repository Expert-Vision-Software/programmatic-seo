import { describe, expect, it } from 'vitest';
import { PACKAGE_NAME } from './index.js';

describe('package scaffold', () => {
  it('exposes the package name', () => {
    expect(PACKAGE_NAME).toBe('@expert-vision-software/programmatic-seo');
  });
});
