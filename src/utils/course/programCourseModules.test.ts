import { moduleItemsFromProgramCourse } from '@/utils/course/programCourseModules';
import type { ProgramCourse } from '@/types/course/course';
import { isProtocolStepAutoCompleted } from '@/utils/course/protocolStepAutoCompleted';

jest.mock('@/utils/community/mappers', () => ({
  mapCommunityPostToPost: jest.fn(() => null),
}));

jest.mock('@/utils/course/protocolStepAutoCompleted', () => ({
  isProtocolStepAutoCompleted: jest.fn(),
}));

const mockedAutoCompleted = isProtocolStepAutoCompleted as jest.MockedFunction<typeof isProtocolStepAutoCompleted>;

const baseCourse: ProgramCourse = {
  type: 'program',
  communityId: 'community-1',
  steps: [
    {
      stepNumber: 1,
      title: 'Aula 1',
      postId: 'post-past',
      body: 'Conteúdo passado',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-10T00:00:00.000Z',
    },
    {
      stepNumber: 2,
      title: 'Aula 2',
      postId: 'post-future',
      body: 'Conteúdo futuro',
      createdAt: '2026-07-20T00:00:00.000Z',
      updatedAt: '2026-12-01T00:00:00.000Z',
    },
  ],
};

describe('moduleItemsFromProgramCourse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAutoCompleted.mockImplementation((updatedAt) => updatedAt === '2026-07-10T00:00:00.000Z');
  });

  it('define completed com base em updatedAt de cada step', () => {
    const modules = moduleItemsFromProgramCourse(baseCourse);

    expect(mockedAutoCompleted).toHaveBeenCalledWith('2026-07-10T00:00:00.000Z', undefined);
    expect(mockedAutoCompleted).toHaveBeenCalledWith('2026-12-01T00:00:00.000Z', undefined);
    expect(modules).toHaveLength(2);
    expect(modules[0]).toMatchObject({ id: 'post-past', completed: true });
    expect(modules[1]).toMatchObject({ id: 'post-future', completed: false });
  });

  it('repassa now para a regra de auto-conclusão', () => {
    const now = new Date('2026-07-15T12:00:00.000Z');
    moduleItemsFromProgramCourse(baseCourse, { now });

    expect(mockedAutoCompleted).toHaveBeenCalledWith('2026-07-10T00:00:00.000Z', now);
    expect(mockedAutoCompleted).toHaveBeenCalledWith('2026-12-01T00:00:00.000Z', now);
  });
});
