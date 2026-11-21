import Link from "next/link";
import { footerGroups } from "@/data/navigation";
import { siteConfig, socialLinks } from "@/data/site";
import { SocialIcon } from "@/components/shared/social-icons";
import { CopyrightYears } from "./current-year";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border bg-surface/60">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />
      <div className="container-site grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{siteConfig.description}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            <a href={`mailto:${siteConfig.email}`} className="transition-colors hover:text-foreground">
              {siteConfig.email}
            </a>
          </p>
          <ul className="mt-6 flex gap-2">
            {socialLinks.map((s) => (
              <li key={s.platform}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                >
                  <SocialIcon platform={s.platform} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-site flex flex-col gap-3 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYears from={siteConfig.foundedYear} /> {siteConfig.name}. All rights reserved.
          </p>
          <p>Independent reviews. Product names and trademarks belong to their respective owners.</p>
        </div>
      </div>
    </footer>
  );
}
