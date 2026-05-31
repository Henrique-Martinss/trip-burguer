/* ============================================================
   TRIP BURGUER — Sistema de Horários de Funcionamento
   ============================================================ */

// Horários de funcionamento automáticos
const HORARIOS_FUNCIONAMENTO = {
    // Dia da semana: 0 = domingo, 1 = segunda, ..., 6 = sábado
    0: { // DOMINGO
        periodos: [
            { inicio: 11, inicioMin: 0, fim: 14, fimMin: 0 },    // 11h-14h
            { inicio: 18, inicioMin: 30, fim: 23, fimMin: 30 }    // 18h30-23h30
        ]
    },
    1: { // SEGUNDA
        periodos: [
            { inicio: 11, inicioMin: 0, fim: 14, fimMin: 0 },    // 11h-14h
            { inicio: 18, inicioMin: 30, fim: 23, fimMin: 30 }    // 18h30-23h30
        ]
    },
    2: { // TERÇA
        periodos: [
            { inicio: 11, inicioMin: 0, fim: 14, fimMin: 0 },    // 11h-14h
            { inicio: 18, inicioMin: 30, fim: 23, fimMin: 30 }    // 18h30-23h30
        ]
    },
    3: { // QUARTA
        periodos: [
            { inicio: 11, inicioMin: 0, fim: 14, fimMin: 0 },    // 11h-14h
            { inicio: 18, inicioMin: 30, fim: 23, fimMin: 30 }    // 18h30-23h30
        ]
    },
    4: { // QUINTA
        periodos: [
            { inicio: 11, inicioMin: 0, fim: 14, fimMin: 0 },    // 11h-14h
            { inicio: 18, inicioMin: 30, fim: 23, fimMin: 30 }    // 18h30-23h30
        ]
    },
    5: { // SEXTA
        periodos: [
            { inicio: 11, inicioMin: 0, fim: 14, fimMin: 0 },    // 11h-14h
            { inicio: 20, inicioMin: 0, fim: 4, fimMin: 0 }       // 20h-04h
        ]
    },
    6: { // SÁBADO
        periodos: [
            { inicio: 20, inicioMin: 0, fim: 4, fimMin: 0 }       // 20h-04h
        ]
    }
};

/**
 * Verifica se a loja está aberta no horário atual
 * @returns {Object} { aberto: boolean, periodo: string }
 */
function verificarSeAberto() {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const hora = agora.getHours();
    const minutos = agora.getMinutes();

    const horarioDia = HORARIOS_FUNCIONAMENTO[diaSemana];

    if (!horarioDia || horarioDia.periodos.length === 0) {
        return {
            aberto: false,
            periodo: 'Fechado'
        };
    }

    // Comparar com cada período
    for (let periodo of horarioDia.periodos) {
        const inicioEmMinutos = periodo.inicio * 60 + periodo.inicioMin;
        const fimEmMinutos = periodo.fim * 60 + periodo.fimMin;
        const agoraEmMinutos = hora * 60 + minutos;

        // Se é de madrugada (ex: 20h-04h), precisamos considerar que pode passar da meia-noite
        if (periodo.fim < periodo.inicio) {
            // Período que passa da meia-noite
            if (agoraEmMinutos >= inicioEmMinutos || agoraEmMinutos < fimEmMinutos) {
                return {
                    aberto: true,
                    periodo: `${String(periodo.inicio).padStart(2, '0')}:${String(periodo.inicioMin).padStart(2, '0')} - ${String(periodo.fim).padStart(2, '0')}:${String(periodo.fimMin).padStart(2, '0')}`
                };
            }
        } else {
            // Período normal (mesmo dia)
            if (agoraEmMinutos >= inicioEmMinutos && agoraEmMinutos < fimEmMinutos) {
                return {
                    aberto: true,
                    periodo: `${String(periodo.inicio).padStart(2, '0')}:${String(periodo.inicioMin).padStart(2, '0')} - ${String(periodo.fim).padStart(2, '0')}:${String(periodo.fimMin).padStart(2, '0')}`
                };
            }
        }
    }

    return {
        aberto: false,
        periodo: 'Fechado'
    };
}

/**
 * Obter próximo horário de abertura
 * @returns {string}
 */
function obterProximoHorarioAbertura() {
    const agora = new Date();
    const diaSemana = agora.getDay();
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    for (let i = 0; i < 7; i++) {
        const diaVerificacao = (diaSemana + i) % 7;
        const horarioDia = HORARIOS_FUNCIONAMENTO[diaVerificacao];

        if (horarioDia && horarioDia.periodos.length > 0) {
            const primeiroPeridio = horarioDia.periodos[0];
            const nomedia = diasSemana[diaVerificacao];
            const hora = String(primeiroPeridio.inicio).padStart(2, '0');
            const min = String(primeiroPeridio.inicioMin).padStart(2, '0');

            if (i === 0) {
                return `Hoje às ${hora}:${min}`;
            } else if (i === 1) {
                return `Amanhã às ${hora}:${min}`;
            } else {
                return `${nomedia} às ${hora}:${min}`;
            }
        }
    }

    return 'Próximo horário não disponível';
}

/**
 * Formatar horários do dia para exibição
 * @param {number} dia - Dia da semana (0-6)
 * @returns {string}
 */
function formatarHorariosDia(dia) {
    const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const horarioDia = HORARIOS_FUNCIONAMENTO[dia];

    if (!horarioDia || horarioDia.periodos.length === 0) {
        return `${nomesDias[dia]}: Fechado`;
    }

    const periodos = horarioDia.periodos.map(p => {
        const inicio = `${String(p.inicio).padStart(2, '0')}:${String(p.inicioMin).padStart(2, '0')}`;
        const fim = `${String(p.fim).padStart(2, '0')}:${String(p.fimMin).padStart(2, '0')}`;
        return `${inicio} - ${fim}`;
    }).join(' | ');

    return `${nomesDias[dia]}: ${periodos}`;
}
