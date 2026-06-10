export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Background noise / grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glowing blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse [animation-delay:1s]" />
        {/* Content */}
        <div className="relative z-10 text-center space-y-6 max-w-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Security Monitor
            </h1>
            <p className="mt-2 text-blue-200 text-sm leading-relaxed">
              Platform terpadu untuk pemantauan keamanan, kontrol akses, dan
              laporan operasional secara real-time.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-left">
            {[
              { icon: "🛡️", text: "Kontrol akses terpusat" },
              { icon: "📊", text: "Dashboard monitoring real-time" },
              { icon: "📋", text: "Laporan operasional lengkap" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-blue-100">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Bottom copyright */}
        <p className="absolute bottom-6 text-xs text-blue-300/50">
          © 2025 Security Monitor · All rights reserved
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {children}
      </div>
    </div>
  );
}
