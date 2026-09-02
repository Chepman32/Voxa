import {
  findSpeechLocaleOption,
  normalizeSpeechLocale,
  resolveRememberedSpeechLocale,
} from '../src/lib/speech-locale';

const options = [
  { label: 'English (United States)', value: 'en-US' },
  { label: 'Russian', value: 'ru-RU' },
];

describe('speech locale helpers', () => {
  it('normalizes Android and Apple locale variants to BCP-47 casing', () => {
    expect(normalizeSpeechLocale(' RU_ru ')).toBe('ru-RU');
    expect(normalizeSpeechLocale('zh_hans_cn')).toBe('zh-Hans-CN');
  });

  it('matches an underscore-form Russian locale to the available option', () => {
    expect(findSpeechLocaleOption('ru_RU', options)?.value).toBe('ru-RU');
  });

  it('resolves a language-only Russian preference to its available locale', () => {
    expect(resolveRememberedSpeechLocale('ru', options)).toBe('ru-RU');
  });
});
