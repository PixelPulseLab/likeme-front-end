import type { CourseStep } from '@/types/course/course';
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
});
