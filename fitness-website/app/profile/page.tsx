import { redirect } from "next/navigation";

// Profile page removed in PostureSense — redirect to role-based home
export default function ProfilePage() {
  redirect("/");
}
