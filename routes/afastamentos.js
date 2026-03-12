const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Servidor = require('../models/Servidor');
const SituacaoServidor = require('../models/SituacaoServidor');
const TipoAfastamento = require('../models/TipoAfastamento');
const auth = require('../middleware/auth');
const { logObservation } = require('../utils/apiHelpers');

// @route   GET api/tipos-afastamento
router.get('/tipos-afastamento', async (req, res) => {
    try {
        const tipos = await TipoAfastamento.find().sort({ nome: 1 });
        res.json(tipos);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   POST api/tipos-afastamento
router.post('/tipos-afastamento', auth, async (req, res) => {
    try {
        const { nome, categoria } = req.body;
        if (!nome) return res.status(400).json({ msg: 'Nome é obrigatório' });
        let tipo = await TipoAfastamento.findOne({ nome: { $regex: new RegExp(`^${nome}$`, 'i') } });
        if (tipo) return res.status(400).json({ msg: 'Este tipo já existe' });
        tipo = new TipoAfastamento({ nome, categoria: categoria || 'Geral' });
        await tipo.save();
        res.json(tipo);
    } catch (err) { console.error(err.message); res.status(500).send('Server Error'); }
});

// @route   GET api/afastamentos
router.get('/afastamentos', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = { ASSUNTO_SIT: { $not: /f[eé]rias/i } };
        const afastamentos = await SituacaoServidor.find(query).sort({ INICIO_FERIAS_SIT: -1 }).skip(skip).limit(limit).lean();
        let enriched = afastamentos;
        if (afastamentos.length > 0) {
            const serverIds = afastamentos.map(a => a.IDFK_SERV);
            const matched = await Servidor.find({ IDPK_SERV: { $in: serverIds } }).select('IDPK_SERV NOME_SERV').lean();
            const map = {}; matched.forEach(s => { map[String(s.IDPK_SERV)] = s.NOME_SERV; });
            enriched = afastamentos.map(a => ({ ...a, NOME_SERV: map[String(a.IDFK_SERV)] || 'Não encontrado' }));
        }
        const total = await SituacaoServidor.countDocuments(query);
        res.json({ afastamentos: enriched, currentPage: page, totalPages: Math.ceil(total / limit), totalAfastamentos: total });
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   POST api/afastamentos
router.post('/afastamentos', auth, async (req, res) => {
    try {
        const { servidorId, tipo, inicio, fim, periodos, observacao, pa_ano1, pa_ano2, inicio_concessivo, fim_concessivo } = req.body;
        const autor = req.user ? req.user.nome : 'Sistema';
        const serv = await Servidor.findOne({ IDPK_SERV: servidorId });
        if (!serv) return res.status(404).json({ msg: 'Servidor não encontrado' });
        const periods = periodos && periodos.length > 0 ? periodos : [{ inicio, fim }];
        const created = [], logs = [];
        const maxAggr = await SituacaoServidor.aggregate([{ $addFields: { nId: { $convert: { input: "$IDPK_SIT", to: "int", onError: 0, onNull: 0 } } } }, { $group: { _id: null, maxId: { $max: "$nId" } } }]);
        let currentMaxId = (maxAggr.length > 0 && maxAggr[0].maxId != null) ? maxAggr[0].maxId : 0;
        for (const p of periods) {
            if (!p.inicio || !p.fim) continue;
            currentMaxId++;
            const newItem = new SituacaoServidor({ IDPK_SIT: String(currentMaxId), IDFK_SERV: servidorId, ASSUNTO_SIT: tipo, INICIO_FERIAS_SIT: p.inicio, FIM_FERIAS_SIT: p.fim, TEXTO_SIT: observacao, STATUS_SIT: 'Pendente', PA_ANO1_SIT: pa_ano1, PA_ANO2_SIT: pa_ano2, INICIO_CONCESSIVO_SIT: inicio_concessivo, FIM_CONCESSIVO_SIT: fim_concessivo, DATACAD_SIT: new Date() });
            await newItem.save(); created.push(newItem); logs.push(`${p.inicio} a ${p.fim}`);
        }
        if (serv.OBSERVACOES) { serv.OBSERVACOES.push({ conteudo: `Solicitação de ${tipo} criada: ${logs.join(', ')}`, categoria: 'Sistema', data: new Date(), autor }); await serv.save(); }
        res.json(created);
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   GET api/afastamentos/:id
router.get('/afastamentos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ _id: id }, { IDPK_SIT: id }] } : { IDPK_SIT: id };
        const item = await SituacaoServidor.findOne(query).lean();
        if (!item) return res.status(404).json({ msg: 'Não encontrado' });
        res.json(item);
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   PUT api/afastamentos/:id
router.put('/afastamentos/:id', auth, async (req, res) => {
    try {
        const { inicio, fim, obs, status, tipo, pa_ano1, pa_ano2, inicio_concessivo, fim_concessivo } = req.body;
        const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ _id: req.params.id }, { IDPK_SIT: req.params.id }] } : { IDPK_SIT: req.params.id };
        const item = await SituacaoServidor.findOneAndUpdate(query, { $set: { INICIO_FERIAS_SIT: inicio, FIM_FERIAS_SIT: fim, TEXTO_SIT: obs, STATUS_SIT: status, ASSUNTO_SIT: tipo, PA_ANO1_SIT: pa_ano1, PA_ANO2_SIT: pa_ano2, INICIO_CONCESSIVO_SIT: inicio_concessivo, FIM_CONCESSIVO_SIT: fim_concessivo } }, { new: true });
        if (!item) return res.status(404).json({ msg: 'Não encontrado' });
        if (status === 'Aprovado') { await Servidor.findOneAndUpdate({ IDPK_SERV: item.IDFK_SERV }, { $set: { ATIVO_SERV: (item.ASSUNTO_SIT?.match(/f[eé]rias/i) ? 'FERIAS' : 'AFASTADO') } }); }
        await logObservation(item.IDFK_SERV, `Solicitação de ${item.ASSUNTO_SIT} atualizada: ${status || 'Editado'}`, 'Sistema', req.user?.nome);
        res.json(item);
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   DELETE api/afastamentos/:id
router.delete('/afastamentos/:id', auth, async (req, res) => {
    try {
        const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ _id: req.params.id }, { IDPK_SIT: req.params.id }] } : { IDPK_SIT: req.params.id };
        const result = await SituacaoServidor.findOneAndDelete(query);
        if (!result) return res.status(404).json({ msg: 'Não encontrado' });
        res.json({ msg: 'Removido' });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
