const AlunoRepository = require('../repositories/AlunoRepository');

class RelatorioController {
  constructor() {
    this.alunoRepo = new AlunoRepository();
    this.matriculasPorPeriodoECurso = this.matriculasPorPeriodoECurso.bind(this);
  }

  async matriculasPorPeriodoECurso(req, res, next) {
    try {
      const { periodo, curso } = req.query;
      const consolidado = await this.alunoRepo.relatorioMatriculas({ periodo, curso });
      const totalGeral = consolidado.reduce((acc, item) => acc + item.total_matriculas, 0);

      res.status(200).json({
        modulo: 'Sistema Acadêmico',
        filtros: { periodo: periodo || 'TODOS', curso: curso || 'TODOS' },
        total_geral: totalGeral,
        detalhamento: consolidado,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = RelatorioController;