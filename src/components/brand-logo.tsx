import Image from "next/image";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "h-12 w-auto" }: BrandLogoProps) {
  return (
    <Image
      src="/compta-logo.png"
      alt="COMPTA"
      width={2172}
      height={724}
      priority
      className={className}
    />
  );
}
