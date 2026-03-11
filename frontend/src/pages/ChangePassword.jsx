import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChangePassword = () => {
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const verifyUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/auth/user', {
                    headers: { 'x-auth-token': token }
                });

                // If user's token is old but backend says they don't need to change password
                if (response.data && response.data.mustChangePassword === false) {
                    try {
                        // Request a fresh token from backend to override the stale one
                        const refreshResponse = await axios.get('/api/auth/refresh-token', {
                            headers: { 'x-auth-token': token }
                        });
                        if (refreshResponse.data && refreshResponse.data.token) {
                            localStorage.setItem('token', refreshResponse.data.token);
                        }
                    } catch (e) {
                        console.error('Could not refresh token automatically', e);
                    }
                    navigate('/dashboard');
                }
            } catch (err) {
                console.error('Falha ao verificar status do usuário', err);
            }
        };
        verifyUser();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (novaSenha.length < 6) {
            setError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setError('As senhas não coincidem. Tente novamente.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/auth/change-password',
                { newPassword: novaSenha },
                { headers: { 'x-auth-token': token } }
            );

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Erro ao alterar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark min-h-screen antialiased text-slate-800 dark:text-slate-100 items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-xl rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-primary mb-4">
                        <span className="material-symbols-outlined text-4xl">lock_reset</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">Trocar Senha</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
                        Por motivos de segurança, é necessário redefinir sua senha padrão antes de continuar acessando o sistema.
                    </p>
                </div>

                {success ? (
                    <div className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-lg flex items-center gap-3">
                        <span className="material-symbols-outlined text-green-600">check_circle</span>
                        <div>
                            <p className="font-bold">Senha alterada com sucesso!</p>
                            <p className="text-sm">Redirecionando para o painel...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nova Senha
                            </label>
                            <input
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-11 pl-4 focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-all"
                                type="password"
                                placeholder="Digite a nova senha"
                                required
                                value={novaSenha}
                                onChange={(e) => setNovaSenha(e.target.value)}
                                minLength="6"
                            />
                        </div>
                        <div className="group">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Confirmar Nova Senha
                            </label>
                            <input
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 h-11 pl-4 focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-all"
                                type="password"
                                placeholder="Repita a nova senha"
                                required
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                minLength="6"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full h-11 bg-primary hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
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

export default ChangePassword;
