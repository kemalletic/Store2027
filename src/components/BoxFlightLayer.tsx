"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useShop } from "@/lib/store";

const BoxFlight = dynamic(() => import("@/three/BoxFlight"), { ssr: false });

/**
 * Hosts the fold-into-box animation. The 3D code is only downloaded the
 * first time something is added to the cart.
 */
export default function BoxFlightLayer() {
  const flight = useShop((s) => s.flight);
  const finish = useShop((s) => s.finishFlight);

  // fetch the 3D code while the browser is idle, so the first add is instant
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const load = () => void import("@/three/BoxFlight");
    if (w.requestIdleCallback) w.requestIdleCallback(load);
    else setTimeout(load, 2500);
  }, []);

  useEffect(() => {
    if (!flight) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
  }, [flight, finish]);

  if (!flight) return null;
  return <BoxFlight key={flight.id} flight={flight} onDone={finish} />;
}
