import AsyncStorage from '@react-native-async-storage/async-storage';
import storageService from '@/services/auth/storageService';

const COMPLETED_KEY = '@likeme:program_module_completed_ids';
const UNCOMPLETED_KEY = '@likeme:program_module_uncompleted_ids';

describe('storageService program module completion', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('guarda desmarcações explícitas separadas dos módulos concluídos', async () => {
    await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify({ 'program-1': ['module-1'] }));

    await storageService.setProgramModuleCompleted('program-1', 'module-1', false);

    await expect(storageService.getProgramModuleCompletedIds('program-1')).resolves.toEqual([]);
    await expect(storageService.getProgramModuleUncompletedIds('program-1')).resolves.toEqual(['module-1']);
  });

  it('remove desmarcação explícita quando o módulo é marcado novamente', async () => {
    await AsyncStorage.setItem(UNCOMPLETED_KEY, JSON.stringify({ 'program-1': ['module-1'] }));

    await storageService.setProgramModuleCompleted('program-1', 'module-1', true);

    await expect(storageService.getProgramModuleCompletedIds('program-1')).resolves.toEqual(['module-1']);
    await expect(storageService.getProgramModuleUncompletedIds('program-1')).resolves.toEqual([]);
  });
});
