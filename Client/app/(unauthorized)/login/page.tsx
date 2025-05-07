import { LoginCard } from "@/components/unauthorized/login-card/login-card";
import { getSessionOrThrow } from "@/lib/api/requests";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  return (
    <div className="flex items-center justify-center ">
      <LoginCard />
    </div>
  );
}
