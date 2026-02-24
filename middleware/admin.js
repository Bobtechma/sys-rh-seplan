const Usuario = require('../models/Usuario');

module.exports = async function (req, res, next) {
    try {
        const user = await Usuario.findById(req.user.id);

        if ((user.perfil && user.perfil.toLowerCase() !== 'admin') &&
            (user.cargo && user.cargo.toLowerCase() !== 'admin')) {
            return res.status(403).json({
                msg: 'Access denied. Admin only.',
                debug: { perfil: user.perfil, cargo: user.cargo }
            });
        }

        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
