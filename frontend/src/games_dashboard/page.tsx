import Link from "next/link";
import Image from "next/image";
import dailyQuizImage from "./assets/dailyquiz.png";
import whackAMoleLogo from "./assets/whack-a-mole-logo.jpg";
import memoryGameLogo from "./assets/memory-game-logo.jpg";

const games = [
  {
    title: "Whack a Mole",
    description:
      "Quick-reflex game to help with focus and reaction time. Tap moles as soon as they appear.",
    href: "/games_dashboard/whack-a-mole",
    accent: "from-amber-500 to-orange-600",
    logo: whackAMoleLogo,
  },
  {
    title: "Memory Card Game",
    description:
      "Flip pairs and remember their positions to boost working memory and pattern recall.",
    href: "/games_dashboard/memory",
    accent: "from-indigo-500 to-cyan-500",
    logo: memoryGameLogo,
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
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {games.map((game) => (
            <article
              key={game.title}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl transition hover:-translate-y-1 hover:shadow-emerald-500/30"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.accent}`} />
              <div className="flex h-full flex-col gap-4 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold">{game.title}</h2>
                    <p className="text-sm text-slate-300">{game.description}</p>
                  </div>
                  <div className="h-24 w-24 rounded-lg bg-white/10 border border-white/20 flex-shrink-0 overflow-hidden">
                    {game.logo && (
                      <Image
                        src={game.logo}
                        alt={`${game.title} logo`}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="mt-auto">
                  <Link
                    href={game.href}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                    aria-disabled
                  >
                    <span>Play Now!</span>
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Daily Quiz Section - Image Only */}
        <div className="flex flex-col gap-4 mt-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-bold">Daily Quiz</h2>
            <p className="max-w-2xl text-base text-slate-300">
              Test your knowledge on nutrition and fitness. 10 quick questions to boost your health awareness.
            </p>
          </div>
          <section className="flex justify-center">
            <Link href="/games_dashboard/daily-quiz" className="block overflow-hidden rounded-2xl transition hover:shadow-2xl hover:shadow-emerald-500/30 w-1/3">
              <Image
                src={dailyQuizImage}
                alt="Daily Quiz"
                className="w-full h-auto object-cover"
                priority
              />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
