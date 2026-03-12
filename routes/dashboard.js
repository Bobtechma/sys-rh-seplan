const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Servidor = require('../models/Servidor');
const SituacaoServidor = require('../models/SituacaoServidor');
const auth = require('../middleware/auth');

// @route   GET api/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const getCount = (facetArray) => (facetArray && facetArray.length > 0) ? facetArray[0].count : 0;
        const [servidorStats, pendencias, ferias] = await Promise.all([
            Servidor.aggregate([
                { $match: { ATIVO_SERV: { $in: ['SIM', 'ATIVO', 'Sim', 'Ativo'] } } },
                {
                    $facet: {
                        active: [{ $count: "count" }],
                        aniversarios: [{ $match: { $expr: { $eq: [{ $month: "$NASCIMENTO_SERV" }, currentMonth] } } }, { $count: "count" }],
                        efetivos: [{ $match: { CARGO_EFETIVO_SERV: { $ne: null } } }, { $count: "count" }],
                        comiss: [{ $match: { CARGO_COMISSIONADO_SERV: { $ne: null } } }, { $count: "count" }],
                        sp: [{ $match: { $or: [{ VINCULO_SERV: 'SERVIÇOS PRESTADOS' }, { SERVICO_PRESTADO_SERV: 'SIM' }] } }, { $count: "count" }],
                        contr: [{ $match: { VINCULO_SERV: { $in: ['Contratado', 'CONTRATADO'] } } }, { $count: "count" }],
                        total: [{ $count: "count" }]
                    }
                }
            ]),
            SituacaoServidor.countDocuments({ STATUS_SIT: { $in: ['Pendente', 'Em Análise', 'Aguardando', 'Aguardando Aprovação', 'PENDENTE', 'Aguardando aprovação'] } }),
            SituacaoServidor.countDocuments({ ASSUNTO_SIT: { $regex: /f[eé]rias/i }, $or: [{ STATUS_SIT: 'Aprovado' }, { STATUS_SIT: 'FERIAS' }, { STATUS_SIT: null }, { STATUS_SIT: "" }, { STATUS_SIT: { $exists: false } }], INICIO_FERIAS_SIT: { $lte: today }, FIM_FERIAS_SIT: { $gte: today } })
        ]);
        const dataStats = servidorStats[0];
        const activeServidores = getCount(dataStats.active);
        const aniversariantesCount = getCount(dataStats.aniversarios);
        const servicosPrestados = getCount(dataStats.sp);
        const efetivosCount = getCount(dataStats.efetivos);
        const comissionadosCount = getCount(dataStats.comiss);
        const contratadosCount = getCount(dataStats.contr);
        const outros = getCount(dataStats.total) - (efetivosCount + comissionadosCount + contratadosCount);
        const recentActivity = await Servidor.aggregate([{ $unwind: "$OBSERVACOES" }, { $sort: { "OBSERVACOES.data": -1 } }, { $group: { _id: "$_id", IDPK_SERV: { $first: "$IDPK_SERV" }, NOME_SERV: { $first: "$NOME_SERV" }, lastUpdate: { $first: "$OBSERVACOES.data" }, author: { $first: "$OBSERVACOES.autor" }, content: { $first: "$OBSERVACOES.conteudo" } } }, { $sort: { lastUpdate: -1 } }, { $limit: 5 }]);
        res.json({ activeServidores, aniversariantesCount, servicosPrestados, pendencias, ferias, efetivosCount, comissionadosCount, contratadosCount, outros, activeCountReal: activeServidores, recentActivity });
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   GET api/dashboard/history
router.get('/dashboard/history', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const history = await Servidor.aggregate([{ $unwind: "$OBSERVACOES" }, { $sort: { "OBSERVACOES.data": -1 } }, { $skip: skip }, { $limit: limit }, { $project: { _id: 1, IDPK_SERV: 1, NOME_SERV: 1, data: "$OBSERVACOES.data", autor: "$OBSERVACOES.autor", conteudo: "$OBSERVACOES.conteudo", categoria: "$OBSERVACOES.categoria" } }]);
        const totalAggregation = await Servidor.aggregate([{ $unwind: "$OBSERVACOES" }, { $count: "total" }]);
        const total = totalAggregation.length > 0 ? totalAggregation[0].total : 0;
        res.json({ history, currentPage: page, totalPages: Math.ceil(total / limit), totalRecords: total });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
