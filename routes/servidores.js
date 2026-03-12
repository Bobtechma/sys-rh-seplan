const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Servidor = require('../models/Servidor');
const SituacaoServidor = require('../models/SituacaoServidor');
const auth = require('../middleware/auth');
const multer = require('multer');
const { logObservation, fmtVal } = require('../utils/apiHelpers');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// @route   GET api/servidores/setores
router.get('/servidores/setores', async (req, res) => {
    try {
        const setores = await Servidor.distinct('SETOR_LOTACAO_SERV');
        const cleanSetores = setores.filter(s => s).sort();
        res.json(cleanSetores);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/servidores/cargos
router.get('/servidores/cargos', async (req, res) => {
    try {
        const efetivos = await Servidor.distinct('CARGO_EFETIVO_SERV');
        const comissionados = await Servidor.distinct('CARGO_COMISSIONADO_SERV');
        const funcoes = await Servidor.distinct('FUNCAO_SP_SERV');
        const allCargos = [...new Set([...efetivos, ...comissionados, ...funcoes])]
            .filter(c => c && c.trim() !== '').sort();
        res.json(allCargos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/servidores
router.get('/servidores', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const query = {};
        if (search) {
            query.$or = [
                { NOME_SERV: { $regex: search, $options: 'i' } },
                { MATRICULA_SERV: { $regex: search, $options: 'i' } },
                { CPF_SERV: { $regex: search, $options: 'i' } }
            ];
        }
        if (req.query.setor) query.SETOR_LOTACAO_SERV = { $regex: req.query.setor, $options: 'i' };

        if (req.query.status) {
            if (req.query.status === 'ativo') {
                query.ATIVO_SERV = { $regex: /^\s*(sim|ativo|ativa)\s*$/i };
                query.CEDIDO_SERV = { $nin: ['true', 'SIM', 'Sim', true] };
                query.VINCULO_SERV = { $not: /demitido|exonerado|inativo/i };
            } else if (req.query.status === 'inativo') {
                query.$or = [
                    { ATIVO_SERV: { $not: /^\s*(sim|ativo|ativa)\s*$/i } },
                    { CEDIDO_SERV: { $in: ['true', 'SIM', 'Sim', true] } },
                    { VINCULO_SERV: { $regex: /demitido|exonerado|inativo/i } }
                ];
            } else if (req.query.status === 'ferias') {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const feriasRecords = await SituacaoServidor.find({
                    ASSUNTO_SIT: { $regex: /f[eé]rias/i }, INICIO_FERIAS_SIT: { $lte: today }, FIM_FERIAS_SIT: { $gte: today }
                });
                const feriasIds = feriasRecords.map(r => r.IDFK_SERV);
                query.$or = [{ ATIVO_SERV: 'FERIAS' }, { IDPK_SERV: { $in: feriasIds } }];
            } else if (req.query.status === 'afastado') {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const afastadoRecords = await SituacaoServidor.find({
                    ASSUNTO_SIT: { $not: /f[eé]rias/i }, INICIO_FERIAS_SIT: { $lte: today }, FIM_FERIAS_SIT: { $gte: today }
                });
                const afastadoIds = afastadoRecords.map(r => r.IDFK_SERV);
                query.$or = [{ ATIVO_SERV: 'AFASTADO' }, { IDPK_SERV: { $in: afastadoIds } }];
            }
        }

        if (req.query.birthMonth) {
            const month = parseInt(req.query.birthMonth);
            if (!isNaN(month)) query.$expr = { $eq: [{ $month: "$NASCIMENTO_SERV" }, month] };
        }
        if (req.query.cargo) {
            query.$or = [
                { CARGO_EFETIVO_SERV: req.query.cargo }, { CARGO_COMISSIONADO_SERV: req.query.cargo }, { FUNCAO_SP_SERV: req.query.cargo }
            ];
        }
        if (req.query.vinculo) {
            const v = req.query.vinculo.toUpperCase();
            if (v === 'EFETIVO') query.$and = [{ CARGO_EFETIVO_SERV: { $ne: null } }, { CARGO_EFETIVO_SERV: { $ne: '' } }];
            else if (v === 'COMISSIONADO') query.$and = [{ CARGO_COMISSIONADO_SERV: { $ne: null } }, { CARGO_COMISSIONADO_SERV: { $ne: '' } }];
            else if (v === 'SERVIÇOS PRESTADOS' || v === 'SERVICOS PRESTADOS') query.$or = [{ VINCULO_SERV: 'SERVIÇOS PRESTADOS' }, { SERVICO_PRESTADO_SERV: { $regex: /^sim$/i } }];
            else if (v === 'CONTRATADO') query.$and = [{ CARGO_EFETIVO_SERV: { $in: [null, ''] } }, { CARGO_COMISSIONADO_SERV: { $in: [null, ''] } }, { SERVICO_PRESTADO_SERV: { $not: { $regex: /^sim$/i } } }];
            else query.VINCULO_SERV = { $regex: req.query.vinculo, $options: 'i' };
        }

        let sort = { NOME_SERV: 1, _id: 1 };
        if (req.query.sort) {
            const [field, direction] = req.query.sort.split(':');
            sort = { [field]: direction === 'desc' ? -1 : 1, _id: 1 };
        }

        const skip = (page - 1) * limit;
        const servidoresRaw = await Servidor.find(query).sort(sort).skip(skip).limit(limit).lean();

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const servidores = await Promise.all(servidoresRaw.map(async (s) => {
            let status = 'Ativo';
            let statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            if (['NÃO', 'INATIVO', 'NAO'].includes(s.ATIVO_SERV?.toUpperCase())) {
                status = 'Inativo'; statusClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            } else {
                const situacao = await SituacaoServidor.findOne({ IDFK_SERV: s.IDPK_SERV, INICIO_FERIAS_SIT: { $lte: today }, FIM_FERIAS_SIT: { $gte: today } });
                if (situacao) {
                    if (situacao.ASSUNTO_SIT?.match(/f[eé]rias/i)) { status = 'Em Férias'; statusClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'; }
                    else { status = 'Afastado'; statusClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'; }
                }
            }
            return { ...s, CARGO_SERV: s.CARGO_EFETIVO_SERV || s.CARGO_COMISSIONADO_SERV || s.FUNCAO_SP_SERV || 'Não informado', status, statusClass };
        }));

        const total = await Servidor.countDocuments(query);
        res.json({ servidores, currentPage: page, totalPages: Math.ceil(total / limit), totalServidores: total });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/servidores
router.post('/servidores', auth, async (req, res) => {
    try {
        const lastServidor = await Servidor.findOne().sort({ IDPK_SERV: -1 });
        let newId = 1;
        if (lastServidor && !isNaN(Number(lastServidor.IDPK_SERV))) newId = Number(lastServidor.IDPK_SERV) + 1;
        const newServidor = new Servidor({ ...req.body, IDPK_SERV: String(newId), OBSERVACOES: [] });
        if (req.body.OBS_SERV) {
            newServidor.OBSERVACOES = [{ conteudo: req.body.OBS_SERV, categoria: 'Observação Geral', data: new Date(), autor: req.user ? req.user.nome : 'Usuário' }];
        }
        const servidor = await newServidor.save();
        res.json(servidor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/servidores/:id
router.put('/servidores/:id', auth, async (req, res) => {
    try {
        const id = req.params.id;
        let servidor = mongoose.Types.ObjectId.isValid(id) ? await Servidor.findById(id) : await Servidor.findOne({ IDPK_SERV: id });
        if (!servidor) return res.status(404).json({ msg: 'Servidor não encontrado' });
        const excludeFields = ['_id', 'IDPK_SERV', 'OBSERVACOES', 'ANEXOS', 'OBS_SERV'];
        const dateFields = ['NASCIMENTO_SERV', 'ADMISSAO_SERV', 'VALIDADE_CNH_SERV', 'DATACAD_SERV'];
        const changes = [];
        Object.keys(req.body).forEach(key => {
            if (excludeFields.includes(key)) return;
            const oldVal = fmtVal(servidor[key], dateFields.includes(key));
            const newVal = fmtVal(req.body[key], dateFields.includes(key));
            if (oldVal !== newVal) { changes.push(`${key}: ${oldVal} → ${newVal}`); servidor[key] = req.body[key]; }
        });
        if (req.body.OBS_SERV) servidor.OBSERVACOES.push({ conteudo: req.body.OBS_SERV, categoria: 'Observação Manual', data: new Date(), autor: req.user ? req.user.nome : 'Usuário' });
        if (changes.length > 0) servidor.OBSERVACOES.push({ conteudo: `Alterado: ${changes.join(', ')}`, categoria: 'Atualização Cadastral', data: new Date(), autor: req.user ? req.user.nome : 'Usuário' });
        await servidor.save();
        res.json(servidor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/servidores/:id
router.get('/servidores/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const servidor = mongoose.Types.ObjectId.isValid(id) ? await Servidor.findById(id) : await Servidor.findOne({ IDPK_SERV: id });
        if (!servidor) return res.status(404).json({ msg: 'Servidor não encontrado' });
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const situacao = await SituacaoServidor.findOne({ IDFK_SERV: servidor.IDPK_SERV, INICIO_FERIAS_SIT: { $lte: today }, FIM_FERIAS_SIT: { $gte: today } });
        const obj = servidor.toObject();
        if (situacao) obj.SITUACAO_SERV = situacao.ASSUNTO_SIT?.match(/f[eé]rias/i) ? 'Em Férias' : 'Afastado';
        else obj.SITUACAO_SERV = ['NÃO', 'INATIVO', 'NAO'].includes(servidor.ATIVO_SERV?.toUpperCase()) ? 'Inativo' : 'Ativo';
        if (obj.OBSERVACOES) obj.OBSERVACOES.sort((a, b) => new Date(b.data) - new Date(a.data));
        res.json({ servidor: obj });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/servidores/:id/upload
router.post('/servidores/:id/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const id = req.params.id;
        const servidor = mongoose.Types.ObjectId.isValid(id) ? await Servidor.findById(id) : await Servidor.findOne({ IDPK_SERV: id });
        if (!servidor || !req.file) return res.status(400).json({ msg: 'Servidor ou arquivo inválido' });
        const anexo = { nome: req.body.nome || req.file.originalname, tipo: req.file.mimetype, tamanho: req.file.size, conteudo: req.file.buffer.toString('base64'), data: new Date() };
        servidor.ANEXOS.push(anexo);
        await logObservation(servidor, `Anexo adicionado: ${anexo.nome}`, 'Documento', req.user?.nome);
        await servidor.save();
        res.json(servidor.ANEXOS);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/servidores/:id/anexos/:anexoId
router.delete('/servidores/:id/anexos/:anexoId', auth, async (req, res) => {
    try {
        const id = req.params.id;
        const servidor = mongoose.Types.ObjectId.isValid(id) ? await Servidor.findById(id) : await Servidor.findOne({ IDPK_SERV: id });
        if (!servidor) return res.status(404).json({ msg: 'Servidor não encontrado' });
        const anexo = servidor.ANEXOS.id(req.params.anexoId);
        const nome = anexo ? anexo.nome : 'desconhecido';
        servidor.ANEXOS.pull({ _id: req.params.anexoId });
        await logObservation(servidor, `Anexo removido: ${nome}`, 'Documento', req.user?.nome);
        await servidor.save();
        res.json(servidor.ANEXOS);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/servidores/:id/observacoes
router.post('/servidores/:id/observacoes', auth, async (req, res) => {
    try {
        const id = req.params.id;
        const servidor = mongoose.Types.ObjectId.isValid(id) ? await Servidor.findById(id) : await Servidor.findOne({ IDPK_SERV: id });
        if (!servidor) return res.status(404).json({ msg: 'Servidor não encontrado' });
        servidor.OBSERVACOES.push({ conteudo: req.body.conteudo, categoria: req.body.categoria || 'Geral', data: new Date(), autor: req.user ? req.user.nome : 'Sistema' });
        await servidor.save();
        res.json(servidor.OBSERVACOES);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/servidores/:id/observacoes/:obsId
router.delete('/servidores/:id/observacoes/:obsId', auth, async (req, res) => {
    try {
        const id = req.params.id;
        const servidor = mongoose.Types.ObjectId.isValid(id) ? await Servidor.findById(id) : await Servidor.findOne({ IDPK_SERV: id });
        if (!servidor) return res.status(404).json({ msg: 'Servidor não encontrado' });
        servidor.OBSERVACOES.pull({ _id: req.params.obsId });
        await servidor.save();
        res.json(servidor.OBSERVACOES);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/servidores/:id/observacoes/:obsId
router.put('/servidores/:id/observacoes/:obsId', auth, async (req, res) => {
    try {
        const id = req.params.id;
        const servidor = mongoose.Types.ObjectId.isValid(id) ? await Servidor.findById(id) : await Servidor.findOne({ IDPK_SERV: id });
        if (!servidor) return res.status(404).json({ msg: 'Servidor não encontrado' });
        const observation = servidor.OBSERVACOES.id(req.params.obsId);
        if (!observation) return res.status(404).json({ msg: 'Não encontrado' });
        observation.conteudo = req.body.conteudo;
        observation.categoria = req.body.categoria || observation.categoria;
        observation.data = new Date();
        await servidor.save();
        res.json(servidor.OBSERVACOES);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
