import imgMe from "../me.jpg";
import { siteConfig } from "../siteConfig";

export function Home() {
    return (
        <section className="row align-items-center g-5">
            <div className="col-12 col-lg-7">
                <p className="eyebrow">About Me</p>
                <p className="fs-4 lh-lg">{siteConfig.headline}</p>
                <div>
                    {siteConfig.description.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                    ))}
                </div>
                <div className="d-flex flex-wrap gap-2 mt-4" aria-label="External links">
                    {siteConfig.externalLinks.map((link) => (
                        <a
                            key={link.href}
                            className="btn btn-outline-primary"
                            href={link.href}
                            target={link.href.startsWith("http") ? "_blank" : undefined}
                            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
            </div>
            <div className="col-12 col-md-5 d-flex justify-content-center">
                <img src={imgMe} className="img-fluid rounded shadow portrait-image" alt={siteConfig.portraitAlt}
                    style={{ maxWidth: 300 }}
                />
            </div>
        </section>
    );
}
