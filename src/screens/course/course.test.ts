import type { CourseStep, ProgramCourseModule } from '@/types/course/course';
import { buildCourse, COURSE_MODULE_STATUS } from './course';

function step(postId: string, title: string): CourseStep {
  return {
    stepNumber: 1,
    title,
    postId,
    body: null,
    attachments: [],
    video: null,
    createdAt: null,
    updatedAt: null,
  };
}

describe('buildCourse', () => {
  const steps = [step('a', 'Introdução'), step('b', 'Aquecimento'), step('c', 'Iniciante')];

  it('libera só o primeiro módulo quando a assinatura ainda não concluiu nenhum conteúdo', () => {
    const course = buildCourse(steps);

    expect(course.modules.map((courseModule) => courseModule.status)).toEqual([
      COURSE_MODULE_STATUS.AVAILABLE,
      COURSE_MODULE_STATUS.LOCKED,
      COURSE_MODULE_STATUS.LOCKED,
    ]);
    expect(course.completedContents).toBe(0);
    expect(course.totalContents).toBe(3);
    expect(course.continueContent?.contentTitle).toBe('Introdução');
  });

  it('libera o módulo seguinte quando o anterior está concluído', () => {
    const course = buildCourse(steps, new Set(['a']));

    expect(course.modules.map((courseModule) => courseModule.status)).toEqual([
      COURSE_MODULE_STATUS.COMPLETED,
      COURSE_MODULE_STATUS.AVAILABLE,
      COURSE_MODULE_STATUS.LOCKED,
    ]);
    expect(course.completedContents).toBe(1);
    expect(course.continueContent?.courseModuleId).toBe('b');
  });

  it('mostra o status e a próxima aula que a API já calculou', () => {
    const outline: ProgramCourseModule[] = [
      {
        id: 'mod-iniciante',
        position: 1,
        title: 'Iniciante',
        summary: null,
        status: 'available',
        contents: [
          {
            id: 'aula-1',
            position: 1,
            title: 'Aula 1',
            body: null,
            attachments: [],
            video: null,
            completed: true,
            locked: false,
          },
          {
            id: 'aula-2',
            position: 2,
            title: 'Aula 2',
            body: null,
            attachments: [],
            video: null,
            completed: false,
            locked: false,
          },
        ],
      },
      {
        id: 'mod-avancado',
        position: 2,
        title: 'Avançado',
        summary: null,
        status: 'locked',
        contents: [
          {
            id: 'semana-1',
            position: 1,
            title: 'Semana 1 - Aula 1',
            body: null,
            attachments: [],
            video: null,
            completed: false,
            locked: true,
          },
        ],
      },
    ];

    const course = buildCourse([], new Set(), outline);

    expect(course.modules.map((courseModule) => courseModule.status)).toEqual([
      COURSE_MODULE_STATUS.AVAILABLE,
      COURSE_MODULE_STATUS.LOCKED,
    ]);
    expect(course.modules[0]?.contents.map((content) => content.locked)).toEqual([false, false]);
    expect(course.modules[1]?.contents[0]?.locked).toBe(true);
    expect(course.continueContent?.contentTitle).toBe('Aula 2');
  });
});
