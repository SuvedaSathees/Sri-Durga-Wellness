import type { Doctor, DoctorDetail, Service, ServiceDetail } from "../../models";
import type { ApiClient } from "../client";
import { endpoints } from "../endpoints";

/** Services and practitioners. Only verified, active practitioners are returned by the API. */
export function createCatalogService(api: ApiClient) {
  return {
    services: (signal?: AbortSignal) => api.request<Service[]>(endpoints.catalog.services, { signal }),
    service: (slug: string, signal?: AbortSignal) =>
      api.request<ServiceDetail>(endpoints.catalog.service, { params: { slug }, signal }),
    doctors: (query: { serviceId?: string } = {}, signal?: AbortSignal) =>
      api.request<Doctor[]>(endpoints.catalog.doctors, { query, signal }),
    doctor: (slug: string, signal?: AbortSignal) =>
      api.request<DoctorDetail>(endpoints.catalog.doctor, { params: { slug }, signal }),
  };
}

export type CatalogService = ReturnType<typeof createCatalogService>;
