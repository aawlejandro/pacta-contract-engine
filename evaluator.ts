/**
 * PACTA Contract Engine — Evaluador principal
 *
 * Ejecuta las reglas del contrato contra el estado actual y devuelve
 * resultados estructurados con notificaciones para cada parte.
 *
 * PRINCIPIO: Este archivo contiene lógica técnica.
 * Las reglas legales están en /rules/lau/*.yaml — auditables por abogados.
 *
 * AVISO LEGAL: Este motor aplica reglas objetivamente computables.
 * No constituye asesoramiento jurídico.
 */

import type {
  Contrato,
  ContratoEstado,
  ContextoEvaluacion,
  EvaluacionCompleta,
  FechaClave,
  Notificacion,
  ResultadoActualizacionRenta,
  ResultadoPlazoPreaviso,
} from "./types";

// =============================================================================
// Evaluador principal
// =============================================================================

export function evaluarContrato(
  contexto: ContextoEvaluacion
): EvaluacionCompleta {
  const { contrato, fecha_actual } = contexto;
  const hoy = new Date(fecha_actual);

  const resultados = [];
  const notificaciones_pendientes: Notificacion[] = [];
  const proximas_fechas_clave: FechaClave[] = [];

  // Evaluar actualización de renta
  const actualizacion = evaluarActualizacionRenta(contrato, hoy, contexto.indices);
  resultados.push(actualizacion);
  notificaciones_pendientes.push(...actualizacion.notificaciones);

  // Evaluar plazos de preaviso
  const preaviso = evaluarPlazoPreaviso(contrato, hoy);
  resultados.push(preaviso);
  notificaciones_pendientes.push(...preaviso.notificaciones);

  // Calcular próximas fechas clave
  proximas_fechas_clave.push(...calcularFechasClave(contrato, hoy));

  return {
    contrato_id: contrato.id,
    fecha_evaluacion: fecha_actual,
    estado_contrato: contrato.estado,
    resultados,
    notificaciones_pendientes,
    proximas_fechas_clave,
  };
}

// =============================================================================
// Regla: Actualización de renta (LAU Art. 18)
// =============================================================================

