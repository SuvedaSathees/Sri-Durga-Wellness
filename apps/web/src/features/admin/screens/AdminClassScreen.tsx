/**
 * Add or edit a live class and its batches. The Google Meet link is entered here and is given only
 * to students whose payment has been verified — it never appears on public pages.
 */
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAdminClass, useDeleteBatch, useForm, useFormat, useSaveBatch, useSaveClass, useT } from "@sdw/controllers";
import {
  addDaysToKey,
  batchFormSchema,
  CLASS_FEE_TYPE_LABEL,
  classFormSchema,
  clinicDateTimeFields,
  errorMessage,
  LEVEL_LABEL,
  REGISTRATION_STATUS,
  rupeesText,
  todayKey,
  type AdminBatch,
  type AdminClass,
  type ClassFeeType,
  type Level,
} from "@sdw/core";
import {
  Badge,
  Button,
  CheckboxField,
  Dialog,
  FormError,
  LoadingState,
  Notice,
  QueryState,
  RadioGroup,
  SelectField,
  TextField,
  useToast,
} from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import { BilingualField, bilingualValue, VisibilityBadges } from "../components/AdminUi";
import styles from "../components/Admin.module.css";

const FEE_HINT: Record<ClassFeeType, string> = {
  PER_BATCH: "One amount for the whole batch. Enter 0 for a free class.",
  MONTHLY: "Charged every month; students renew by paying again. Enter 0 for a free class.",
  PER_SESSION: "Charged per session; a batch costs this × its number of sessions. Enter 0 for a free class.",
};

