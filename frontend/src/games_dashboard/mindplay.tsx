import Link from "next/link";

const games = [
  {
    title: "Whack a Mole",
    description:
      "Quick-reflex game to help with focus and reaction time. Tap moles as soon as they appear.",
    href: "/games_dashboard/whack-a-mole",
    accent: "from-amber-500 to-orange-600",
  },
  {
    title: "Memory Card Game",
    description:
      "Flip pairs and remember their positions to boost working memory and pattern recall.",
    href: "/games_dashboard/memory",
    accent: "from-indigo-500 to-cyan-500",
  },
];

export default function GamesDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.25rem] text-emerald-300">
              Neurodiversity-first play lab
            </p>
            <h1 className="text-4xl font-bold sm:text-5xl">MindPlay</h1>
            <p className="max-w-2xl text-base text-slate-300">
              Light, structured games designed to support focus, calm, and memory for neurodiverse patients.
            </p>
          </div>
          <div className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 shadow-lg">
            Frontend preview
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {games.map((game) => (
            <article
              key={game.title}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl transition hover:-translate-y-1 hover:shadow-emerald-500/30"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent}`} />
              <div className="flex h-full flex-col gap-4 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold">{game.title}</h2>
                    <p className="text-sm text-slate-300">{game.description}</p>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
                    Coming Soon
                  </span>
                </div>
                <div className="mt-auto">
                  <Link
                    href={game.href}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                    aria-disabled
                  >
                    <span>Preview layout</span>
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
