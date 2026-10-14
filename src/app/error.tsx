"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="p-12 pt-32 text-center">
      <h1 className="text-3xl">Unable to load this page</h1>
      <p className="my-6">Please try again in a moment.</p>
      <button
        className="p-3 rounded-lg bg-blue-600 text-white"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}
