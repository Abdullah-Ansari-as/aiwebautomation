import type { ContentSection } from "@/types";

export interface InfoPage {
  slug: "privacy-policy" | "terms" | "disclaimer" | "editorial-policy" | "write-for-us" | "advertise";
  title: string;
  metaTitle: string;
  description: string;
  /** ISO date this page was last reviewed. */
  updatedAt: string;
  /**
   * Legal templates must be reviewed by qualified counsel before launch.
   * Pages flagged here show a visible notice.
   */
  requiresLegalReview: boolean;
  intro: string;
  sections: ContentSection[];
}

const p = (text: string) => ({ type: "p" as const, text });
const list = (items: string[]) => ({ type: "list" as const, items });

export const infoPages: InfoPage[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    metaTitle: "Privacy Policy",
    description: "How WebAIAutomation handles information when you visit the website and use its free tools.",
    updatedAt: "2026-11-18",
    requiresLegalReview: true,
    intro:
      "This policy explains what information WebAIAutomation.com (\"we\", \"us\") processes when you use this website. It reflects how the site currently works and will be updated before any new data collection is introduced.",
    sections: [
      {
        id: "who-we-are",
        heading: "Who we are",
        blocks: [
          p("WebAIAutomation.com is operated by **[Legal entity name]**, **[registered address]**. You can contact us about privacy at [hello@webaiautomation.com](mailto:hello@webaiautomation.com)."),
        ],
      },
      {
        id: "information-we-process",
        heading: "Information we process today",
        blocks: [
          list([
            "**Free utilities:** text you enter into tools such as the Word Counter, JSON Formatter or Text Summarizer is processed in your browser and is not sent to our servers.",
            "**Service and sponsorship inquiries:** when you send the quote form on our [Services](/services) page or the sponsorship form on our [Advertise](/advertise) page, we store the details you provide (name, email, company, website, phone number if given, the service or option you chose, budget range, project description and preferred contact method) so we can respond and manage your request. A notification containing your inquiry is emailed to our team through our email delivery provider **[Resend — confirm provider]**. We keep inquiries for **[define retention period]** and you can ask us to delete yours at any time.",
            "**Abuse prevention:** with each form submission we store a one-way hashed (non-reversible) version of your IP address and your browser's user-agent string, and we count recent submissions to limit spam. We do not store your raw IP address.",
            "**Contact form:** when you send a message through our [Contact](/contact) page we store your name, email, chosen topic and message so we can reply, and email a copy to our team. We keep messages for **[define retention period]**.",
            "**Newsletter:** if you subscribe (and tick the consent box), we store your email address, the date you subscribed and the page you signed up on. Every newsletter email includes a one-click unsubscribe link; after unsubscribing we keep only a record that you opted out, and you can ask us to delete it entirely.",
            "**Tool submissions:** when you suggest a tool through our [Submit a tool](/submit-tool) page we store the tool details and your email so our editors can review it and contact you about it.",
            "**Clients:** if you become a client, we store your business contact and billing details, the plan you chose and your invoices and payment records, as needed to provide the service and to meet accounting and tax obligations.",
            "**Preferences:** your light/dark theme choice is saved in your browser's local storage so the site remembers it. It never leaves your device.",
            "**Server logs:** our hosting provider may automatically record technical data such as IP address, browser type and requested pages to operate and secure the service. **[Confirm hosting provider and retention period.]**",
          ]),
        ],
      },
      {
        id: "cookies-and-analytics",
        heading: "Cookies and analytics",
        blocks: [
          p("The website does not set advertising cookies or use third-party analytics, and no cookies are set for visitors. The only cookie we set is a strictly necessary session cookie for site administrators when they sign in to the admin area."),
          p("We use our own privacy-friendly, cookieless statistics to understand which pages are useful: for each page view we count the page address, the referring website (if any) and a few button clicks (such as quote requests). To estimate unique visitors we use a one-way hash of your IP address and browser that changes every day and is deleted after two days, so you can't be identified or tracked across days or websites. Statistics are stored as daily totals and kept for about 13 months. If we add advertising or third-party analytics in future, this policy will be updated first and, where required, we will ask for your consent."),
        ],
      },
      {
        id: "third-party-links",
        heading: "Third-party links",
        blocks: [
          p("Our pages link to external websites, including the official sites of the AI tools we cover, affiliate links where disclosed, WhatsApp click-to-chat links and social share links. Those sites have their own privacy practices, which we do not control."),
        ],
      },
      {
        id: "your-rights",
        heading: "Your rights",
        blocks: [
          p("Depending on where you live, you may have rights to access, correct or delete personal data and to object to certain processing. **[Describe applicable rights and legal bases for your jurisdiction, e.g. GDPR/UK GDPR or CCPA, once data collection begins.]**"),
        ],
      },
      {
        id: "changes",
        heading: "Changes to this policy",
        blocks: [p("We will post any changes on this page and update the date above.")],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    metaTitle: "Terms & Conditions",
    description: "The terms that apply when you access and use WebAIAutomation.com and its free tools.",
    updatedAt: "2026-11-18",
    requiresLegalReview: true,
    intro:
      "These terms govern your use of WebAIAutomation.com. By using the website you agree to them. If you do not agree, please do not use the site.",
    sections: [
      {
        id: "use-of-the-site",
        heading: "Use of the website",
        blocks: [
          list([
            "You may browse the site and use the free utilities for personal and commercial purposes.",
            "You agree not to misuse the site, attempt to disrupt it, or access it through automated means that place an unreasonable load on our infrastructure.",
            "We may change, suspend or discontinue any part of the site at any time.",
          ]),
        ],
      },
      {
        id: "content-and-accuracy",
        heading: "Content and accuracy",
        blocks: [
          p("Our articles, guides and tool listings are provided for general information. Products, features and pricing change frequently; always confirm details with the vendor before making decisions. See our [Disclaimer](/disclaimer) for more."),
        ],
      },
      {
        id: "free-tools",
        heading: "Free tools",
        blocks: [
          p("The free utilities are provided \"as is\" without warranties of any kind. You are responsible for reviewing any output — including summaries, emails, prompts and meta descriptions — before relying on or publishing it."),
        ],
      },
      {
        id: "automation-services",
        heading: "Automation services",
        blocks: [
          p("Prices shown on our [Services](/services) page are indicative starting prices, not offers. The scope, price, timeline and terms of any paid engagement are set out in a written quote or agreement, which takes precedence over the website. Third-party software subscriptions and usage fees are not included unless the quote says otherwise. **[Add payment, cancellation and warranty terms reviewed by legal counsel.]**"),
        ],
      },
      {
        id: "intellectual-property",
        heading: "Intellectual property",
        blocks: [
          p("The site's original text, design and code are owned by **[Legal entity name]** unless stated otherwise. Product names, logos and trademarks belong to their respective owners and are used for identification only."),
        ],
      },
      {
        id: "liability",
        heading: "Limitation of liability",
        blocks: [
          p("**[Insert limitation of liability clause appropriate to your jurisdiction, reviewed by legal counsel.]**"),
        ],
      },
      {
        id: "governing-law",
        heading: "Governing law",
        blocks: [p("These terms are governed by the laws of **[jurisdiction]**. **[Confirm with legal counsel.]**")],
      },
      {
        id: "contact",
        heading: "Contact",
        blocks: [p("Questions about these terms? [Contact us](/contact).")],
      },
    ],
  },
  {
    slug: "disclaimer",
    title: "Disclaimer",
    metaTitle: "Disclaimer",
    description: "Important information about the accuracy, independence and intended use of WebAIAutomation content.",
    updatedAt: "2026-11-18",
    requiresLegalReview: true,
    intro:
      "WebAIAutomation publishes independent information about AI tools, automation and technology. Please read this disclaimer before acting on anything you find here.",
    sections: [
      {
        id: "general-information",
        heading: "General information only",
        blocks: [
          p("Content on this website is for general informational and educational purposes. It is not legal, financial, security or other professional advice. Consult a qualified professional for advice specific to your situation."),
        ],
      },
      {
        id: "accuracy",
        heading: "Accuracy and changes",
        blocks: [
          p("We work to keep listings and articles accurate, but AI products change quickly. Features, pricing models, availability and terms may differ from what we describe. Always verify current information on the vendor's official website."),
        ],
      },
      {
        id: "independence",
        heading: "Independence and affiliations",
        blocks: [
          p("Some tool listings may include **affiliate links**. Where a listing has one, the button is labelled and accompanied by a disclosure: if you sign up or buy through it we may earn a commission, at no extra cost to you. Affiliate relationships never decide whether a tool is listed, how it is described or how it is ranked."),
          p("Apart from disclosed affiliate links, we are not affiliated with the companies whose products we cover unless we state otherwise. Any sponsored placements will be clearly labelled in line with our [Editorial Policy](/editorial-policy)."),
          p("We also sell automation services (see [Services](/services)). Tools are not described more favourably because we use them in client work."),
        ],
      },
      {
        id: "ai-output",
        heading: "AI-generated output",
        blocks: [
          p("AI tools can produce incorrect, biased or outdated output. Review any AI-assisted result — from third-party tools or our own utilities — before relying on it."),
        ],
      },
      {
        id: "trademarks",
        heading: "Trademarks",
        blocks: [
          p("All product names, logos and brands are property of their respective owners. Tool icons on this site are generated monograms, not official logos."),
        ],
      },
    ],
  },
  {
    slug: "editorial-policy",
    title: "Editorial Policy",
    metaTitle: "Editorial Policy",
    description: "How WebAIAutomation researches, writes, reviews and updates articles, guides and AI tool listings.",
    updatedAt: "2026-11-18",
    requiresLegalReview: false,
    intro:
      "Readers rely on us to help them choose and use technology. This policy describes the standards our editorial team follows so you know how our content is made.",
    sections: [
      {
        id: "principles",
        heading: "Our principles",
        blocks: [
          list([
            "**Accuracy first:** we describe features and pricing models conservatively and link to official sources so readers can verify details.",
            "**Independence:** inclusion in the directory and editorial recommendations cannot be bought.",
            "**Practicality:** we favour advice readers can apply, with clear steps and honest trade-offs.",
            "**Transparency:** we disclose demo features, limitations and any commercial relationships.",
          ]),
        ],
      },
      {
        id: "tool-listings",
        heading: "How we list AI tools",
        blocks: [
          p("Tools are selected for usefulness and public availability. Each listing summarises what the product does, its pricing model, commonly cited pros and cons, and alternatives. We avoid publishing specific prices because they change frequently."),
          p("Vendors and readers can suggest tools through our [submission form](/submit-tool). Submissions are reviewed by editors and are not guaranteed to be listed."),
        ],
      },
      {
        id: "use-of-ai",
        heading: "Use of AI in our work",
        blocks: [
          p("Our team may use AI tools for research assistance, outlining or editing. Every article and guide is reviewed by a person for accuracy, clarity and usefulness before publication, and we don't publish statistics or claims we cannot support."),
        ],
      },
      {
        id: "corrections",
        heading: "Corrections and updates",
        blocks: [
          p("If you spot an error, please [contact us](/contact) with the page URL and details. We review correction requests promptly and update content — noting significant changes with an updated date."),
        ],
      },
      {
        id: "commercial-relationships",
        heading: "Advertising and sponsorships",
        blocks: [
          p("Any sponsored content or advertising will be clearly labelled and kept separate from editorial recommendations. See [Advertise](/advertise) for details."),
        ],
      },
      {
        id: "affiliate-links",
        heading: "Affiliate links",
        blocks: [
          p("Some tool listings may link to a vendor through an affiliate program, which can earn us a commission at no extra cost to you. Affiliate links are always labelled where they appear and are only added for tools we would list anyway. Whether a tool has an affiliate program has no effect on inclusion, descriptions, pros and cons, or ordering."),
        ],
      },
      {
        id: "services",
        heading: "Our automation services",
        blocks: [
          p("WebAIAutomation also offers paid automation services. Our editorial coverage of automation platforms and AI tools is independent of that work: we don't promote a tool because we use it for clients, and client relationships are never presented as editorial content."),
        ],
      },
    ],
  },
  {
    slug: "write-for-us",
    title: "Write for Us",
    metaTitle: "Write for Us — Contribute AI & Automation Guides",
    description: "Pitch a practical guide or article on AI tools, automation or technology to the WebAIAutomation editorial team.",
    updatedAt: "2026-11-07",
    requiresLegalReview: false,
    intro:
      "We welcome contributions from practitioners who use AI and automation in real work — developers, operators, marketers and analysts with hands-on experience to share.",
    sections: [
      {
        id: "what-we-publish",
        heading: "What we publish",
        blocks: [
          list([
            "Step-by-step tutorials with real, reproducible workflows",
            "Honest comparisons based on hands-on use",
            "Clear explainers of AI, machine learning, SaaS and cloud concepts",
            "Case studies of automation projects, including what didn't work",
          ]),
        ],
      },
      {
        id: "guidelines",
        heading: "Contributor guidelines",
        blocks: [
          list([
            "Original, unpublished work only.",
            "Support factual claims with sources and avoid invented statistics.",
            "No promotional content or undisclosed affiliations.",
            "Our editors may edit for clarity, accuracy and style.",
          ]),
        ],
      },
      {
        id: "how-to-pitch",
        heading: "How to pitch",
        blocks: [
          p("Send a short pitch through our [contact form](/contact) with the topic \"Other\" or email [hello@webaiautomation.com](mailto:hello@webaiautomation.com). Include a working title, a three-to-five point outline, why you're the right person to write it, and links to previous writing."),
        ],
      },
    ],
  },
  {
    slug: "advertise",
    title: "Advertise with Us",
    metaTitle: "Advertise — Reach AI & Automation Professionals",
    description: "Partnership and sponsorship options with WebAIAutomation, built around clear labelling and editorial independence.",
    updatedAt: "2026-11-18",
    requiresLegalReview: false,
    intro:
      "WebAIAutomation reaches professionals who are actively evaluating AI tools and automation platforms. We're building partnership options that respect our readers and keep editorial content independent.",
    sections: [
      {
        id: "options",
        heading: "Partnership options",
        blocks: [
          list([
            "**Newsletter sponsorships** — a clearly labelled placement in our weekly brief (once the newsletter launches).",
            "**Sponsored guides** — educational content produced to our editorial standards and labelled as sponsored.",
            "**Display placements** — limited, non-intrusive placements that don't affect page performance.",
          ]),
          { type: "callout", tone: "info", title: "Availability", text: "Partnership options are in development. Get in touch to register interest and we'll share details as they become available." },
        ],
      },
      {
        id: "our-standards",
        heading: "Our standards",
        blocks: [
          p("Sponsorship never buys a directory listing, a recommendation or a review outcome. All paid placements are labelled. Read our [Editorial Policy](/editorial-policy) for details."),
        ],
      },
      {
        id: "get-in-touch",
        heading: "Get in touch",
        blocks: [
          p("Send a sponsorship inquiry using the [form below](#sponsor-inquiry), or email [hello@webaiautomation.com](mailto:hello@webaiautomation.com). Tell us about your product, the audience you want to reach and your timing, and we'll reply with availability."),
        ],
      },
    ],
  },
];

export function getInfoPage(slug: InfoPage["slug"]): InfoPage {
  const page = infoPages.find((pg) => pg.slug === slug);
  if (!page) throw new Error(`Unknown info page: ${slug}`);
  return page;
}
