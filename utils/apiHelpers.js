const mongoose = require('mongoose');
const Servidor = require('../models/Servidor');

/**
 * Helper to add observation to server
 */
async function logObservation(servidorId, conteudo, categoria = 'Sistema', autor = 'Sistema') {
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
                autor: autor
            });
            await serv.save();
        }
    } catch (e) {
        console.error('Error logging observation:', e);
    }
}

/**
 * Calculates vacation status for a server based on a 3-year window.
 */
function calculateVacationStatus(servidor, vacations) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const admissao = new Date(servidor.ADMISSAO_SERV);
    if (isNaN(admissao)) return null;

    const periods = [];
    let latestAqEnd = new Date(admissao);
    while (latestAqEnd <= today) {
        latestAqEnd.setFullYear(latestAqEnd.getFullYear() + 1);
    }

    let currentAqEnd = new Date(latestAqEnd);
    currentAqEnd.setFullYear(currentAqEnd.getFullYear() - 1);

    for (let i = 0; i < 3; i++) {
        let aqStart = new Date(currentAqEnd);
        aqStart.setFullYear(aqStart.getFullYear() - 1);

        if (aqStart < admissao) {
            if (aqStart < admissao && i > 0) break;
            if (aqStart < admissao) {
                if (periods.length > 0) break;
                aqStart = new Date(admissao);
            }
        }

        const concessionEnd = new Date(currentAqEnd);
        concessionEnd.setFullYear(concessionEnd.getFullYear() + 1);

        periods.push({
            start: new Date(aqStart),
            end: new Date(currentAqEnd),
            concessionEnd: new Date(concessionEnd),
            isVencido: today > concessionEnd,
            hasVacation: false
        });

        currentAqEnd = new Date(aqStart);
        if (currentAqEnd <= admissao) break;
    }

    const unmatchedVacations = [...vacations];

    for (const p of periods) {
        const paYear = p.end.getFullYear();
        const foundIndex = unmatchedVacations.findIndex(v =>
            v.PA_ANO1_SIT == paYear ||
            (v.INICIO_FERIAS_SIT && new Date(v.INICIO_FERIAS_SIT).getFullYear() === paYear)
        );

        if (foundIndex !== -1) {
            p.hasVacation = true;
            unmatchedVacations.splice(foundIndex, 1);
        }
    }

    for (const p of periods) {
        if (!p.hasVacation && unmatchedVacations.length > 0) {
            p.hasVacation = true;
            unmatchedVacations.shift();
        }
    }

    const unfulfilledVencidos = periods.filter(p => p.isVencido && !p.hasVacation);
    const unfulfilledAcquired = periods.filter(p => !p.isVencido && !p.hasVacation);

    return {
        vencidas: unfulfilledVencidos.length,
        atrasadasCount: unfulfilledVencidos.length + unfulfilledAcquired.length,
        oldestVencida: unfulfilledVencidos.length > 0 ? unfulfilledVencidos[unfulfilledVencidos.length - 1] : null,
        isAtrasado: (unfulfilledVencidos.length + unfulfilledAcquired.length) >= 2,
        periods: periods
    };
}

/**
 * Helper to format field values for display in change logs
 */
const fmtVal = (val, isDate) => {
    if (val === null || val === undefined || val === '') return '(vazio)';
    if (isDate) {
        const d = new Date(val);
        return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
    if (val === true || val === 'true') return 'Sim';
    if (val === false || val === 'false') return 'Não';
    return String(val);
};

/**
 * Normalizes strings for comparison (removes accents, uppercase)
 */
const normalizeStr = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

/**
 * Formats a date to DD/MM/YYYY
 */
const formatShortDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

/**
 * Helper function to build Servidor filter query for Ferias & Afastamentos
 */
async function applyServidorFilters(reqQuery, baseQuery) {
    const { search, setor, cargo, vinculo, birthMonth } = reqQuery;
    if (!search && !setor && !cargo && !vinculo && !birthMonth && !reqQuery.status_servidor) {
        return baseQuery;
    }

    let servQuery = {};
    if (search) {
        servQuery.$or = [
            { NOME_SERV: { $regex: search, $options: 'i' } },
            { MATRICULA_SERV: { $regex: search, $options: 'i' } }
        ];
    }
    if (setor) servQuery.SETOR_LOTACAO_SERV = { $regex: setor, $options: 'i' };
    if (cargo) {
        servQuery.$or = [
            { CARGO_EFETIVO_SERV: cargo },
            { CARGO_COMISSIONADO_SERV: cargo },
            { FUNCAO_SP_SERV: cargo }
        ];
    }
    if (vinculo) {
        const v = vinculo.toUpperCase();
        if (v === 'EFETIVO') {
            servQuery.$and = [{ CARGO_EFETIVO_SERV: { $ne: null } }, { CARGO_EFETIVO_SERV: { $ne: '' } }];
        } else if (v === 'COMISSIONADO') {
            servQuery.$and = [{ CARGO_COMISSIONADO_SERV: { $ne: null } }, { CARGO_COMISSIONADO_SERV: { $ne: '' } }];
        } else if (v === 'SERVIÇOS PRESTADOS' || v === 'SERVICOS PRESTADOS') {
            servQuery.$or = [{ VINCULO_SERV: 'SERVIÇOS PRESTADOS' }, { SERVICO_PRESTADO_SERV: { $regex: /^sim$/i } }];
        } else if (v === 'CONTRATADO') {
            servQuery.$and = [{ CARGO_EFETIVO_SERV: { $in: [null, ''] } }, { CARGO_COMISSIONADO_SERV: { $in: [null, ''] } }, { SERVICO_PRESTADO_SERV: { $not: { $regex: /^sim$/i } } }];
        } else {
            servQuery.VINCULO_SERV = { $regex: vinculo, $options: 'i' };
        }
    }

    if (reqQuery.status_servidor) {
        if (reqQuery.status_servidor === 'ativo') {
            servQuery.ATIVO_SERV = { $regex: /^\s*(sim|ativo|ativa)\s*$/i };
            servQuery.CEDIDO_SERV = { $nin: ['true', 'SIM', 'Sim', true] };
            servQuery.VINCULO_SERV = { $not: /demitido|exonerado|inativo/i };
        } else if (reqQuery.status_servidor === 'inativo') {
            if (!servQuery.$and) servQuery.$and = [];
            servQuery.$and.push({
                $or: [
                    { ATIVO_SERV: { $not: /^\s*(sim|ativo|ativa)\s*$/i } },
                    { CEDIDO_SERV: { $in: ['true', 'SIM', 'Sim', true] } },
                    { VINCULO_SERV: { $regex: /demitido|exonerado|inativo/i } }
                ]
            });
        }
    }

    const matchedServidores = await Servidor.find(servQuery).select('IDPK_SERV').lean();
    const matchedIds = matchedServidores.map(s => s.IDPK_SERV);
    const matchedIdsNum = matchedIds.map(id => !isNaN(Number(id)) ? Number(id) : id);

    if (matchedIds.length === 0) {
        baseQuery.IDFK_SERV = { $in: ['_NOT_FOUND_'] };
    } else {
        baseQuery.IDFK_SERV = { $in: [...matchedIds, ...matchedIdsNum] };
    }

    return baseQuery;
}

module.exports = {
    logObservation,
    calculateVacationStatus,
    fmtVal,
    normalizeStr,
    formatShortDate,
    applyServidorFilters
};
