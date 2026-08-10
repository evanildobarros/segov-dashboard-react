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
        background: '#fff', borderRadius: '14px', padding: '40px 36px',
        width: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#0b3c5d', margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '26px', fontWeight: 700
        }}>
          <Lock size={32} />
        </div>
        <h1 style={{ fontSize: '19px', textAlign: 'center', color: '#0b3c5d', marginBottom: '6px' }}>
          SEGOV-MA
        </h1>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#7a8a99', marginBottom: '22px' }}>
          Painel de Monitoramento Político<br />Governo do Estado do Maranhão
        </p>
        
        {erro && (
          <div style={{ 
            background: '#fef2f2', border: '1px solid #fecaca', color: '#c0392b',
            padding: '10px 14px', borderRadius: '8px', fontSize: '12px',
            textAlign: 'center', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            <AlertCircle size={14} /> {erro}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#4a5b6b', display: 'block', marginBottom: '4px' }}>
              Usuário
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              style={{ width: '100%', padding: '11px 12px', border: '1px solid #dde3ea', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              autoComplete="off"
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#4a5b6b', display: 'block', marginBottom: '4px' }}>
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
                  width: '100%', padding: '11px 12px', border: '1px solid #dde3ea', 
                  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
                  paddingRight: '44px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#7a8a99',
                  padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', marginTop: '8px', padding: '12px',
              background: loading ? '#7a8a99' : '#0b3c5d', color: '#fff', border: 'none',
              borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar no sistema'}
          </button>
        </form>
        
        <div style={{ 
          marginTop: '14px', fontSize: '11px', color: '#8b98a5', 
          textAlign: 'center', background: '#f0f4f7', padding: '8px', borderRadius: '6px'
        }}>
          Acesso restrito SEGOV
        </div>
      </div>
    </div>
  );
}
