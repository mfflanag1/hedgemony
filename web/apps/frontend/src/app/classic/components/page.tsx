"use client";

import { CLASSIC_ENABLED } from "@/lib/classicEnabled";
import { ComponentsGallery } from "@/components/classic/ComponentsGallery";
import { ClassicDisabled } from "../disabled";

export default function ClassicComponentsPage() {
  if (!CLASSIC_ENABLED) return <ClassicDisabled />;
  return <ComponentsGallery />;
}
