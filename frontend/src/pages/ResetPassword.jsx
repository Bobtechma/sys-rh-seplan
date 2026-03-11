import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (senha !== confirmarSenha) {
            setError('As senhas não coincidem.');
            return;
        }

        if (senha.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`/api/auth/reset-password/${token}`, { senha });
            setSuccess(response.data.msg || 'Senha atualizada com sucesso!');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Erro ao redefinir a senha. O link pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center p-4 bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center opacity-40"
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDNMtCwvHMEuYNfnamNf85-jEKSKR2V6p4sE-BMRUfgxQOVLLkGrq2ZTM7Nzdk6eooSYs5ZFkExqzsGTa_FXoMJcvcAXc255EX2v_Y80WLjT3f7s7_Mz7Z3llMROS68L_f826PxggyomMyYNuQZvhk_5gy3rDGJEEWFQMaYLBNUquIr5GQAYqSBnMr87-2QLR2E8tgeuBCdVglR0BKPW304fjh8RcmuJVI_v2Zr5nv54yWXawkBMto3P510IokeAaHSZbtQVs35xQ8t')" }}>
            </div>

            <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8 border border-white/20">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-primary mb-4">
                        <span className="material-symbols-outlined text-4xl">lock_reset</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Redefinir Senha</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                        Crie uma nova senha para acessar o sistema Sys RH SEPLAN.
                    </p>
                </div>

                {success ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                        </div>
                        <p className="text-green-600 dark:text-green-400 font-medium mb-6">{success}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Você será redirecionado para a tela de login em instantes.
                        </p>
                        <Link to="/login" className="inline-block w-full text-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium py-3 rounded-lg transition-colors">
                            Voltar para o Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">
                                Nova Senha
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    className="peer form-input w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 pl-4 pr-11 focus:border-primary focus:ring-primary focus:ring-1 transition-all"
                                    id="password"
                                    placeholder="Digite a nova senha"
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
                        </div>

                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="confirm-password">
                                Confirmar Nova Senha
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    className="peer form-input w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-12 pl-4 pr-11 focus:border-primary focus:ring-primary focus:ring-1 transition-all"
                                    id="confirm-password"
                                    placeholder="Repita a nova senha"
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</div>}

                        <button
                            className="mt-4 w-full h-12 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <span>Processando...</span>
                            ) : (
                                <>
                                    <span>Salvar Nova Senha</span>
                                    <span className="material-symbols-outlined text-[20px]">save</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
