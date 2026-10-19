/** Clinic information, editable text, FAQs, testimonials, blog and the service catalogue. */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PageQuery, PolicyPage } from "@sdw/core";
import { useApi, useApp } from "./provider";
import { qk } from "./query-keys";

const LONG = 10 * 60_000;

export function useSite() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({ queryKey: qk.site(locale), queryFn: ({ signal }) => api.content.site(signal), staleTime: LONG });
}

/** Text blocks by prefix ("home.", "about.") with a getter that falls back to "". */
export function useContentBlocks(prefix: string) {
  const api = useApi();
  const { locale } = useApp();
  const q = useQuery({
    queryKey: qk.blocks(locale, prefix),
    queryFn: ({ signal }) => api.content.blocks(prefix, signal),
    staleTime: LONG,
  });
  return { ...q, text: (key: string) => q.data?.[key] ?? "" };
}

export function usePolicy(slug: PolicyPage["slug"]) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.policy(locale, slug),
    queryFn: ({ signal }) => api.content.policy(slug, signal),
    staleTime: LONG,
  });
}

export function useFaqs() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({ queryKey: qk.faqs(locale), queryFn: ({ signal }) => api.content.faqs(signal), staleTime: LONG });
}

export function useTestimonials() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.testimonials(locale),
    queryFn: ({ signal }) => api.content.testimonials(signal),
    staleTime: LONG,
  });
}

export function usePosts(query: PageQuery & { tag?: string } = {}) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.posts(locale, query),
    queryFn: ({ signal }) => api.content.posts(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function usePost(slug: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({ queryKey: qk.post(locale, slug), queryFn: ({ signal }) => api.content.post(slug, signal) });
}

// ── Services and practitioners ───────────────────────────────

export function useServiceList() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.services(locale),
    queryFn: ({ signal }) => api.catalog.services(signal),
    staleTime: LONG,
  });
}

export function useService(slug: string | null | undefined) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.service(locale, slug ?? ""),
    queryFn: ({ signal }) => api.catalog.service(slug!, signal),
    enabled: !!slug,
    staleTime: LONG,
  });
}

export function useDoctors(serviceId?: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.doctors(locale, serviceId),
    queryFn: ({ signal }) => api.catalog.doctors(serviceId ? { serviceId } : {}, signal),
    staleTime: LONG,
  });
}

export function useDoctor(slug: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.doctor(locale, slug),
    queryFn: ({ signal }) => api.catalog.doctor(slug, signal),
    staleTime: LONG,
  });
}
