import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/lib/auth";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { modules } from "@/lib/cms-config";
import { ThemeToggle } from "@/components/public/ThemeToggle";
export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  return (
    <div className="admin-shell min-h-screen">
      <header className="admin-top">
        <Link href="/admin/dashboard">
          <Image
            src="/brand/icon-dark.png"
            alt="Bunyaad Solutions"
            width={40}
            height={40}
          />
        </Link>
        <strong>Content Studio</strong>
        <span className="ml-auto">
          {user.name} · {user.role === "SUPER_ADMIN" ? "Super Admin" : "Editor"}
        </span>
        <ThemeToggle />
        <Link href="/" target="_blank">
          View site
        </Link>
        <form
          action={async () => {
            "use server";
            const actor = await requireAuth();
            await prisma.activityLog.create({
              data: {
                userId: actor.id,
                action: "LOGOUT",
                entityType: "users",
                entityId: actor.id,
              },
            });
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button>Sign out</button>
        </form>
      </header>
      <div className="admin-grid">
        <aside>
          <nav aria-label="Administration">
            <Link href="/admin/dashboard">Overview</Link>
            {Object.entries(modules)
              .filter(([, m]) => !m.superOnly || user.role === "SUPER_ADMIN")
              .map(([key, m]) => (
                <Link key={key} href={"/admin/" + key}>
                  {m.label}
                </Link>
              ))}
            <Link href="/admin/media">Media library</Link>
            <Link href="/admin/activity">Activity log</Link>
          </nav>
        </aside>
        <main id="main-content" className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
