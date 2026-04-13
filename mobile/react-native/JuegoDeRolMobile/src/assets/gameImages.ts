import {Image, type ImageSourcePropType} from 'react-native';

export const gameImages = {
  town: require('./images/town.png'),
  store: require('./images/store.png'),
  cave: require('./images/cave.png'),
  beast: require('./images/beast.png'),
  walker: require('./images/walker.png'),
  dragon: require('./images/dragon.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export async function preloadGameImages(): Promise<void> {
  const preloadTasks = Object.values(gameImages).map(source => {
    const resolved = Image.resolveAssetSource(source);
    if (!resolved?.uri) {
      return Promise.resolve(true);
    }
    return Image.prefetch(resolved.uri);
  });

  await Promise.all(preloadTasks);
}
