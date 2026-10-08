import ResetPasswordForm from "../components/site/ResetPasswordForm";
import { useTitle } from "../lib/useTitle";

export default function ResetPasswordPage() {
  useTitle("Reset Password — Hotel");
  return <ResetPasswordForm />;
}
