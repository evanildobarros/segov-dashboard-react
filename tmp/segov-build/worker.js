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
function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlDecode(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
__name(base64UrlDecode, "base64UrlDecode");
var AUTH_COOKIE = "segov_session";
var ROTAS_PROTEGIDAS = ["/dados_municipios.json", "/eixos_obras.json", "/api/data"];
function getCookie(header, name) {
  if (!header) return null;
  const match = new RegExp("(?:^|;\\s*)" + name + "=([^;]*)").exec(header);
  return match ? match[1] : null;
}
__name(getCookie, "getCookie");
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
function json(resp, status, extra = {}) {
  return new Response(JSON.stringify(resp), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...securityHeaders(), ...extra }
  });
}
__name(json, "json");
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
async function d1Query(env, sql, params = []) {
  if (env.DB) {
    const stmt = env.DB.prepare(sql).bind(...params);
    const isRead = /^(SELECT|PRAGMA)/i.test(sql.trim());
    if (isRead) {
      const { results } = await stmt.all();
      return { results: results || [] };
    }
    const info = await stmt.run();
    return { results: [], success: true, meta: info.meta };
  }
  if (env.CF_ACCOUNT_ID && env.CF_API_TOKEN && env.D1_DB_ID) {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/d1/database/${env.D1_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.CF_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sql, params })
      }
    );
    const data = await resp.json();
    return { results: data.result?.[0]?.results || [], success: data.success, meta: data.result?.[0]?.meta };
  }
  throw new Error("D1 n\xE3o configurado (binding ou secrets HTTP)");
}
__name(d1Query, "d1Query");
async function loadDadosAtivos(env) {
  const result = await d1Query(
    env,
    "SELECT ibge, nome, grupo, prioritario, cor, prefeito, alinhamento, total_obras, obras_em_andamento, obras_entregues, equipamento_solicitado, equipamento_categoria, partido, investimento_planner, total_liderancas, mesorregiao, eixos, asfalto FROM municipios ORDER BY nome"
  );
  if (result.results && result.results.length > 0) {
    const muns = result.results.map((r) => ({
      ibge: String(r.ibge),
      nome: String(r.nome),
      grupo: String(r.grupo || "indefinido"),
      prioritario: r.prioritario ? true : false,
      cor: String(r.cor || "#BDC3C7"),
      prefeito: String(r.prefeito || ""),
      alinhamento: String(r.alinhamento || ""),
      total_obras: Number(r.total_obras || 0),
      obras_em_andamento: Number(r.obras_em_andamento || 0),
      obras_entregues: Number(r.obras_entregues || 0),
      equipamento_solicitado: String(r.equipamento_solicitado || ""),
      equipamento_categoria: String(r.equipamento_categoria || ""),
      partido: String(r.partido || ""),
      investimento_planner: r.investimento_planner != null ? String(r.investimento_planner) : "",
      total_liderancas: Number(r.total_liderancas || 0),
      mesorregiao: String(r.mesorregiao || ""),
      eixos: (() => {
        try {
          return JSON.parse(r.eixos || "[]");
        } catch {
          return [];
        }
      })(),
      asfalto: (() => {
        try {
          return JSON.parse(r.asfalto || "{}");
        } catch {
          return null;
        }
      })()
    }));
    const totalObras = muns.reduce((s, m) => s + m.total_obras, 0);
    return {
      municipios: muns,
      metadata: {
        total_municipios: muns.length,
        total_obras: totalObras,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  }
  return null;
}
__name(loadDadosAtivos, "loadDadosAtivos");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const secret = env.AUTH_SECRET;
    const method = request.method;
    if (path === "/api/sessao" && method === "GET") {
      const usuario = await validarSessao(request.headers.get("Cookie"), secret);
      return json({ autenticado: !!usuario, usuario }, usuario ? 200 : 401, { "Cache-Control": "private, no-store" });
    }
    if (path === "/api/login" && method === "POST") {
      try {
        const body = await request.json();
        const u = String(body.usuario || "").trim();
        const p = String(body.senha || "");
        if (!env.DASH_USER || !env.DASH_PASS || !secret) {
          return json({ ok: false, erro: "Secrets n\xE3o configurados" }, 500, { "Cache-Control": "no-store" });
        }
        if (u === env.DASH_USER && p === env.DASH_PASS) {
          const payload = { u, exp: Date.now() + 12 * 60 * 60 * 1e3 };
          const payloadB64 = base64UrlEncode(JSON.stringify(payload));
          const sig = await hmacHex(secret, payloadB64);
          const cookie = AUTH_COOKIE + "=" + payloadB64 + "." + sig + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=" + 12 * 60 * 60;
          return json({ ok: true }, 200, { "Set-Cookie": cookie, "Cache-Control": "no-store" });
        }
        return json({ ok: false, erro: "Credenciais inv\xE1lidas" }, 401, { "Cache-Control": "no-store" });
      } catch (e) {
        return json({ ok: false, erro: "Requisi\xE7\xE3o inv\xE1lida: " + (e.message || "parse error") }, 400, { "Cache-Control": "no-store" });
      }
    }
    if (path === "/api/logout" && method === "POST") {
      const cookie = AUTH_COOKIE + "=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";
      return json({ ok: true }, 200, { "Set-Cookie": cookie, "Cache-Control": "no-store" });
    }
    if (path === "/api/municipios" && method === "GET") {
      try {
        const dados = await loadDadosAtivos(env);
        if (dados) {
          return json(dados, 200, {
            "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
            "CDN-Cache-Control": "public, max-age=300"
          });
        }
        const resp2 = await env.ASSETS.fetch(request);
        if (resp2.status === 404) return json({ ok: false, erro: "Dados n\xE3o encontrados" }, 404);
        const h2 = new Headers(resp2.headers);
        h2.set("Cache-Control", "public, max-age=300");
        return new Response(resp2.body, { status: 200, headers: h2 });
      } catch (e) {
        console.error("loadDadosAtivos error:", e);
        const resp2 = await env.ASSETS.fetch(request);
        return new Response(resp2.body, { status: resp2.status, headers: resp2.headers });
      }
    }
    const mIbgeMatch = path.match(/^\/api\/municipios\/(\d+)$/);
    if (mIbgeMatch && method === "GET") {
      const ibge = mIbgeMatch[1];
      try {
        const dados = await loadDadosAtivos(env);
        if (dados) {
          const m = dados.municipios.find((m2) => String(m2.ibge) === ibge);
          if (m) return json({ ok: true, municipio: m }, 200, { "Cache-Control": "public, max-age=300" });
          return json({ ok: false, erro: "Munic\xEDpio n\xE3o encontrado" }, 404, { "Cache-Control": "public, max-age=300" });
        }
        return json({ ok: false, erro: "Dados n\xE3o carregados" }, 500);
      } catch (e) {
        return json({ ok: false, erro: e.message }, 500);
      }
    }
    if (path === "/api/kpis" && method === "GET") {
      try {
        const dados = await loadDadosAtivos(env);
        if (!dados) return json({ ok: false, erro: "Dados n\xE3o carregados" }, 500);
        const muns = dados.municipios || [];
        const grupos = muns.reduce((acc, m) => {
          acc[m.grupo] = (acc[m.grupo] || 0) + 1;
          return acc;
        }, {});
        return json({
          ok: true,
          total_municipios: muns.length,
          total_obras: dados.metadata?.total_obras || 0,
          investimento_total: dados.metadata?.investimento_total || 0,
          grupos,
          updated_at: dados.metadata?.updated_at || null
        }, 200, { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" });
      } catch (e) {
        return json({ ok: false, erro: e.message }, 500);
      }
    }
    if (path === "/api/municipios" && method === "POST") {
      const usuario = await validarSessao(request.headers.get("Cookie"), secret);
      if (!usuario) return json({ ok: false, erro: "N\xE3o autorizado" }, 401, { "Cache-Control": "no-store" });
      try {
        const dados = await request.json();
        validarJSON(dados);
        const payloadBase64 = base64UrlEncode(JSON.stringify(dados));
        const result = await d1Query(
          env,
          "INSERT INTO dados_municipios (conteudo_base64, total_municipios, total_obras, actor, created_at) VALUES (?, ?, ?, ?, ?)",
          [payloadBase64, dados.municipios.length, dados.metadata?.total_obras || 0, usuario, (/* @__PURE__ */ new Date()).toISOString()]
        );
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
          } catch {
            deployOk = false;
          }
        }
        return json({
          ok: true,
          message: "\u2705 Salvo no D1",
          saved_to_db: result && result.results !== void 0,
          total_municipios: dados.municipios.length,
          deploy_ci: deployOk
        }, 201, { "Cache-Control": "no-store" });
      } catch (err) {
        return json({ ok: false, erro: err.message }, 400);
      }
    }
    if (path === "/api/versoes" && method === "GET") {
      try {
        const result = await d1Query(
          env,
          "SELECT COUNT(*) as total_municipios, MAX(updated_at) as ultima_atualizacao FROM municipios"
        );
        return json({ ok: true, versions: result.results || [] }, 200, { "Cache-Control": "public, max-age=300" });
      } catch (e) {
        return json({ ok: false, erro: e.message }, 500);
      }
    }
    const putMatch = path.match(/^\/api\/municipios\/(\d+)$/);
    if (putMatch && method === "PUT") {
      const usuario = await validarSessao(request.headers.get("Cookie"), secret);
      if (!usuario) return json({ ok: false, erro: "N\xE3o autorizado" }, 401, { "Cache-Control": "no-store" });
      try {
        const ibge = putMatch[1];
        const body = await request.json();
        const allowedFields = [
          "grupo",
          "cor",
          "prioritario",
          "prefeito",
          "alinhamento",
          "total_obras",
          "obras_em_andamento",
          "obras_entregues",
          "equipamento_solicitado",
          "equipamento_categoria",
          "partido",
          "investimento_planner",
          "total_liderancas",
          "mesorregiao",
          "eixos"
        ];
        const updates = [];
        const params = [];
        for (const field of allowedFields) {
          if (field in body) {
            updates.push(`${field} = ?`);
            params.push(body[field]);
          }
        }
        if (updates.length === 0) {
          return json({ ok: false, erro: "Nenhum campo para atualizar" }, 400);
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        params.push(now);
        params.push(ibge);
        const sql = `UPDATE municipios SET ${updates.join(", ")}, updated_at = ? WHERE ibge = ?`;
        const result = await d1Query(env, sql, params);
        return json({ ok: true, message: "Munic\xEDpio atualizado no D1", updated: result.success }, 200, { "Cache-Control": "no-store" });
      } catch (err) {
        return json({ ok: false, erro: err.message }, 400);
      }
    }
    const delMatch = path.match(/^\/api\/municipios\/(\d+)$/);
    if (delMatch && method === "DELETE") {
      try {
        const ibge = delMatch[1];
        const result = await d1Query(
          env,
          "DELETE FROM municipios WHERE ibge = ?",
          [ibge]
        );
        return json({ ok: true, message: "Munic\xEDpio exclu\xEDdo", deleted: result.success }, 200, { "Cache-Control": "no-store" });
      } catch (e) {
        return json({ ok: false, erro: e.message }, 500);
      }
    }
    if (path === "/api/versoes" && method === "GET") {
      const usuario = await validarSessao(request.headers.get("Cookie"), secret);
      if (!usuario) return json({ ok: false, erro: "N\xE3o autorizado" }, 401, { "Cache-Control": "private, no-store" });
      const result = await d1Query(
        env,
        "SELECT id, total_municipios, total_obras, actor, created_at FROM dados_municipios ORDER BY created_at DESC LIMIT 20"
      );
      return json({ ok: true, versions: result.results || [] }, 200, { "Cache-Control": "private, no-store" });
    }
    const protegida = ROTAS_PROTEGIDAS.some((r) => path === r || path.startsWith(r));
    if (protegida) {
      const usuario = await validarSessao(request.headers.get("Cookie"), secret);
      if (!usuario) return json({ ok: false, erro: "N\xE3o autorizado" }, 401, { "Cache-Control": "private, no-store" });
      const resp2 = await env.ASSETS.fetch(request);
      if (resp2.status === 404) return json({ ok: false, erro: "Recurso n\xE3o encontrado" }, 404);
      const h2 = new Headers(resp2.headers);
      h2.set("Cache-Control", "private, max-age=0, must-revalidate");
      for (const [k, v] of Object.entries(securityHeaders())) h2.set(k, v);
      return new Response(resp2.body, { status: resp2.status, headers: h2 });
    }
    const resp = await env.ASSETS.fetch(request);
    if (resp.status === 404) {
      if (!path.includes(".") || path === "/login") {
        return await env.ASSETS.fetch(new Request(new URL("/", request.url)));
      }
    }
    const h = new Headers(resp.headers);
    for (const [k, v] of Object.entries(securityHeaders())) h.set(k, v);
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
