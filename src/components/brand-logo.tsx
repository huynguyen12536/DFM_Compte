import Image from "next/image";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "h-12 w-auto" }: BrandLogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="COMPTE"
      width={2172}
      height={724}
      priority
      className={className}
    />
  );
}
