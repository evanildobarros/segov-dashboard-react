import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useStore';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const { login, checkAuth } = useAuth();
  const [usuario, setUsuario] = useState('evanildobarros');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (checkAuth()) {
      // Redirecionamento será feito pelo App
    }
  }, [checkAuth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Chama a função login do useStore que já possui o fallback local
      const res = await login(usuario, senha);

      if (res && res.success) {
        return;
      }

      setErro(res?.error || 'Credenciais inválidas.');
    } catch (err) {
      setErro('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #072a42 0%, #0b3c5d 55%, #1b9e5a 130%)'
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '50px 45px 40px',
        width: '380px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden',
        maxWidth: '90vw'
      }}>
        {/* Barra superior colorida */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #2980b9, #3498db, #2ecc71)'
        }}></div>

        {/* Logo */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.1)', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.15)'
        }}>
          <Lock size={36} color='#fff' />
        </div>

        <h1 style={{
          fontSize: '22px', textAlign: 'center', color: '#0b3c5d',
          marginBottom: '8px', fontWeight: 700
        }}>
          SEGOV-MA
        </h1>
        <p style={{
          textAlign: 'center', fontSize: '13px', color: '#7a8a99',
          marginBottom: '32px', letterSpacing: '1px'
        }}>
          Painel de Monitoramento Político<br />
          Governo do Estado do Maranhão
        </p>

        {erro && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#c0392b',
            padding: '10px 14px', borderRadius: '10px', fontSize: '13px',
            textAlign: 'center', marginBottom: '20px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            border: '1px solid rgba(231,76,60,0.2)'
          }}>
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '12px', fontWeight: 600, color: '#4a5b6b',
              display: 'block', marginBottom: '4px'
            }}>
              Usuário
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', border: '1px solid #dde3ea',
                borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box'
              }}
              autoComplete="off"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              fontSize: '12px', fontWeight: 600, color: '#4a5b6b',
              display: 'block', marginBottom: '4px'
            }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '14px 12px', border: '1px solid #dde3ea',
                  borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box',
                  paddingRight: '44px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#7a8a99',
                  padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', marginTop: '8px', padding: '14px',
              background: loading ? '#7a8a99' : 'linear-gradient(135deg, #2980b9, #3498db)',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar no sistema'}
          </button>
        </form>

        <div style={{
          marginTop: '20px', fontSize: '11px', color: '#8b98a5',
          textAlign: 'center', background: '#f0f4f7', padding: '8px', borderRadius: '6px'
        }}>
          Acesso restrito SEGOV-MA
        </div>
      </div>
    </div>
  );
}