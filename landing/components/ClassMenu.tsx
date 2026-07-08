import Image from "next/image";

import type { ClassMenuItem } from "@/content/site";

type ClassMenuProps = {
  classes: ClassMenuItem[];
};

export function ClassMenu({ classes }: ClassMenuProps) {
  return (
    <div className="menu-grid">
      {classes.map((item) => (
        <article className="menu-card" data-reveal key={item.title}>
          <div className="menu-card-image">
            <Image
              src={item.image}
              alt={item.imageAlt}
              fill
              sizes="(max-width: 560px) 118px, (max-width: 1100px) 33vw, 20vw"
            />
          </div>
          <div className="menu-card-body">
            <span className="menu-time">{item.duration}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
