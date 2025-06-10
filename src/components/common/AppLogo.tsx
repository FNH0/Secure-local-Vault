import { ShieldCheck } from 'lucide-react';

interface AppLogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export function AppLogo({ className, iconSize = 8, textSize = "text-2xl" }: AppLogoProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <ShieldCheck className={`h-${iconSize} w-${iconSize} text-primary`} />
      <h1 className={`font-headline font-semibold ${textSize} text-primary`}>
        FNH Secure Vault
      </h1>
    </div>
  );
}
