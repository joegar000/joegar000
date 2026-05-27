import { Link, useLoaderData } from "react-router-dom";

const postsUrl = `${process.env.PUBLIC_URL || ""}/posts.json`;

export function Blog() {
    const { posts } = useLoaderData();

    return (
        <section>
            <div className="mb-4">
                <p className="eyebrow">Behold - My Thoughts</p>
            </div>
            {posts.length > 0 ? (
                <div className="d-grid gap-3">
                    {posts.map((post) => <PostCard key={post.id} post={post} />)}
                </div>
            ) : (
                <p>No posts published yet.</p>
            )}
        </section>
    );
}


export function PostCard({ post }) {
    return (
        <Link to={`/blog/${post.id}`} className="card card-hover text-decoration-none">
            <div className="card-body">
                <p className="mb-1">{formatDate(post.date)}</p>
                <h2 className="h4 card-title">{post.title}</h2>
                {post.description && <p className="card-text">{post.description}</p>}
                <div className="d-flex flex-wrap gap-2 mt-3" aria-label="Tags">
                    {post.tags.map((tag) => <span key={tag} className="badge text-bg-secondary">{tag}</span>)}
                </div>
            </div>
        </Link>
    );
}

export async function postsLoader() {
    const data = await fetch(postsUrl).then(res => res.json());
    return { posts: data.posts || [] };
}

export async function postLoader({ params }) {
    const data = await fetch(postsUrl).then(res => res.json());
    const post = data.posts.find(({ id }) => id === params.postId);
    return { post };
}

export function BlogPost() {
    const { post } = useLoaderData();

    if (!post) {
        return (
            <section>
                <div>
                    <h1>Post not found</h1>
                    <Link to="/blog">Back to blog</Link>
                </div>
            </section>
        );
    }

    return (
        <article>
            <header className="border-bottom pb-4 mb-4">
                <Link to="/blog" className="post-back-link mb-3 text-decoration-none">Back to blog</Link>
                <h1>{post.title}</h1>
                {post.description && <p className="lead">{post.description}</p>}
                <div className="d-flex flex-wrap gap-2 small">
                    <span>{formatDate(post.date)}</span>
                    <span>{post.readingTime}</span>
                </div>
            </header>
            <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>
    );
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(...value.split("-").map((part, index) => index === 1 ? Number(part) - 1 : Number(part)))
        : new Date(value);

    return new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(date);
}
