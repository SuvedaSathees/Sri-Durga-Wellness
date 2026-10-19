import type { DateKey, ID, ISODateTime, Paise, Reference } from "./common";

export type Slot = {
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  branchId: ID | null;
};

export type AvailabilityDay = {
  date: DateKey;
  /** Empty when the practitioner has no free time that day. */
  slots: Slot[];
  /** Set when the whole day is closed, e.g. "Clinic holiday". */
  closedReason: string | null;
};

export type AvailabilityQuery = {
  serviceId: ID;
  doctorId: ID;
  /** First date to return (inclusive). */
  from: DateKey;
  /** Number of days, 1–31. */
  days: number;
};

export type Availability = { timeZone: string; days: AvailabilityDay[] };

export type AppointmentStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export type Appointment = {
  id: ID;
  reference: Reference;
  status: AppointmentStatus;
  service: { id: ID; slug: string; name: string; durationMinutes: number; price: Paise | null };
  doctor: { id: ID; slug: string; name: string };
  branch: { id: ID; name: string; addressLine: string; city: string } | null;
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string;
  /** Whether the customer may still cancel online (the server applies the clinic's cut-off). */
  canCancel: boolean;
  /** Latest time online cancellation is allowed, for display. */
  cancelBefore: ISODateTime | null;
  cancelledAt: ISODateTime | null;
};

export type CreateAppointmentRequest = {
  serviceId: ID;
  doctorId: ID;
  startsAt: ISODateTime;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string;
  consent: true;
};

export type CancelAppointmentRequest = { reason?: string };

export type ConsultationMethod = "PHONE" | "VIDEO" | "IN_PERSON";

export type ConsultationRequestInput = {
  name: string;
  phone: string;
  email: string;
  preferredMethod: ConsultationMethod;
  reason: string;
  consent: true;
};

export type ContactMessageInput = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};
