import Image from "next/image";

import { AnimatedArrowIcon } from "@/components/AnimatedArrowIcon";
import type { StudioProfile } from "@/content/site";

type StudioDirectoryProps = {
  studios: StudioProfile[];
};

export function StudioDirectory({ studios }: StudioDirectoryProps) {
  return (
    <section className="section studio-directory" aria-label="Partner studios">
      {studios.map((studio, index) => (
        <article
          className={`studio-profile studio-profile-${studio.imageTheme}`}
          data-reveal
          key={studio.name}
        >
          <header className="studio-profile-heading">
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="eyebrow">{studio.locationLabel}</p>
              <h2>{studio.name}</h2>
            </div>
          </header>
          <div className="studio-profile-body">
            <div className={`studio-media studio-media-${studio.imageTheme}`}>
              <Image
                src={studio.image}
                alt={studio.imageAlt}
                width={studio.imageWidth}
                height={studio.imageHeight}
                className={`studio-logo-image studio-logo-image-${studio.imageVariant}`}
                sizes="(max-width: 640px) calc(100vw - 88px), (max-width: 900px) 420px, 460px"
              />
            </div>
            <div className="studio-content">
              <p className="studio-description">{studio.description}</p>
              <ul className="studio-tags" aria-label={`${studio.name} focus areas`}>
                {studio.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <dl className="studio-details">
                {studio.details.map((detail) => (
                  <div key={detail.label}>
                    <dt>{detail.label}</dt>
                    <dd>{detail.value}</dd>
                  </div>
                ))}
              </dl>
              <a className="studio-link" href={studio.website.href} target="_blank" rel="noopener">
                Visit website
                <AnimatedArrowIcon />
              </a>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
