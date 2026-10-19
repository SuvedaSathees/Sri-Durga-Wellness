import { useState } from "react";
import { Link, useParams } from "react-router";
import { useCancelAppointment, useForm, useFormat, useMyAppointment, useSite, useT } from "@sdw/controllers";
import { APPOINTMENT_STATUS, cancelAppointmentSchema, googleCalendarLink } from "@sdw/core";
import {
  Badge,
  Button,
  ButtonAnchor,
  Dialog,
  Facts,
  FormError,
  LoadingState,
  Notice,
  QueryState,
  TextArea,
} from "../../../components/ui";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";
import { AccountPanel } from "../components/AccountPanel";
import styles from "../components/Account.module.css";

export function AppointmentScreen() {
  const t = useT();
  const f = useFormat();
  const { id = "" } = useParams();
  const appointment = useMyAppointment(id);
  const site = useSite().data;
  const cancel = useCancelAppointment(id);
  const [open, setOpen] = useState(false);
  const form = useForm(cancelAppointmentSchema, { reason: "" });
  useDocumentTitle(appointment.data ? appointment.data.service.name : t("Appointment"));

  const confirmCancel = form.handleSubmit(async (data) => {
    await cancel.mutateAsync(data);
    setOpen(false);
  });

  return (
    <QueryState query={appointment} loading={<LoadingState />}>
      {(a) => {
        const status = APPOINTMENT_STATUS[a.status];
        const place = a.branch
          ? `${a.branch.name}, ${a.branch.addressLine}, ${a.branch.city}`
          : t("Online (video call)");
        return (
          <AccountPanel title={a.service.name} action={<Badge tone={status.tone}>{t(status.label)}</Badge>}>
            <p>
              <Link to="/account/appointments">← {t("All appointments")}</Link>
            </p>
            {cancel.isSuccess ? <Notice tone="success">{t("Your appointment has been cancelled.")}</Notice> : null}
            <Facts
              items={[
                { label: t("Reference"), value: a.reference },
                { label: t("Date"), value: f.longDate(a.startsAt) },
                { label: t("Time"), value: `${f.time(a.startsAt)} – ${f.time(a.endsAt)}` },
                { label: t("Practitioner"), value: a.doctor.name },
                { label: t("Where"), value: place },
                { label: t("Reason for visit"), value: a.reason },
              ]}
            />
            {a.status === "CONFIRMED" ? (
              <div className={styles.actions}>
                <ButtonAnchor
                  href={googleCalendarLink({
                    title: `${a.service.name} — ${site?.clinicName ?? ""}`,
                    start: a.startsAt,
                    end: a.endsAt,
                    location: a.branch ? place : undefined,
                  })}
                  icon="calendar"
                >
                  {t("Add to Google Calendar")}
                </ButtonAnchor>
                {a.canCancel ? (
                  <Button variant="danger" onClick={() => setOpen(true)}>
                    {t("Cancel appointment")}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {a.status === "CONFIRMED" && a.canCancel && a.cancelBefore ? (
              <p className="muted">{t("You can cancel online until {date}.", { date: f.dateTime(a.cancelBefore) })}</p>
            ) : null}
            {a.status === "CONFIRMED" && !a.canCancel ? (
              <Notice tone="info">
                {t("This appointment can no longer be cancelled online. Please contact the clinic.")}
              </Notice>
            ) : null}

            <Dialog
              open={open}
              onClose={() => setOpen(false)}
              title={t("Cancel this appointment?")}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setOpen(false)}>
                    {t("Keep appointment")}
                  </Button>
                  <Button variant="danger" loading={form.submitting} onClick={() => void confirmCancel()}>
                    {t("Yes, cancel it")}
                  </Button>
                </>
              }
            >
              <p>
                {a.service.name} · {f.dateTime(a.startsAt)}
              </p>
              <FormError message={form.formError} />
              <TextArea
                label={t("Reason")}
                hint={t("Letting us know helps us look after other patients.")}
                rows={3}
                value={form.values.reason ?? ""}
                onChange={(v) => form.setField("reason", v)}
                error={form.errorFor("reason")}
              />
            </Dialog>
          </AccountPanel>
        );
      }}
    </QueryState>
  );
}
