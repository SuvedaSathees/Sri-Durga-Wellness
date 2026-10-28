/**
 * Add or edit a recorded course and its lessons. Lesson videos are YouTube or Vimeo links; they play
 * only for students whose payment has been verified (and for everyone on a free-preview lesson).
 */
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAdminCourse, useDeleteLesson, useForm, useSaveCourse, useSaveLesson, useT } from "@sdw/controllers";
import {
  courseFormSchema,
  errorMessage,
  LEVEL_LABEL,
  lessonSchema,
  rupeesText,
  type AdminCourse,
  type AdminLesson,
  type Level,
} from "@sdw/core";
import {
  Badge,
  Button,
  CheckboxField,
  Dialog,
  FormError,
  LoadingState,
  QueryState,
  SelectField,
  TextField,
  useToast,
} from "../../../components/ui";
import { AccountPanel } from "../../account/components/AccountPanel";
import { BilingualField, bilingualValue, VisibilityBadges } from "../components/AdminUi";
import styles from "../components/Admin.module.css";

function CourseForm({ initial }: { initial: AdminCourse | null }) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const save = useSaveCourse(initial?.id);
  const form = useForm(courseFormSchema, {
    title: bilingualValue(initial?.title),
    summary: bilingualValue(initial?.summary),
    description: bilingualValue(initial?.description),
    level: initial?.level ?? "ALL_LEVELS",
    price: rupeesText(initial?.price ?? null),
    accessDays: initial ? (initial.accessDays === null ? "" : String(initial.accessDays)) : "365",
    isPublished: initial?.isPublished ?? true,
  });
  const v = form.values;
  const submit = form.handleSubmit(async (body) => {
    const saved = await save.mutateAsync(body);
    if (initial) toast(t("Changes saved"));
    else {
      toast(t("Course added. Now add its lessons."));
      navigate(`/admin/courses/${saved.id}`, { replace: true });
    }
  });

  return (
    <AccountPanel
      title={initial ? t("Course details") : t("New course")}
      action={initial ? <VisibilityBadges isPublished={initial.isPublished} isSample={initial.isSample} /> : null}
    >
      <p>
        <Link to="/admin/courses">← {t("All courses")}</Link>
        {initial?.isPublished ? (
          <>
            {" · "}
            <Link to={`/courses/${initial.slug}`}>{t("See it on the website")}</Link>
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
          hint={t("One or two sentences shown on the course list.")}
          multiline
          rows={2}
          value={v.summary}
          onChange={(lang, x) => form.setField(`summary.${lang}`, x)}
          errorEn={form.errorFor("summary.en")}
          errorTa={form.errorFor("summary.ta")}
        />
        <BilingualField
          label={t("Description")}
          hint={t("Shown on the course page. You can use **bold** and lists starting with -.")}
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
            label={t("Price (₹)")}
            hint={t("Enter 0 for a free course.")}
            required
            inputMode="decimal"
            value={v.price}
            onChange={(x) => form.setField("price", x)}
            error={form.errorFor("price")}
          />
          <TextField
            label={t("Access (days)")}
            hint={t("How long students can watch after payment. 365 = 12 months. Leave empty for lifetime.")}
            inputMode="numeric"
            value={String(v.accessDays ?? "")}
            onChange={(x) => form.setField("accessDays", x)}
            error={form.errorFor("accessDays")}
          />
        </div>
        <CheckboxField
          label={t("Show this course on the website")}
          hint={t("Hidden courses stay open to students who already enrolled.")}
          checked={!!v.isPublished}
          onChange={(x) => form.setField("isPublished", x)}
        />
        <div className={styles.formActions}>
          <Button type="submit" loading={form.submitting}>
            {initial ? t("Save changes") : t("Add course")}
          </Button>
        </div>
      </form>
    </AccountPanel>
  );
}

function LessonDialog({
  course,
  lesson,
  onClose,
}: {
  course: AdminCourse;
  lesson: AdminLesson | null;
  onClose: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const save = useSaveLesson(course.id);
  const form = useForm(lessonSchema, {
    title: bilingualValue(lesson?.title),
    durationMinutes: lesson?.durationMinutes === null || !lesson ? "" : String(lesson.durationMinutes),
    isFreePreview: lesson?.isFreePreview ?? false,
    notes: bilingualValue(lesson?.notes),
    videoUrl: lesson?.videoUrl ?? "",
  });
  const v = form.values;
  const submit = form.handleSubmit(async (body) => {
    await save.mutateAsync({ lessonId: lesson?.id, body });
    toast(lesson ? t("Lesson updated") : t("Lesson added"));
    onClose();
  });
  return (
    <Dialog
      open
      onClose={onClose}
      title={lesson ? t("Edit lesson") : t("Add a lesson")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={() => void submit()} loading={form.submitting}>
            {lesson ? t("Save lesson") : t("Add lesson")}
          </Button>
        </>
      }
    >
      <FormError message={form.formError} />
      <BilingualField
        label={t("Lesson title")}
        value={v.title}
        onChange={(lang, x) => form.setField(`title.${lang}`, x)}
        errorEn={form.errorFor("title.en")}
        errorTa={form.errorFor("title.ta")}
      />
      <TextField
        label={t("Video link")}
        hint={t("A YouTube or Vimeo link. Set the video to Unlisted so only students can find it.")}
        inputMode="url"
        autoComplete="off"
        value={v.videoUrl ?? ""}
        onChange={(x) => form.setField("videoUrl", x)}
        error={form.errorFor("videoUrl")}
      />
      <TextField
        label={t("Length (minutes)")}
        inputMode="numeric"
        value={String(v.durationMinutes ?? "")}
        onChange={(x) => form.setField("durationMinutes", x)}
        error={form.errorFor("durationMinutes")}
      />
      <BilingualField
        label={t("Lesson notes")}
        multiline
        rows={4}
        required={false}
        value={v.notes}
        onChange={(lang, x) => form.setField(`notes.${lang}`, x)}
        errorEn={form.errorFor("notes.en")}
        errorTa={form.errorFor("notes.ta")}
      />
      <CheckboxField
        label={t("Free preview — anyone can watch this lesson")}
        checked={!!v.isFreePreview}
        onChange={(x) => form.setField("isFreePreview", x)}
      />
    </Dialog>
  );
}

function DeleteLessonDialog({ lesson, onClose }: { lesson: AdminLesson; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const remove = useDeleteLesson();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog
      open
      onClose={onClose}
      title={t("Delete this lesson?")}
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
                .mutateAsync(lesson.id)
                .then(() => {
                  toast(t("Lesson deleted"));
                  onClose();
                })
                .catch((e: unknown) => setError(errorMessage(e)))
            }
          >
            {t("Delete lesson")}
          </Button>
        </>
      }
    >
      <p>{lesson.title.en}</p>
      <FormError message={error} />
    </Dialog>
  );
}

