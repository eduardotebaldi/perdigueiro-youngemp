import { Tables } from "@/integrations/supabase/types";

type Gleba = Tables<"glebas">;

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

/**
 * Valida se uma gleba possui todas as informações necessárias.
 * 
 * Campos comuns (exceto descartadas): cidade, área (m²)
 * Por status:
 * - visita_realizada: data_visita
 * - proposta_enviada: preço
 * - protocolo_assinado: arquivo_protocolo
 * - descartada: motivo_descarte_id
 * - negocio_fechado: arquivo_contrato, data_fechamento
 * - standby: standby_motivo
 */
export function validateGlebaStatus(gleba: Gleba): ValidationResult {
  const missingFields: string[] = [];

  // Campos comuns obrigatórios para todas as glebas (exceto descartadas)
  if (gleba.status !== "descartada") {
    if (!gleba.cidade_id) {
      missingFields.push("Cidade");
    }
    if (!gleba.tamanho_m2) {
      missingFields.push("Área (m²)");
    }
  }

  // Validações específicas por status
  switch (gleba.status) {
    case "visita_realizada":
      if (!gleba.data_visita) {
        missingFields.push("Data da visita");
      }
      break;

    case "proposta_enviada":
      if (!gleba.preco) {
        missingFields.push("Preço");
      }
      break;

    case "protocolo_assinado":
      if (!gleba.arquivo_protocolo) {
        missingFields.push("Arquivo do protocolo");
      }
      break;

    case "descartada":
      if (!gleba.motivo_descarte_id) {
        missingFields.push("Motivo do descarte");
      }
      break;

    case "proposta_recusada":
      break;

    case "negocio_fechado":
      if (!gleba.arquivo_contrato) {
        missingFields.push("Contrato definitivo");
      }
      if (!gleba.data_fechamento) {
        missingFields.push("Data de fechamento");
      }
      break;

    case "standby":
      if (!gleba.standby_motivo) {
        missingFields.push("Motivo do standby");
      }
      break;

    default:
      break;
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Retorna uma mensagem formatada com os campos faltantes
 */
export function getValidationMessage(result: ValidationResult): string {
  if (result.isValid) return "";
  
  return `Faltando: ${result.missingFields.join(", ")}`;
}
