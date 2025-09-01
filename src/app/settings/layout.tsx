
import React from 'react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and payment details.
        </p>
      </div>
      <div className="bg-card p-8 rounded-lg shadow-sm">
        {children}
      </div>
    </div>
  );
}
