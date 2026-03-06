import { launchImageLibrary } from 'react-native-image-picker';

export async function pickVideoAsset() {
  const response = await launchImageLibrary({
    mediaType: 'video',
    selectionLimit: 1,
    videoQuality: 'high',
    presentationStyle: 'fullScreen',
    assetRepresentationMode: 'compatible',
    formatAsMp4: true,
    includeExtra: true,
  });

  if (response.didCancel) {
    return null;
  }

  if (response.errorCode || response.errorMessage) {
    throw new Error(response.errorMessage ?? response.errorCode ?? 'Unable to open the photo library.');
  }

  const asset = response.assets?.[0];
  if (!asset?.uri) {
    throw new Error('The selected video could not be read.');
  }

  return asset;
}
