const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const identityTestPath = path.join(__dirname, 'app-identity.test.js');
const legacyBrand = String.fromCharCode(86, 111, 120, 97);
const textExtensions = new Set([
  '.gradle',
  '.h',
  '.java',
  '.js',
  '.json',
  '.kt',
  '.m',
  '.md',
  '.pbxproj',
  '.plist',
  '.rb',
  '.strings',
  '.swift',
  '.ts',
  '.tsx',
  '.xcscmblueprint',
  '.xcscheme',
  '.xcworkspacedata',
  '.xml',
  '.yaml',
  '.yml',
]);
const ignoredDirectories = new Set([
  '.build',
  '.codebase-memory',
  '.cxx',
  '.git',
  '.gradle',
  '.kotlin',
  '.qa',
  '.yarn',
  'Pods',
  'build',
  'coverage',
  'node_modules',
  'vendor',
]);

function walkTextFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      return [];
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walkTextFiles(entryPath);
    }

    if (entry.name === 'link-assets-manifest.json') {
      return [];
    }

    return textExtensions.has(path.extname(entry.name)) ? [entryPath] : [];
  });
}

describe('LocalSub app identity', () => {
  it('uses the LocalSub React Native registration name', () => {
    const appConfig = require('../app.json');

    expect(appConfig).toEqual({
      name: 'LocalSub',
      displayName: 'LocalSub',
    });
  });

  it('uses LocalSub in the visible splash and native launcher names', () => {
    const splash = fs.readFileSync(
      path.join(
        projectRoot,
        'src',
        'components',
        'splash',
        'SplashSequence.tsx',
      ),
      'utf8',
    );
    const androidStrings = fs.readFileSync(
      path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
        'values',
        'strings.xml',
      ),
      'utf8',
    );
    const iosInfo = fs.readFileSync(
      path.join(projectRoot, 'ios', 'LocalSub', 'Info.plist'),
      'utf8',
    );

    expect(splash).toContain('>LOCALSUB</Text>');
    expect(androidStrings).toContain(
      '<string name="app_name">LocalSub</string>',
    );
    expect(iosInfo).toContain('<string>LocalSub</string>');
  });

  it('uses the LocalSub native application identifiers', () => {
    const androidBuild = fs.readFileSync(
      path.join(projectRoot, 'android', 'app', 'build.gradle'),
      'utf8',
    );
    const iosProject = fs.readFileSync(
      path.join(projectRoot, 'ios', 'LocalSub.xcodeproj', 'project.pbxproj'),
      'utf8',
    );

    expect(androidBuild).toContain('namespace "com.localsub"');
    expect(androidBuild).toContain('applicationId "com.localsub"');
    expect(iosProject).toContain('PRODUCT_BUNDLE_IDENTIFIER = com.localsub;');
  });

  it('contains no legacy brand references in source or project metadata', () => {
    const legacyPattern = new RegExp(legacyBrand, 'i');
    const violations = walkTextFiles(projectRoot)
      .filter(filePath => filePath !== identityTestPath)
      .flatMap(filePath => {
        const relativePath = path.relative(projectRoot, filePath);
        const source = fs.readFileSync(filePath, 'utf8');
        return legacyPattern.test(relativePath) || legacyPattern.test(source)
          ? [relativePath]
          : [];
      });

    expect(violations).toEqual([]);
  });
});
