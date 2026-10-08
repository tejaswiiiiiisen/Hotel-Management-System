import ForgotPasswordForm from "../components/site/ForgotPasswordForm";
import { useTitle } from "../lib/useTitle";

export default function ForgotPasswordPage() {
  useTitle("Forgot Password — Hotel");
  return <ForgotPasswordForm />;
}
