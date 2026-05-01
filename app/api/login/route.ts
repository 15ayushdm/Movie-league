import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  const expected = process.env.LEAGUE_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("mfl_auth", expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
  return res;
}
