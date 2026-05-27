import { useEffect, useState } from "react";
import { NavLink, Outlet, createHashRouter } from "react-router-dom";
import './catppuccin.css';
import './App.css';
import { Home } from "./components/home";
import { Blog, BlogPost, postsLoader, postLoader } from "./components/blog";
import { Projects } from './components/projects';
import { Resume } from './components/resume';
import { sitePages } from "./siteConfig";

const themes = [
    { id: "latte", label: "Latte" },
    { id: "frappe", label: "Frappe" },
    { id: "macchiato", label: "Macchiato" },
    { id: "mocha", label: "Mocha" }
];

export const router = createHashRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/blog",
                loader: postsLoader,
                element: <Blog />
            },
            {
                path: "/blog/:postId",
                loader: postLoader,
                element: <BlogPost />
            },
            {
                path: "/projects",
                element: <Projects />
            },
            {
                path: "/resume",
                element: <Resume />
            }
        ]
    }
]);

function App() {
    const [theme, setTheme] = useState(() => {
        try {
         return JSON.parse(window.localStorage.getItem("catppuccin-theme")) || themes[3];
        } catch {
            return themes[3];
        }
    });

    useEffect(() => {
        document.documentElement.dataset.bsTheme = theme.id;
        delete document.documentElement.dataset.theme;
        window.localStorage.setItem("catppuccin-theme", JSON.stringify(theme));
    }, [theme]);

    return (
        <div className="min-vh-100">
            <Navbar theme={theme} setTheme={setTheme} />
            <main className="container py-5 readable-container">
                <Outlet />
            </main>
        </div>
    );
}

export function Navbar({ theme, setTheme }) {
    return (
        <header className="sticky-top bg-body">
            <div className="container nav-wrap">
                <nav className="nav nav-pills justify-content-center" aria-label="Primary navigation">
                    <NavLink to="/" end className={({ isActive }) => `nav-link mx-2${isActive ? " active" : ""}`}>
                        Home
                    </NavLink>
                    {sitePages.map((page) => (
                        <NavLink
                            key={page.path}
                            to={page.path}
                            className={({ isActive }) => `nav-link mx-2${isActive ? " active" : ""}`}
                        >
                            {page.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="justify-self-end" aria-label="Catppuccin theme">
                    <label className="visually-hidden" htmlFor="theme-select">Theme</label>
                    <div className="dropdown">
                        <button id="theme-select" className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            {theme.label}
                        </button>
                        <ul className="dropdown-menu">
                            {themes.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className={`dropdown-item${theme.id === item.id ? " active" : ""}`}
                                        onClick={() => setTheme(item)}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default App;
