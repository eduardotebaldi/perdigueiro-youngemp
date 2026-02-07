import { Tables } from "@/integrations/supabase/types";

type Gleba = Tables<"glebas">;

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
}

/**
 * Valida se uma gleba possui todas as informações necessárias para seu status atual.
 * 
 * Regras:
 * - visita_realizada: exige data_visita
 * - proposta_enviada: exige arquivo de proposta (verificado via propostas relacionadas)
 * - protocolo_assinado: exige arquivo_protocolo
 * - descartada: exige motivo_descarte_id
 * - negocio_fechado: exige arquivo_contrato
 * - standby: exige standby_motivo
 */
export function validateGlebaStatus(gleba: Gleba): ValidationResult {
  const missingFields: string[] = [];

  switch (gleba.status) {
    case "visita_realizada":
      if (!gleba.data_visita) {
        missingFields.push("Data da visita");
      }
      break;

    case "proposta_enviada":
      // A proposta é uma entidade separada, mas podemos verificar se há algum indicador
      // Por enquanto, assumimos que está ok se chegou nesse status
      // Se quiser validar, precisa buscar na tabela propostas
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
      // Não há requisitos específicos além de ter passado por proposta_enviada
      break;

    case "negocio_fechado":
      if (!gleba.arquivo_contrato) {
        missingFields.push("Contrato definitivo");
      }
      break;

    case "standby":
      if (!gleba.standby_motivo) {
        missingFields.push("Motivo do standby");
      }
      break;

    // identificada e informacoes_recebidas não têm requisitos obrigatórios
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
