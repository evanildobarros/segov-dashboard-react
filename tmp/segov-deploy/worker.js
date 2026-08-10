var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.js
async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacHex, "hmacHex");
var AUTH_COOKIE = "segov_session";
var ROTAS_PROTEGIDAS = [
  "/dados_municipios.json",
  "/eixos_obras.json",
  "/api/data"
];
function getCookie(header, name) {
  if (!header) return null;
  const match = new RegExp("(?:^|;\\s*)" + name + "=([^;]*)").exec(header);
  return match ? match[1] : null;
}
__name(getCookie, "getCookie");
function base64UrlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
__name(base64UrlDecode, "base64UrlDecode");
function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\\+/g, "-").replace(/\\/ / g, "_").replace(/=+$/, "");
}
__name(base64UrlEncode, "base64UrlEncode");
async function validarSessao(header, secret) {
  const raw = getCookie(header, AUTH_COOKIE);
  if (!raw || !secret) return false;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return false;
  try {
    const esperado = await hmacHex(secret, payload);
    if (esperado !== sig) return false;
    const dec = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    if (!dec.exp || dec.exp < Date.now()) return false;
    return dec.u || false;
  } catch {
    return false;
  }
}
__name(validarSessao, "validarSessao");
function securityHeaders() {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:; frame-ancestors 'none'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  };
}
__name(securityHeaders, "securityHeaders");
function json(resp, status, extra = {}) {
  return new Response(JSON.stringify(resp), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...securityHeaders(), ...extra }
  });
}
__name(json, "json");
function validarJSON(dados) {
  if (!dados.municipios || !Array.isArray(dados.municipios)) {
    throw new Error('Formato inv\xE1lido: esperado { "municipios": [...] }');
  }
  const required = ["ibge", "nome", "grupo", "cor"];
  const first = dados.municipios[0];
  const missing = required.filter((k) => !(k in first));
  if (missing.length > 0) {
    throw new Error(`Campos obrigat\xF3rios ausentes: ${missing.join(", ")}`);
  }
}
__name(validarJSON, "validarJSON");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const secret = env.AUTH_SECRET;
    if (path === "/api/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const u = String(body.usuario || "").trim();
        const p = String(body.senha || "");
        if (u === env.DASH_USER && p === env.DASH_PASS && secret) {
          const payload = {
            u,
            exp: Date.now() + 12 * 60 * 60 * 1e3
            // 12h
          };
          const payloadB64 = base64UrlEncode(JSON.stringify(payload));
          const sig = await hmacHex(secret, payloadB64);
          const cookieValue = payloadB64 + "." + sig;
          const cookie = AUTH_COOKIE + "=" + cookieValue + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=" + 12 * 60 * 60;
          return json({ ok: true }, 200, {
            "Set-Cookie": cookie,
            "Cache-Control": "no-store"
          });
        }
        return json({ ok: false, erro: "Credenciais inv\xE1lidas" }, 401, { "Cache-Control": "no-store" });
      } catch (e) {
        return json({ ok: false, erro: "Requisi\xE7\xE3o inv\xE1lida" }, 400, { "Cache-Control": "no-store" });
      }
    }
    if (path === "/api/logout" && request.method === "POST") {
      const cookie = AUTH_COOKIE + "=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
      return json({ ok: true }, 200, { "Set-Cookie": cookie, "Cache-Control": "no-store" });
    }
    if (path === "/api/dados-municipios" && request.method === "POST") {
      const usuario = await validarSessao(request.headers.get("Cookie"), secret);
      if (!usuario) {
        return json({ ok: false, erro: "N\xE3o autorizado" }, 401, { "Cache-Control": "no-store" });
      }
      try {
        const dados = await request.json();
        validarJSON(dados);
        const payloadBase64 = base64UrlEncode(JSON.stringify(dados));
        if (env.DB) {
          await env.DB.prepare(
            "INSERT INTO dados_municipios (conteudo_base64, total_municipios, total_obras, actor, created_at) VALUES (?, ?, ?, ?, ?)"
          ).bind(
            payloadBase64,
            dados.municipios.length,
            dados.metadata?.total_obras || 0,
            usuario,
            (/* @__PURE__ */ new Date()).toISOString()
          ).all();
        }
        const deployUrl = env.DEPLOY_WEBHOOK_URL;
        let deployOk = false;
        if (deployUrl) {
          try {
            const deployResp = await fetch(deployUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                json_base64: payloadBase64,
                arquivo: "src/data/dados_municipios.json",
                message: `Update via admin panel (${(/* @__PURE__ */ new Date()).toISOString()})`,
                actor: usuario
              })
            });
            deployOk = deployResp.ok;
          } catch (e) {
            deployOk = false;
          }
        }
        return json({
          ok: true,
          message: deployOk ? "Salvo no D1 + deploy autom\xE1tico via CI" : "Salvo no D1 (fa\xE7a commit manual)",
          total_municipios: dados.municipios?.length || 0,
          deploy_ci: deployOk,
          saved_to_db: !!env.DB
        }, 200, { "Cache-Control": "no-store" });
      } catch (err) {
        return json({ ok: false, erro: err.message }, 400, { "Cache-Control": "no-store" });
      }
    }
    if (path === "/api/dados-municipios" && request.method === "GET") {
      const usuario = await validarSessao(request.headers.get("Cookie"), secret);
      if (!usuario) {
        return json({ ok: false, erro: "N\xE3o autorizado" }, 401, { "Cache-Control": "private, no-store" });
      }
      if (env.DB) {
        const { results } = await env.DB.prepare(
          "SELECT id, total_municipios, total_obras, actor, created_at FROM dados_municipios ORDER BY created_at DESC LIMIT 20"
        ).all();
        return json({ ok: true, versions: results || [] }, 200, { "Cache-Control": "private, no-store" });
      }
      return json({ ok: true, versions: [] }, 200, { "Cache-Control": "no-store" });
    }
    const protegida = ROTAS_PROTEGIDAS.some((r) => path === r || path.startsWith(r));
    if (protegida) {
      const usuario = await validarSessao(request.headers.get("Cookie"), secret);
      if (!usuario) {
        return json({ ok: false, erro: "N\xE3o autorizado" }, 401, { "Cache-Control": "private, no-store" });
      }
      const resp2 = await env.ASSETS.fetch(request);
      if (resp2.status === 404) return json({ ok: false, erro: "Recurso n\xE3o encontrado" }, 404);
      const h2 = new Headers(resp2.headers);
      h2.set("Cache-Control", "private, max-age=0, must-revalidate");
      for (const [k, v] of Object.entries(securityHeaders())) h2.set(k, v);
      return new Response(resp2.body, { status: resp2.status, headers: h2 });
    }
    if (path === "/api/sessao") {
      const usuario = await validarSessao(request.headers.get("Cookie"), secret);
      return json({ autenticado: !!usuario }, usuario ? 200 : 401, { "Cache-Control": "private, no-store" });
    }
    const resp = await env.ASSETS.fetch(request);
    if (resp.status === 404) {
      if (!path.includes(".") || path === "/login") {
        return await env.ASSETS.fetch(new Request(new URL("/", request.url)));
      }
    }
    const h = new Headers(resp.headers);
    for (const [k, v] of Object.entries(securityHeaders())) h.set(k, v);
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: h
    });
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
