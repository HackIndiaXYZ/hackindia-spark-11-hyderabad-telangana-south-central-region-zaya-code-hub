import Link from "next/link";
import { LogoWordmark } from "./logo";

export function Navbar({ variant = "home" }: { variant?: "home" | "build" }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">
          <LogoWordmark />
        </Link>
        <nav className="site-nav">
          {variant === "home" ? (
            <>
              <Link href="#workflow">Workflow</Link>
              <Link href="#outputs">Outputs</Link>
              <Link href="/build" className="btn btn-primary btn-sm">
                Open workspace
              </Link>
            </>
          ) : (
            <Link href="/" className="btn btn-ghost btn-sm">
              Back
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
