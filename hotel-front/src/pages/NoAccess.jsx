import { Link } from "react-router-dom";

export default function NoAccess() {
  return (
    <div className="no-access">
      <div className="no-access-icon">🔒</div>
      <h2>No Access</h2>
      <p>Your role does not have permission to view this module.</p>
      <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
    </div>
  );
}
