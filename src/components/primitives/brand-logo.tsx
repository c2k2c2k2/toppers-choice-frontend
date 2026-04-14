import Image from "next/image";

const BRAND_ASSETS = {
  lockup: {
    height: 674,
    src: "/branding/logo-lockup.png",
    width: 757,
  },
  mark: {
    height: 502,
    src: "/branding/logo-mark.png",
    width: 635,
  },
} as const;

type BrandLogoVariant = keyof typeof BRAND_ASSETS;

type BrandLogoProps = {
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  variant?: BrandLogoVariant;
};

function buildClassName(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function BrandLogo({
  alt,
  className,
  imageClassName,
  priority = false,
  sizes,
  variant = "mark",
}: Readonly<BrandLogoProps>) {
  const asset = BRAND_ASSETS[variant];

  return (
    <span className={buildClassName("inline-flex shrink-0", className)}>
      <Image
        src={asset.src}
        alt={alt}
        width={asset.width}
        height={asset.height}
        priority={priority}
        sizes={sizes}
        className={buildClassName("h-auto w-full object-contain", imageClassName)}
      />
    </span>
  );
}

export function BrandMark(props: Omit<BrandLogoProps, "variant">) {
  return <BrandLogo {...props} variant="mark" />;
}

export function BrandLockup(props: Omit<BrandLogoProps, "variant">) {
  return <BrandLogo {...props} variant="lockup" />;
}
