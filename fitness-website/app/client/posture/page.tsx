import { redirect } from "next/navigation";

// Redirect clients to the shared LivePosture analyzer
export default function ClientPosturePage() {
  redirect("/workouts/LiveWorkout/LivePosture");
}