function Lessons({ course }: { course: AdminCourse }) {
  const t = useT();
  const [editing, setEditing] = useState<AdminLesson | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminLesson | null>(null);
  return (
    <AccountPanel
      title={t("Lessons")}
      action={
        <Button size="sm" icon="plus" onClick={() => setEditing("new")}>
          {t("Add a lesson")}
        </Button>
      }
    >
      {course.lessons.length === 0 ? (
        <p className="muted">{t("No lessons yet.")}</p>
      ) : (
        <ol className={styles.lessonList}>
          {course.lessons.map((l) => (
            <li key={l.id} className={styles.lessonRow}>
              <span className={styles.lessonNo}>{l.position}</span>
              <div>
                <strong>{l.title.en}</strong>
                <div className={styles.meta}>
                  {l.durationMinutes ? <span>{t("{minutes} min", { minutes: l.durationMinutes })}</span> : null}
                  {l.videoUrl ? <span>{t("Video added")}</span> : <Badge tone="warning">{t("No video yet")}</Badge>}
                  {l.isFreePreview ? <Badge tone="info">{t("Free preview")}</Badge> : null}
                </div>
              </div>
              <div className={styles.rowActions}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(l)}>
                  {t("Edit")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(l)}>
                  {t("Delete")}
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
      {editing ? (
        <LessonDialog course={course} lesson={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      ) : null}
      {deleting ? <DeleteLessonDialog lesson={deleting} onClose={() => setDeleting(null)} /> : null}
    </AccountPanel>
  );
}

export function AdminCourseScreen() {
  const { id } = useParams();
  const course = useAdminCourse(id ?? "");
  if (!id) return <CourseForm initial={null} />;
  return (
    <QueryState query={course} loading={<LoadingState />}>
      {(c) => (
        <>
          <CourseForm key={c.id} initial={c} />
          <Lessons course={c} />
        </>
      )}
    </QueryState>
  );
}
