import { useNavigation } from "@react-navigation/native";
import { useMyCourses, useT } from "@sdw/controllers";
import { AuthGate, Button, EmptyView, QueryView, Screen } from "../../../components/ui";
import type { RootNavigation } from "../../../navigation/types";
import { Group } from "../components/Group";
import { CourseRow } from "../components/Rows";

function Content() {
  const t = useT();
  const navigation = useNavigation<RootNavigation>();
  const courses = useMyCourses();
  return (
    <Screen onRefresh={() => courses.refetch()}>
      <QueryView
        query={courses}
        empty={
          <EmptyView
            icon="school-outline"
            title={t("No courses yet")}
            body={t("Courses you enrol in appear here, with your progress.")}
            action={
              <Button onPress={() => navigation.navigate("Tabs", { screen: "LearnTab" })}>{t("Browse courses")}</Button>
            }
          />
        }
      >
        {(list) => (
          <Group>
            {list.map((c) => (
              <CourseRow key={c.enrolment.id} item={c} />
            ))}
          </Group>
        )}
      </QueryView>
    </Screen>
  );
}

export function MyCoursesScreen() {
  return (
    <AuthGate>
      <Content />
    </AuthGate>
  );
}
