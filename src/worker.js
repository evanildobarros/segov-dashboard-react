/**
 * SEGOV-MA Dashboard — Cloudflare Worker com Auth HMAC + D1 REST API
 *
 * Endpoints:
 *   POST   /api/login              → valida credenciais (secrets), emite cookie
 *   POST   /api/logout             → limpa cookie
 *   GET    /api/sessao             → verifica autenticação
 *   GET    /api/municipios         → retorna dados_ativos (JSON completo)
 *   POST   /api/municipios         → salva nova versão no D1 (auth)
 *   GET    /api/municipios/[ibge]  → dados de um município específico
 *   GET    /api/kpis               → KPIs do dashboard
 *   GET    /api/versoes            → histórico de versões salvas no D1
 *
 * Protegidas: /api/municipios (POST), /api/versoes, dados_municipios.json
 *
 * Secrets:
 *   AUTH_SECRET, DASH_USER, DASH_PASS
 *   CF_ACCOUNT_ID, CF_API_TOKEN, D1_DB_ID (fallback D1 HTTP)
 */

// --- Crypto helpers ---
async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Codifica string → base64url com padding (compatível D1)
function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

// Decodifica base64url com padding → bytes
function base64UrlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Auth helpers
const AUTH_COOKIE = 'segov_session';
const ROTAS_PROTEGIDAS = ['/dados_municipios.json', '/eixos_obras.json', '/api/data'];

function getCookie(header, name) {
  if (!header) return null;
  const match = new RegExp('(?:^|;\\s*)' + name + '=([^;]*)').exec(header);
  return match ? match[1] : null;
}

async function validarSessao(header, secret) {
  const raw = getCookie(header, AUTH_COOKIE);
  if (!raw || !secret) return false;
  const [payload, sig] = raw.split('.');
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

function validarJSON(dados) {
  if (!dados.municipios || !Array.isArray(dados.municipios)) {
    throw new Error('Formato inválido: esperado { "municipios": [...] }');
  }
  const required = ['ibge', 'nome', 'grupo', 'cor'];
  const first = dados.municipios[0];
  const missing = required.filter(k => !(k in first));
  if (missing.length > 0) {
    throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
  }
}

function json(resp, status, extra = {}) {
  return new Response(JSON.stringify(resp), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...securityHeaders(), ...extra }
  });
}

function securityHeaders() {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:; frame-ancestors 'none'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
}

// --- D1 helpers (binding + HTTP fallback) ---
async function d1Query(env, sql, params = []) {
  // 1) Binding D1 nativo (env.DB)
  if (env.DB) {
    const stmt = env.DB.prepare(sql).bind(...params);
    const isRead = /^(SELECT|PRAGMA)/i.test(sql.trim());
    if (isRead) {
      const { results } = await stmt.all();
      return { results: results || [] };
    }
    // Para INSERT/UPDATE/DELETE usar .run()
    const info = await stmt.run();
    return { results: [], success: true, meta: info.meta };
  }
  // 2) Fallback HTTP API
  if (env.CF_ACCOUNT_ID && env.CF_API_TOKEN && env.D1_DB_ID) {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/d1/database/${env.D1_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql, params })
      }
    );
    const data = await resp.json();
    return { results: data.result?.[0]?.results || [], success: data.success, meta: data.result?.[0]?.meta };
  }
  throw new Error('D1 não configurado (binding ou secrets HTTP)');
}

