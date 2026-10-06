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

  it('abre a jornada no módulo e guarda os conteúdos', () => {
    const outline: ProgramCourseModule[] = [
      {
        id: 'mod-iniciante',
        position: 1,
        title: 'Iniciante',
        summary: 'Aprenda os movimentos e fundamentos.',
        contents: [
          { id: 'content-1', position: 1, title: 'Aula 1', body: null, attachments: [], video: null },
          { id: 'content-2', position: 2, title: 'Aula 2', body: null, attachments: [], video: null },
          { id: 'content-3', position: 3, title: 'Aula 3', body: null, attachments: [], video: null },
        ],
      },
    ];

    const course = buildCourse([], new Set(), outline);

    expect(course.modules).toHaveLength(1);
    expect(course.modules[0]?.title).toBe('Iniciante');
    expect(course.modules[0]?.status).toBe(COURSE_MODULE_STATUS.AVAILABLE);
    expect(course.modules[0]?.contents.map((content) => content.title)).toEqual(['Aula 1', 'Aula 2', 'Aula 3']);
    expect(course.totalContents).toBe(3);
    expect(course.continueContent?.courseModuleTitle).toBe('Iniciante');
    expect(course.continueContent?.contentTitle).toBe('Aula 1');
  });
});
