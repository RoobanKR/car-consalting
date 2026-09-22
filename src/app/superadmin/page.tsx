import AdminWorkspace from '@/components/AdminWorkspace';

// Same workspace as /admin, plus the Users tab. The API still enforces the role,
// so an admin who opens this page can look but not manage users.
export default function SuperAdminPage() {
  return <AdminWorkspace superadmin/>;
}
