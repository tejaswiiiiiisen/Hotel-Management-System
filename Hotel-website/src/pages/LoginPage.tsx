import LoginForm from "../components/site/LoginForm";
import { useTitle } from "../lib/useTitle";

export default function LoginPage() {
  useTitle("Login — Hotel");
  return <LoginForm />;
}
