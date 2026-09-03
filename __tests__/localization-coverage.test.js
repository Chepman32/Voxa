const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const {
  resolveLocale,
  supportedLocales,
  translations,
} = require('../src/i18n/translations');
const {
  onboardingCards,
  subtitleBackgroundColorOptions,
  subtitleFontOptions,
  subtitleHighlightColorOptions,
  subtitlePositionOptions,
  subtitleTextColorOptions,
} = require('../src/theme/tokens');

const projectRoot = path.resolve(__dirname, '..');
const componentRoot = path.join(projectRoot, 'src', 'components');
const nativeLocales = supportedLocales.filter(locale => locale !== 'en');

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

describe('localization coverage', () => {
  it('resolves regional locales and falls back for unsupported languages', () => {
    expect(resolveLocale('pt-BR')).toBe('pt');
    expect(resolveLocale('PL-pl')).toBe('en');
  });

  it('keeps every locale in parity with English', () => {
    const englishKeys = Object.keys(translations.en).sort();

    for (const locale of supportedLocales) {
      expect(Object.keys(translations[locale]).sort()).toEqual(englishKeys);
      for (const key of englishKeys) {
        expect(translations[locale][key].trim()).not.toBe('');
      }
    }
  });

  it('does not render hardcoded copy from JSX', () => {
    const violations = [];
    const allowedCopy = new Set(['LOCALSUB']);
    const literalProps = new Set(['accessibilityLabel', 'placeholder']);

    for (const filePath of walkFiles(componentRoot).filter(file =>
      file.endsWith('.tsx'),
    )) {
      const source = fs.readFileSync(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );

      const visit = node => {
        if (ts.isJsxText(node)) {
          const copy = node.getText(sourceFile).replace(/\s+/g, ' ').trim();
          if (/[A-Za-z]/.test(copy) && !allowedCopy.has(copy)) {
            const line =
              sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
                .line + 1;
            violations.push(`${path.relative(projectRoot, filePath)}:${line} ${copy}`);
          }
        }

        if (
          ts.isJsxAttribute(node) &&
          literalProps.has(node.name.text) &&
          node.initializer &&
          ts.isStringLiteral(node.initializer) &&
          /[A-Za-z]/.test(node.initializer.text)
        ) {
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
              .line + 1;
          violations.push(
            `${path.relative(projectRoot, filePath)}:${line} ${node.name.text}`,
          );
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    expect(violations).toEqual([]);
  });

  it('uses translation keys for onboarding cards and style option labels', () => {
    for (const card of onboardingCards) {
      expect(translations.en[card.eyebrowKey]).toBeDefined();
      expect(translations.en[card.titleKey]).toBeDefined();
      expect(translations.en[card.descriptionKey]).toBeDefined();
      if (card.ctaLabelKey) {
        expect(translations.en[card.ctaLabelKey]).toBeDefined();
      }
    }

    const localizedOptionGroups = [
      subtitleFontOptions,
      subtitleTextColorOptions,
      subtitleHighlightColorOptions,
      subtitleBackgroundColorOptions,
      subtitlePositionOptions,
    ];
    for (const options of localizedOptionGroups) {
      for (const option of options) {
        expect(translations.en[option.labelKey]).toBeDefined();
      }
    }
  });

  it('provides localized native permission and notification copy', () => {
    for (const locale of nativeLocales) {
      const infoPlistStrings = fs.readFileSync(
        path.join(projectRoot, 'ios', 'LocalSub', `${locale}.lproj`, 'InfoPlist.strings'),
        'utf8',
      );
      expect(infoPlistStrings).toContain('NSPhotoLibraryUsageDescription');
      expect(infoPlistStrings).toContain('NSPhotoLibraryAddUsageDescription');
      expect(infoPlistStrings).toContain('NSSpeechRecognitionUsageDescription');

      const androidStrings = fs.readFileSync(
        path.join(
          projectRoot,
          'android',
          'app',
          'src',
          'main',
          'res',
          `values-${locale}`,
          'strings.xml',
        ),
        'utf8',
      );
      expect(androidStrings).toContain('notification_channel_reminders');
      expect(androidStrings).toContain(
        'notification_channel_reminders_description',
      );
    }
  });
});
