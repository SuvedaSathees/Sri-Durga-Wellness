/** Locale-bound formatters, so screens never pass the language around by hand. */
import { useMemo } from "react";
import {
  dayChipParts,
  formatDate,
  formatDateKey,
  formatDateTime,
  formatClassFee,
  formatDuration,
  formatFee,
  formatLongDate,
  formatPrice,
  formatShortDate,
  formatTime,
  type ClassFeeType,
  type DateKey,
  type ISODateTime,
  type Paise,
} from "@sdw/core";
import { useApp } from "./provider";

export function useFormat() {
  const { locale } = useApp();
  return useMemo(
    () => ({
      locale,
      date: (d: ISODateTime | Date) => formatDate(d, locale),
      longDate: (d: ISODateTime | Date) => formatLongDate(d, locale),
      shortDate: (d: ISODateTime | Date) => formatShortDate(d, locale),
      time: (d: ISODateTime | Date) => formatTime(d, locale),
      dateTime: (d: ISODateTime | Date) => formatDateTime(d, locale),
      dateKey: (k: DateKey, style: "short" | "long" | "default" = "default") => formatDateKey(k, style, locale),
      dayChip: (k: DateKey) => dayChipParts(k, locale),
      duration: (minutes: number) => formatDuration(minutes, locale),
      price: (paise: Paise) => formatPrice(paise),
      fee: (paise: Paise) => formatFee(paise, locale),
      /** "₹1,200 / month", "₹250 / session", "₹800" or "Free". */
      classFee: (paise: Paise, feeType: ClassFeeType) => formatClassFee(paise, feeType, locale),
    }),
    [locale],
  );
}
