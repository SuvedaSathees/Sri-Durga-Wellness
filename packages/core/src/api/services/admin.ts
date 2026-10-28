import type {
  AdminClass,
  AdminClassSummary,
  AdminCourse,
  AdminCourseSummary,
  AdminOrder,
  AdminOrderQuery,
  AdminOrderSummary,
  AdminOverview,
  AdminPayment,
  AdminPaymentQuery,
  AdminProduct,
  AdminProductSummary,
  BatchInput,
  ClassInput,
  CourseInput,
  LessonInput,
  Paginated,
  ProductInput,
  RejectPaymentRequest,
  UpdateOrderStatusRequest,
  VerifyPaymentRequest,
} from "../../models";
import type { ApiClient } from "../client";
import { endpoints } from "../endpoints";

const e = endpoints.admin;

/** Admin area (clinic owner). The server checks the owner role on every call. */
export function createAdminService(api: ApiClient) {
  return {
    overview: (signal?: AbortSignal) => api.request<AdminOverview>(e.overview, { signal }),

    payments: (query: AdminPaymentQuery = {}, signal?: AbortSignal) =>
      api.request<AdminPayment[]>(e.payments, { query, signal }),
    verifyPayment: (paymentId: string, body: VerifyPaymentRequest) =>
      api.request<AdminPayment>(e.verifyPayment, { params: { paymentId }, body }),
    rejectPayment: (paymentId: string, body: RejectPaymentRequest) =>
      api.request<AdminPayment>(e.rejectPayment, { params: { paymentId }, body }),

    orders: (query: AdminOrderQuery = {}, signal?: AbortSignal) =>
      api.request<Paginated<AdminOrderSummary>>(e.orders, { query, signal }),
    order: (reference: string, signal?: AbortSignal) =>
      api.request<AdminOrder>(e.order, { params: { reference }, signal }),
    updateOrderStatus: (reference: string, body: UpdateOrderStatusRequest) =>
      api.request<AdminOrder>(e.updateOrderStatus, { params: { reference }, body }),

    classes: (signal?: AbortSignal) => api.request<AdminClassSummary[]>(e.classes, { signal }),
    createClass: (body: ClassInput) => api.request<AdminClass>(e.createClass, { body }),
    class: (classId: string, signal?: AbortSignal) => api.request<AdminClass>(e.class, { params: { classId }, signal }),
    updateClass: (classId: string, body: Partial<ClassInput>) =>
      api.request<AdminClass>(e.updateClass, { params: { classId }, body }),
    createBatch: (classId: string, body: BatchInput) =>
      api.request<AdminClass>(e.createBatch, { params: { classId }, body }),
    updateBatch: (batchId: string, body: Partial<BatchInput>) =>
      api.request<AdminClass>(e.updateBatch, { params: { batchId }, body }),
    deleteBatch: (batchId: string) => api.request<void>(e.deleteBatch, { params: { batchId } }),

    products: (signal?: AbortSignal) => api.request<AdminProductSummary[]>(e.products, { signal }),
    createProduct: (body: ProductInput) => api.request<AdminProduct>(e.createProduct, { body }),
    product: (productId: string, signal?: AbortSignal) =>
      api.request<AdminProduct>(e.product, { params: { productId }, signal }),
    updateProduct: (productId: string, body: Partial<ProductInput>) =>
      api.request<AdminProduct>(e.updateProduct, { params: { productId }, body }),

    courses: (signal?: AbortSignal) => api.request<AdminCourseSummary[]>(e.courses, { signal }),
    createCourse: (body: CourseInput) => api.request<AdminCourse>(e.createCourse, { body }),
    course: (courseId: string, signal?: AbortSignal) =>
      api.request<AdminCourse>(e.course, { params: { courseId }, signal }),
    updateCourse: (courseId: string, body: Partial<CourseInput>) =>
      api.request<AdminCourse>(e.updateCourse, { params: { courseId }, body }),
    createLesson: (courseId: string, body: LessonInput) =>
      api.request<AdminCourse>(e.createLesson, { params: { courseId }, body }),
    updateLesson: (lessonId: string, body: Partial<LessonInput>) =>
      api.request<AdminCourse>(e.updateLesson, { params: { lessonId }, body }),
    deleteLesson: (lessonId: string) => api.request<void>(e.deleteLesson, { params: { lessonId } }),
  };
}

export type AdminService = ReturnType<typeof createAdminService>;
