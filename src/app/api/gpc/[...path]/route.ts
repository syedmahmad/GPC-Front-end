import type { NextRequest } from "next/server";
import { callGpc, isAllowed } from "@/lib/gpc-server";

/**
 * The browser talks to this route, never to GPC directly. It only forwards the
 * few calls the demo screen needs, and adds the access token on the server.
 */
async function forward(request: NextRequest, ctx: RouteContext<"/api/gpc/[...path]">) {
  const { path } = await ctx.params;
  const target = `/${path.join("/")}`;
  const method = request.method;

  if (!isAllowed(method, target)) {
    return Response.json({ message: "Not part of the demo." }, { status: 404 });
  }

  try {
    const text = await request.text();
    const body = text ? (JSON.parse(text) as unknown) : undefined;
    const result = await callGpc(method, target + request.nextUrl.search, body);
    if (result.status === 204 || result.body === undefined) {
      return new Response(null, { status: result.status });
    }
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown problem.";
    return Response.json({ message: `Demo server problem: ${message}` }, { status: 502 });
  }
}

export { forward as GET, forward as POST, forward as DELETE };
