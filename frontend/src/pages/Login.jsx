import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('/api/auth/login', { email, senha });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            if (user && user.nome) {
                localStorage.setItem('userName', user.nome);
            }

            if (user && user.mustChangePassword) {
                navigate('/change-password');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Erro ao fazer login');
        }
    };

    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark min-h-screen antialiased text-slate-800 dark:text-slate-100">
            <div className="flex w-full md:w-1/2 lg:w-[45%] xl:w-[40%] flex-col justify-center bg-white dark:bg-slate-900 shadow-xl z-10 p-8 sm:p-12 lg:p-16 h-full overflow-y-auto">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-20 w-auto mb-4 relative flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-primary mb-2">
                            <span className="material-symbols-outlined text-4xl">account_balance</span>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-1">Prefeitura de São Luís</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">SEPLAN - Secretaria Municipal de Planejamento</p>
                </div>
                <div className="w-full max-w-sm mx-auto flex flex-col">
                    <div className="mb-6 text-center">
                        <h2 className="text-4xl font-bold text-primary dark:text-white tracking-tight mb-2">Sys RH SEPLAN</h2>
                        <p className="text-slate-500 dark:text-slate-400">Entre com suas credenciais para acessar o sistema.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                                Email
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    className="peer form-input w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 pl-4 pr-11 focus:border-primary focus:ring-primary focus:ring-1 transition-all"
                                    id="email"
                                    placeholder="Digite seu email"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoFocus
                                />
                                <span className="absolute right-3 text-slate-400 peer-focus:text-primary transition-colors">
                                    <span className="material-symbols-outlined">mail</span>
                                </span>
                            </div>
                        </div>
                        <div className="group">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                                    Senha
                                </label>
                            </div>
                            <div className="relative flex items-center">
                                <input
                                    className="peer form-input w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 pl-4 pr-11 focus:border-primary focus:ring-primary focus:ring-1 transition-all"
                                    id="password"
                                    placeholder="Digite sua senha"
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                />
                                <button
                                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[22px]">
                                        {showPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                            <div className="flex justify-end mt-2">
                                <a className="text-sm font-semibold text-primary hover:text-blue-700 dark:hover:text-blue-400 transition-colors" href="#">
                                    Esqueceu a senha?
                                </a>
                            </div>
                        </div>
                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                        <button
                            className="mt-2 w-full h-12 bg-primary hover:bg-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            type="submit">
                            <span>Entrar</span>
                            <span className="material-symbols-outlined text-[20px]">login</span>
                        </button>
                    </form>
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            © 2026 Prefeitura de São Luís - MA<br />
                            SEPLAN - Secretaria Municipal de Planejamento
                        </p>
                    </div>
                </div>
            </div>
            <div className="hidden md:flex md:w-1/2 lg:w-[55%] xl:w-[60%] relative bg-slate-900">
                <div className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDNMtCwvHMEuYNfnamNf85-jEKSKR2V6p4sE-BMRUfgxQOVLLkGrq2ZTM7Nzdk6eooSYs5ZFkExqzsGTa_FXoMJcvcAXc255EX2v_Y80WLjT3f7s7_Mz7Z3llMROS68L_f826PxggyomMyYNuQZvhk_5gy3rDGJEEWFQMaYLBNUquIr5GQAYqSBnMr87-2QLR2E8tgeuBCdVglR0BKPW304fjh8RcmuJVI_v2Zr5nv54yWXawkBMto3P510IokeAaHSZbtQVs35xQ8t')" }}>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-blue-900/40 mix-blend-multiply"></div>
                <div className="relative z-10 flex flex-col justify-end h-full w-full p-12 lg:p-20 text-white">
                    <div className="mb-8">
                        <div className="h-1 w-20 bg-secondary mb-6"></div>
                        <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-4 drop-shadow-md">
                            Gestão Eficiente para<br />o Servidor Público
                        </h2>
                        <p className="text-lg text-blue-100 max-w-lg drop-shadow-sm">
                            Sistema integrado de recursos humanos da Secretaria Municipal de Planejamento.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-w-lg">
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                            <span className="material-symbols-outlined mb-2 text-secondary">description</span>
                            <p className="text-xs text-blue-100/80">Acesso rápido e seguro</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                            <span className="material-symbols-outlined mb-2 text-secondary">folder_shared</span>
                            <p className="text-xs text-blue-100/80">Mantenha atualizado</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
