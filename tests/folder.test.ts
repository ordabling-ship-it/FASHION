import { describe, expect, it } from 'vitest';
import { groupFiles, itemKeyFor } from '../src/server/services/folder';

describe('input folder grouping', () => {
  it('groups by subfolder and by filename prefix', () => {
    const g = groupFiles([
      'red-dress/front.jpg',
      'red-dress/back.JPG',
      'red-dress/info.json',
      'jeans_front.png',
      'jeans_back.webp',
      'Kurtka Zimowa.heic',
      'processed/old/front.jpg',
      'notes.txt',
    ]);
    expect([...g.keys()].sort()).toEqual(['jeans', 'kurtka-zimowa', 'red-dress']);
    expect(g.get('red-dress')).toHaveLength(2);
    expect(g.get('jeans')).toHaveLength(2);
  });

  it('ignores processed/ and hidden files', () => {
    expect(itemKeyFor('processed/a.jpg')).toBeNull();
    expect(itemKeyFor('.DS_Store')).toBeNull();
    expect(itemKeyFor('Sukienka Łączka_1.jpg')).toBe('sukienka-laczka');
  });
});
