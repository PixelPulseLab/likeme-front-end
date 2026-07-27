import { BOTTOM_DOCK_BAR_HEIGHT, BOTTOM_DOCK_SUPPORT_GAP } from '@/constants/bottomDockBar';
import { supportFloatingBottomOffset } from '@/utils/layout/supportFloatingBottomOffset';

describe('supportFloatingBottomOffset', () => {
  it('sobe o suporte acima do composer no PostDetail', () => {
    expect(supportFloatingBottomOffset('PostDetail', false, 34)).toBe(BOTTOM_DOCK_BAR_HEIGHT + BOTTOM_DOCK_SUPPORT_GAP);
  });

  it('sobe o suporte acima do menu flutuante', () => {
    expect(supportFloatingBottomOffset('CommunityList', true, 0)).toBe(
      BOTTOM_DOCK_BAR_HEIGHT + BOTTOM_DOCK_SUPPORT_GAP,
    );
  });

  it('usa inset padrão sem barra inferior', () => {
    expect(supportFloatingBottomOffset('CommunityList', false, 34)).toBe(34 + 20);
  });
});
