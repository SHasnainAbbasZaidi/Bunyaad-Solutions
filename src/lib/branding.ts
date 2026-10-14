// Shared, editable starting content. The database remains the source of truth.
export const brandName = "Bunyaad Solutions";
export const brandDescription =
  "We create digital platforms and turn ideas into useful innovations through research, thoughtful design, and software development.";
export const brandHero = {
  headline: "Creating Digital Platforms. Bringing Ideas to Life.",
  subtitle: "Digital platforms & innovation",
  description: brandDescription,
  ctaPrimaryText: "Explore Our Work",
  ctaPrimaryUrl: "/projects",
  ctaSecondaryText: "Start a Conversation",
  ctaSecondaryUrl: "/contact",
};
export const defaultNavigation = [
  { name: "What We Create", href: "/solutions" },
  { name: "Our Work", href: "/projects" },
  { name: "About", href: "/about" },
  { name: "Team", href: "/team" },
  { name: "Insights", href: "/news" },
  { name: "Contact", href: "/contact" },
];
export const defaultHighlights = [
  {
    title: "Explore",
    description: "Understand real needs and discover possibilities.",
  },
  {
    title: "Design",
    description: "Shape ideas into clear, useful experiences.",
  },
  {
    title: "Create",
    description: "Bring digital platforms and products to life.",
  },
  { title: "Improve", description: "Learn, refine, and keep innovating." },
];
export const defaultSectionCopy: Record<string, string> = {
  about_title: "A foundation for digital innovation",
  services_eyebrow: "What we create",
  services_title: "From ideas to digital experiences",
  services_description:
    "Our work brings research, design, and technology together to create useful digital platforms and innovations.",
  projects_eyebrow: "Our work",
  projects_title: "Platforms, products & ideas",
  projects_description:
    "Explore the digital experiences and ideas we are developing. We share updates as our work progresses.",
  projects_empty:
    "Our work is taking shape. Updates will be shared here as projects are ready to be introduced.",
  team_eyebrow: "People & ideas",
  team_title: "The people behind Bunyaad",
  team_description:
    "A shared curiosity for technology and a commitment to creating useful digital experiences.",
  team_empty: "Meet our team here as profiles are added.",
  news_eyebrow: "Ideas & updates",
  news_title: "Inside our work",
  news_description:
    "Thoughts, discoveries, and progress from our journey of creating digital platforms.",
  contact_eyebrow: "Let's connect",
  contact_title: "Every innovation starts with a conversation",
  contact_description:
    "Share an idea, explore a collaboration, or learn more about what we create.",
  contact_form_title: "Send us a message",
  contact_submit_text: "Send message",
};
export const brandAbout = [
  {
    sectionKey: "overview",
    title: "Who we are",
    content: `<p><strong>Bunyaad Solutions</strong> is a digital platform and innovation company. We bring ideas to life through research, design, and software development, creating useful experiences around real needs.</p>`,
  },
  {
    sectionKey: "mission",
    title: "Our mission",
    content:
      "<p>To turn meaningful ideas into digital platforms and innovations that help people connect, discover, and do more.</p>",
  },
  {
    sectionKey: "vision",
    title: "Our vision",
    content:
      "<p>To build a future shaped by thoughtful digital experiences, original ideas, and continuous learning.</p>",
  },
  {
    sectionKey: "core_values",
    title: "What guides us",
    content:
      "<ul><li>Curiosity: explore possibilities and ask better questions.</li><li>Purpose: create around real needs.</li><li>Care: value clear design and dependable engineering.</li><li>Learning: improve through feedback and experimentation.</li></ul>",
  },
  {
    sectionKey: "approach",
    title: "How we create",
    content:
      "<p>Explore the need. Shape the idea. Design the experience. Build and test. Learn and improve.</p>",
  },
];
export const brandServices = [
  {
    legacySlug: "b2b-platforms",
    slug: "digital-platform-creation",
    title: "Digital Platform Creation",
    icon: "Layers",
    summary:
      "Bringing connected digital experiences to life, from an early idea to a working platform.",
    features: [
      "Platform planning",
      "Experience design",
      "Development and iteration",
    ],
  },
  {
    legacySlug: "b2c-platforms",
    slug: "experience-design",
    title: "Experience & Product Design",
    icon: "Users",
    summary:
      "Making complex ideas clear through thoughtful interfaces and experiences built around people.",
    features: ["User journeys", "Interface design", "Usability feedback"],
  },
  {
    legacySlug: "d2c-commerce",
    slug: "prototyping",
    title: "Ideas & Prototyping",
    icon: "Cpu",
    summary:
      "Exploring possibilities with prototypes, experiments, and practical ways to test an idea.",
    features: [
      "Concept exploration",
      "Interactive prototypes",
      "Learning through testing",
    ],
  },
  {
    legacySlug: "custom-web-apps",
    slug: "software-development",
    title: "Software Development",
    icon: "Code",
    summary:
      "Creating web applications and digital tools with clear purpose and room to evolve.",
    features: [
      "Web applications",
      "System integration",
      "Testing and refinement",
    ],
  },
  {
    legacySlug: "saas-automation",
    slug: "digital-innovation",
    title: "Digital Innovation",
    icon: "Cpu",
    summary:
      "Connecting research and technology to discover useful new approaches to everyday challenges.",
    features: [
      "Technology exploration",
      "Practical experiments",
      "Continuous improvement",
    ],
  },
  {
    legacySlug: "business-automation",
    slug: "workflow-tools",
    title: "Tools & Connected Workflows",
    icon: "Layers",
    summary:
      "Designing digital tools that connect information, simplify tasks, and make work easier.",
    features: [
      "Workflow discovery",
      "Useful integrations",
      "Task simplification",
    ],
  },
];
export const brandSettings: Record<string, string> = {
  logo_light: "/brand/logo-light.png",
  logo_dark: "/brand/logo-dark.png",
  icon_light: "/brand/icon-light.png",
  icon_dark: "/brand/icon-dark.png",
  site_name: brandName,
  site_tagline: "Creating digital platforms and innovations.",
  footer_content: brandDescription,
  seo_title: "Bunyaad Solutions — Digital Platforms & Innovation",
  seo_description: brandDescription,
  navigation: JSON.stringify(defaultNavigation),
  footer_navigation: JSON.stringify(defaultNavigation),
  header_cta_text: "Let's Talk",
  header_cta_url: "/contact",
  hero_highlights: JSON.stringify(defaultHighlights),
  section_copy: JSON.stringify(defaultSectionCopy),
};
export function navigationLinks(value?: string) {
  try {
    const links = JSON.parse(value ?? JSON.stringify(defaultNavigation));
    return Array.isArray(links)
      ? links.filter(
          (v): v is { name: string; href: string } =>
            !!v &&
            typeof v.name === "string" &&
            typeof v.href === "string" &&
            !/^\/admin(?:\/|$)/.test(v.href),
        )
      : defaultNavigation;
  } catch {
    return defaultNavigation;
  }
}
