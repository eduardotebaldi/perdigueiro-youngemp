// API do IBGE para buscar dados de municípios

export interface PopulacaoIBGE {
  id: string;
  localidade: string;
  res: {
    [key: string]: string;
  };
}

/**
 * Busca a população de um município usando a API SIDRA do IBGE
 * Tabela 6579 - População residente estimada
 * @param codigoIbge Código IBGE do município (7 dígitos)
 */
export async function buscarPopulacaoMunicipio(codigoIbge: number): Promise<number | null> {
  try {
    // Tabela 6579 - Estimativa populacional
    // /t/6579/n6/{codigo}/v/9324/p/last
    const url = `https://apisidra.ibge.gov.br/values/t/6579/n6/${codigoIbge}/v/9324/p/last`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Erro ao buscar população:", response.status);
      return null;
    }
    
    const data = await response.json();
    
    // A API retorna array, primeiro item é header, segundo é o dado
    if (data && data.length >= 2 && data[1]?.V) {
      const populacao = parseInt(data[1].V, 10);
      return isNaN(populacao) ? null : populacao;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar população do IBGE:", error);
    return null;
  }
}

/**
 * Formata população para exibição
 */
export function formatarPopulacao(populacao: number | null | undefined): string {
  if (!populacao) return "";
  
  if (populacao >= 1000000) {
    return `${(populacao / 1000000).toFixed(1)}M hab.`;
  }
  if (populacao >= 1000) {
    return `${(populacao / 1000).toFixed(0)}K hab.`;
  }
  return `${populacao} hab.`;
}

/**
 * Normaliza o nome de uma cidade para o formato "Cidade/UF"
 * @param nome Nome atual da cidade
 */
export function normalizarNomeCidade(nome: string): { nome: string; precisaAtualizar: boolean } {
  if (!nome) return { nome, precisaAtualizar: false };
  
  // Se já está no formato "Cidade - UF" ou "Cidade/UF", normalizar para "Cidade/UF"
  const matchTraco = nome.match(/^(.+?)\s*-\s*([A-Z]{2})$/i);
  if (matchTraco) {
    const novoNome = `${matchTraco[1].trim()}/${matchTraco[2].toUpperCase()}`;
    return { nome: novoNome, precisaAtualizar: novoNome !== nome };
  }
  
  const matchBarra = nome.match(/^(.+?)\/([A-Z]{2})$/i);
  if (matchBarra) {
    const novoNome = `${matchBarra[1].trim()}/${matchBarra[2].toUpperCase()}`;
    return { nome: novoNome, precisaAtualizar: novoNome !== nome };
  }
  
  // Se não tem UF, precisará ser corrigido manualmente ou via busca IBGE
  return { nome, precisaAtualizar: false };
}
