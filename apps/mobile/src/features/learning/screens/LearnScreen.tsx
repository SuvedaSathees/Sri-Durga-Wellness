/** Learn tab: live classes and recorded courses, switched with a segmented control. */
import { useState } from "react";
import { View } from "react-native";
import { useClasses, useCourses, useT } from "@sdw/controllers";
import { ClassCard, CourseCard } from "../../../components/cards/Cards";
import { EmptyView, QueryView, Screen, Text } from "../../../components/ui";
import { SegmentedControl } from "../components/SegmentedControl";

export function LearnScreen() {
  const t = useT();
  const [tab, setTab] = useState<"classes" | "courses">("classes");
  const classes = useClasses();
  const courses = useCourses();
  return (
    <Screen onRefresh={() => Promise.all([classes.refetch(), courses.refetch()])}>
      <SegmentedControl
        options={[
          { key: "classes", label: t("Live classes") },
          { key: "courses", label: t("Recorded courses") },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "classes" ? (
        <>
          <Text variant="small">
            {t(
              "Guided live classes on Google Meet — join from anywhere in India. Joining links are shared privately with registered students.",
            )}
          </Text>
          <QueryView
            query={classes}
            empty={
              <EmptyView
                title={t("New classes are being planned")}
                body={t("Upcoming batches will appear here as soon as they are scheduled.")}
              />
            }
          >
            {(list) => (
              <View style={{ gap: 16 }}>
                {list.map((c) => (
                  <ClassCard key={c.id} item={c} />
                ))}
              </View>
            )}
          </QueryView>
        </>
      ) : (
        <>
          <Text variant="small">
            {t(
              "Short video lessons you can return to whenever you need. Every course shows its access period, and the first lesson is free to preview.",
            )}
          </Text>
          <QueryView
            query={courses}
            empty={
              <EmptyView
                title={t("No courses here yet")}
                body={t("New courses will appear here as soon as they are published.")}
              />
            }
          >
            {(list) => (
              <View style={{ gap: 16 }}>
                {list.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </View>
            )}
          </QueryView>
        </>
      )}
    </Screen>
  );
}
