import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useAbsences = (initialFilters = {}) => {
    const [afastamentos, setAfastamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [searchFilters, setSearchFilters] = useState({
        search: '',
        setor: '',
        cargo: '',
        vinculo: '',
        status_servidor: '',
        birthMonth: '',
        ...initialFilters
    });

    const [tiposAfastamento, setTiposAfastamento] = useState([]);
    const [setoresOpt, setSetoresOpt] = useState([]);
    const [cargosOpt, setCargosOpt] = useState([]);

    const limit = 10;

    const fetchMetadata = useCallback(async () => {
        try {
            const [setoresRes, cargosRes, tiposRes] = await Promise.all([
                axios.get('/api/servidores/setores'),
                axios.get('/api/servidores/cargos'),
                axios.get('/api/tipos-afastamento')
            ]);
            setSetoresOpt(setoresRes.data);
            setCargosOpt(cargosRes.data);
            setTiposAfastamento(tiposRes.data);
        } catch (error) {
            console.error('Error loading metadata:', error);
        }
    }, []);

    const fetchAfastamentos = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: searchFilters.search,
                setor: searchFilters.setor,
                cargo: searchFilters.cargo,
                vinculo: searchFilters.vinculo,
                status_servidor: searchFilters.status_servidor,
                birthMonth: searchFilters.birthMonth
            };

            Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

            const response = await axios.get('/api/afastamentos', { params });
            setAfastamentos(response.data.afastamentos || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalItems(response.data.totalAfastamentos || 0);
        } catch (error) {
            console.error('Error fetching afastamentos:', error);
        } finally {
            setLoading(false);
        }
    }, [page, searchFilters]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    useEffect(() => {
        const timer = setTimeout(fetchAfastamentos, 500);
        return () => clearTimeout(timer);
    }, [fetchAfastamentos]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setSearchFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
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
        setPage(1);
    };

    const deleteAbsence = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este registro?')) return false;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/afastamentos/${id}`, { headers: { 'x-auth-token': token } });
            setAfastamentos(prev => prev.filter(a => (a._id || a.IDPK_SIT) !== id));
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const addAbsenceType = async (nome) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/tipos-afastamento', { nome }, { headers: { 'x-auth-token': token } });
            setTiposAfastamento(prev => [...prev, res.data]);
            return res.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    return {
        afastamentos,
        loading,
        page,
        setPage,
        totalPages,
        totalItems,
        searchFilters,
        setSearchFilters,
        tiposAfastamento,
        setoresOpt,
        cargosOpt,
        handleFilterChange,
        clearFilters,
        deleteAbsence,
        addAbsenceType,
        refresh: fetchAfastamentos
    };
};