async function loadDadosAtivos(env) {
  // Busca diretamente da tabela municipios no D1 (sincronizada via sync)
  const result = await d1Query(env,
    'SELECT ibge, nome, grupo, prioritario, cor, prefeito, alinhamento, total_obras, obras_em_andamento, obras_entregues, equipamento_solicitado, equipamento_categoria, partido, investimento_planner, total_liderancas, mesorregiao, eixos FROM municipios ORDER BY nome'
  );
  if (result.results && result.results.length > 0) {
    const muns = result.results.map(r => ({
      ibge: String(r.ibge),
      nome: String(r.nome),
      grupo: String(r.grupo || 'indefinido'),
      prioritario: r.prioritario ? true : false,
      cor: String(r.cor || '#BDC3C7'),
      prefeito: String(r.prefeito || ''),
      alinhamento: String(r.alinhamento || ''),
      total_obras: Number(r.total_obras || 0),
      obras_em_andamento: Number(r.obras_em_andamento || 0),
      obras_entregues: Number(r.obras_entregues || 0),
      equipamento_solicitado: String(r.equipamento_solicitado || ''),
      equipamento_categoria: String(r.equipamento_categoria || ''),
      partido: String(r.partido || ''),
      investimento_planner: r.investimento_planner != null ? String(r.investimento_planner) : '',
      total_liderancas: Number(r.total_liderancas || 0),
      mesorregiao: String(r.mesorregiao || ''),
      eixos: (() => {
        try { return JSON.parse(r.eixos || '[]'); } catch { return []; }
      })()
    }));
    const totalObras = muns.reduce((s, m) => s + m.total_obras, 0);
    return {
      municipios: muns,
      metadata: {
        total_municipios: muns.length,
        total_obras: totalObras,
        updated_at: new Date().toISOString()
      }
    };
  }
  return null; // fallback: usar assets estáticos
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const secret = env.AUTH_SECRET;
    const method = request.method;

    // --- Public routes ---

    // GET /api/sessao
    if (path === '/api/sessao' && method === 'GET') {
      const usuario = await validarSessao(request.headers.get('Cookie'), secret);
      return json({ autenticado: !!usuario, usuario }, usuario ? 200 : 401, { 'Cache-Control': 'private, no-store' });
    }

    // POST /api/login
    if (path === '/api/login' && method === 'POST') {
      try {
        const body = await request.json();
        const u = String(body.usuario || '').trim();
        const p = String(body.senha || '');
        if (!env.DASH_USER || !env.DASH_PASS || !secret) {
          return json({ ok: false, erro: 'Secrets não configurados' }, 500, { 'Cache-Control': 'no-store' });
        }
        if (u === env.DASH_USER && p === env.DASH_PASS) {
          const payload = { u, exp: Date.now() + 12 * 60 * 60 * 1000 };
          const payloadB64 = base64UrlEncode(JSON.stringify(payload));
          const sig = await hmacHex(secret, payloadB64);
          const cookie = AUTH_COOKIE + '=' + payloadB64 + '.' + sig + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + (12 * 60 * 60);
          return json({ ok: true }, 200, { 'Set-Cookie': cookie, 'Cache-Control': 'no-store' });
        }
        return json({ ok: false, erro: 'Credenciais inválidas' }, 401, { 'Cache-Control': 'no-store' });
      } catch (e) {
        return json({ ok: false, erro: 'Requisição inválida: ' + (e.message || 'parse error') }, 400, { 'Cache-Control': 'no-store' });
      }
    }

    // POST /api/logout
    if (path === '/api/logout' && method === 'POST') {
      const cookie = AUTH_COOKIE + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
      return json({ ok: true }, 200, { 'Set-Cookie': cookie, 'Cache-Control': 'no-store' });
    }

    // GET /api/municipios → dados ativos (do D1 ou assets fallback)
    if (path === '/api/municipios' && method === 'GET') {
      try {
        const dados = await loadDadosAtivos(env);
        if (dados) {
          return json(dados, 200, {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
            'CDN-Cache-Control': 'public, max-age=300'
          });
        }
        // Fallback: assets estáticos
        const resp = await env.ASSETS.fetch(request);
        if (resp.status === 404) return json({ ok: false, erro: 'Dados não encontrados' }, 404);
        const h = new Headers(resp.headers);
        h.set('Cache-Control', 'public, max-age=300');
        return new Response(resp.body, { status: 200, headers: h });
      } catch (e) {
        console.error('loadDadosAtivos error:', e);
        const resp = await env.ASSETS.fetch(request);
        return new Response(resp.body, { status: resp.status, headers: resp.headers });
      }
    }

    // GET /api/municipios/[ibge] → município específico
    const mIbgeMatch = path.match(/^\/api\/municipios\/(\d+)$/);
    if (mIbgeMatch && method === 'GET') {
      const ibge = mIbgeMatch[1];
      try {
        const dados = await loadDadosAtivos(env);
        if (dados) {
          const m = dados.municipios.find(m => String(m.ibge) === ibge);
          if (m) return json({ ok: true, municipio: m }, 200, { 'Cache-Control': 'public, max-age=300' });
          return json({ ok: false, erro: 'Município não encontrado' }, 404, { 'Cache-Control': 'public, max-age=300' });
        }
        return json({ ok: false, erro: 'Dados não carregados' }, 500);
      } catch (e) {
        return json({ ok: false, erro: e.message }, 500);
      }
    }

    // GET /api/kpis → dashboard KPIs
    if (path === '/api/kpis' && method === 'GET') {
      try {
        const dados = await loadDadosAtivos(env);
        if (!dados) return json({ ok: false, erro: 'Dados não carregados' }, 500);
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
        }, 200, { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' });
      } catch (e) {
        return json({ ok: false, erro: e.message }, 500);
      }
    }

    // --- Protected routes ---

    // POST /api/municipios (auth) → salva nova versão no D1
    if (path === '/api/municipios' && method === 'POST') {
      const usuario = await validarSessao(request.headers.get('Cookie'), secret);
      if (!usuario) return json({ ok: false, erro: 'Não autorizado' }, 401, { 'Cache-Control': 'no-store' });
      try {
        const dados = await request.json();
        validarJSON(dados);
        const payloadBase64 = base64UrlEncode(JSON.stringify(dados));
        const result = await d1Query(env,
          'INSERT INTO dados_municipios (conteudo_base64, total_municipios, total_obras, actor, created_at) VALUES (?, ?, ?, ?, ?)',
          [payloadBase64, dados.municipios.length, dados.metadata?.total_obras || 0, usuario, new Date().toISOString()]
        );

        // Webhook CI
        const deployUrl = env.DEPLOY_WEBHOOK_URL;
        let deployOk = false;
        if (deployUrl) {
          try {
            const deployResp = await fetch(deployUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                json_base64: payloadBase64,
                arquivo: 'src/data/dados_municipios.json',
                message: `Update via admin panel (${new Date().toISOString()})`,
                actor: usuario
              })
            });
            deployOk = deployResp.ok;
          } catch { deployOk = false; }
        }

        return json({
          ok: true,
          message: '✅ Salvo no D1',
          saved_to_db: result && result.results !== undefined,
          total_municipios: dados.municipios.length,
          deploy_ci: deployOk
        }, 201, { 'Cache-Control': 'no-store' });
      } catch (err) {
        return json({ ok: false, erro: err.message }, 400);
      }
    }

    // GET /api/versoes (público) → status do dashboard
            if (path === '/api/versoes' && method === 'GET') {
              try {
                const result = await d1Query(env,
                  'SELECT COUNT(*) as total_municipios, MAX(updated_at) as ultima_atualizacao FROM municipios'
                );
                return json({ ok: true, versions: result.results || [] }, 200, { 'Cache-Control': 'public, max-age=300' });
              } catch (e) {
                return json({ ok: false, erro: e.message }, 500);
              }
            }

        // PUT /api/municipios/:ibge (auth) → atualiza município na tabela municipios
                const putMatch = path.match(/^\/api\/municipios\/(\d+)$/);
                if (putMatch && method === 'PUT') {
                  const usuario = await validarSessao(request.headers.get('Cookie'), secret);
                  if (!usuario) return json({ ok: false, erro: 'Não autorizado' }, 401, { 'Cache-Control': 'no-store' });
                  try {
                    const ibge = putMatch[1];
                    const body = await request.json();
                    // Campos permitidos para atualização
                    const allowedFields = [
                      'grupo', 'cor', 'prioritario', 'prefeito', 'alinhamento',
                      'total_obras', 'obras_em_andamento', 'obras_entregues',
                      'equipamento_solicitado', 'equipamento_categoria', 'partido',
                      'investimento_planner', 'total_liderancas', 'mesorregiao', 'eixos'
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
                      return json({ ok: false, erro: 'Nenhum campo para atualizar' }, 400);
                    }
                    const now = new Date().toISOString();
                    params.push(now);
                    params.push(ibge);
                    const sql = `UPDATE municipios SET ${updates.join(', ')}, updated_at = ? WHERE ibge = ?`;
                    const result = await d1Query(env, sql, params);
                    return json({ ok: true, message: 'Município atualizado no D1', updated: result.success }, 200, { 'Cache-Control': 'no-store' });
                  } catch (err) {
                    return json({ ok: false, erro: err.message }, 400);
                  }
                }

                // DELETE /api/municipios/:ibge (público) → excluir do D1
                const delMatch = path.match(/^\/api\/municipios\/(\d+)$/);
                if (delMatch && method === 'DELETE') {
                  try {
                    const ibge = delMatch[1];
                    const result = await d1Query(env,
                      'DELETE FROM municipios WHERE ibge = ?',
                      [ibge]
                    );
                    return json({ ok: true, message: 'Município excluído', deleted: result.success }, 200, { 'Cache-Control': 'no-store' });
                  } catch (e) {
                    return json({ ok: false, erro: e.message }, 500);
                  }
                }

                // GET /api/versoes (auth) → histórico D1
        if (path === '/api/versoes' && method === 'GET') {
          const usuario = await validarSessao(request.headers.get('Cookie'), secret);
          if (!usuario) return json({ ok: false, erro: 'Não autorizado' }, 401, { 'Cache-Control': 'private, no-store' });
          const result = await d1Query(env,
            'SELECT id, total_municipios, total_obras, actor, created_at FROM dados_municipios ORDER BY created_at DESC LIMIT 20'
          );
          return json({ ok: true, versions: result.results || [] }, 200, { 'Cache-Control': 'private, no-store' });
        }

    // --- Protected assets ---
    const protegida = ROTAS_PROTEGIDAS.some(r => path === r || path.startsWith(r));
    if (protegida) {
      const usuario = await validarSessao(request.headers.get('Cookie'), secret);
      if (!usuario) return json({ ok: false, erro: 'Não autorizado' }, 401, { 'Cache-Control': 'private, no-store' });
      const resp = await env.ASSETS.fetch(request);
      if (resp.status === 404) return json({ ok: false, erro: 'Recurso não encontrado' }, 404);
      const h = new Headers(resp.headers);
      h.set('Cache-Control', 'private, max-age=0, must-revalidate');
      for (const [k, v] of Object.entries(securityHeaders())) h.set(k, v);
      return new Response(resp.body, { status: resp.status, headers: h });
    }

    // --- Static assets SPA fallback ---
    const resp = await env.ASSETS.fetch(request);
    if (resp.status === 404) {
      if (!path.includes('.') || path === '/login') {
        return await env.ASSETS.fetch(new Request(new URL('/', request.url)));
      }
    }
    const h = new Headers(resp.headers);
    for (const [k, v] of Object.entries(securityHeaders())) h.set(k, v);
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
  }
};