function ClassForm({ initial }: { initial: AdminClass | null }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const save = useSaveClass(initial?.id);
  const form = useForm(classFormSchema, {
    title: bilingualValue(initial?.title),
    summary: bilingualValue(initial?.summary),
    description: bilingualValue(initial?.description),
    level: initial?.level ?? "BEGINNER",
    language: initial ? bilingualValue(initial.language) : { en: "Tamil and English", ta: "தமிழ் மற்றும் ஆங்கிலம்" },
    feeType: initial?.feeType ?? "MONTHLY",
    fee: rupeesText(initial?.fee ?? null),
    instructorName: initial?.instructorName ?? "",
    isPublished: initial?.isPublished ?? true,
  });
  const v = form.values;
  const feeType = (v.feeType ?? "MONTHLY") as ClassFeeType;

  const submit = form.handleSubmit(async (body) => {
    const saved = await save.mutateAsync(body);
    if (initial) toast(t("Changes saved"));
    else {
      toast(t("Class added. Now add its first batch."));
      navigate(`/admin/classes/${saved.id}`, { replace: true });
    }
  });

  return (
    <AccountPanel
      title={initial ? t("Class details") : t("New live class")}
      action={initial ? <VisibilityBadges isPublished={initial.isPublished} isSample={initial.isSample} /> : null}
    >
      <p>
        <Link to="/admin/classes">← {t("All live classes")}</Link>
        {initial?.isPublished ? (
          <>
            {" · "}
            <Link to={`/classes/${initial.slug}`}>{t("See it on the website")}</Link>
          </>
        ) : null}
      </p>
      <form
        className={styles.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <FormError message={form.formError} />
        <BilingualField
          label={t("Title")}
          value={v.title}
          onChange={(lang, x) => form.setField(`title.${lang}`, x)}
          errorEn={form.errorFor("title.en")}
          errorTa={form.errorFor("title.ta")}
        />
        <BilingualField
          label={t("Summary")}
          hint={t("One or two sentences shown on the class list.")}
          multiline
          rows={2}
          value={v.summary}
          onChange={(lang, x) => form.setField(`summary.${lang}`, x)}
          errorEn={form.errorFor("summary.en")}
          errorTa={form.errorFor("summary.ta")}
        />
        <BilingualField
          label={t("Description")}
          hint={t("Shown on the class page. You can use **bold** and lists starting with -.")}
          multiline
          rows={6}
          required={false}
          value={v.description}
          onChange={(lang, x) => form.setField(`description.${lang}`, x)}
          errorEn={form.errorFor("description.en")}
          errorTa={form.errorFor("description.ta")}
        />
        <div className={styles.formGrid}>
          <SelectField
            label={t("Level")}
            required
            value={v.level as string}
            onChange={(x) => form.setField("level", x as Level)}
            options={(Object.keys(LEVEL_LABEL) as Level[]).map((l) => ({ value: l, label: t(LEVEL_LABEL[l]) }))}
            error={form.errorFor("level")}
          />
          <TextField
            label={t("Teacher")}
            value={v.instructorName ?? ""}
            onChange={(x) => form.setField("instructorName", x)}
            error={form.errorFor("instructorName")}
          />
        </div>
        <BilingualField
          label={t("Language of the class")}
          value={v.language}
          onChange={(lang, x) => form.setField(`language.${lang}`, x)}
          errorEn={form.errorFor("language.en")}
          errorTa={form.errorFor("language.ta")}
        />
        <RadioGroup
          legend={t("How the fee is charged")}
          name="feeType"
          value={feeType}
          onChange={(x) => form.setField("feeType", x)}
          options={(Object.keys(CLASS_FEE_TYPE_LABEL) as ClassFeeType[]).map((k) => ({
            value: k,
            label: t(CLASS_FEE_TYPE_LABEL[k]),
          }))}
          error={form.errorFor("feeType")}
        />
        <div className={styles.formGrid}>
          <TextField
            label={t("Fee (₹)")}
            hint={t(FEE_HINT[feeType])}
            required
            inputMode="decimal"
            value={v.fee}
            onChange={(x) => form.setField("fee", x)}
            error={form.errorFor("fee")}
          />
        </div>
        <CheckboxField
          label={t("Show this class on the website")}
          hint={t("Hidden classes stay open to students who already registered.")}
          checked={!!v.isPublished}
          onChange={(x) => form.setField("isPublished", x)}
        />
        <div className={styles.formActions}>
          <Button type="submit" loading={form.submitting}>
            {initial ? t("Save changes") : t("Add class")}
          </Button>
        </div>
      </form>
    </AccountPanel>
  );
}

function BatchDialog({ cls, batch, onClose }: { cls: AdminClass; batch: AdminBatch | null; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const save = useSaveBatch(cls.id);
  const start = batch ? clinicDateTimeFields(batch.startsAt) : { date: addDaysToKey(todayKey(), 7), time: "07:00" };
  const form = useForm(batchFormSchema, {
    name: batch?.name ?? "",
    date: start.date,
    time: start.time,
    durationMinutes: String(batch?.durationMinutes ?? 45),
    sessionsCount: String(batch?.sessionsCount ?? 8),
    scheduleNote: batch?.scheduleNote ?? "",
    seatLimit: batch?.seatLimit === null || batch?.seatLimit === undefined ? "" : String(batch.seatLimit),
    registrationOpen: batch?.registrationOpen ?? true,
    meetingUrl: batch?.meetingUrl ?? "",
  });
  const v = form.values;
  const submit = form.handleSubmit(async (body) => {
    await save.mutateAsync({ batchId: batch?.id, body });
    toast(batch ? t("Batch updated") : t("Batch added"));
    onClose();
  });
  return (
    <Dialog
      open
      onClose={onClose}
      title={batch ? t("Edit batch") : t("Add a batch")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={() => void submit()} loading={form.submitting}>
            {batch ? t("Save batch") : t("Add batch")}
          </Button>
        </>
      }
    >
      <FormError message={form.formError} />
      <TextField
        label={t("Batch name")}
        hint={t("For example: Morning batch, or November batch.")}
        value={v.name ?? ""}
        onChange={(x) => form.setField("name", x)}
        error={form.errorFor("name")}
      />
      <div className={styles.formGrid}>
        <TextField
          label={t("First session date")}
          type="date"
          required
          value={v.date}
          onChange={(x) => form.setField("date", x)}
          error={form.errorFor("date") ?? form.errorFor("startsAt")}
        />
        <TextField
          label={t("Start time (India time)")}
          type="time"
          required
          value={v.time}
          onChange={(x) => form.setField("time", x)}
          error={form.errorFor("time")}
        />
      </div>
      <div className={styles.formGrid}>
        <TextField
          label={t("Minutes per session")}
          hint={t("Up to 60, the free Google Meet limit.")}
          required
          inputMode="numeric"
          value={String(v.durationMinutes)}
          onChange={(x) => form.setField("durationMinutes", x)}
          error={form.errorFor("durationMinutes")}
        />
        <TextField
          label={cls.feeType === "MONTHLY" ? t("Sessions each month") : t("Number of sessions")}
          required
          inputMode="numeric"
          value={String(v.sessionsCount)}
          onChange={(x) => form.setField("sessionsCount", x)}
          error={form.errorFor("sessionsCount")}
        />
      </div>
      <TextField
        label={t("Days and times")}
        hint={t("For example: Mon, Wed, Fri · 7:00–7:45 AM")}
        value={v.scheduleNote ?? ""}
        onChange={(x) => form.setField("scheduleNote", x)}
        error={form.errorFor("scheduleNote")}
      />
      <TextField
        label={t("Seat limit")}
        hint={t("Leave empty for no limit.")}
        inputMode="numeric"
        value={String(v.seatLimit ?? "")}
        onChange={(x) => form.setField("seatLimit", x)}
        error={form.errorFor("seatLimit")}
      />
      <TextField
        label={t("Google Meet link")}
        hint={t("Only students whose payment you have verified see this link. Starts with meet.google.com/")}
        inputMode="url"
        autoComplete="off"
        value={v.meetingUrl ?? ""}
        onChange={(x) => form.setField("meetingUrl", x)}
        error={form.errorFor("meetingUrl")}
      />
      <CheckboxField
        label={t("Open for registration")}
        checked={!!v.registrationOpen}
        onChange={(x) => form.setField("registrationOpen", x)}
      />
    </Dialog>
  );
}

function DeleteBatchDialog({ batch, onClose }: { batch: AdminBatch; onClose: () => void }) {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const remove = useDeleteBatch();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open
      onClose={onClose}
      title={t("Delete this batch?")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Keep it")}
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove
                .mutateAsync(batch.id)
                .then(() => {
                  toast(t("Batch deleted"));
                  onClose();
                })
                .catch((e: unknown) => setError(errorMessage(e)))
            }
          >
            {t("Delete batch")}
          </Button>
        </>
      }
    >
      <p>
        {batch.name ? `${batch.name} · ` : ""}
        {f.dateTime(batch.startsAt)}
      </p>
      <FormError message={error} />
    </Dialog>
  );
}

