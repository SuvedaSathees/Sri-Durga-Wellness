/** Live classes and recorded courses. */
import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { idempotencyKey } from "@sdw/core";
import { useApi, useApp } from "./provider";
import { qk } from "./query-keys";
import { useSession } from "./session";

export function useClasses() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({ queryKey: qk.classes(locale), queryFn: ({ signal }) => api.classes.list(signal) });
}

/** Class detail; refetched after sign-in because it includes the customer's own registrations. */
export function useLiveClass(slug: string) {
  const api = useApi();
  const { locale } = useApp();
  const { user, status } = useSession();
  return useQuery({
    queryKey: [...qk.liveClass(locale, slug), user?.id ?? "guest"],
    queryFn: ({ signal }) => api.classes.get(slug, signal),
    enabled: status !== "loading",
  });
}

export function useRegisterForBatch() {
  const api = useApi();
  const qc = useQueryClient();
  const keys = useRef(new Map<string, string>());
  return useMutation({
    mutationFn: (batchId: string) => {
      if (!keys.current.has(batchId)) keys.current.set(batchId, idempotencyKey());
      return api.classes.register(batchId, keys.current.get(batchId)!);
    },
    onSuccess: (_data, batchId) => {
      keys.current.delete(batchId);
      void qc.invalidateQueries({ queryKey: qk.me });
      void qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useCourses(category?: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.courses(locale, category),
    queryFn: ({ signal }) => api.courses.list(category ? { category } : {}, signal),
  });
}

/** Course detail with lock state per lesson for this viewer. */
export function useCourse(slug: string) {
  const api = useApi();
  const { locale } = useApp();
  const { user, status } = useSession();
  return useQuery({
    queryKey: [...qk.course(locale, slug), user?.id ?? "guest"],
    queryFn: ({ signal }) => api.courses.get(slug, signal),
    enabled: status !== "loading",
  });
}

export function useLesson(slug: string, lessonId: string | null | undefined) {
  const api = useApi();
  const { locale } = useApp();
  const { user, status } = useSession();
  return useQuery({
    queryKey: [...qk.lesson(locale, slug, lessonId ?? ""), user?.id ?? "guest"],
    queryFn: ({ signal }) => api.courses.lesson(slug, lessonId!, signal),
    enabled: !!lessonId && status !== "loading",
  });
}

export function useEnrol(slug: string) {
  const api = useApi();
  const qc = useQueryClient();
  const key = useRef(idempotencyKey());
  return useMutation({
    mutationFn: () => api.courses.enrol(slug, key.current),
    onSuccess: () => {
      key.current = idempotencyKey();
      void qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useSetLessonComplete() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, completed }: { lessonId: string; completed: boolean }) =>
      api.courses.setLessonComplete(lessonId, completed),
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.me }),
  });
}
