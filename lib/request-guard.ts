// Menolak request yang tidak berasal dari halaman app ini sendiri.
// Browser selalu mengirim header Origin pada fetch POST, jadi request dari situs lain
// atau script tanpa Origin akan ditolak.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
