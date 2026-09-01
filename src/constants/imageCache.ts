import type { ImageProps } from 'expo-image';

/**
 * Defaults aplicados a todo uso de `Image` (expo-image) no app.
 *
 * `memory-disk` garante cache persistente entre sessões; `transition` evita o
 * pisca branco ao trocar de tela quando a imagem ainda não está em memória.
 */
export const IMAGE_CACHE_POLICY: NonNullable<ImageProps['cachePolicy']> = 'memory-disk';

/** Transição padrão em ms para fade-in quando a imagem decodifica. */
export const IMAGE_TRANSITION_MS = 150;

/**
 * Placeholder neutro usado quando o consumidor não fornece um próprio.
 * Cor próxima ao fundo do app para não competir com o conteúdo.
 */
export const IMAGE_NEUTRAL_PLACEHOLDER_COLOR = '#E1DFCF';

/**
 * Prioridade alta para imagens "above the fold" (hero, avatar do header,
 * primeiros cards visíveis). Demais imagens podem usar `normal`/`low`.
 */
export const IMAGE_PRIORITY_HIGH: NonNullable<ImageProps['priority']> = 'high';

/**
 * Enquadramento de arte de comunidade/produto: `cover` centralizado corta o assunto
 * (rosto, logo) no topo, e ancorar em `top` sobra headroom demais — 25% fica entre os dois.
 */
export const IMAGE_CONTENT_POSITION_ABOVE_CENTER: NonNullable<ImageProps['contentPosition']> = {
  top: '35%',
  left: '50%',
};