function evaluarActualizacionRenta(
  contrato: Contrato,
  hoy: Date,
  indices?: ContextoEvaluacion["indices"]
): ResultadoActualizacionRenta {
  const notificaciones: Notificacion[] = [];

  // Condición 1: Estado del contrato
  const estadosValidos: ContratoEstado[] = ["VIGENTE", "PRORROGA_OBLIGATORIA"];
  if (!estadosValidos.includes(contrato.estado)) {
    return {
      regla_id: "LAU_18_actualizacion_renta",
      aplicable: false,
      motivo_no_aplicable: `Estado del contrato (${contrato.estado}) no permite actualización de renta`,
      notificaciones: [],
    };
  }

  // Condición 2: ¿Es la fecha de aniversario?
  const fechaInicio = new Date(contrato.fecha_inicio);
  const esAniversario =
    hoy.getDate() === fechaInicio.getDate() &&
    hoy.getMonth() === fechaInicio.getMonth() &&
    hoy.getFullYear() > fechaInicio.getFullYear();

  if (!esAniversario) {
    // Calcular días hasta el próximo aniversario para notificación preventiva
    const diasHastaAniversario = calcularDiasHastaAniversario(hoy, fechaInicio);

    // Avisar 30 días antes (plazo mínimo de notificación al arrendatario)
    if (diasHastaAniversario <= 30 && diasHastaAniversario > 0) {
      notificaciones.push({
        nivel: "accion_requerida",
        mensaje: `Faltan ${diasHastaAniversario} días para el aniversario del contrato. Notifica al arrendatario la actualización de renta antes de la fecha límite.`,
        destinatario: "arrendador",
        plazo_dias: diasHastaAniversario,
        accion: "enviar_notificacion_actualizacion_renta",
        normativa_referencia: "LAU Art. 18",
      });
    }

    return {
      regla_id: "LAU_18_actualizacion_renta",
      aplicable: false,
      motivo_no_aplicable: "Hoy no es la fecha de aniversario del contrato",
      notificaciones,
    };
  }

  // Condición 3: ¿Ya se actualizó este año?
  if (contrato.fecha_ultima_actualizacion_renta) {
    const ultimaActualizacion = new Date(contrato.fecha_ultima_actualizacion_renta);
    const mesesDesdeUltima =
      (hoy.getFullYear() - ultimaActualizacion.getFullYear()) * 12 +
      (hoy.getMonth() - ultimaActualizacion.getMonth());

    if (mesesDesdeUltima < 12) {
      return {
        regla_id: "LAU_18_actualizacion_renta",
        aplicable: false,
        motivo_no_aplicable: "La renta ya fue actualizada en los últimos 12 meses",
        notificaciones: [],
      };
    }
  }

  // Sin datos de índices no podemos calcular
  if (!indices) {
    return {
      regla_id: "LAU_18_actualizacion_renta",
      aplicable: true,
      motivo_no_aplicable: "Datos de índice económico no disponibles — consultar INE",
      notificaciones: [{
        nivel: "aviso",
        mensaje: "No se pudieron obtener los datos del índice IRAV/IPC del INE. Verifica la conexión a datos públicos.",
        destinatario: "ambos",
        normativa_referencia: "LAU Art. 18",
      }],
    };
  }

  // Determinar índice aplicable según fecha del contrato
  const fechaCorteIRAV = new Date("2024-01-01");
  const fechaFirma = new Date(contrato.fecha_firma);
  const usarIRAV = fechaFirma >= fechaCorteIRAV;

  const variacionBase = usarIRAV
    ? (indices.irav_variacion_anual ?? 0)
    : (indices.ipc_variacion_anual ?? 0);

  // Aplicar límite zona tensionada
  const LIMITE_ZONA_TENSIONADA = 0.03;
  const limitado = contrato.inmueble.zona_tensionada && variacionBase > LIMITE_ZONA_TENSIONADA;
  const variacionAplicada = limitado ? LIMITE_ZONA_TENSIONADA : variacionBase;

  const nuevaRenta = Math.round(contrato.renta_actual * (1 + variacionAplicada) * 100) / 100;

  notificaciones.push({
    nivel: "accion_requerida",
    mensaje: `La renta actualiza hoy a ${nuevaRenta}€/mes (${(variacionAplicada * 100).toFixed(2)}% de incremento${limitado ? ", limitado por zona tensionada" : ""}).`,
    destinatario: "ambos",
    normativa_referencia: "LAU Art. 18",
  });

  return {
    regla_id: "LAU_18_actualizacion_renta",
    aplicable: true,
    renta_actual: contrato.renta_actual,
    nueva_renta: nuevaRenta,
    variacion_aplicada: variacionAplicada,
    indice_usado: usarIRAV ? "IRAV" : "IPC",
    limitado_por_zona_tensionada: limitado,
    fecha_efectiva: hoy.toISOString().split("T")[0],
    notificaciones,
  };
}

// =============================================================================
// Regla: Plazos de preaviso (LAU Arts. 9 y 11)
// =============================================================================

