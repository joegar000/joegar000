export function Resume() {
    const resumeUrl = `${process.env.PUBLIC_URL || ""}/resume.pdf`;

    return (
        <section>
            <div className="d-flex align-items-end justify-content-between gap-3 mb-4 flex-wrap">
                <div>
                    <p className="eyebrow">My Ethos</p>
                </div>
                <a className="btn btn-outline-primary" href={resumeUrl} download>
                    Download PDF
                </a>
            </div>
            <div className="border rounded shadow overflow-hidden bg-body-secondary">
                <iframe className="resume-frame" title="David Garcia resume" src={resumeUrl} />
            </div>
        </section>
    );
}
