import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  variant: "adaptive" | "on-dark" | "on-light";
};

const logoDimensions = {
  height: 424,
  width: 1119,
};

const logoSources = {
  "on-dark": "/assets/brand/summer-in-the-mitten-logo-on-dark-transparent.png",
  "on-light": "/assets/brand/summer-in-the-mitten-logo-on-light-transparent.png",
} as const;

export function BrandLogo({
  className = "",
  priority = false,
  variant,
}: BrandLogoProps) {
  const classes = ["brand-logo", `brand-logo-${variant}`, className]
    .filter(Boolean)
    .join(" ");

  if (variant === "adaptive") {
    return (
      <span className={classes} aria-hidden="true">
        <Image
          className="brand-logo-image brand-logo-image-on-light"
          src={logoSources["on-light"]}
          alt=""
          height={logoDimensions.height}
          priority={priority}
          width={logoDimensions.width}
        />
        <Image
          className="brand-logo-image brand-logo-image-on-dark"
          src={logoSources["on-dark"]}
          alt=""
          height={logoDimensions.height}
          priority={priority}
          width={logoDimensions.width}
        />
      </span>
    );
  }

  return (
    <span className={classes} aria-hidden="true">
      <Image
        className="brand-logo-image"
        src={logoSources[variant]}
        alt=""
        height={logoDimensions.height}
        priority={priority}
        width={logoDimensions.width}
      />
    </span>
  );
}
