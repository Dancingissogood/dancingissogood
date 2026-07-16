import Image from "next/image";

import type { InstructorProfile } from "@/content/site";

type InstructorRosterProps = {
  instructors: InstructorProfile[];
};

export function InstructorRoster({ instructors }: InstructorRosterProps) {
  return (
    <section className="section instructor-roster" aria-label="Instructor roster">
      {instructors.map((instructor, index) => {
        const sequence = String(index + 1).padStart(2, "0");

        return (
          <article className="instructor-profile" key={instructor.role}>
            <div className="instructor-profile-image">
              <Image
                alt={instructor.imageAlt}
                fill
                sizes="(max-width: 820px) 100vw, 50vw"
                src={instructor.image}
              />
              <span>{sequence}</span>
            </div>
            <div className="instructor-profile-content">
              <div className="instructor-profile-status">
                <span>Instructor name</span>
                <strong>To be announced</strong>
              </div>
              <h2>{instructor.role}</h2>
              <p>{instructor.description}</p>
              <div className="instructor-profile-details">
                <div>
                  <span>Teaching format</span>
                  <strong>{instructor.teachingFormat}</strong>
                </div>
                <div>
                  <span>Focus areas</span>
                  <ul aria-label={`${instructor.role} focus areas`}>
                    {instructor.specialties.map((specialty) => (
                      <li key={specialty}>{specialty}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