function evaluarPlazoPreaviso(
  contrato: Contrato,
  hoy: Date
): ResultadoPlazoPreaviso {
  const notificaciones: Notificacion[] = [];
  const fechaInicio = new Date(contrato.fecha_inicio);

  const plazoMinimoAnios =
    contrato.arrendador.tipo === "persona_juridica" ? 7 : 5;

  const fechaFinPlazoMinimo = new Date(fechaInicio);
  fechaFinPlazoMinimo.setFullYear(
    fechaFinPlazoMinimo.getFullYear() + plazoMinimoAnios
  );

  const diasParaFinPlazoMinimo = Math.floor(
    (fechaFinPlazoMinimo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Alertar al arrendador 120 días antes del fin del plazo mínimo
  if (diasParaFinPlazoMinimo > 0 && diasParaFinPlazoMinimo <= 120) {
    notificaciones.push({
      nivel: diasParaFinPlazoMinimo <= 30 ? "bloqueante" : "accion_requerida",
      mensaje: `Faltan ${diasParaFinPlazoMinimo} días para el fin del plazo mínimo. Si no quieres renovar, debes notificar al arrendatario antes del ${calcularFechaLimite(fechaFinPlazoMinimo, 120)}.`,
      destinatario: "arrendador",
      plazo_dias: diasParaFinPlazoMinimo,
      accion: "enviar_preaviso_no_renovacion",
      normativa_referencia: "LAU Art. 9.3",
    });
  }

  // Alertar al arrendatario 60 días antes del fin del plazo mínimo
  if (diasParaFinPlazoMinimo > 0 && diasParaFinPlazoMinimo <= 60) {
    notificaciones.push({
      nivel: "accion_requerida",
      mensaje: `Faltan ${diasParaFinPlazoMinimo} días para el fin del plazo mínimo. Si no quieres renovar, debes notificar al arrendador antes del ${calcularFechaLimite(fechaFinPlazoMinimo, 60)}.`,
      destinatario: "arrendatario",
      plazo_dias: diasParaFinPlazoMinimo,
      accion: "enviar_preaviso_no_renovacion",
      normativa_referencia: "LAU Art. 9.3",
    });
  }

  // Calcular meses desde inicio para evaluar desistimiento
  const mesesDesdeInicio =
    (hoy.getFullYear() - fechaInicio.getFullYear()) * 12 +
    (hoy.getMonth() - fechaInicio.getMonth());

  const puedeDesistir = mesesDesdeInicio >= 6;

  return {
    regla_id: "LAU_9_11_plazos_preaviso",
    escenario: contrato.estado,
    puede_actuar: true,
    plazo_preaviso_dias: puedeDesistir ? 30 : undefined,
    consecuencia_si_no_actua:
      diasParaFinPlazoMinimo <= 0
        ? "El contrato entra en prórroga tácita de 3 años (LAU Art. 10.2)"
        : undefined,
    requiere_consulta_legal: !puedeDesistir && mesesDesdeInicio < 6,
    notificaciones,
  };
}

// =============================================================================
// Utilidades
// =============================================================================

function calcularDiasHastaAniversario(hoy: Date, fechaInicio: Date): number {
  const proximoAniversario = new Date(fechaInicio);
  proximoAniversario.setFullYear(hoy.getFullYear());

  if (proximoAniversario < hoy) {
    proximoAniversario.setFullYear(hoy.getFullYear() + 1);
  }

  return Math.floor(
    (proximoAniversario.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function calcularFechaLimite(fechaFin: Date, diasAntes: number): string {
  const limite = new Date(fechaFin);
  limite.setDate(limite.getDate() - diasAntes);
  return limite.toISOString().split("T")[0];
}

function calcularFechasClave(contrato: Contrato, hoy: Date): FechaClave[] {
  const fechas: FechaClave[] = [];
  const fechaInicio = new Date(contrato.fecha_inicio);
  const plazoMinimo =
    contrato.arrendador.tipo === "persona_juridica" ? 7 : 5;

  // Próximo aniversario
  const proximoAniversario = new Date(fechaInicio);
  proximoAniversario.setFullYear(hoy.getFullYear());
  if (proximoAniversario <= hoy) {
    proximoAniversario.setFullYear(hoy.getFullYear() + 1);
  }

  fechas.push({
    fecha: proximoAniversario.toISOString().split("T")[0],
    descripcion: "Aniversario del contrato — posible actualización de renta",
    accion_requerida: "Notificar actualización de renta al arrendatario (30 días antes)",
    destinatario: "arrendador",
  });

  // Fin de plazo mínimo
  const finPlazoMinimo = new Date(fechaInicio);
  finPlazoMinimo.setFullYear(finPlazoMinimo.getFullYear() + plazoMinimo);

  if (finPlazoMinimo > hoy) {
    fechas.push({
      fecha: finPlazoMinimo.toISOString().split("T")[0],
      descripcion: `Fin del plazo mínimo (${plazoMinimo} años)`,
      accion_requerida: "Decidir si renovar o notificar no renovación",
      destinatario: "ambos",
    });
  }

  return fechas.sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
}
