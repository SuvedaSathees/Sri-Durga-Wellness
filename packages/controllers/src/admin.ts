/**
 * Admin area (clinic owner). Keys live under "me" so signing out clears them, and the data is
 * always refetched when the owner comes back to the tab — customers may have paid in the meantime.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminOrderQuery,
  BatchInput,
  ClassInput,
  CourseInput,
  LessonInput,
  PaymentStatus,
  ProductInput,
  RejectPaymentRequest,
  UpdateOrderStatusRequest,
} from "@sdw/core";
import { useApi, useApp } from "./provider";
import { qk } from "./query-keys";
import { useSession } from "./session";

/** True when the signed-in user may use the Admin area. The server checks this on every call too. */
export function useIsOwner(): boolean {
  return useSession().user?.role === "OWNER";
}

const fresh = { staleTime: 0, refetchOnWindowFocus: true } as const;

/** After a change, refresh the admin lists and the public pages that show the same content. */
function useRefresh() {
  const qc = useQueryClient();
  return (...publicKeys: string[]) => {
    void qc.invalidateQueries({ queryKey: qk.admin });
    for (const key of publicKeys) void qc.invalidateQueries({ queryKey: [key] });
  };
}

export function useAdminOverview() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminOverview(locale),
    queryFn: ({ signal }) => api.admin.overview(signal),
    enabled: useIsOwner(),
    refetchInterval: 60_000,
    ...fresh,
  });
}

// ── Payments ─────────────────────────────────────────────────

export function useAdminPayments(status?: PaymentStatus) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminPayments(locale, status ?? "ALL"),
    queryFn: ({ signal }) => api.admin.payments(status ? { status } : {}, signal),
    enabled: useIsOwner(),
    refetchInterval: status === "SUBMITTED" ? 30_000 : false,
    ...fresh,
  });
}

export function useVerifyPayment() {
  const api = useApi();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (paymentId: string) => api.admin.verifyPayment(paymentId, { foundInBankStatement: true }),
    onSuccess: () => refresh("classes", "courses"),
  });
}

export function useRejectPayment() {
  const api = useApi();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ paymentId, body }: { paymentId: string; body: RejectPaymentRequest }) =>
      api.admin.rejectPayment(paymentId, body),
    onSuccess: () => refresh(),
  });
}

// ── Orders ───────────────────────────────────────────────────

export function useAdminOrders(query: AdminOrderQuery = {}) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminOrders(locale, query),
    queryFn: ({ signal }) => api.admin.orders(query, signal),
    enabled: useIsOwner(),
    placeholderData: keepPreviousData,
    ...fresh,
  });
}

export function useAdminOrder(reference: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminOrder(locale, reference),
    queryFn: ({ signal }) => api.admin.order(reference, signal),
    enabled: useIsOwner(),
    ...fresh,
  });
}

export function useUpdateOrderStatus(reference: string) {
  const api = useApi();
  const qc = useQueryClient();
  const { locale } = useApp();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: UpdateOrderStatusRequest) => api.admin.updateOrderStatus(reference, body),
    onSuccess: (order) => {
      qc.setQueryData(qk.adminOrder(locale, reference), order);
      refresh("products");
    },
  });
}

// ── Live classes ─────────────────────────────────────────────

export function useAdminClasses() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminClasses(locale),
    queryFn: ({ signal }) => api.admin.classes(signal),
    enabled: useIsOwner(),
    ...fresh,
  });
}

export function useAdminClass(classId: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminClass(locale, classId),
    queryFn: ({ signal }) => api.admin.class(classId, signal),
    enabled: useIsOwner() && !!classId,
    ...fresh,
  });
}

export function useSaveClass(classId?: string) {
  const api = useApi();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: ClassInput) => (classId ? api.admin.updateClass(classId, body) : api.admin.createClass(body)),
    onSuccess: () => refresh("classes"),
  });
}

/** Add a batch (no batchId) or change one. */
export function useSaveBatch(classId: string) {
  const api = useApi();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ batchId, body }: { batchId?: string; body: BatchInput }) =>
      batchId ? api.admin.updateBatch(batchId, body) : api.admin.createBatch(classId, body),
    onSuccess: () => refresh("classes"),
  });
}

export function useDeleteBatch() {
  const api = useApi();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (batchId: string) => api.admin.deleteBatch(batchId),
    onSuccess: () => refresh("classes"),
  });
}

// ── Products ─────────────────────────────────────────────────

export function useAdminProducts() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminProducts(locale),
    queryFn: ({ signal }) => api.admin.products(signal),
    enabled: useIsOwner(),
    ...fresh,
  });
}

export function useAdminProduct(productId: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminProduct(locale, productId),
    queryFn: ({ signal }) => api.admin.product(productId, signal),
    enabled: useIsOwner() && !!productId,
    ...fresh,
  });
}

export function useSaveProduct(productId?: string) {
  const api = useApi();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: ProductInput) =>
      productId ? api.admin.updateProduct(productId, body) : api.admin.createProduct(body),
    onSuccess: () => refresh("products", "product"),
  });
}

// ── Courses ──────────────────────────────────────────────────

export function useAdminCourses() {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminCourses(locale),
    queryFn: ({ signal }) => api.admin.courses(signal),
    enabled: useIsOwner(),
    ...fresh,
  });
}

export function useAdminCourse(courseId: string) {
  const api = useApi();
  const { locale } = useApp();
  return useQuery({
    queryKey: qk.adminCourse(locale, courseId),
    queryFn: ({ signal }) => api.admin.course(courseId, signal),
    enabled: useIsOwner() && !!courseId,
    ...fresh,
  });
}

export function useSaveCourse(courseId?: string) {
  const api = useApi();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (body: CourseInput) =>
      courseId ? api.admin.updateCourse(courseId, body) : api.admin.createCourse(body),
    onSuccess: () => refresh("courses"),
  });
}

/** Add a lesson (no lessonId) or change one. */
export function useSaveLesson(courseId: string) {
  const api = useApi();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ lessonId, body }: { lessonId?: string; body: LessonInput }) =>
      lessonId ? api.admin.updateLesson(lessonId, body) : api.admin.createLesson(courseId, body),
    onSuccess: () => refresh("courses"),
  });
}

export function useDeleteLesson() {
  const api = useApi();
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (lessonId: string) => api.admin.deleteLesson(lessonId),
    onSuccess: () => refresh("courses"),
  });
}
