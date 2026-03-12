import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useVacations = (initialFilters = {}) => {
    const [ferias, setFerias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ active: 0, pending: 0, total: 0 });
    const [completionStats, setCompletionStats] = useState({
        activeServers: 0,
        with2024: 0,
        with2025: 0,
        percent2024: 0,
        percent2025: 0
    });

    const [concessivoList, setConcessivoList] = useState([]);
    const [vencidasList, setVencidasList] = useState([]);
    const [atrasadasList, setAtrasadasList] = useState([]);

    const [searchFilters, setSearchFilters] = useState({
        search: '',
        setor: '',
        cargo: '',
        vinculo: '',
        status_servidor: '',
        birthMonth: '',
        ...initialFilters
    });

    const [setoresOpt, setSetoresOpt] = useState([]);
    const [cargosOpt, setCargosOpt] = useState([]);

    const fetchMetadata = useCallback(async () => {
        try {
            const [setoresRes, cargosRes] = await Promise.all([
                axios.get('/api/servidores/setores'),
                axios.get('/api/servidores/cargos')
            ]);
            setSetoresOpt(setoresRes.data);
            setCargosOpt(cargosRes.data);
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    }, []);

    const fetchAllLists = useCallback(async () => {
        try {
            const [conRes, venRes, atrRes, statRes] = await Promise.all([
                axios.get('/api/servidores/concessivo'),
                axios.get('/api/servidores/ferias-vencidas'),
                axios.get('/api/servidores/ferias-atrasadas'),
                axios.get('/api/ferias/stats')
            ]);
            setConcessivoList(conRes.data || []);
            setVencidasList(venRes.data || []);
            setAtrasadasList(atrRes.data || []);
            setCompletionStats(statRes.data);
        } catch (error) {
            console.error('Error fetching vacation sub-lists:', error);
        }
    }, []);

    const fetchFerias = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ...searchFilters, limit: 5000 };
            Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

            const response = await axios.get('/api/ferias', { params });
            const data = response.data.ferias || [];
            setFerias(data);

            const now = new Date();
            setStats({
                active: data.filter(f => {
                    const s = (f.STATUS_SIT || f.status || '').toUpperCase();
                    const isApproved = s === 'APROVADO' || s === 'DEFERIDO' || s === 'EM FÉRIAS' || s === 'EM_FERIAS' || s === 'FÉRIAS';
                    if (!isApproved) return false;
                    const inicio = new Date(f.INICIO_FERIAS_SIT || f.inicio);
                    const fim = new Date(f.FIM_FERIAS_SIT || f.fim);
                    return inicio <= now && fim >= now;
                }).length,
                pending: data.filter(f => {
                    const s = (f.STATUS_SIT || f.status || '').toUpperCase();
                    return s === 'PENDENTE' || s === 'AGUARDANDO APROVAÇÃO' || s === 'AGUARDANDO' || s === 'EM ANÁLISE' || s === 'EMTRAMITAÇÃO';
                }).length,
                total: data.length
            });
        } catch (error) {
            console.error('Error fetching ferias:', error);
        } finally {
            setLoading(false);
        }
    }, [searchFilters]);

    useEffect(() => {
        fetchMetadata();
        fetchAllLists();
    }, [fetchMetadata, fetchAllLists]);

    useEffect(() => {
        const timer = setTimeout(fetchFerias, 500);
        return () => clearTimeout(timer);
    }, [fetchFerias]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setSearchFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setSearchFilters({
            search: '',
            setor: '',
            cargo: '',
            vinculo: '',
            status_servidor: '',
            birthMonth: ''
        });
    };

    const deleteVacation = async (id) => {
        if (!window.confirm('Excluir este registro?')) return false;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/afastamentos/${id}`, { headers: { 'x-auth-token': token } });
            setFerias(prev => prev.filter(f => (f._id || f.IDPK_SIT) !== id));
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/afastamentos/${id}`, { status: newStatus }, { headers: { 'x-auth-token': token } });
            await fetchFerias();
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    return {
        ferias,
        stats,
        completionStats,
        concessivoList,
        vencidasList,
        atrasadasList,
        loading,
        searchFilters,
        setoresOpt,
        cargosOpt,
        handleFilterChange,
        clearFilters,
        deleteVacation,
        updateStatus,
        limit: 10,
        refresh: fetchFerias,
        refreshAll: () => { fetchFerias(); fetchAllLists(); }
    };
};
