import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-800 via-green-700 to-green-900">
      <main className="flex flex-col items-center gap-8 p-8 bg-white/10 backdrop-blur-sm rounded-3xl border-4 border-amber-900 shadow-2xl max-w-2xl">
        <h1 className="text-6xl font-bold text-white text-center">
          Blackjack
        </h1>
        <p className="text-xl text-gray-200 text-center max-w-md">
          Guest-first, server-authoritative blackjack. No login required.
        </p>
        <div className="flex flex-col gap-4 text-center">
          <Link
            href="/play"
            className="px-12 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-2xl rounded-lg shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            Play Now
          </Link>
          <p className="text-sm text-gray-300">
            Dealer stands on soft 17 • Blackjack pays 3:2
          </p>
        </div>
        <div className="mt-8 p-6 bg-gray-900/50 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-3">Features:</h2>
          <ul className="text-gray-300 space-y-2">
            <li>✓ Server-authoritative gameplay</li>
            <li>✓ Persistent shoe across hands</li>
            <li>✓ Split & double down support</li>
            <li>✓ Keyboard shortcuts (H/S/D/P)</li>
            <li>✓ Smooth animations</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
