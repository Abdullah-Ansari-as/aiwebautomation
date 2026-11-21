/**
 * Page transition: templates re-mount on every navigation, so this CSS
 * entrance animation plays on each route change. CSS (rather than JS) keeps
 * content visible at first paint and protects LCP.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
