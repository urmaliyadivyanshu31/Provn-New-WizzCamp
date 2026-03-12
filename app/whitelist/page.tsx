import { redirect } from "next/navigation";

// Waitlist has been removed - redirect to homepage for public access
export default function WhitelistPage() {
  redirect("/");
}
