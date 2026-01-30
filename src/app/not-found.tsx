import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-md text-center">
        <h2 className="text-6xl font-bold text-gray-600 mb-4">404</h2>
        <h3 className="text-xl font-bold text-white mb-2">Page Not Found</h3>
        <p className="text-gray-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/play"
            className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors inline-block"
          >
            Play Blackjack
          </Link>
          <Link
            href="/"
            className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors inline-block"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
