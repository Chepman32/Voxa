const { readFileSync } = require('fs');
const path = require('path');

const resourcesRoot = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'res',
);

function readResource(relativePath) {
  return readFileSync(path.join(resourcesRoot, relativePath), 'utf8');
}

describe('Android adaptive launcher icon', () => {
  it.each(['ic_launcher.xml', 'ic_launcher_round.xml'])(
    'defines %s as an adaptive icon on Android 8+',
    fileName => {
      const icon = readResource(`mipmap-anydpi-v26/${fileName}`);

      expect(icon).toContain('<adaptive-icon');
      expect(icon).toContain(
        '<background android:drawable="@drawable/ic_launcher_background"',
      );
      expect(icon).toContain(
        '<foreground android:drawable="@drawable/ic_launcher_foreground"',
      );
    },
  );

  it.each(['ic_launcher.xml', 'ic_launcher_round.xml'])(
    'provides a monochrome layer in the Android 13 %s resource',
    fileName => {
      const icon = readResource(`mipmap-anydpi-v33/${fileName}`);

      expect(icon).toContain(
        '<monochrome android:drawable="@drawable/ic_launcher_monochrome"',
      );
    },
  );

  it('uses a non-white full-bleed background', () => {
    const background = readResource('drawable/ic_launcher_background.xml');

    expect(background).toContain('<gradient');
    expect(background).not.toMatch(/#(?:FF)?FFFFFF/i);
  });

  it('uses a square foreground PNG with a real alpha channel', () => {
    const foreground = readFileSync(
      path.join(resourcesRoot, 'drawable-nodpi', 'ic_launcher_foreground_art.png'),
    );

    expect(foreground.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(foreground.readUInt32BE(16)).toBe(foreground.readUInt32BE(20));
    expect([4, 6]).toContain(foreground[25]);
  });
});
