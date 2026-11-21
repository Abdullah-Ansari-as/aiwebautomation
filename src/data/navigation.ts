import type { FooterGroup, NavItem } from "@/types";

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "AI Tools",
    href: "/tools",
    children: [
      {
        label: "Tools Directory",
        href: "/tools",
        description: "Search and compare well-known AI tools",
        icon: "sparkles",
      },
      {
        label: "Free AI Utilities",
        href: "/free-ai-tools",
        description: "Browser-based tools you can use right now",
        icon: "wand",
      },
      {
        label: "Writing Tools",
        href: "/tools/category/ai-writing",
        description: "Draft, edit and polish content",
        icon: "pen",
      },
      {
        label: "Coding Tools",
        href: "/tools/category/ai-coding",
        description: "Assistants for developers",
        icon: "code",
      },
      {
        label: "Submit a Tool",
        href: "/submit-tool",
        description: "Suggest a product for the directory",
        icon: "rocket",
      },
    ],
  },
  { label: "AI Automation", href: "/automation" },
  { label: "How-To Guides", href: "/guides" },
  { label: "Technology", href: "/technology" },
  { label: "Blog", href: "/blog" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

/** Revenue call to action shown in the header and mobile menu. */
export const hireUsNav = { label: "Hire us", href: "/services", description: "Done-for-you automation services" } as const;

export const footerGroups: FooterGroup[] = [
  {
    title: "AI Tools",
    links: [
      { label: "Tools Directory", href: "/tools" },
      { label: "Free AI Utilities", href: "/free-ai-tools" },
      { label: "AI Writing", href: "/tools/category/ai-writing" },
      { label: "AI Image Generation", href: "/tools/category/ai-image-generation" },
      { label: "AI Coding", href: "/tools/category/ai-coding" },
      { label: "Submit a Tool", href: "/submit-tool" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "AI Automation", href: "/automation" },
      { label: "How-To Guides", href: "/guides" },
      { label: "Technology", href: "/technology" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Automation Services", href: "/services" },
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Editorial Policy", href: "/editorial-policy" },
      { label: "Write for Us", href: "/write-for-us" },
      { label: "Advertise", href: "/advertise" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
  },
];
