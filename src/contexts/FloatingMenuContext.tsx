import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { FloatingMenu } from '@/components/ui/menu';
import { getSelectedIdFromNavState, shouldShowFloatingMenuByRoute } from '@/utils/floatingMenuRoutePolicy';

export type FloatingMenuItem = {
  id: string;
  icon?: string;
  iconImage?: ImageSourcePropType;
  label: string;
  fullLabel?: string;
  onPress: () => void;
};

type MenuState = {
  items: FloatingMenuItem[];
  selectedId?: string;
} | null;

type ActionsValue = {
  setMenu: (items: FloatingMenuItem[], selectedId?: string) => void;
  clearMenu: () => void;
};

type StateValue = {
  /** Itens do menu + rota atual permitem exibir o `FloatingMenu` (mesmo critério do overlay). */
  isFloatingMenuVisible: boolean;
};

/**
 * Split em dois contexts (actions x state) para evitar que consumidores que
 * so precisam disparar `setMenu`/`clearMenu` re-renderizem sempre que o menu
 * fica visivel/invisivel. Actions sao referencias estaveis (useCallback) —
 * quem assina o contexto de actions praticamente nunca re-renderiza por
 * causa do menu.
 */
const noopSetMenu: ActionsValue['setMenu'] = () => undefined;
const noopClearMenu: ActionsValue['clearMenu'] = () => undefined;

const floatingMenuActionsFallback: ActionsValue = {
  setMenu: noopSetMenu,
  clearMenu: noopClearMenu,
};

const floatingMenuStateFallback: StateValue = {
  isFloatingMenuVisible: false,
};

const FloatingMenuActionsContext = createContext<ActionsValue>(floatingMenuActionsFallback);
const FloatingMenuStateContext = createContext<StateValue>(floatingMenuStateFallback);

export const FloatingMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenuState] = useState<MenuState>(null);

  const showMenuByRoute = useNavigationState((state) => shouldShowFloatingMenuByRoute(state));
  const selectedIdFromRoute = useNavigationState((state) => getSelectedIdFromNavState(state));

  const setMenu = useCallback((items: FloatingMenuItem[], selectedId?: string) => {
    setMenuState({ items, selectedId });
  }, []);

  const clearMenu = useCallback(() => {
    setMenuState(null);
  }, []);

  const effectiveSelectedId = selectedIdFromRoute ?? menu?.selectedId;

  const showMenu = menu && showMenuByRoute;
  const isFloatingMenuVisible = Boolean(showMenu);

  const actionsValue = useMemo<ActionsValue>(() => ({ setMenu, clearMenu }), [setMenu, clearMenu]);
  const stateValue = useMemo<StateValue>(() => ({ isFloatingMenuVisible }), [isFloatingMenuVisible]);

  return (
    <FloatingMenuActionsContext.Provider value={actionsValue}>
      <FloatingMenuStateContext.Provider value={stateValue}>
        {children}
        {showMenu && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 10000, elevation: 10000 }]} pointerEvents='box-none'>
            <FloatingMenu items={menu.items} selectedId={effectiveSelectedId} />
          </View>
        )}
      </FloatingMenuStateContext.Provider>
    </FloatingMenuActionsContext.Provider>
  );
};

export function useFloatingMenuActions(): ActionsValue {
  return useContext(FloatingMenuActionsContext);
}

export function useIsFloatingMenuVisible(): boolean {
  return useContext(FloatingMenuStateContext).isFloatingMenuVisible;
}

/**
 * Wrapper de compatibilidade. Prefira `useFloatingMenuActions()` quando so
 * precisar de `setMenu`/`clearMenu`, ou `useIsFloatingMenuVisible()` quando
 * so precisar do estado — assim o componente nao re-renderiza por mudancas
 * do outro lado.
 */
export function useFloatingMenu(): ActionsValue & StateValue {
  const actions = useFloatingMenuActions();
  const isFloatingMenuVisible = useIsFloatingMenuVisible();
  return useMemo(() => ({ ...actions, isFloatingMenuVisible }), [actions, isFloatingMenuVisible]);
}

export const useSetFloatingMenu = (items: FloatingMenuItem[], selectedId?: string): void => {
  const { setMenu } = useFloatingMenuActions();

  React.useEffect(() => {
    setMenu(items, selectedId);
  }, [items, selectedId, setMenu]);
};
