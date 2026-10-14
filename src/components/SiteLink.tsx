"use client";
import Link, { useLinkStatus } from "next/link";
import { useEffect, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";

function NavigationNotice({ href }: { href: string }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);
  return createPortal(
    <div className="navigation-notice" role="status" aria-live="polite">
      <span className="navigation-spinner" aria-hidden="true" />
      <span>
        {slow ? "This page is taking longer to respond." : "Opening page…"}
      </span>
      {slow && (
        <a href={href} onClick={(event) => event.stopPropagation()}>
          Try a full page load
        </a>
      )}
    </div>,
    document.body,
  );
}
function Pending({ href }: { href: string }) {
  const { pending } = useLinkStatus();
  return pending ? <NavigationNotice href={href} /> : null;
}
export default function SiteLink({
  children,
  ...props
}: ComponentProps<typeof Link>) {
  const href =
    typeof props.href === "string" ? props.href : props.href.pathname || "/";
  return (
    <Link {...props}>
      {children}
      <Pending href={href} />
    </Link>
  );
}
