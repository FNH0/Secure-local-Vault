
import Image from 'next/image';

interface AppLogoProps {
  className?: string;
  imageRenderHeightPx?: number;
  textSize?: string;
}

const FNH_IMAGE_ASPECT_RATIO = 250 / 70; // Approx 3.57

export function AppLogo({ className, imageRenderHeightPx = 32, textSize = "text-2xl" }: AppLogoProps) {
  // Use imageRenderHeightPx to determine the actual dimensions for the image
  const actualRenderHeight = imageRenderHeightPx;
  const actualRenderWidth = Math.round(actualRenderHeight * FNH_IMAGE_ASPECT_RATIO);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* This div wrapper ensures the space is allocated correctly.
          The width and height here should match what next/image will render. */}
      <div style={{ width: `${actualRenderWidth}px`, height: `${actualRenderHeight}px` }} className="relative">
        <Image
          src={`https://placehold.co/${actualRenderWidth}x${actualRenderHeight}.png`} // Use calculated dimensions for placeholder URL
          alt="FNH Logo" // Updated alt text
          width={actualRenderWidth}  // Pass calculated width to next/image
          height={actualRenderHeight} // Pass calculated height to next/image
          className="object-contain" // Ensures the image content scales within the bounds
          data-ai-hint="glitch FNH logo green"
        />
      </div>
      <h1 className={`font-headline font-semibold ${textSize} text-primary`}>
        Secure Vault
      </h1>
    </div>
  );
}
