"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, User } from 'lucide-react';
import { loginAction } from '../actions/login';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Erro ao efetuar login.');
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-[100dvh] bg-[#f2f2ed] text-[#20221f] lg:grid-cols-[minmax(320px,0.9fr)_minmax(480px,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-[#1e2420] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-white/20 bg-white/5 text-sm font-bold">V</div>
          <div>
            <p className="text-base font-semibold">VortexAI</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#96a098]">Operações</p>
          </div>
        </div>
        <div className="max-w-md pb-10">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#7fc3aa]">Central de operação</p>
          <h1 className="text-[2.75rem] font-semibold leading-[1.05]">Vendas, pedidos e estoque no mesmo ritmo.</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-[#b8c0b9]">Acompanhe o desempenho da operação e mantenha o catálogo do Bling sob controle.</p>
        </div>
        <p className="text-xs text-[#7f8981]">Acesso administrativo</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-[#1e2420] text-sm font-bold text-white">V</div>
            <p className="mt-3 font-semibold">VortexAI</p>
          </div>
          <p className="page-kicker mb-3">Área administrativa</p>
          <h2 className="text-3xl font-semibold leading-tight text-[#20221f]">Entrar no painel</h2>
          <p className="mt-2 text-sm text-[#6f736d]">Use suas credenciais para continuar.</p>

        <form onSubmit={handleLogin} className="mt-9 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#41443f]">Usuário</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-[18px] w-[18px] text-[#8b8f88]" strokeWidth={1.8} />
              </div>
              <input
                type="text"
                name="username"
                required
                className="field w-full py-3 pl-11 pr-4 text-sm outline-none placeholder:text-[#a8aaa5]"
                placeholder="Seu usuário"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#41443f]">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-[18px] w-[18px] text-[#8b8f88]" strokeWidth={1.8} />
              </div>
              <input
                type="password"
                name="password"
                required
                className="field w-full py-3 pl-11 pr-4 text-sm outline-none placeholder:text-[#a8aaa5]"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-[5px] border border-[#d9aaa0] bg-[#f7e7e3] p-3">
              <p className="text-sm font-medium text-[#8a3326]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button-primary mt-4 w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            ) : (
              <><span>Entrar</span><ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>
      </div>
      </section>
    </main>
  );
}
