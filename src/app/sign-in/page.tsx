import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#0d0d0f]">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Logo */}
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase text-white">
            Fitness<span className="text-orange-500">.</span>
          </h1>
          <p className="mt-2 text-xs text-white/40 uppercase tracking-widest">
            Track your lifts. See your progress.
          </p>
        </div>

        {/* Sign-in card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8 space-y-6">
          <p className="text-sm text-white/50">Sign in to access your workouts</p>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.10] transition-all"
            >
              {/* Google "G" icon */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        <p className="text-xs text-white/20">Access is invite-only</p>
      </div>
    </main>
  );
}
