const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const SituacaoServidor = require('../models/SituacaoServidor');
const Calendario = require('../models/Calendario');
const path = require('path');
const fs = require('fs');

// @route   POST api/documentos/next-number
router.post('/documentos/next-number', auth, async (req, res) => {
    try {
        const count = await SituacaoServidor.countDocuments({ ASSUNTO_SIT: req.body.tipo });
        res.json({ nextNumber: count + 1 });
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   POST api/sync-situacoes
router.post('/sync-situacoes', auth, async (req, res) => {
    try {
        const dataPath = path.join(__dirname, '..', 'data_converted.json');
        if (!fs.existsSync(dataPath)) return res.status(404).json({ msg: 'Não encontrado' });
        const situacoes = JSON.parse(fs.readFileSync(dataPath, 'utf-8')).SITUACAO_SERVIDOR;
        if (!situacoes) return res.status(400).json({ msg: 'JSON inválido' });
        const existing = new Set((await SituacaoServidor.find({}, { IDPK_SIT: 1 }).lean()).map(d => String(d.IDPK_SIT)));
        const news = situacoes.filter(r => !existing.has(String(r.IDPK_SIT))).map(r => ({ ...r, DATACAD_SIT: r.DATACAD_SIT ? new Date(r.DATACAD_SIT) : null, INICIO_FERIAS_SIT: r.INICIO_FERIAS_SIT ? new Date(r.INICIO_FERIAS_SIT) : null, FIM_FERIAS_SIT: r.FIM_FERIAS_SIT ? new Date(r.FIM_FERIAS_SIT) : null }));
        if (news.length > 0) await SituacaoServidor.insertMany(news, { ordered: false });
        res.json({ msg: 'Sincronizado', inserted: news.length });
    } catch (err) { res.status(500).json({ msg: err.message }); }
});

// @route   GET api/calendario
router.get('/calendario', auth, async (req, res) => {
    try { res.json(await Calendario.find().sort({ data: 1 })); }
    catch (err) { res.status(500).send('Server Error'); }
});

// @route   POST api/calendario
router.post('/calendario', auth, async (req, res) => {
    try {
        const event = new Calendario({ ...req.body, servidores: req.body.servidores || [] });
        await event.save(); res.json(event);
    } catch (err) { res.status(500).send('Server Error'); }
});

// @route   DELETE api/calendario/:id
router.delete('/calendario/:id', auth, async (req, res) => {
    try { await Calendario.findByIdAndDelete(req.params.id); res.json({ msg: 'Removido' }); }
    catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
