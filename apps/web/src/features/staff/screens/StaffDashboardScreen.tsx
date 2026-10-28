/**
 * The earlier Staff page has been replaced by the Admin area (/admin), where the clinic owner checks
 * payments, manages orders and edits classes, products and courses. Old links to /staff land there.
 * The previous version of this file is kept in _backup-before-admin/.
 */
import { Navigate } from "react-router";

export function StaffDashboardScreen() {
  return <Navigate to="/admin" replace />;
}
