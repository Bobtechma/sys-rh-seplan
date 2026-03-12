const express = require('express');
const router = express.Router();
const Servidor = require('../models/Servidor');
const SituacaoServidor = require('../models/SituacaoServidor');
const auth = require('../middleware/auth');
const { calculateVacationStatus, applyServidorFilters, normalizeStr } = require('../utils/apiHelpers');

// @route   GET api/ferias/stats
router.get('/ferias/stats', async (req, res) => {
    try {
        const activeServers = await Servidor.find({ ATIVO_SERV: { $in: ['SIM', 'ATIVO', 'Sim', 'Ativo'] }, ADMISSAO_SERV: { $exists: true, $ne: null } }, { IDPK_SERV: 1 });
        const activeServersCount = activeServers.length;
        let s24 = 0, s25 = 0;
        if (activeServersCount > 0) {
            const serverIds = activeServers.map(s => s.IDPK_SERV);
            const allVacations = await SituacaoServidor.find({
                IDFK_SERV: { $in: serverIds }, ASSUNTO_SIT: { $regex: /f[eé]rias/i },
                $or: [{ INICIO_FERIAS_SIT: { $gte: new Date('2024-01-01'), $lte: new Date('2024-12-31') } }, { INICIO_FERIAS_SIT: { $gte: new Date('2025-01-01'), $lte: new Date('2025-12-31') } }]
            }).lean();
            const set24 = new Set(), set25 = new Set();
            for (const vac of allVacations) {
                const year = new Date(vac.INICIO_FERIAS_SIT).getFullYear();
                if (year === 2024) set24.add(String(vac.IDFK_SERV));
                else if (year === 2025) set25.add(String(vac.IDFK_SERV));
            }
            s24 = set24.size; s25 = set25.size;
        }
        res.json({ activeServers: activeServersCount, with2024: s24, with2025: s25, percent2024: activeServersCount > 0 ? Math.round((s24 / activeServersCount) * 100) : 0, percent2025: activeServersCount > 0 ? Math.round((s25 / activeServersCount) * 100) : 0 });
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET api/ferias
router.get('/ferias', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = { $or: [{ ASSUNTO_SIT: 'Férias' }, { ASSUNTO_SIT: /f[eé]rias/i }] };
        const ferias = await SituacaoServidor.find(query).sort({ INICIO_FERIAS_SIT: -1 }).skip(skip).limit(limit).lean();
        let enriched = ferias;
        if (ferias.length > 0) {
            const serverIds = ferias.map(f => f.IDFK_SERV);
            const matched = await Servidor.find({ IDPK_SERV: { $in: serverIds } }).select('IDPK_SERV NOME_SERV').lean();
            const map = {}; matched.forEach(s => { map[String(s.IDPK_SERV)] = s.NOME_SERV; });
            enriched = ferias.map(f => ({ ...f, NOME_SERV: map[String(f.IDFK_SERV)] || 'Não encontrado' }));
        }
        const total = await SituacaoServidor.countDocuments(query);
        res.json({ ferias: enriched, currentPage: page, totalPages: Math.ceil(total / limit), totalFerias: total });
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   GET api/ferias-data
router.get('/ferias-data', async (req, res) => {
    try {
        const { year, nomeFilter, setorFilter } = req.query;
        let query = { ASSUNTO_SIT: { $regex: /f[eé]rias/i } };
        if (year) { const start = new Date(`${year}-01-01`), end = new Date(`${year}-12-31`); query.INICIO_FERIAS_SIT = { $gte: start, $lte: end }; }
        const ferias = await SituacaoServidor.find(query).limit(500).lean();
        const serverIds = [...new Set(ferias.map(f => f.IDFK_SERV))];
        const matched = await Servidor.find({ IDPK_SERV: { $in: serverIds } }).lean();
        const map = {}; matched.forEach(s => { map[s.IDPK_SERV] = s; });
        let data = ferias.reduce((acc, f) => {
            const s = map[f.IDFK_SERV]; if (!s) return acc;
            if (setorFilter && !normalizeStr(s.SETOR_LOTACAO_SERV).includes(normalizeStr(setorFilter))) return acc;
            if (nomeFilter && !normalizeStr(s.NOME_SERV).includes(normalizeStr(nomeFilter))) return acc;
            acc.push({ ...f, NOME_SERV: s.NOME_SERV, SETOR_LOTACAO_SERV: s.SETOR_LOTACAO_SERV }); return acc;
        }, []);
        res.json({ data, year, total: data.length });
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   GET api/servidores/concessivo
router.get('/servidores/concessivo', async (req, res) => {
    try {
        const today = new Date();
        const servidores = await Servidor.find({ ATIVO_SERV: { $in: ['SIM', 'ATIVO', 'Sim', 'Ativo'] } }).lean();
        const upcoming = servidores.filter(s => {
            if (!s.ADMISSAO_SERV) return false;
            const adm = new Date(s.ADMISSAO_SERV);
            return (today.getMonth() === adm.getMonth()); // Simplified logic used in original concessivo
        }).map(s => ({ ...s, PROXIMO_INICIO_CONCESSIVO: new Date(today.getFullYear(), new Date(s.ADMISSAO_SERV).getMonth(), new Date(s.ADMISSAO_SERV).getDate()) }));
        res.json(upcoming);
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   GET api/servidores/ferias-vencidas
router.get('/servidores/ferias-vencidas', async (req, res) => {
    try {
        const servidores = await Servidor.find({ ATIVO_SERV: { $in: ['SIM', 'ATIVO', 'Sim', 'Ativo'] } }).lean();
        const serverIds = servidores.map(s => s.IDPK_SERV);
        const allVacations = await SituacaoServidor.find({ IDFK_SERV: { $in: serverIds }, ASSUNTO_SIT: { $regex: /f[eé]rias/i } }).lean();
        const vacMap = {}; allVacations.forEach(v => { if (!vacMap[v.IDFK_SERV]) vacMap[v.IDFK_SERV] = []; vacMap[v.IDFK_SERV].push(v); });
        const list = [];
        for (const s of servidores) {
            const status = calculateVacationStatus(s, vacMap[s.IDPK_SERV] || []);
            if (status && status.vencidas > 0) list.push({ ...s, PERIODOS_VENCIDOS: status.vencidas, AQUISITIVO_PENDENTE_INICIO: status.oldestVencida?.start, AQUISITIVO_PENDENTE_FIM: status.oldestVencida?.end });
        }
        res.json(list);
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   GET api/servidores/ferias-atrasadas
router.get('/servidores/ferias-atrasadas', async (req, res) => {
    try {
        const servidores = await Servidor.find({ ATIVO_SERV: { $in: ['SIM', 'ATIVO', 'Sim', 'Ativo'] } }).lean();
        const serverIds = servidores.map(s => s.IDPK_SERV);
        const allVacations = await SituacaoServidor.find({ IDFK_SERV: { $in: serverIds }, ASSUNTO_SIT: { $regex: /f[eé]rias/i } }).lean();
        const vacMap = {}; allVacations.forEach(v => { if (!vacMap[v.IDFK_SERV]) vacMap[v.IDFK_SERV] = []; vacMap[v.IDFK_SERV].push(v); });
        const list = [];
        for (const s of servidores) {
            const status = calculateVacationStatus(s, vacMap[s.IDPK_SERV] || []);
            if (status && status.isAtrasado) list.push({ ...s, feriasAtrasadas: status.atrasadasCount, vencidas: status.vencidas });
        }
        list.sort((a, b) => b.feriasAtrasadas - a.feriasAtrasadas);
        res.json(list);
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
