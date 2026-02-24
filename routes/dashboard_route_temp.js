
// @route   GET api/dashboard
// @desc    Get dashboard statistics
// @access  Public (should be Private in prod)
router.get('/dashboard', async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // 1. Active Servidores (Excluding those on vacation/leave is tricky if status is dynamic, 
        // using base ATIVO_SERV for now, but could refine)
        const activeServidores = await Servidor.countDocuments({
            $or: [{ ATIVO_SERV: 'SIM' }, { ATIVO_SERV: 'ATIVO' }]
        });

        // 2. Aniversariantes (Match month)
        // Using aggregation for month matching
        const aniversariantesCount = await Servidor.countDocuments({
            $expr: { $eq: [{ $month: "$NASCIMENTO_SERV" }, today.getMonth() + 1] }
        });

        // 3. Ferias (Currently on vacation)
        const ferias = await SituacaoServidor.countDocuments({
            ASSUNTO_SIT: 'Férias',
            INICIO_FERIAS_SIT: { $lte: today },
            FIM_FERIAS_SIT: { $gte: today }
        });

        // 4. Pendencias (Placeholder - e.g. missing critical fields)
        // Example: Missing CPF or Birth Date
        const pendencias = await Servidor.countDocuments({
            $or: [
                { CPF_SERV: { $exists: false } },
                { CPF_SERV: '' },
                { NASCIMENTO_SERV: null }
            ]
        });

        // 5. Vinculos Distribution for Doughnut Chart
        const vinculosStats = await Servidor.aggregate([
            {
                $group: {
                    _id: "$VINCULO_SERV",
                    count: { $sum: 1 }
                }
            }
        ]);

        const vinculos = {
            efetivos: 0,
            comissionados: 0,
            contratados: 0,
            outros: 0
        };

        vinculosStats.forEach(stat => {
            const type = stat._id ? stat._id.toUpperCase() : 'OUTROS';
            if (type.includes('EFETIVO') || type.includes('ESTATUTÁRIO')) vinculos.efetivos += stat.count;
            else if (type.includes('COMISSIONADO')) vinculos.comissionados += stat.count;
            else if (type.includes('CONTRATADO') || type.includes('TEMPORÁRIO')) vinculos.contratados += stat.count;
            else vinculos.outros += stat.count;
        });

        // 6. Recent Activity (Latest Updated Servers)
        const recentActivity = await Servidor.find()
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('NOME_SERV MATRICULA_SERV updatedAt ATIVO_SERV');

        res.json({
            activeServidores,
            aniversariantesCount,
            pendencias,
            ferias,
            vinculos,
            recentActivity
        });

    } catch (err) {
        console.error('Dashboard Error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
