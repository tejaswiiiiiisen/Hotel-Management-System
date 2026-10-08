import SchedulerView from "../components/site/SchedulerView";
import { useTitle } from "../lib/useTitle";

export default function SchedulerPage() {
  useTitle("Scheduler — Hotel");
  return (
    <div className="min-h-screen bg-cream p-4 sm:p-8">
      <SchedulerView />
    </div>
  );
}
