import { resolveCompletedModuleIds } from '@/components/sections/program/ModuleAccordion';

describe('resolveCompletedModuleIds', () => {
  it('aplica conclusões manuais e remove módulos explicitamente desmarcados', () => {
    const completedIds = resolveCompletedModuleIds(
      [
        { id: 'auto-completed', completed: true },
        { id: 'manual-completed', completed: false },
        { id: 'pending', completed: false },
      ],
      ['manual-completed'],
      ['auto-completed'],
    );

    expect([...completedIds].sort()).toEqual(['manual-completed']);
  });
});
