import { describe, expect, test } from 'vitest';
import {
  toUpperCase, toLowerCase, toTitleCase, toSentenceCase,
  toCamelCase, toPascalCase, toSnakeCase, toKebabCase,
  reverseCharacters, reverseWords, reverseLines,
  slugify, SLUGIFY_DEFAULTS,
  sortText, DEFAULT_SORT_OPTIONS,
  toKatakana, toHiragana,
} from '../utils/text.js';

describe('text utils', () => {
  test('toUpperCase', () => expect(toUpperCase('hello')).toBe('HELLO'));
  test('toLowerCase', () => expect(toLowerCase('HELLO')).toBe('hello'));
  test('toTitleCase', () => expect(toTitleCase('hello world')).toBe('Hello World'));
  test('toSentenceCase', () => expect(toSentenceCase('hello world')).toBe('Hello world'));
  test('toCamelCase', () => expect(toCamelCase('hello world')).toBe('helloWorld'));
  test('toPascalCase', () => expect(toPascalCase('hello world')).toBe('HelloWorld'));
  test('toSnakeCase', () => expect(toSnakeCase('hello world')).toBe('hello_world'));
  test('toKebabCase', () => expect(toKebabCase('hello world')).toBe('hello-world'));
  test('reverseCharacters', () => expect(reverseCharacters('hello')).toBe('olleh'));
  test('reverseWords', () => expect(reverseWords('hello world')).toBe('world hello'));
  test('reverseLines', () => expect(reverseLines('a\nb')).toBe('b\na'));
  test('slugify', () => expect(slugify('Hello World', SLUGIFY_DEFAULTS)).toBe('hello-world'));
  test('sortText', () => expect(sortText('b\na', DEFAULT_SORT_OPTIONS)).toBe('a\nb'));
  test('toKatakana', () => expect(toKatakana('あいう')).toBe('アイウ'));
  test('toHiragana', () => expect(toHiragana('アイウ')).toBe('あいう'));
});
