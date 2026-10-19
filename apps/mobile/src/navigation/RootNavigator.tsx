/**
 * App navigation: five bottom tabs, with detail and flow screens pushed on a native stack above
 * them (native transitions, swipe-back on iOS, hardware back on Android).
 */
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator, type NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useCart, useT } from "@sdw/controllers";
import { Icon, type IconName } from "../components/ui";
import { serif, theme } from "../theme";
import type { RootStackParamList, TabParamList } from "./types";

import { AccountScreen } from "../features/account/screens/AccountScreen";
import { AppointmentScreen } from "../features/account/screens/AppointmentScreen";
import { AppointmentsScreen } from "../features/account/screens/AppointmentsScreen";
import { MyClassScreen } from "../features/account/screens/MyClassScreen";
import { MyClassesScreen } from "../features/account/screens/MyClassesScreen";
import { MyCoursesScreen } from "../features/account/screens/MyCoursesScreen";
import { OrderScreen } from "../features/account/screens/OrderScreen";
import { OrdersScreen } from "../features/account/screens/OrdersScreen";
import { PaymentsScreen } from "../features/account/screens/PaymentsScreen";
import { ProfileScreen } from "../features/account/screens/ProfileScreen";
import { SettingsScreen } from "../features/account/screens/SettingsScreen";
import { ForgotPasswordScreen } from "../features/auth/screens/ForgotPasswordScreen";
import { LoginScreen } from "../features/auth/screens/LoginScreen";
import { RegisterScreen } from "../features/auth/screens/RegisterScreen";
import { ResetPasswordScreen } from "../features/auth/screens/ResetPasswordScreen";
import { BookingScreen } from "../features/booking/screens/BookingScreen";
import { ConsultationScreen } from "../features/booking/screens/ConsultationScreen";
import { AboutScreen } from "../features/content/screens/AboutScreen";
import { BlogScreen } from "../features/content/screens/BlogScreen";
import { ContactScreen } from "../features/content/screens/ContactScreen";
import { PolicyScreen } from "../features/content/screens/PolicyScreen";
import { PostScreen } from "../features/content/screens/PostScreen";
import { HomeScreen } from "../features/home/screens/HomeScreen";
import { ClassDetailScreen } from "../features/learning/screens/ClassDetailScreen";
import { CourseDetailScreen } from "../features/learning/screens/CourseDetailScreen";
import { LearnScreen } from "../features/learning/screens/LearnScreen";
import { LessonScreen } from "../features/learning/screens/LessonScreen";
import { PaymentScreen } from "../features/payments/screens/PaymentScreen";
import { ServiceDetailScreen } from "../features/services/screens/ServiceDetailScreen";
import { ServicesScreen } from "../features/services/screens/ServicesScreen";
import { CartScreen } from "../features/shop/screens/CartScreen";
import { CheckoutScreen } from "../features/shop/screens/CheckoutScreen";
import { ProductScreen } from "../features/shop/screens/ProductScreen";
import { ShopScreen } from "../features/shop/screens/ShopScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

export const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: theme.color.bg },
  headerTintColor: theme.color.primary,
  headerTitleStyle: { fontFamily: serif, color: theme.color.heading, fontSize: 19 },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
  contentStyle: { backgroundColor: theme.color.bg },
};

const TAB_ICONS: Record<keyof TabParamList, [IconName, IconName]> = {
  HomeTab: ["home", "home-outline"],
  ServicesTab: ["leaf", "leaf-outline"],
  ShopTab: ["basket", "basket-outline"],
  LearnTab: ["school", "school-outline"],
  AccountTab: ["person-circle", "person-circle-outline"],
};

function Tabs() {
  const t = useT();
  const { count } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.color.bg },
        headerTitleStyle: { fontFamily: serif, color: theme.color.heading, fontSize: 20 },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.color.primary,
        tabBarInactiveTintColor: theme.color.textMuted,
        tabBarStyle: { backgroundColor: theme.color.surface, borderTopColor: theme.color.borderStrong },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ focused, color, size }) => (
          <Icon name={TAB_ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
        sceneStyle: { backgroundColor: theme.color.bg },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: t("Home"), headerShown: false }} />
      <Tab.Screen name="ServicesTab" component={ServicesScreen} options={{ title: t("Services") }} />
      <Tab.Screen
        name="ShopTab"
        component={ShopScreen}
        options={{
          title: t("Shop"),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.color.primary, color: theme.color.onPrimary },
        }}
      />
      <Tab.Screen name="LearnTab" component={LearnScreen} options={{ title: t("Learn") }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: t("Account") }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const t = useT();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false, title: t("Home") }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={{ title: t("Services") }} />
      <Stack.Screen name="Booking" component={BookingScreen} options={{ title: t("Book an appointment") }} />
      <Stack.Screen name="Consultation" component={ConsultationScreen} options={{ title: t("Free consultation") }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: t("Contact") }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: t("About") }} />
      <Stack.Screen name="Product" component={ProductScreen} options={{ title: t("Shop") }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: t("Your cart") }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: t("Checkout") }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: t("Payment") }} />
      <Stack.Screen name="ClassDetail" component={ClassDetailScreen} options={{ title: t("Online Classes") }} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: t("Courses") }} />
      <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: t("Lesson") }} />
      <Stack.Screen name="Blog" component={BlogScreen} options={{ title: t("Journal") }} />
      <Stack.Screen name="Post" component={PostScreen} options={{ title: t("Journal") }} />
      <Stack.Screen name="Policy" component={PolicyScreen} options={{ title: t("Policies") }} />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: t("Log in") }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t("Create an account") }} />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: t("Reset your password") }}
        />
      </Stack.Group>
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ title: t("Choose a new password") }}
      />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} options={{ title: t("Appointments") }} />
      <Stack.Screen name="Appointment" component={AppointmentScreen} options={{ title: t("Appointment") }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: t("Orders") }} />
      <Stack.Screen name="Order" component={OrderScreen} options={{ title: t("Order") }} />
      <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: t("Payments") }} />
      <Stack.Screen name="MyClasses" component={MyClassesScreen} options={{ title: t("My classes") }} />
      <Stack.Screen name="MyClass" component={MyClassScreen} options={{ title: t("Class registration") }} />
      <Stack.Screen name="MyCourses" component={MyCoursesScreen} options={{ title: t("My courses") }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t("Profile") }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t("Settings") }} />
    </Stack.Navigator>
  );
}
