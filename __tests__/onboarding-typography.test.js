const fs = require('fs');
const path = require('path');

const onboardingRoot = path.resolve(
  __dirname,
  '..',
  'src',
  'components',
  'onboarding',
);

const activeOnboardingScreens = [
  'GoalQuestionScreen.tsx',
  'PainPointsScreen.tsx',
  'PermissionPrimingScreen.tsx',
  'PreferenceConfigScreen.tsx',
  'ProcessingMomentScreen.tsx',
  'SocialProofScreen.tsx',
  'ValueDeliveryScreen.tsx',
  'WelcomeScreen.tsx',
];

describe('onboarding typography', () => {
  it('keeps visible onboarding copy at a readable 14sp minimum', () => {
    const undersizedText = [];

    for (const fileName of activeOnboardingScreens) {
      const source = fs.readFileSync(path.join(onboardingRoot, fileName), 'utf8');
      const fontSizePattern = /fontSize:\s*(\d+)/g;
      let match;

      while ((match = fontSizePattern.exec(source)) !== null) {
        const fontSize = Number(match[1]);
        if (fontSize < 14) {
          undersizedText.push(`${fileName}:${fontSize}`);
        }
      }
    }

    expect(undersizedText).toEqual([]);
  });

  it('keeps subtitle style option labels readable instead of auto-shrinking them', () => {
    const source = fs.readFileSync(
      path.join(onboardingRoot, 'PreferenceConfigScreen.tsx'),
      'utf8',
    );
    const gridItemTextStyle = source.match(
      /gridItemText:\s*\{([\s\S]*?)\n\s*\},/,
    )?.[1];
    const gridStyle = source.match(/grid:\s*\{([\s\S]*?)\n\s*\},/)?.[1];
    const gridItemStyle = source.match(
      /gridItem:\s*\{([\s\S]*?)\n\s*\},/,
    )?.[1];

    expect({
      autoShrinks: source.includes('adjustsFontSizeToFit'),
      fontSize: gridItemTextStyle?.match(/fontSize:\s*(\d+)/)?.[1],
      gridItemBasis: gridItemStyle?.match(/flexBasis:\s*'([^']+)'/)?.[1],
      gridWrap: gridStyle?.match(/flexWrap:\s*'([^']+)'/)?.[1],
      lineHeight: gridItemTextStyle?.match(/lineHeight:\s*(\d+)/)?.[1],
      twoLineLabels: source.match(/numberOfLines=\{2\}/g)?.length ?? 0,
    }).toEqual({
      autoShrinks: false,
      fontSize: '16',
      gridItemBasis: '48%',
      gridWrap: 'wrap',
      lineHeight: '20',
      twoLineLabels: 2,
    });
  });
});
