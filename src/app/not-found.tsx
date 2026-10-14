import Link from "@/components/SiteLink";
export default function NotFound() {
  return (
    <main className="p-12 pt-32 text-center">
      <h1 className="text-4xl">Page not found</h1>
      <p className="my-6">
        This content may be unpublished or no longer available.
      </p>
      <Link className="text-blue-600" href="/">
        Return home
      </Link>
    </main>
  );
}
