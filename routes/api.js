const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Servidor = require('../models/Servidor');
const SituacaoServidor = require('../models/SituacaoServidor');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure Multer for memory storage (for Vercel/Serverless)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit to 5MB to avoid document size limits
});

// Helper to add observation to server
async function logObservation(servidorId, conteudo, categoria = 'Sistema') {
    try {
        let serv;
        if (typeof servidorId === 'object' && servidorId.save) {
            serv = servidorId; // It's already a document
        } else {
            // Find by _id or IDPK_SERV
            if (mongoose.Types.ObjectId.isValid(servidorId)) {
                serv = await Servidor.findById(servidorId);
            } else {
                serv = await Servidor.findOne({ IDPK_SERV: servidorId });
            }
        }

        if (serv) {
            if (!serv.OBSERVACOES) serv.OBSERVACOES = [];
            serv.OBSERVACOES.push({
                conteudo: conteudo,
                categoria: categoria,
                data: new Date(),
                autor: 'Sistema'
            });
            await serv.save();
        }
    } catch (e) {
        console.error('Error logging observation:', e);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST api/documentos/next-number
// @desc    Atomically get next sequential document number for vacation notices
// @access  Public
// @body    { tipo: 'AVF' | 'RCF' }
// @returns { numero: '042/2026', seq: 42, year: 2026 }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/documentos/next-number', async (req, res) => {
    try {
        const Counter = require('../models/Counter');
        const tipo = (req.body.tipo || 'AVF').toUpperCase();
        const year = new Date().getFullYear();

        // Atomically increment the counter (upsert = create if not exists)
        const counter = await Counter.findOneAndUpdate(
            { tipo, year },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const seq = counter.seq;
        const numero = `${String(seq).padStart(3, '0')}/${year}`;

        res.json({ numero, seq, year });
    } catch (err) {
        console.error('Error generating document number:', err.message);
        res.status(500).json({ msg: 'Erro ao gerar número do documento' });
    }
});



// @desc    Delete attachment (MOVED TO TOP FOR DEBUG)
// @access  Public
router.delete('/servidores/:id/anexos/:anexoId', async (req, res) => {
    console.log(`DELETE request for servidor: ${req.params.id}, anexo: ${req.params.anexoId}`);
    try {
        const servidor = await Servidor.findById(req.params.id);
        if (!servidor) {
            console.log('Servidor not found for ID:', req.params.id);
            return res.status(404).json({ msg: 'Servidor not found', requestedId: req.params.id });
        }

        const anexoId = req.params.anexoId;

        // Idempotent deletion logic
        const anexo = servidor.ANEXOS.find(a => a._id.toString() === anexoId);

        if (anexo) {
            // Remove file from filesystem if path exists and not memory
            if (anexo.path !== 'memory' && fs.existsSync(anexo.path)) {
                try {
                    fs.unlinkSync(anexo.path);
                } catch (fsErr) {
                    console.warn('Delete file warning:', fsErr.message);
                }
            }
        } else {
            console.log('Anexo not found in list via find(), attempting pull anyway.');
            const debugIds = servidor.ANEXOS.map(a => a._id ? a._id.toString() : 'missing_id');
            console.log('Available IDs:', debugIds);
        }

        // Remove from array using Mongoose pull (robust)
        servidor.ANEXOS.pull({ _id: anexoId });
        await servidor.save();

        res.json(servidor.ANEXOS);
    } catch (err) {
        console.error('Delete Anexo Error:', err.message);
        res.status(500).send('Server Error');
    }
});


// @desc    Add a new observation to a servidor profile
// @access  Public
router.post('/servidores/:id/observacoes', async (req, res) => {
    try {
        const servidor = await Servidor.findById(req.params.id);
        if (!servidor) return res.status(404).json({ msg: 'Servidor não encontrado' });

        const { conteudo, autor } = req.body;
        if (!conteudo || !conteudo.trim()) {
            return res.status(400).json({ msg: 'O conteúdo da observação não pode estar vazio' });
        }

        const novaObs = {
            conteudo: conteudo.trim(),
            autor: autor || 'Usuário',
            data: new Date()
        };

        if (!servidor.OBSERVACOES) servidor.OBSERVACOES = [];
        servidor.OBSERVACOES.push(novaObs);
        await servidor.save();

        res.json(servidor.OBSERVACOES);
    } catch (err) {
        console.error('Add Observation Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/servidores/:id/observacoes/:obsId
// @desc    Delete an observation from a servidor profile
// @access  Public
router.delete('/servidores/:id/observacoes/:obsId', async (req, res) => {
    try {
        const servidor = await Servidor.findById(req.params.id);
        if (!servidor) return res.status(404).json({ msg: 'Servidor não encontrado' });

        servidor.OBSERVACOES.pull({ _id: req.params.obsId });
        await servidor.save();

        res.json(servidor.OBSERVACOES);
    } catch (err) {
        console.error('Delete Observation Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/servidores/setores
// @desc    Get all distinct sectors
// @access  Public
router.get('/servidores/setores', async (req, res) => {
    try {
        const setores = await Servidor.distinct('SETOR_LOTACAO_SERV');
        // Filter out null/empty and sort
        const cleanSetores = setores.filter(s => s).sort();
        res.json(cleanSetores);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/servidores/concessivo
// @desc    Get servidores entereing concession period (admission anniversary in next 30 days)
// @access  Public
router.get('/servidores/concessivo', async (req, res) => {
    try {
        const today = new Date();
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        // We need to match day/month of ADMISSAO_SERV within the range [today, next30Days]
        // Since years differ, we can't use simple date comparison.
        // We use aggregation to project the next anniversary.

        const servidores = await Servidor.aggregate([
            {
                $match: {
                    ATIVO_SERV: { $in: ['SIM', 'ATIVO', 'Sim', 'Ativo'] },
                    ADMISSAO_SERV: { $exists: true, $ne: null }
                }
            },
            {
                $project: {
                    NOME_SERV: 1,
                    IDPK_SERV: 1,
                    ADMISSAO_SERV: 1,
                    SETOR_LOTACAO_SERV: 1,
                    MATRICULA_SERV: 1,
                    month: { $month: "$ADMISSAO_SERV" },
                    day: { $dayOfMonth: "$ADMISSAO_SERV" },
                    todayMonth: { $literal: today.getMonth() + 1 },
                    todayDay: { $literal: today.getDate() }
                }
            },
            // Logic to calculate next anniversary is complex in pure mongo aggregation for "next 30 days" spanning years.
            // Simplified approach: Fetch all active users and filter in JS (dataset is small enough, ~150 users).
            // If dataset grows, we need properly indexed 'next_vacation_date' field.
        ]);

        // JS Filtering for accuracy
        const upcoming = servidores.filter(s => {
            if (!s.ADMISSAO_SERV) return false;

            const admissao = new Date(s.ADMISSAO_SERV);
            const currentYear = today.getFullYear();

            // Construct anniversary for this year
            let anniversary = new Date(currentYear, admissao.getMonth(), admissao.getDate());

            // If anniversary already passed this year, check next year
            if (anniversary < today) {
                anniversary.setFullYear(currentYear + 1);
            }

            // Check if anniversary is within next 30 days
            return anniversary >= today && anniversary <= next30Days;
        }).map(s => ({
            ...s,
            PROXIMO_INICIO_CONCESSIVO: new Date(today.getFullYear() + (new Date(s.ADMISSAO_SERV).getMonth() < today.getMonth() ? 1 : 0), new Date(s.ADMISSAO_SERV).getMonth(), new Date(s.ADMISSAO_SERV).getDate())
        }));

        res.json(upcoming);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/servidores/cargos
// @desc    Get all distinct cargos (merged from effective, commissioned, function)
// @access  Public
router.get('/servidores/cargos', async (req, res) => {
    try {
        const efetivos = await Servidor.distinct('CARGO_EFETIVO_SERV');
        const comissionados = await Servidor.distinct('CARGO_COMISSIONADO_SERV');
        const funcoes = await Servidor.distinct('FUNCAO_SP_SERV');

        // Merge and deduplicate
        const allCargos = new Set([
            ...efetivos.filter(c => c),
            ...comissionados.filter(c => c),
            ...funcoes.filter(c => c)
        ]);

        res.json(Array.from(allCargos).sort());
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/servidores
// @desc    Get all servidores with pagination, search, and filters
// @access  Public
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

        if (req.query.setor) {
            query.SETOR_LOTACAO_SERV = { $regex: req.query.setor, $options: 'i' };
        }

        if (req.query.status) {
            // Map frontend status values to database values
            if (req.query.status === 'ativo') {
                query.ATIVO_SERV = { $in: ['SIM', 'ATIVO'] };
            } else if (req.query.status === 'inativo') {
                query.ATIVO_SERV = { $in: ['NÃO', 'INATIVO'] };
            } else if (req.query.status === 'ferias') {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Start of day for comparison

                const feriasRecords = await SituacaoServidor.find({
                    ASSUNTO_SIT: 'FÃ©rias',
                    INICIO_FERIAS_SIT: { $lte: new Date() }, // Started before or now
                    FIM_FERIAS_SIT: { $gte: today } // Ends today or later
                }).select('IDFK_SERV');
                const feriasIds = feriasRecords.map(r => r.IDFK_SERV);

                query.$or = [
                    { ATIVO_SERV: 'FERIAS' },
                    { IDPK_SERV: { $in: feriasIds } }
                ];
            } else if (req.query.status === 'afastado') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const afastadoRecords = await SituacaoServidor.find({
                    ASSUNTO_SIT: { $ne: 'FÃ©rias' },
                    INICIO_FERIAS_SIT: { $lte: new Date() },
                    FIM_FERIAS_SIT: { $gte: today }
                }).select('IDFK_SERV');
                const afastadoIds = afastadoRecords.map(r => r.IDFK_SERV);

                query.$or = [
                    { ATIVO_SERV: 'AFASTADO' },
                    { IDPK_SERV: { $in: afastadoIds } }
                ];
            }
        }

        if (req.query.birthMonth) {
            const month = parseInt(req.query.birthMonth);
            if (!isNaN(month)) {
                query.$expr = { $eq: [{ $month: "$NASCIMENTO_SERV" }, month] };
            }
        }

        if (req.query.cargo) {
            query.$or = [
                { CARGO_EFETIVO_SERV: req.query.cargo },
                { CARGO_COMISSIONADO_SERV: req.query.cargo },
                { FUNCAO_SP_SERV: req.query.cargo }
            ];
        }

        if (req.query.vinculo) {
            const v = req.query.vinculo.toUpperCase();
            if (v === 'EFETIVO') {
                query.$and = [
                    { CARGO_EFETIVO_SERV: { $ne: null } },
                    { CARGO_EFETIVO_SERV: { $ne: '' } }
                ];
            } else if (v === 'COMISSIONADO') {
                query.$and = [
                    { CARGO_COMISSIONADO_SERV: { $ne: null } },
                    { CARGO_COMISSIONADO_SERV: { $ne: '' } }
                ];
            } else if (v === 'SERVIÇOS PRESTADOS' || v === 'SERVICOS PRESTADOS') {
                query.$or = [
                    { VINCULO_SERV: 'SERVIÇOS PRESTADOS' },
                    { SERVICO_PRESTADO_SERV: { $regex: /^sim$/i } }
                ];
            } else if (v === 'CONTRATADO') {
                query.$and = [
                    { CARGO_EFETIVO_SERV: { $in: [null, ''] } },
                    { CARGO_COMISSIONADO_SERV: { $in: [null, ''] } },
                    { SERVICO_PRESTADO_SERV: { $not: { $regex: /^sim$/i } } }
                ];
            } else {
                query.VINCULO_SERV = { $regex: req.query.vinculo, $options: 'i' };
            }
        }

        if (req.query.cedido === 'true') {
            query.CEDIDO_SERV = 'true';
        } else if (req.query.cedido === 'false') {
            query.CEDIDO_SERV = { $ne: 'true' };
        }

        let sort = { NOME_SERV: 1, _id: 1 };
        if (req.query.sort) {
            const [field, direction] = req.query.sort.split(':');
            sort = { [field]: direction === 'desc' ? -1 : 1, _id: 1 };
        }

        const servidoresRaw = await Servidor.find(query)
            .select('-ANEXOS.conteudo') // Exclude Base64 content from list view
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today for map comparison

        // If simple=true, skip status calculation and return minimal data
        if (req.query.simple === 'true') {
            const servidores = await Servidor.find(query)
                .select('IDPK_SERV NOME_SERV') // Select ONLY ID and Name
                .sort(sort)
                .lean();

            return res.json({
                servidores,
                totalServidores: servidores.length
            });
        }

        const servidores = await Promise.all(servidoresRaw.map(async (s) => {
            let status = 'Ativo';
            let statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';

            // First check if explicitly inactive
            if (['NÃO', 'INATIVO', 'NAO'].includes(s.ATIVO_SERV ? s.ATIVO_SERV.toUpperCase() : '')) {
                status = 'Inativo';
                statusClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            } else {
                // For users marked as ATIVO, SIM, FERIAS, or AFASTADO, we check the dynamic situation.
                // If the static field says AFASTADO but the period ended, this dynamic check will return null,
                // and we will fall back to 'Ativo' (effectively automating the return).

                const activeSituation = await SituacaoServidor.findOne({
                    IDFK_SERV: s.IDPK_SERV,
                    INICIO_FERIAS_SIT: { $lte: new Date() },
                    FIM_FERIAS_SIT: { $gte: today }
                });

                if (activeSituation) {
                    if (activeSituation.ASSUNTO_SIT === 'Férias') {
                        status = 'Em Férias';
                        statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                    } else {
                        status = 'Afastado';
                        statusClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
                    }
                } else {
                    // No active situation found. Even if DB says 'AFASTADO', it's expired.
                    status = 'Ativo';
                    // Default class is already set at top
                }
            }

            return {
                ...s,
                CARGO_SERV: s.CARGO_EFETIVO_SERV || s.CARGO_COMISSIONADO_SERV || s.FUNCAO_SP_SERV || 'NÃ£o informado',
                status,
                statusClass
            };
        }));

        const total = await Servidor.countDocuments(query);

        res.json({
            servidores,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalServidores: total
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/servidores
// @desc    Add new servidor
// @access  Private
router.post('/servidores', auth, async (req, res) => {
    try {
        const anexos = [];

        // Generate IDPK_SERV
        const lastServidor = await Servidor.findOne().sort({ IDPK_SERV: -1 });
        let newId = 1;
        if (lastServidor && !isNaN(Number(lastServidor.IDPK_SERV))) {
            newId = Number(lastServidor.IDPK_SERV) + 1;
        }

        const newServidorData = {
            IDPK_SERV: String(newId),
            ANEXOS: anexos
        };

        const excludeFields = ['_id', 'IDPK_SERV', 'OBSERVACOES', 'ANEXOS', 'OBS_SERV'];
        const dateFields = ['NASCIMENTO_SERV', 'ADMISSAO_SERV', 'VALIDADE_CNH_SERV', 'DATACAD_SERV'];

        Object.keys(req.body).forEach(key => {
            if (excludeFields.includes(key)) return;
            if (dateFields.includes(key)) {
                newServidorData[key] = req.body[key] === '' ? null : req.body[key];
            } else {
                newServidorData[key] = req.body[key];
            }
        });

        const newServidor = new Servidor(newServidorData);

        if (req.body.OBS_SERV && req.body.OBS_SERV.trim()) {
            newServidor.OBSERVACOES = [{
                conteudo: req.body.OBS_SERV,
                categoria: 'Manual',
                data: new Date(),
                autor: req.user ? req.user.nome : 'Usuário'
            }];
            newServidor.OBS_SERV = req.body.OBS_SERV; // Also keep as sticky if needed
        }

        const servidor = await newServidor.save();
        res.json(servidor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/servidores/:id
// @desc    Update servidor
// @access  Private
router.put('/servidores/:id', auth, async (req, res) => {
    try {
        let servidor;
        const id = req.params.id;

        if (mongoose.Types.ObjectId.isValid(id)) {
            servidor = await Servidor.findById(id);
        }

        if (!servidor) {
            servidor = await Servidor.findOne({ IDPK_SERV: id });
        }

        if (!servidor) {
            return res.status(404).json({ msg: 'Servidor not found' });
        }

        const excludeFields = ['_id', 'IDPK_SERV', 'OBSERVACOES', 'ANEXOS', 'OBS_SERV'];
        const dateFields = ['NASCIMENTO_SERV', 'ADMISSAO_SERV', 'VALIDADE_CNH_SERV', 'DATACAD_SERV'];

        Object.keys(req.body).forEach(key => {
            if (excludeFields.includes(key)) return;
            if (dateFields.includes(key)) {
                servidor[key] = req.body[key] === '' ? null : req.body[key];
            } else {
                servidor[key] = req.body[key];
            }
        });

        if (req.body.OBS_SERV && req.body.OBS_SERV.trim()) {
            servidor.OBSERVACOES.push({
                conteudo: req.body.OBS_SERV,
                categoria: 'Manual',
                data: new Date(),
                autor: req.user ? req.user.nome : 'Usuário'
            });
            servidor.OBS_SERV = ''; // Clear the input field in the database
        }

        // Log Profile Update
        servidor.OBSERVACOES.push({
            conteudo: 'Perfil do servidor atualizado.',
            categoria: 'Atualização Cadastral',
            data: new Date(),
            autor: req.user ? `Sistema (${req.user.nome})` : 'Sistema'
        });

        await servidor.save();
        res.json(servidor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/servidores/:id/anexos/:anexoId
// @desc    Delete attachment
// @access  Private
router.delete('/servidores/:id/anexos/:anexoId', auth, async (req, res) => {
    try {
        const servidor = await Servidor.findOne({ IDPK_SERV: req.params.id });
        if (!servidor) {
            return res.status(404).json({ msg: 'Servidor not found' });
        }

        const anexoName = servidor.ANEXOS.find(a => a._id.toString() === req.params.anexoId)?.nome || 'Desconhecido';

        servidor.ANEXOS = servidor.ANEXOS.filter(
            anexo => anexo._id.toString() !== req.params.anexoId
        );

        // Log Deletion using helper logic inline since we have the doc
        servidor.OBSERVACOES.push({
            conteudo: `Arquivo excluído: ${anexoName}`,
            categoria: 'Anexo',
            data: new Date(),
            autor: req.user ? `Sistema (${req.user.nome})` : 'Sistema'
        });

        await servidor.save();
        res.json(servidor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/servidores/:id
// @desc    Get single servidor
// @access  Public
router.get('/servidores/:id', async (req, res) => {
    try {
        let servidor;
        const id = req.params.id;

        // Check if it's a valid MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            servidor = await Servidor.findById(id);
        }

        // If not found by _id, try IDPK_SERV
        if (!servidor) {
            servidor = await Servidor.findOne({ IDPK_SERV: id });
        }

        if (!servidor) {
            return res.status(404).json({ msg: 'Servidor not found' });
        }

        // Calculate Dynamic Status (SITUACAO_SERV)
        // Check for active leaves or vacations
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeSituation = await SituacaoServidor.findOne({
            IDFK_SERV: servidor.IDPK_SERV,
            INICIO_FERIAS_SIT: { $lte: new Date() },
            FIM_FERIAS_SIT: { $gte: today }
        });

        const servidorObj = servidor.toObject();

        if (activeSituation) {
            if (activeSituation.ASSUNTO_SIT === 'Férias' || activeSituation.ASSUNTO_SIT === 'FÃ©rias') {
                servidorObj.SITUACAO_SERV = 'Em Férias';
            } else {
                servidorObj.SITUACAO_SERV = 'Afastado';
            }
        } else {
            // If no active situation, default to 'Ativo' if not explicitly Inativo in ATIVO_SERV
            if (!['NÃO', 'INATIVO', 'NAO'].includes(servidor.ATIVO_SERV ? servidor.ATIVO_SERV.toUpperCase() : '')) {
                servidorObj.SITUACAO_SERV = 'Ativo';
            } else {
                servidorObj.SITUACAO_SERV = 'Inativo';
            }
        }

        // Sort observations chronologically (newest first)
        if (servidorObj.OBSERVACOES && Array.isArray(servidorObj.OBSERVACOES)) {
            servidorObj.OBSERVACOES.sort((a, b) => new Date(b.data) - new Date(a.data));
        }

        res.json({ servidor: servidorObj });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/servidores/:id/upload
// @desc    Upload attachment to servidor
router.post('/servidores/:id/upload', auth, upload.single('file'), async (req, res) => {
    try {
        const servidor = await Servidor.findById(req.params.id);
        if (!servidor) {
            return res.status(404).json({ msg: 'Servidor not found' });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const newAttachment = {
            nome: file.originalname,
            tipo: file.mimetype,
            conteudo: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            tamanho: file.size,
            data: new Date()
        };

        servidor.ANEXOS.push(newAttachment);

        // Log observation
        if (!servidor.OBSERVACOES) servidor.OBSERVACOES = [];
        servidor.OBSERVACOES.push({
            conteudo: `Anexo adicionado: ${file.originalname}`,
            categoria: 'Anexo',
            data: new Date(),
            autor: 'Sistema'
        });

        await servidor.save();
        res.json(servidor.ANEXOS);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/servidores/:id/observacoes/:obsId
// @desc    Delete an observation from a servidor
// @access  Private
router.delete('/servidores/:id/observacoes/:obsId', auth, async (req, res) => {
    try {
        const servidor = await Servidor.findById(req.params.id);
        if (!servidor) {
            return res.status(404).json({ msg: 'Servidor not found' });
        }

        // Pull the observation with the matching _id from the array
        await Servidor.updateOne(
            { _id: req.params.id },
            { $pull: { OBSERVACOES: { _id: req.params.obsId } } }
        );

        // Return the updated list of observations
        const updatedServidor = await Servidor.findById(req.params.id);
        res.json(updatedServidor.OBSERVACOES);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/ferias-data
// @desc    Get vacation records for report (filtered by year and setor)
// @access  Public
router.get('/ferias-data', async (req, res) => {
    try {
        const SituacaoServidor = require('../models/SituacaoServidor');

        // Default to current year if no year provided
        const currentYear = new Date().getFullYear();
        const year = parseInt(req.query.year) || currentYear;
        const setorFilter = req.query.setor || '';
        const statusFilter = req.query.status || '';

        // Build query with year filter on INICIO_FERIAS_SIT
        const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
        const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

        const query = {
            ASSUNTO_SIT: { $regex: /f[eé]rias/i },
            INICIO_FERIAS_SIT: { $gte: yearStart, $lte: yearEnd }
        };

        if (statusFilter && statusFilter !== 'TODOS') {
            const approvedVals = ['APROVADO', 'DEFERIDO', 'FERIAS'];
            const pendingVals = ['PENDENTE', 'AGUARDANDO', 'EM ANALISE', 'AGUARDANDO APROVACAO'];
            if (statusFilter === 'APROVADO') {
                query.STATUS_SIT = { $in: approvedVals };
            } else if (statusFilter === 'PENDENTE') {
                query.STATUS_SIT = { $in: pendingVals };
            } else if (statusFilter === 'REJEITADO') {
                query.STATUS_SIT = { $in: ['REJEITADO', 'CANCELADO'] };
            }
        }

        const ferias = await SituacaoServidor.find(query)
            .sort({ INICIO_FERIAS_SIT: -1 })
            .limit(500)
            .lean();

        // Get unique server IDs from records
        const serverIds = [...new Set(ferias.map(f => f.IDFK_SERV))];
        const serverIdsMixed = [
            ...serverIds.map(String),
            ...serverIds.map(id => !isNaN(Number(id)) ? Number(id) : id)
        ];

        // Fetch server details
        const Servidor = require('../models/Servidor');
        let serverQuery = { IDPK_SERV: { $in: serverIdsMixed } };
        const servidores = await Servidor.find(serverQuery)
            .select('IDPK_SERV NOME_SERV MATRICULA_SERV CARGO_EFETIVO_SERV SETOR_LOTACAO_SERV ATIVO_SERV')
            .lean();

        // Map server info to a lookup object
        const serverMap = {};
        servidores.forEach(s => {
            serverMap[s.IDPK_SERV] = s;
        });

        // Combine data
        let reportData = ferias.reduce((acc, f) => {
            const server = serverMap[f.IDFK_SERV];
            if (!server) return acc;

            // Optional setor filter (applied here since it's a server field)
            const serverSetor = (server.SETOR_LOTACAO_SERV || '').toUpperCase();
            if (setorFilter && !serverSetor.includes(setorFilter.toUpperCase())) return acc;

            acc.push({
                ...f,
                NOME_SERV: server.NOME_SERV || 'Desconhecido',
                MATRICULA_SERV: server.MATRICULA_SERV || '',
                CARGO_SERV: server.CARGO_EFETIVO_SERV || '',
                SETOR_SERV: server.SETOR_LOTACAO_SERV || '',
                ATIVO_SERV: server.ATIVO_SERV || ''
            });
            return acc;
        }, []);

        // Sort by start date descending
        reportData.sort((a, b) => {
            const dateA = new Date(a.INICIO_FERIAS_SIT);
            const dateB = new Date(b.INICIO_FERIAS_SIT);
            return dateB - dateA;
        });

        res.json({ data: reportData, year, total: reportData.length });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/ferias
// @desc    Get ferias data
// @access  Public
router.get('/ferias', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { status, month } = req.query;

        let query = {
            $or: [
                { ASSUNTO_SIT: 'Férias' },
                { ASSUNTO_SIT: /f[eé]rias/i }
            ]
        };

        if (status) {
            // Filter by status (A Vencer, Vencida, Em Aberto)
            // This requires complex logic comparing dates.
            // For simplicity, let's assume status is passed or we filter in memory if dataset is small.
            // But for pagination, we should filter in DB.
            // Let's implement basic date filtering if needed.
        }

        if (month) {
            const monthInt = parseInt(month);
            if (!isNaN(monthInt)) {
                query.$expr = { $eq: [{ $month: "$INICIO_FERIAS_SIT" }, monthInt] };
            }
        }

        const ferias = await SituacaoServidor.find(query)
            .sort({ INICIO_FERIAS_SIT: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Enrich with Servidor name
        const enrichedFerias = await Promise.all(ferias.map(async (f) => {
            const fIdStr = String(f.IDFK_SERV);
            const fIdNum = !isNaN(Number(f.IDFK_SERV)) ? Number(f.IDFK_SERV) : f.IDFK_SERV;
            const servidor = await Servidor.findOne({ IDPK_SERV: { $in: [fIdStr, fIdNum] } }).select('-ANEXOS');
            return { ...f, servidor };
        }));

        const total = await SituacaoServidor.countDocuments(query);

        res.json({
            ferias: enrichedFerias,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalFerias: total
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get Afastamentos (Leaves)
router.get('/afastamentos', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { status, month, type } = req.query;

        let query = { ASSUNTO_SIT: { $ne: 'FÃ©rias' } };

        if (status) {
            query.STATUS_SIT = { $regex: new RegExp(`^${status}$`, 'i') };
        }

        if (month) {
            const monthInt = parseInt(month);
            if (!isNaN(monthInt)) {
                query.$expr = { $eq: [{ $month: "$INICIO_FERIAS_SIT" }, monthInt] };
            }
        }

        if (type) {
            query.ASSUNTO_SIT = { $regex: new RegExp(type, 'i') };
        }

        const afastamentos = await SituacaoServidor.find(query)
            .sort({ INICIO_FERIAS_SIT: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Enrich with Servidor name
        const enrichedAfastamentos = await Promise.all(afastamentos.map(async (a) => {
            const servidor = await Servidor.findOne({ IDPK_SERV: a.IDFK_SERV }).select('NOME_SERV MATRICULA_SERV SETOR_LOTACAO_SERV');
            return { ...a, servidor };
        }));

        const total = await SituacaoServidor.countDocuments(query);

        res.json({
            afastamentos: enrichedAfastamentos,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalAfastamentos: total
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/afastamentos
// @desc    Create new vacation or leave request (Supports single or multiple periods)
// @access  Public
router.post('/afastamentos', async (req, res) => {
    try {
        const { servidorId, tipo, inicio, fim, periodos, observacao } = req.body;

        // Validation
        if (!servidorId || !tipo) {
            return res.status(400).json({ msg: 'Por favor, preencha servidor e tipo.' });
        }

        // Determine periods to process
        let periodsToProcess = [];
        if (periodos && Array.isArray(periodos) && periodos.length > 0) {
            periodsToProcess = periodos;
        } else if (inicio && fim) {
            periodsToProcess = [{ inicio, fim }];
        } else {
            return res.status(400).json({ msg: 'Por favor, informe o período (início e fim) ou lista de períodos.' });
        }

        let serv = await Servidor.findById(servidorId);
        if (!serv) serv = await Servidor.findOne({ IDPK_SERV: servidorId });

        if (!serv) {
            return res.status(404).json({ msg: 'Servidor não encontrado.' });
        }

        const createdAfastamentos = [];
        const observationLogs = [];

        // Efficiently find max numeric IDPK_SIT to prevent duplicates and string-sort bugs
        const maxSitAggr = await SituacaoServidor.aggregate([
            { $addFields: { numericId: { $convert: { input: "$IDPK_SIT", to: "int", onError: 0, onNull: 0 } } } },
            { $group: { _id: null, maxId: { $max: "$numericId" } } }
        ]);
        let currentMaxId = (maxSitAggr.length > 0 && maxSitAggr[0].maxId != null) ? maxSitAggr[0].maxId : 0;

        for (const p of periodsToProcess) {
            if (!p.inicio || !p.fim) continue;

            currentMaxId++;
            const newId = String(currentMaxId);

            const newAfastamento = new SituacaoServidor({
                IDPK_SIT: newId,
                IDFK_SERV: serv.IDPK_SERV,
                ASSUNTO_SIT: tipo,
                INICIO_FERIAS_SIT: new Date(p.inicio),
                FIM_FERIAS_SIT: new Date(p.fim),
                STATUS_SIT: 'Aguardando Aprovação', // Default
                OBSERVACOES_SIT: observacao,
                DATA_APRESENTACAO_SIT: new Date()
            });

            await newAfastamento.save();
            createdAfastamentos.push(newAfastamento);
            observationLogs.push(`${p.inicio} a ${p.fim}`);
        }

        if (serv.OBSERVACOES) {
            const obsContent = `Solicitação de ${tipo} criada. Períodos: ${observationLogs.join(', ')}.`;
            serv.OBSERVACOES.push({
                conteudo: obsContent,
                categoria: 'Sistema',
                data: new Date(),
                autor: 'Sistema'
            });
            await serv.save();
        }

        // Return created records (or the first one for backward compatibility if client expects single object)
        res.json(createdAfastamentos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/afastamentos/:id
// @desc    Get single leave request by ID
// @access  Public
router.get('/afastamentos/:id', async (req, res) => {
    try {
        const id = req.params.id;

        let conditions = [{ IDPK_SIT: id }];

        // Only query by _id if it's a valid ObjectId to avoid CastError
        if (mongoose.Types.ObjectId.isValid(id)) {
            conditions.push({ _id: id });
        }

        // Also try as number if it looks like one (for legacy data)
        if (!isNaN(id)) {
            conditions.push({ IDPK_SIT: parseInt(id) });
        }

        let afastamento = await SituacaoServidor.findOne({
            $or: conditions
        }).lean();

        if (!afastamento) {
            return res.status(404).json({ msg: 'Afastamento nÃ£o encontrado' });
        }

        const servidor = await Servidor.findOne({ IDPK_SERV: afastamento.IDFK_SERV }).select('NOME_SERV MATRICULA_SERV SETOR_LOTACAO_SERV');
        afastamento.servidor = servidor;

        res.json(afastamento);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/afastamentos/:id
// @desc    Update leave request (Approve/Reject/Edit)
// @access  Public
router.put('/afastamentos/:id', async (req, res) => {
    try {
        const { inicio, fim, obs, status, tipo } = req.body;
        const afastamentoId = req.params.id;

        // Build update object
        const updateFields = {};
        if (inicio) updateFields.INICIO_FERIAS_SIT = new Date(inicio);
        if (fim) updateFields.FIM_FERIAS_SIT = new Date(fim);
        if (obs) updateFields.OBS_SIT = obs;
        if (status) updateFields.STATUS_SIT = status;
        if (tipo) updateFields.ASSUNTO_SIT = tipo;

        // Find and update
        let afastamento = await SituacaoServidor.findOneAndUpdate(
            { IDPK_SIT: afastamentoId },
            { $set: updateFields },
            { new: true }
        );

        if (!afastamento) {
            // Try finding by _id if IDPK_SIT failed
            if (afastamentoId.match(/^[0-9a-fA-F]{24}$/)) {
                afastamento = await SituacaoServidor.findByIdAndUpdate(
                    afastamentoId,
                    { $set: updateFields },
                    { new: true }
                );
            }
        }

        if (!afastamento) {
            return res.status(404).json({ msg: 'Afastamento nÃ£o encontrado' });
        }

        // If status changed to 'Aprovado', update Servidor status
        if (status === 'Aprovado') {
            const today = new Date();
            const inicioDate = new Date(afastamento.INICIO_FERIAS_SIT);
            const fimDate = new Date(afastamento.FIM_FERIAS_SIT);

            if (inicioDate <= today && fimDate >= today) {
                await Servidor.findOneAndUpdate(
                    { IDPK_SERV: afastamento.IDFK_SERV },
                    { $set: { ATIVO_SERV: 'AFASTADO' } }
                );
            }
        }

        // Log to Server Profile
        await logObservation(afastamento.IDFK_SERV, `SolicitaÃ§Ã£o de ${afastamento.ASSUNTO_SIT} atualizada para: ${status || 'Editado'}`, 'Afastamento');

        res.json(afastamento);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/afastamentos/:id
// @desc    Delete leave request
// @access  Public
router.delete('/afastamentos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        let query = { IDPK_SIT: id };

        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { $or: [{ IDPK_SIT: id }, { _id: id }] };
        } else if (!isNaN(id)) {
            query = { IDPK_SIT: parseInt(id) };
        } else {
            // If neither valid objectId nor number, try as _id only if it looks like one, or fail
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                query = { _id: id };
            }
        }

        const afastamento = await SituacaoServidor.findOneAndDelete(query);

        if (!afastamento) {
            return res.status(404).json({ msg: 'Afastamento não encontrado' });
        }

        // Log deletion
        await logObservation(afastamento.IDFK_SERV, `Solicitação de ${afastamento.ASSUNTO_SIT} excluída.`, 'Afastamento');

        res.json({ msg: 'Afastamento excluído' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Removed duplicate POST /api/afastamentos (Legacy version)


// @route   GET api/dashboard-old
// @desc    Get dashboard statistics (Legacy, disabled)
// @access  Public
router.get('/dashboard-old', async (req, res) => {
    try {
        // Database check handled by Mongoose buffering or global middleware if needed.

        const today = new Date();
        const currentMonth = today.getMonth() + 1;

        // 1. Active Servidores
        const activeServidores = await Servidor.countDocuments({
            ATIVO_SERV: { $in: ['SIM', 'ATIVO'] }
        });

        // 2. Aniversariantes (Current Month) - Active Only
        const aniversariantesCount = await Servidor.countDocuments({
            ATIVO_SERV: { $in: ['SIM', 'ATIVO'] },
            $expr: { $eq: [{ $month: "$NASCIMENTO_SERV" }, currentMonth] }
        });

        // 3. Pendencias (Pending Leave Requests)
        const pendencias = await SituacaoServidor.countDocuments({
            STATUS_SIT: 'Pendente'
        });

        // 4. Ferias (Currently on Vacation)
        // Logic: Start date <= today AND End date >= today AND Type = 'Férias'
        const ferias = await SituacaoServidor.countDocuments({
            ASSUNTO_SIT: { $regex: /f[ée]rias/i }, // Regex for safety
            INICIO_FERIAS_SIT: { $lte: today },
            FIM_FERIAS_SIT: { $gte: today }
        });

        // 5. Vinculos Distribution (Inferred from Cargo fields) - Active Only
        const vinculosAggregation = await Servidor.aggregate([
            {
                $match: {
                    ATIVO_SERV: { $in: ['SIM', 'ATIVO'] }
                }
            },
            {
                $project: {
                    vinculo: {
                        $cond: {
                            if: {
                                $and: [
                                    { $ne: ["$CARGO_EFETIVO_SERV", null] },
                                    { $ne: ["$CARGO_EFETIVO_SERV", ""] }
                                ]
                            },
                            then: "EFETIVO",
                            else: {
                                $cond: {
                                    if: { $eq: ["$SERVICO_PRESTADO_SERV", "SIM"] },
                                    then: "SERVIÇOS PRESTADOS",
                                    else: {
                                        $cond: {
                                            if: {
                                                $and: [
                                                    { $ne: ["$CARGO_COMISSIONADO_SERV", null] },
                                                    { $ne: ["$CARGO_COMISSIONADO_SERV", ""] }
                                                ]
                                            },
                                            then: "COMISSIONADO",
                                            else: "CONTRATADO"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$vinculo",
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('Dashboard Vinculos Aggregation:', JSON.stringify(vinculosAggregation, null, 2));

        let efetivos = 0;
        let comissionados = 0;
        let contratados = 0;
        let outros = 0;

        vinculosAggregation.forEach(v => {
            const type = v._id;
            if (type === 'EFETIVO') {
                efetivos = v.count;
            } else if (type === 'COMISSIONADO') {
                comissionados = v.count;
            } else if (type === 'CONTRATADO') {
                contratados = v.count;
            } else {
                outros += v.count;
            }
        });

        // 5. Recent Activity (Last 5 modified profiles)
        // Aggregating from OBSERVACOES to find the last 5 UNIQUE servers modified by users (not just system)
        const recentActivity = await Servidor.aggregate([
            { $unwind: "$OBSERVACOES" },
            { $sort: { "OBSERVACOES.data": -1 } },
            {
                $group: {
                    _id: "$_id",
                    IDPK_SERV: { $first: "$IDPK_SERV" },
                    NOME_SERV: { $first: "$NOME_SERV" },
                    MATRICULA_SERV: { $first: "$MATRICULA_SERV" },
                    updatedAt: { $first: "$OBSERVACOES.data" },
                    action: { $first: "$OBSERVACOES.categoria" },
                    autor: { $first: "$OBSERVACOES.autor" }
                }
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            activeServidores,
            aniversariantesCount,
            pendencias,
            ferias,
            vinculos: {
                efetivos,
                comissionados,
                contratados,
                outros
            },
            recentActivity
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/afastamentos/:id
// @desc    Get single leave request by ID
// @access  Public
router.get('/afastamentos/:id', async (req, res) => {
    try {
        const id = req.params.id;

        let conditions = [{ IDPK_SIT: id }];

        // Only query by _id if it's a valid ObjectId to avoid CastError
        if (mongoose.Types.ObjectId.isValid(id)) {
            conditions.push({ _id: id });
        }

        // Also try as number if it looks like one (for legacy data)
        if (!isNaN(id)) {
            conditions.push({ IDPK_SIT: parseInt(id) });
        }

        let afastamento = await SituacaoServidor.findOne({
            $or: conditions
        }).lean();

        if (!afastamento) {
            return res.status(404).json({ msg: 'Afastamento nÃ£o encontrado' });
        }

        const servidor = await Servidor.findOne({ IDPK_SERV: afastamento.IDFK_SERV }).select('NOME_SERV MATRICULA_SERV SETOR_LOTACAO_SERV');
        afastamento.servidor = servidor;

        res.json(afastamento);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/afastamentos/:id
// @desc    Update leave request (Approve/Reject/Edit)
// @access  Public
router.put('/afastamentos/:id', async (req, res) => {
    try {
        const { inicio, fim, obs, status, tipo } = req.body;
        const afastamentoId = req.params.id;

        // Build update object
        const updateFields = {};
        if (inicio) updateFields.INICIO_FERIAS_SIT = new Date(inicio);
        if (fim) updateFields.FIM_FERIAS_SIT = new Date(fim);
        if (obs) updateFields.OBS_SIT = obs;
        if (status) updateFields.STATUS_SIT = status;
        if (tipo) updateFields.ASSUNTO_SIT = tipo;

        // Find and update
        let afastamento = await SituacaoServidor.findOneAndUpdate(
            { IDPK_SIT: afastamentoId },
            { $set: updateFields },
            { new: true }
        );

        if (!afastamento) {
            // Try finding by _id if IDPK_SIT failed
            if (afastamentoId.match(/^[0-9a-fA-F]{24}$/)) {
                afastamento = await SituacaoServidor.findByIdAndUpdate(
                    afastamentoId,
                    { $set: updateFields },
                    { new: true }
                );
            }
        }

        if (!afastamento) {
            return res.status(404).json({ msg: 'Afastamento nÃ£o encontrado' });
        }

        // If status changed to 'Aprovado', update Servidor status
        if (status === 'Aprovado') {
            const today = new Date();
            const inicioDate = new Date(afastamento.INICIO_FERIAS_SIT);
            const fimDate = new Date(afastamento.FIM_FERIAS_SIT);

            if (inicioDate <= today && fimDate >= today) {
                await Servidor.findOneAndUpdate(
                    { IDPK_SERV: afastamento.IDFK_SERV },
                    { $set: { ATIVO_SERV: 'AFASTADO' } }
                );
            }
        }

        res.json(afastamento);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Removed another duplicate POST /api/afastamentos (Legacy version)

// @route   GET api/dashboard
// @desc    Get dashboard statistics
// @access  Public
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;

        // Execute all heavy counts in parallel using a massive $facet pipeline for Servidor
        // and Promise.all for independent SituacaoServidor queries.
        const [servidorStats, pendencias, ferias] = await Promise.all([
            Servidor.aggregate([
                { $match: { ATIVO_SERV: { $in: ['SIM', 'ATIVO', 'Sim', 'Ativo'] } } },
                {
                    $facet: {
                        active: [{ $count: "count" }],
                        aniversarios: [{ $match: { $expr: { $eq: [{ $month: "$NASCIMENTO_SERV" }, currentMonth] } } }, { $count: "count" }],
                        sp: [{ $match: { $or: [{ VINCULO_SERV: { $in: ['Serviços Prestados', 'SERVIÇOS PRESTADOS', 'Servicos Prestados', 'SERVICOS PRESTADOS'] } }, { SERVICO_PRESTADO_SERV: 'SIM' }] } }, { $count: "count" }],
                        comiss: [{ $match: { VINCULO_SERV: { $nin: ['Serviços Prestados', 'SERVIÇOS PRESTADOS', 'Servicos Prestados', 'SERVICOS PRESTADOS'] }, SERVICO_PRESTADO_SERV: { $ne: 'SIM' }, $or: [{ VINCULO_SERV: { $in: ['Comissionado', 'COMISSIONADO'] } }, { CARGO_COMISSIONADO_SERV: { $nin: [null, ''] } }] } }, { $count: "count" }],
                        efet: [{ $match: { VINCULO_SERV: { $nin: ['Serviços Prestados', 'SERVIÇOS PRESTADOS', 'Servicos Prestados', 'SERVICOS PRESTADOS', 'Comissionado', 'COMISSIONADO'] }, SERVICO_PRESTADO_SERV: { $ne: 'SIM' }, CARGO_COMISSIONADO_SERV: { $in: [null, ''] }, $or: [{ VINCULO_SERV: { $in: ['Efetivo', 'EFETIVO'] } }, { CARGO_EFETIVO_SERV: { $nin: [null, ''] } }] } }, { $count: "count" }],
                        contr: [{ $match: { VINCULO_SERV: { $in: ['Contratado', 'CONTRATADO'] } } }, { $count: "count" }],
                        total: [{ $count: "count" }]
                    }
                }
            ]),
            SituacaoServidor.countDocuments({
                STATUS_SIT: { $in: ['Pendente', 'Em Análise', 'Aguardando', 'Aguardando Aprovação', 'PENDENTE', 'Aguardando aprovação'] }
            }),
            SituacaoServidor.countDocuments({
                ASSUNTO_SIT: { $regex: /férias/i },
                INICIO_FERIAS_SIT: { $lte: today },
                FIM_FERIAS_SIT: { $gte: today }
            })
        ]);

        const getCount = (facetArray) => facetArray.length > 0 ? facetArray[0].count : 0;
        const dataStats = servidorStats[0];

        const activeServidores = getCount(dataStats.active);
        const aniversariantesCount = getCount(dataStats.aniversarios);
        const servicosPrestados = getCount(dataStats.sp);
        const comissionados = getCount(dataStats.comiss);
        const efetivos = getCount(dataStats.efet);
        const contratados = getCount(dataStats.contr);
        const totalRaw = getCount(dataStats.total);

        // Ensure outros isn't negative from unexpected edge-case overlap
        let outros = totalRaw - (efetivos + comissionados + contratados + servicosPrestados);
        if (outros < 0) outros = 0;

        console.log("DASHBOARD_VINCULOS_DEBUG:", {
            efetivos,
            comissionados,
            contratados,
            servicosPrestados,
            outros,
            activeCountReal: activeServidores
        });

        // 6. Recent Activity (Last 5 modified profiles)
        // Aggregating from OBSERVACOES to find the last 5 UNIQUE servers modified by users (not just system)
        const recentActivity = await Servidor.aggregate([
            { $unwind: "$OBSERVACOES" },
            { $sort: { "OBSERVACOES.data": -1 } },
            {
                $group: {
                    _id: "$_id",
                    IDPK_SERV: { $first: "$IDPK_SERV" },
                    NOME_SERV: { $first: "$NOME_SERV" },
                    MATRICULA_SERV: { $first: "$MATRICULA_SERV" },
                    updatedAt: { $first: "$OBSERVACOES.data" },
                    action: { $first: "$OBSERVACOES.categoria" },
                    autor: { $first: "$OBSERVACOES.autor" }
                }
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            activeServidores,
            aniversariantesCount,
            pendencias,
            ferias,
            vinculos: {
                efetivos,
                comissionados,
                contratados,
                servicosPrestados,
                outros
            },
            recentActivity
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/dashboard/history
// @desc    Get paginated history of server modifications
// @access  Public
router.get('/dashboard/history', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const aggregationPipeline = [
            { $unwind: "$OBSERVACOES" },
            { $sort: { "OBSERVACOES.data": -1 } },
            {
                $group: {
                    _id: "$_id",
                    IDPK_SERV: { $first: "$IDPK_SERV" },
                    NOME_SERV: { $first: "$NOME_SERV" },
                    MATRICULA_SERV: { $first: "$MATRICULA_SERV" },
                    updatedAt: { $first: "$OBSERVACOES.data" },
                    action: { $first: "$OBSERVACOES.categoria" },
                    autor: { $first: "$OBSERVACOES.autor" }
                }
            },
            { $sort: { updatedAt: -1 } }
        ];

        const [result] = await Servidor.aggregate([
            ...aggregationPipeline,
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [{ $skip: skip }, { $limit: limit }]
                }
            }
        ]);

        const history = result.data;
        const total = result.metadata[0] ? result.metadata[0].total : 0;

        res.json({
            history,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- Calendario Routes ---
const Calendario = require('../models/Calendario');

// GET /calendario
router.get('/calendario', auth, async (req, res) => {
    try {
        const events = await Calendario.find().sort({ data: 1 });
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// POST /calendario
router.post('/calendario', auth, async (req, res) => {
    try {
        const { data, dataFim, tipo, descricao, global, servidores } = req.body;
        // Normalize date to avoid timezone issues
        const normalizedDate = new Date(data);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        let endDate = null;
        if (dataFim) {
            endDate = new Date(dataFim);
            endDate.setUTCHours(23, 59, 59, 999);
        }

        // We removed the overlap check because multiple isolated 'RECESSO' blocks could run on the same date for different servers.
        const event = new Calendario({
            data: normalizedDate,
            dataFim: endDate,
            tipo,
            descricao,
            global: global !== undefined ? global : true,
            servidores: servidores || []
        });

        await event.save();
        res.json(event);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// DELETE /calendario/:id
router.delete('/calendario/:id', auth, async (req, res) => {
    try {
        await Calendario.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Evento removido' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/servidores/:id
// @desc    Delete servidor
// @access  Private
router.delete('/servidores/:id', auth, async (req, res) => {
    try {
        let servidor;
        const id = req.params.id;

        if (mongoose.Types.ObjectId.isValid(id)) {
            servidor = await Servidor.findById(id);
        }
        if (!servidor) {
            servidor = await Servidor.findOne({ IDPK_SERV: id });
        }

        if (!servidor) {
            return res.status(404).json({ msg: 'Servidor not found' });
        }

        await Servidor.findByIdAndDelete(servidor._id);
        res.json({ msg: 'Servidor removido com sucesso' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
