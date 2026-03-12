import { useState, useEffect } from 'react';
import axios from 'axios';

export const useServidores = (initialPage = 1, initialFilters = {}) => {
    const [servidores, setServidores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({
        search: '',
        setor: '',
        cargo: '',
        vinculo: '',
        status: '',
        birthMonth: '',
        ...initialFilters
    });

    const [setoresOpt, setSetoresOpt] = useState([]);
    const [cargosOpt, setCargosOpt] = useState([]);

    const limit = 10;

    useEffect(() => {
        const fetchMetadata = async () => {
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
        };
        fetchMetadata();
    }, []);

    const fetchServidores = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: filters.search,
                setor: filters.setor,
                cargo: filters.cargo,
                vinculo: filters.vinculo,
                status: filters.status,
                birthMonth: filters.birthMonth,
                _t: Date.now()
            };

            Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

            const response = await axios.get('/api/servidores', { params });
            setServidores(response.data.servidores);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.totalServidores);
        } catch (error) {
            console.error('Error fetching servidores:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServidores();
    }, [page, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            setor: '',
            cargo: '',
            status: '',
            birthMonth: '',
            vinculo: ''
        });
        setPage(1);
    };

    const deleteServidor = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este servidor? Esta ação não pode ser desfeita.')) {
            return false;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/servidores/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setServidores(prev => prev.filter(s => s._id !== id));
            return true;
        } catch (error) {
            console.error('Error deleting servidor:', error);
            throw error;
        }
    };

    return {
        servidores,
        loading,
        page,
        setPage,
        totalPages,
        totalItems,
        filters,
        setFilters,
        setoresOpt,
        cargosOpt,
        handleFilterChange,
        clearFilters,
        deleteServidor,
        limit: 10,
        refresh: fetchServidores
    };
};
