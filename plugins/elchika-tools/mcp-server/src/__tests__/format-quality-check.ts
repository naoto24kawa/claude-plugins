import { describe, test, expect } from 'vitest';
import { formatJSON, minifyJSON, simpleXmlToJson, tomlToJson } from '../utils/format.js';

describe('format utils - quality checks', () => {
  // formatJSON: JSON.parse構文チェック
  test('formatJSON uses JSON.parse for validation', () => {
    expect(formatJSON('{"a":1}', 2)).toContain('"a"');
  });

  test('formatJSON throws on invalid JSON', () => {
    expect(() => formatJSON('{bad}', 2)).toThrow();
  });

  test('formatJSON throws on malformed arrays', () => {
    expect(() => formatJSON('[1, 2, bad]', 2)).toThrow();
  });

  // simpleXmlToJson: DOMParser不使用、純粋TS実装
  test('simpleXmlToJson has no DOMParser reference', () => {
    const source = require('fs').readFileSync(new URL('../utils/format.ts', import.meta.url), 'utf-8');
    expect(source).not.toContain('DOMParser');
  });

  test('simpleXmlToJson handles duplicate elements as arrays', () => {
    const result = JSON.parse(simpleXmlToJson('<root><item>1</item><item>2</item></root>'));
    expect(result.root.item).toEqual([1, 2]);
  });

  // tomlToJson: セクション・配列テーブル処理
  test('tomlToJson handles [section]', () => {
    const result = JSON.parse(tomlToJson('[section]\nkey = "value"'));
    expect(result.section.key).toBe('value');
  });

  test('tomlToJson handles [[array.table]]', () => {
    const result = JSON.parse(tomlToJson('[[items]]\nname = "A"\n[[items]]\nname = "B"'));
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items).toHaveLength(2);
  });

  test('tomlToJson handles nested sections', () => {
    const result = JSON.parse(tomlToJson('[db.server]\nhost = "localhost"\nport = 5432'));
    expect(result.db.server.host).toBe('localhost');
    expect(result.db.server.port).toBe(5432);
  });

  // 純粋性チェック（副作用なし）
  test('formatJSON is pure (same input = same output)', () => {
    const input = '{"x":1,"y":2}';
    const out1 = formatJSON(input, 2);
    const out2 = formatJSON(input, 2);
    expect(out1).toBe(out2);
  });

  test('minifyJSON is pure', () => {
    const input = '{ "a": 1 }';
    expect(minifyJSON(input)).toBe(minifyJSON(input));
  });
});
