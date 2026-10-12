/**
 * Never accept Sites' internal identity headers from internet requests.
 * Independent Cloudflare hosting authenticates only verified Google sessions.
 *
 * This must run at the public Worker ingress before vinext route handling.
 */
export function stripUntrustedSiteIdentityHeaders(request) {
  const headers = new Headers(request.headers);
  let changed = false;
  for (const key of [...headers.keys()]) {
    if (key.toLowerCase().startsWith("oai-authenticated-user-")) {
      headers.delete(key);
      changed = true;
    }
  }
  return changed ? new Request(request, { headers }) : request;
}
