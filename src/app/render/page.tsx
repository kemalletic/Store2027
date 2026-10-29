import { notFound } from "next/navigation";
import { Suspense } from "react";
import RenderStage from "./RenderStage";

/**
 * Development-only stage used by scripts/render-images.mjs to render the
 * product, category and banner images from the procedural 3D garments.
 */
export default function RenderPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <RenderStage />
    </Suspense>
  );
}
