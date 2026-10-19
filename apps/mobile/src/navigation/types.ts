/** Typed routes for the whole app. Params never carry personal data, tokens or meeting links. */
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import type { PolicyPage } from "@sdw/core";

export type TabParamList = {
  HomeTab: undefined;
  ServicesTab: undefined;
  ShopTab: undefined;
  LearnTab: undefined;
  AccountTab: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ServiceDetail: { slug: string };
  Booking: { serviceSlug?: string; doctorSlug?: string } | undefined;
  Consultation: undefined;
  Contact: undefined;
  About: undefined;
  Product: { slug: string };
  Cart: undefined;
  Checkout: undefined;
  Payment: { paymentId: string };
  ClassDetail: { slug: string };
  CourseDetail: { slug: string };
  Lesson: { slug: string; lessonId: string };
  Blog: undefined;
  Post: { slug: string };
  Policy: { slug: PolicyPage["slug"] };
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Appointments: undefined;
  Appointment: { id: string };
  Orders: undefined;
  Order: { reference: string };
  Payments: undefined;
  MyClasses: undefined;
  MyClass: { id: string };
  MyCourses: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
export type RootScreenProps<K extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, K>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
