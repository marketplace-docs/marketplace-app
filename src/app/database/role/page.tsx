
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function RolePage() {
  return (
    <div className="w-full max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Database Role</h1>
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            A list of all the roles in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Role management page is under construction.</p>
        </CardContent>
      </Card>
    </div>
  );
}
