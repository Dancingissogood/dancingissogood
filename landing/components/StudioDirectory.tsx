import Image from "next/image";

import type { StudioProfile } from "@/content/site";

type StudioDirectoryProps = {
  studios: StudioProfile[];
};

export function StudioDirectory({ studios }: StudioDirectoryProps) {
  return (
    <section className="section studio-directory" aria-label="Current studios">
      {studios.map((studio, index) => (
        <article
          className={`studio-profile${index % 2 === 1 ? " studio-profile-reverse" : ""}`}
          key={studio.name}
        >
          <div className={`studio-media studio-media-${studio.imageTheme}`}>
            <Image
              src={studio.image}
              alt={studio.imageAlt}
              width={studio.imageWidth}
              height={studio.imageHeight}
              className={`studio-logo-image studio-logo-image-${studio.imageVariant}`}
              sizes="(max-width: 560px) 280px, 420px"
            />
          </div>
          <div className="studio-content">
            <p className="eyebrow">{studio.locationLabel}</p>
            <h2>{studio.name}</h2>
            <p>{studio.description}</p>
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
              {studio.website.label}
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}
