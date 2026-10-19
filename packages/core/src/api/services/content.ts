import type {
  BlogPost,
  BlogPostSummary,
  ContentBlocks,
  Faq,
  PageQuery,
  Paginated,
  PolicyPage,
  SiteInfo,
  Testimonial,
} from "../../models";
import type { ApiClient } from "../client";
import { endpoints } from "../endpoints";

/** Clinic information and editable website text. */
export function createContentService(api: ApiClient) {
  return {
    site: (signal?: AbortSignal) => api.request<SiteInfo>(endpoints.content.site, { signal }),
    /** Text blocks whose key starts with `prefix`, e.g. "home." */
    blocks: (prefix: string, signal?: AbortSignal) =>
      api.request<ContentBlocks>(endpoints.content.blocks, { query: { prefix }, signal }),
    policy: (slug: PolicyPage["slug"], signal?: AbortSignal) =>
      api.request<PolicyPage>(endpoints.content.policy, { params: { slug }, signal }),
    faqs: (signal?: AbortSignal) => api.request<Faq[]>(endpoints.content.faqs, { signal }),
    testimonials: (signal?: AbortSignal) => api.request<Testimonial[]>(endpoints.content.testimonials, { signal }),
    posts: (query: PageQuery & { tag?: string } = {}, signal?: AbortSignal) =>
      api.request<Paginated<BlogPostSummary>>(endpoints.content.posts, { query, signal }),
    post: (slug: string, signal?: AbortSignal) =>
      api.request<BlogPost>(endpoints.content.post, { params: { slug }, signal }),
  };
}

export type ContentService = ReturnType<typeof createContentService>;
