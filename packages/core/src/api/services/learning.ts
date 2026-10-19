import type {
  Course,
  CourseSummary,
  EnrolResponse,
  Lesson,
  LiveClass,
  LiveClassSummary,
  RegisterForBatchResponse,
} from "../../models";
import type { ApiClient } from "../client";
import { endpoints } from "../endpoints";

export function createClassesService(api: ApiClient) {
  return {
    list: (signal?: AbortSignal) => api.request<LiveClassSummary[]>(endpoints.classes.list, { signal }),
    get: (slug: string, signal?: AbortSignal) =>
      api.request<LiveClass>(endpoints.classes.get, { params: { slug }, signal }),
    register: (batchId: string, idempotencyKey: string) =>
      api.request<RegisterForBatchResponse>(endpoints.classes.register, {
        params: { batchId },
        body: {},
        idempotencyKey,
      }),
  };
}

export function createCoursesService(api: ApiClient) {
  return {
    list: (query: { category?: string } = {}, signal?: AbortSignal) =>
      api.request<CourseSummary[]>(endpoints.courses.list, { query, signal }),
    get: (slug: string, signal?: AbortSignal) =>
      api.request<Course>(endpoints.courses.get, { params: { slug }, signal }),
    /** 403 NOT_ENROLLED for locked lessons; the response never contains video data the viewer can't access. */
    lesson: (slug: string, lessonId: string, signal?: AbortSignal) =>
      api.request<Lesson>(endpoints.courses.lesson, { params: { slug, lessonId }, signal }),
    enrol: (slug: string, idempotencyKey: string) =>
      api.request<EnrolResponse>(endpoints.courses.enrol, { params: { slug }, body: {}, idempotencyKey }),
    setLessonComplete: (lessonId: string, completed: boolean) =>
      api.request<void>(endpoints.courses.completeLesson, { params: { lessonId }, body: { completed } }),
  };
}

export type ClassesService = ReturnType<typeof createClassesService>;
export type CoursesService = ReturnType<typeof createCoursesService>;
