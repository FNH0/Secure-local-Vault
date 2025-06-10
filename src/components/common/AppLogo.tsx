import Image from 'next/image';

interface AppLogoProps {
  className?: string;
  imageRenderHeightPx?: number;
  textSize?: string;
}

const FNH_IMAGE_ASPECT_RATIO = 250 / 70; // Approx 3.57

export function AppLogo({ className, imageRenderHeightPx = 32, textSize = "text-2xl" }: AppLogoProps) {
  const placeholderHeight = 32;
  const placeholderWidth = Math.round(placeholderHeight * FNH_IMAGE_ASPECT_RATIO);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div style={{ height: `${imageRenderHeightPx}px`, width: `${Math.round(imageRenderHeightPx * FNH_IMAGE_ASPECT_RATIO)}px` }}>
        <Image
          src={`https://placehold.co/${placeholderWidth}x${placeholderHeight}.png`}
          alt="FNH"
          width={placeholderWidth}
          height={placeholderHeight}
          className="object-contain w-full h-full"
          data-ai-hint="glitch FNH logo green"
        />
      </div>
      <h1 className={`font-headline font-semibold ${textSize} text-primary`}>
        Secure Vault
      </h1>
    </div>
  );
}
