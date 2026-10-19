import { useMemo } from "react";
import { RouterProvider } from "react-router";
import { AppProvider, type AppRuntime } from "@sdw/controllers";
import { ToastProvider } from "../components/ui";
import { DemoTools } from "./DemoTools";
import { createRouter } from "./routes";

export function App({ runtime, routing = "browser" }: { runtime: AppRuntime; routing?: "browser" | "hash" }) {
  const router = useMemo(() => createRouter(routing), [routing]);
  return (
    <AppProvider runtime={runtime}>
      <ToastProvider>
        <RouterProvider router={router} />
        {import.meta.env.MODE === "test" && runtime.demo ? <DemoTools routing={routing} /> : null}
      </ToastProvider>
    </AppProvider>
  );
}
