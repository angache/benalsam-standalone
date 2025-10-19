'use client';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
          BenAlsam Next.js
        </h1>
        <p className="text-muted-foreground text-lg">
          ✅ Altyapı hazır, UI bekleniyor...
        </p>
        <div className="flex gap-4 justify-center text-sm">
          <a href="/test-api" className="px-4 py-2 rounded-lg border hover:bg-accent transition-all">
            🧪 API Test
          </a>
        </div>
      </div>
    </div>
  );
}
