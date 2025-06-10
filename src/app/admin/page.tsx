
'use client';

import { AdminPanel } from '@/components/admin/AdminPanel';

export default function AdminPage() {
  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        This panel allows administrators to view and manage user accounts stored locally in this browser.
        Deleting a user will permanently remove all their associated data from this browser's local storage.
        This action is irreversible.
      </p>
      <AdminPanel />
    </div>
  );
}

    