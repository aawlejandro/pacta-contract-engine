/**
 * PACTA Contract Engine — Core Types
 *
 * Tipos compartidos entre el evaluador y los consumidores del motor.
 * Estos tipos son la interfaz pública del engine.
 */

// =============================================================================
// Contrato
// =============================================================================

export type ContratoEstado =
  | "INICIALIZACION"
  | "VIGENTE"
  | "PRORROGA_OBLIGATORIA"
  | "PRORROGA_TACITA"
  | "PRORROGA_EXTRAORDINARIA"
  | "FINALIZADO";

export type TipoArrendador = "persona_fisica" | "persona_juridica";

export type IndiceActualizacion = "IRAV" | "IPC";

export interface Contrato {
  id: string;
  estado: ContratoEstado;

  // Partes
  arrendador: {
    tipo: TipoArrendador;
  };

  // Fechas clave
  fecha_firma: string;        // ISO 8601
  fecha_inicio: string;       // ISO 8601 — puede diferir de firma
  fecha_fin_pactada?: string; // ISO 8601 — si tiene fecha de fin expresa

  // Financiero
  renta_actual: number;       // euros/mes
  fecha_ultima_actualizacion_renta?: string; // ISO 8601

  // Inmueble
  inmueble: {
    referencia_catastral?: string;
    zona_tensionada: boolean;
    municipio_codigo_ine?: string;
  };
}

// =============================================================================
// Evaluación de reglas
// =============================================================================

export interface ContextoEvaluacion {
  contrato: Contrato;
  fecha_actual: string;       // ISO 8601 — inyectable para tests
  indices?: IndicesEconomicos;
}

export interface IndicesEconomicos {
  irav_variacion_anual?: number;   // decimal, ej: 0.025
  ipc_variacion_anual?: number;    // decimal
  fecha_dato?: string;             // cuándo se obtuvieron los datos
}

export type ResultadoCondicion = {
  id: string;
  cumplida: boolean;
  motivo?: string;
};

export type NivelSeveridad = "info" | "aviso" | "accion_requerida" | "bloqueante";

export interface Notificacion {
  nivel: NivelSeveridad;
  mensaje: string;
  destinatario: "arrendador" | "arrendatario" | "ambos";
  plazo_dias?: number;
  accion?: string;
  normativa_referencia?: string;
}

// =============================================================================
// Resultados por tipo de regla
// =============================================================================

export interface ResultadoActualizacionRenta {
  regla_id: "LAU_18_actualizacion_renta";
  aplicable: boolean;
  motivo_no_aplicable?: string;

  // Solo presentes si aplicable == true
  renta_actual?: number;
  nueva_renta?: number;
  variacion_aplicada?: number;
  indice_usado?: IndiceActualizacion;
  limitado_por_zona_tensionada?: boolean;
  fecha_efectiva?: string;
  notificaciones: Notificacion[];
}

export interface ResultadoPlazoPreaviso {
  regla_id: "LAU_9_11_plazos_preaviso";
  escenario: string;
  puede_actuar: boolean;
  plazo_preaviso_dias?: number;
  fecha_limite?: string;
  consecuencia_si_no_actua?: string;
  requiere_consulta_legal?: boolean;
  notificaciones: Notificacion[];
}

export type ResultadoRegla =
  | ResultadoActualizacionRenta
  | ResultadoPlazoPreaviso;

// =============================================================================
// Evaluador
// =============================================================================

export interface EvaluacionCompleta {
  contrato_id: string;
  fecha_evaluacion: string;
  estado_contrato: ContratoEstado;
  resultados: ResultadoRegla[];
  notificaciones_pendientes: Notificacion[];
  proximas_fechas_clave: FechaClave[];
}

export interface FechaClave {
  fecha: string;
  descripcion: string;
  accion_requerida?: string;
  destinatario: "arrendador" | "arrendatario" | "ambos";
}
