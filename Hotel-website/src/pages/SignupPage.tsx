import SignupForm from "../components/site/SignupForm";
import { useTitle } from "../lib/useTitle";

export default function SignupPage() {
  useTitle("Create Account — Hotel");
  return <SignupForm />;
}
