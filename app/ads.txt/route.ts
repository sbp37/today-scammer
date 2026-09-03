const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "";

export async function GET() {
  const publisherId = clientId.replace(/^ca-/, "");
  if (!/^pub-\d+$/.test(publisherId)) {
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }

  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
