import { BillingPage } from '../BillingPage';

// Admin billing reuses the standard BillingPage which has full ADMIN-aware behavior.
export function AdminBillingPage() {
  return <BillingPage />;
}
