// Edit this file when you want to change homepage copy, links, or project data.
export const siteConfig = {
  name: "David Garcia",
  role: "Software developer",
  headline: "Welcome to my portfolio site!",
  description: [
    "This site holds my writing, projects, and resume.",
    "I use vim by the way."
  ],
  portraitAlt: "David Garcia",
  externalLinks: [
    {
      label: "GitHub",
      href: "https://github.com/joegar000"
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/david-garcia-the-2nd/"
    }
  ]
};

export const sitePages = [
  {
    path: "/blog",
    label: "Blog",
    summary: "Notes, essays, and technical posts."
  },
  {
    path: "/resume",
    label: "Resume",
    summary: "Experience, skills, and work history in one place."
  },
  {
    path: "/projects",
    label: "Projects",
    summary: "A compact index of work, experiments, and things worth sharing."
  }
];

export const projects = [
  {
    title: "Monday Night Bytes",
    tags: ["Podcast", "Finished"],
    description:
      "A podcast I made with two STEM friends during college. They call me Joey, my nickname.",
    links: [
      {
        label: "Listen on Spotify",
        href: "https://open.spotify.com/show/06qyT4x2eLWRtpI1OI3ZJF?si=35b4a8bbd88a425f"
      }
    ]
  },
  {
    title: "Watch Algorithms",
    tags: ["Visualization", "WIP"],
    description: "A website for visualizing algorithms as they run.",
    links: [
      {
        label: "Check it out",
        href: "https://joegar000.github.io/watch-algorithms/"
      }
    ]
  }
];