function BatchCard({
  cls,
  batch: b,
  onEdit,
  onDelete,
}: {
  cls: AdminClass;
  batch: AdminBatch;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const f = useFormat();
  const active = b.students.filter((s) => s.status !== "CANCELLED");
  const confirmed = b.students.filter((s) => s.status === "CONFIRMED").length;
  const started = new Date(b.startsAt).getTime() <= Date.now();
  return (
    <li className={styles.subCard}>
      <div className={styles.subCardHead}>
        <div>
          <div className={styles.subCardTitle}>{b.name ?? t("Batch")}</div>
          <div className={styles.meta}>
            <span>{f.dateTime(b.startsAt)}</span>
            {b.scheduleNote ? <span>{b.scheduleNote}</span> : null}
          </div>
        </div>
        <span className={styles.badges}>
          {started ? (
            <Badge>{t("Already started")}</Badge>
          ) : b.registrationOpen ? (
            <Badge tone="success">{t("Registration open")}</Badge>
          ) : (
            <Badge tone="warning">{t("Registration closed")}</Badge>
          )}
          {b.meetingUrl ? (
            <Badge tone="success">{t("Meet link added")}</Badge>
          ) : (
            <Badge tone="warning">{t("No Meet link yet")}</Badge>
          )}
        </span>
      </div>
      <div className={styles.meta}>
        <span>{t("{count} sessions", { count: b.sessionsCount })}</span>
        <span>{t("{minutes} min each", { minutes: b.durationMinutes })}</span>
        <span>
          {b.seatLimit === null
            ? t("{count} registered · no seat limit", { count: active.length })
            : t("{count} of {limit} seats taken", { count: active.length, limit: b.seatLimit })}
        </span>
        <span>{t("Registration fee {amount}", { amount: f.fee(b.price) })}</span>
      </div>
      {!b.meetingUrl && confirmed > 0 && !cls.isSample ? (
        <Notice tone="warning">
          {t("{count} confirmed students are waiting for the Google Meet link.", { count: confirmed })}
        </Notice>
      ) : null}
      {b.students.length > 0 ? (
        <details className={styles.more}>
          <summary>{t("Students ({count})", { count: b.students.length })}</summary>
          <ul className={styles.students}>
            {b.students.map((s) => {
              const meta = REGISTRATION_STATUS[s.status];
              return (
                <li key={s.registrationId}>
                  <span>
                    <strong>{s.name}</strong>
                    {s.phone ? ` · ${s.phone}` : ""} · {s.reference}
                  </span>
                  <Badge tone={meta.tone}>{t(meta.label)}</Badge>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
      <div className={styles.formActions}>
        <Button size="sm" variant="secondary" onClick={onEdit}>
          {t("Edit batch")}
        </Button>
        {active.length === 0 ? (
          <Button size="sm" variant="ghost" onClick={onDelete}>
            {t("Delete")}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

function Batches({ cls }: { cls: AdminClass }) {
  const t = useT();
  const [editing, setEditing] = useState<AdminBatch | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminBatch | null>(null);
  return (
    <AccountPanel
      title={t("Batches")}
      action={
        <Button size="sm" icon="plus" onClick={() => setEditing("new")}>
          {t("Add a batch")}
        </Button>
      }
    >
      {cls.batches.length === 0 ? (
        <p className="muted">{t("No batches yet. Add one so customers can register.")}</p>
      ) : (
        <ul className={styles.cards}>
          {cls.batches.map((b) => (
            <BatchCard key={b.id} cls={cls} batch={b} onEdit={() => setEditing(b)} onDelete={() => setDeleting(b)} />
          ))}
        </ul>
      )}
      {editing ? (
        <BatchDialog cls={cls} batch={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      ) : null}
      {deleting ? <DeleteBatchDialog batch={deleting} onClose={() => setDeleting(null)} /> : null}
    </AccountPanel>
  );
}

export function AdminClassScreen() {
  const { id } = useParams();
  const cls = useAdminClass(id ?? "");
  if (!id) return <ClassForm initial={null} />;
  return (
    <QueryState query={cls} loading={<LoadingState />}>
      {(c) => (
        <>
          <ClassForm key={c.id} initial={c} />
          <Batches cls={c} />
        </>
      )}
    </QueryState>
  );
}
