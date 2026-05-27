import { projects } from "../siteConfig";

export function Projects() {
    return (
        <section>
            <div className="mb-4">
                <p className="eyebrow">Yeah... guess you could say I've done some things</p>
            </div>
            <div className="row g-3">
                {projects.map((project) => <ProjectCard key={project.title} project={project} />)}
            </div>
        </section>
    );
}

export function ProjectCard({ project }) {
    return (
        <div className="col-6 col-md-4">
            <article className="card h-100">
                <div className="card-body d-flex flex-column justify-content-between">
                    <div>
                        <h2 className="h4 card-title">{project.title}</h2>
                        <p className="card-text">{project.description}</p>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                        {project.links.map((link) => (
                            <a key={link.href} className="btn btn-outline-primary" href={link.href} target="_blank" rel="noreferrer">
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </article>
        </div>
    );
}
