"use client";

import StarBackgroundComponent from "@/components/StarBackground";

/**
 * Client boundary for the canvas star background, which uses effects and
 * state. Server components import this instead of the component directly.
 */
export default function Stars() {
  return <StarBackgroundComponent />;
}
