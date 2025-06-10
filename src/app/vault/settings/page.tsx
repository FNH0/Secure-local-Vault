
'use client';

import { FingerprintSettings } from '@/components/settings/FingerprintSettings';
import { RecoveryPhraseSettings } from '@/components/settings/RecoveryPhraseSettings';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your vault preferences and security settings.</p>
      </div>
      <Separator />
      <FingerprintSettings />
      <Separator />
      <RecoveryPhraseSettings />
      {/* Additional settings sections can be added below */}
    </div>
  );
}
