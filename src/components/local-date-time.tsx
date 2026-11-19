"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export default function LocalDateTime({ value }: { value: string }) {
  const label = useSyncExternalStore(
    subscribe,
    () => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    () => `${value.replace("T", " ").replace(/\.\d{3}Z$/, " UTC")}`,
  );

  return <time dateTime={value}>{label}</time>;
}
