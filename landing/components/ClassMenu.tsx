import Image from "next/image";

import type { ClassMenuItem } from "@/content/site";

type ClassMenuProps = {
  classes: ClassMenuItem[];
};

export function ClassMenu({ classes }: ClassMenuProps) {
  return (
    <div className="menu-grid">
      {classes.map((item) => (
        <article className="menu-card" key={item.title}>
          <div className="menu-card-image">
            <Image
              src={item.image}
              alt={item.imageAlt}
              fill
              sizes="(max-width: 580px) 117px, (max-width: 1100px) 50vw, 430px"
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
