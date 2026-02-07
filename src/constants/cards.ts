const cardModules = import.meta.glob('@/assets/images/cards/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

/** Map from filename (e.g. 'red7.png') to the Vite-resolved asset URL */
export const CARD_TEXTURES: Record<string, string> = {};
for (const [path, url] of Object.entries(cardModules)) {
  const filename = path.split('/').pop()!;
  CARD_TEXTURES[filename] = url;
}

/** The card back texture URL */
export const CARD_BACK_TEXTURE = CARD_TEXTURES['back.png'];
