import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeServidores: 0,
        aniversariantesCount: 0,
        pendencias: 0,
        ferias: 0,
        vinculos: { efetivos: 0, comissionados: 0, contratados: 0, servicosPrestados: 0, outros: 0 },
        recentActivity: []
    });

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/dashboard?_t=${Date.now()}`, {
                headers: { 'x-auth-token': token }
            });

            // Explicitly map flat backend response to expected nested structure
            const d = response.data || {};
            setStats({
                activeServidores: d.activeCountReal || d.activeServidores || 0,
                aniversariantesCount: d.aniversariantesCount || 0,
                pendencias: d.pendencias || 0,
                ferias: d.ferias || 0,
                vinculos: {
                    efetivos: d.efetivosCount || 0,
                    comissionados: d.comissionadosCount || 0,
                    contratados: d.contratadosCount || 0,
                    servicosPrestados: d.servicosPrestados || 0,
                    outros: d.outros || 0
                },
                recentActivity: (d.recentActivity || []).map(act => ({
                    ...act,
                    lastUpdate: act.lastUpdate || act.createdAt || new Date().toISOString()
                }))
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async (page = 1) => {
        setHistoryLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/dashboard/history?page=${page}&limit=10&_t=${Date.now()}`, {
                headers: { 'x-auth-token': token }
            });
            setHistoryData(res.data.history);
            setHistoryTotalPages(res.data.totalPages);
            setHistoryPage(res.data.currentPage);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    useEffect(() => {
        if (isHistoryModalOpen) {
            fetchHistory(1);
        }
    }, [isHistoryModalOpen, fetchHistory]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= historyTotalPages) {
            fetchHistory(newPage);
        }
    };

    const v = stats?.vinculos || { efetivos: 0, comissionados: 0, contratados: 0, servicosPrestados: 0, outros: 0 };
    const totalVinculos = (v?.efetivos || 0) + (v?.comissionados || 0) + (v?.contratados || 0) + (v?.servicosPrestados || 0) + (v?.outros || 0);

    return {
        stats,
        loading,
        totalVinculos,
        isHistoryModalOpen,
        setIsHistoryModalOpen,
        historyData,
        historyPage,
        historyTotalPages,
        historyLoading,
        handlePageChange,
        refresh: fetchDashboardStats
    };
};
