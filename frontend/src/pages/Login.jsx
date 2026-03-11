import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // Forgot Password State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');
    const [forgotError, setForgotError] = useState('');
    const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

    // 2FA State
    const [needs2FA, setNeeds2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [isSubmitting2FA, setIsSubmitting2FA] = useState(false);
    const [tempEmail, setTempEmail] = useState(''); // Store email between steps

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('/api/auth/login', { email, senha });

            if (response.data.requires2FA) {
                // Backend signaled we need to verify 2FA
                setNeeds2FA(true);
                setTempEmail(response.data.email);
                return; // Stop flow and show 2FA form
            }

            // Normal login success
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

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting2FA(true);
        try {
            const response = await axios.post('/api/auth/verify-2fa', { email: tempEmail, code: twoFactorCode });
            // Success
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
            setError(err.response?.data?.msg || 'Código de verificação inválido.');
        } finally {
            setIsSubmitting2FA(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotMessage('');
        setIsSubmittingForgot(true);

        try {
            const response = await axios.post('/api/auth/forgot-password', { email: forgotEmail });
            setForgotMessage(response.data.msg || 'E-mail enviado com sucesso. Verifique sua caixa de entrada.');
            setTimeout(() => {
                setShowForgotModal(false);
                setForgotMessage('');
                setForgotEmail('');
            }, 5000);
        } catch (err) {
            setForgotError(err.response?.data?.msg || 'Erro ao enviar e-mail de recuperação.');
        } finally {
            setIsSubmittingForgot(false);
        }
    };

    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark min-h-screen antialiased text-slate-800 dark:text-slate-100">
            <div className="flex w-full md:w-1/2 lg:w-[45%] xl:w-[40%] flex-col justify-center bg-white dark:bg-slate-900 shadow-xl z-10 p-6 sm:p-12 lg:p-16 h-full overflow-y-auto">
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="h-16 sm:h-20 w-auto mb-3 sm:mb-4 relative flex items-center justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center text-primary mb-2">
                            <span className="material-symbols-outlined text-3xl sm:text-4xl">account_balance</span>
                        </div>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-center text-slate-900 dark:text-white mb-1">Prefeitura de São Luís</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">SEPLAN - Secretaria Municipal de Planejamento</p>
                </div>
                <div className="w-full max-w-sm mx-auto flex flex-col">
                    <div className="mb-6 text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-primary dark:text-white tracking-tight mb-2">Sys RH SEPLAN</h2>
                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                            {needs2FA ? 'Verificação de Segurança.' : 'Entre com suas credenciais para acessar o sistema.'}
                        </p>
                    </div>

                    {!needs2FA ? (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
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
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowForgotModal(true);
                                        }}
                                        className="text-xs sm:text-sm font-semibold text-primary hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                    >
                                        Esqueceu a senha?
                                    </button>
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
                    ) : (
                        <form onSubmit={handleVerify2FA} className="flex flex-col gap-4 sm:gap-5 animate-fade-in">
                            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 p-4 rounded-lg text-sm text-center border border-blue-200 dark:border-blue-800 mb-2">
                                Um código de 6 dígitos foi enviado para <br /><strong>{tempEmail}</strong>
                            </div>
                            <div className="group">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 text-center" htmlFor="twoFactorCode">
                                    Digite o código de verificação
                                </label>
                                <div className="relative flex justify-center mt-2 mb-2">
                                    <input
                                        className="peer form-input w-full max-w-[200px] text-center text-2xl tracking-[0.2em] rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-300 h-14 focus:border-primary focus:ring-primary focus:ring-1 transition-all uppercase"
                                        id="twoFactorCode"
                                        placeholder="------"
                                        required
                                        type="text"
                                        maxLength="6"
                                        autoComplete="off"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNeeds2FA(false);
                                        setTwoFactorCode('');
                                        setError('');
                                    }}
                                    className="w-full sm:w-1/3 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors flex items-center justify-center"
                                >
                                    Voltar
                                </button>
                                <button
                                    className="w-full sm:w-2/3 h-12 bg-primary hover:bg-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    type="submit"
                                    disabled={isSubmitting2FA || twoFactorCode.length < 6}
                                >
                                    {isSubmitting2FA ? 'Verificando...' : 'Verificar'}
                                </button>
                            </div>
                        </form>
                    )}
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
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

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Recuperar Senha</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Digite seu e-mail cadastrado e enviaremos um link para você redefinir sua senha.
                            </p>

                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="forgot-email">
                                        E-mail
                                    </label>
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        required
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="form-input w-full rounded-lg border-slate-300 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary focus:ring-1"
                                        placeholder="seu.email@exemplo.com"
                                    />
                                </div>

                                {forgotError && <div className="text-red-500 text-sm">{forgotError}</div>}
                                {forgotMessage && <div className="text-green-600 dark:text-green-400 text-sm font-medium">{forgotMessage}</div>}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingForgot}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSubmittingForgot ? 'Enviando...' : 'Enviar Link'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
