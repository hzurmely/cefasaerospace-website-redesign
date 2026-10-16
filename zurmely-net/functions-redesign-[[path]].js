// zurmely.net/redesign -> projeto cefasaerospace-website-redesign no Cloudflare Pages
const ORIGEM = "https://cefasaerospace-website-redesign.pages.dev";
const PREFIXO = "/redesign";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "connect-src 'self' data: blob: https://cloudflareinsights.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SEGURANCA = {
  "Content-Security-Policy": CSP,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

const REPASSAR = ["accept", "accept-encoding", "accept-language", "if-none-match", "if-modified-since", "range", "user-agent"];

export async function onRequest({ request }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Método não permitido", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const url = new URL(request.url);

  // /redesign sem barra quebraria os caminhos relativos do site
  if (url.pathname === PREFIXO) {
    url.pathname = PREFIXO + "/";
    return Response.redirect(url.toString(), 301);
  }

  const destino = new URL(url.pathname.slice(PREFIXO.length) || "/", ORIGEM);
  destino.search = url.search;

  const cabecalhos = new Headers();
  for (const nome of REPASSAR) {
    const valor = request.headers.get(nome);
    if (valor) cabecalhos.set(nome, valor);
  }

  const resposta = await fetch(destino, { method: request.method, headers: cabecalhos, redirect: "manual" });
  const saida = new Response(resposta.body, resposta);

  // redirecionamentos do projeto de origem continuam dentro de /redesign
  const location = saida.headers.get("Location");
  if (location) {
    const alvo = new URL(location, ORIGEM);
    if (alvo.origin === ORIGEM) {
      saida.headers.set("Location", PREFIXO + alvo.pathname + alvo.search);
    }
  }

  for (const [nome, valor] of Object.entries(SEGURANCA)) saida.headers.set(nome, valor);
  saida.headers.delete("Access-Control-Allow-Origin");
  return saida;
}
