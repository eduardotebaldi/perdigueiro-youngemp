import { useQuery } from "@tanstack/react-query";

interface MunicipioIBGE {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
        nome: string;
      };
    };
  };
}

export interface CidadeBrasil {
  id: number;
  nome: string;
  uf: string;
  nomeCompleto: string; // "Cidade - UF"
}

export function useCidadesBrasil() {
  return useQuery({
    queryKey: ["cidades-brasil"],
    queryFn: async (): Promise<CidadeBrasil[]> => {
      const response = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome"
      );
      
      if (!response.ok) {
        throw new Error("Erro ao buscar cidades do IBGE");
      }
      
      const data: MunicipioIBGE[] = await response.json();
      
      return data.map((municipio) => ({
        id: municipio.id,
        nome: municipio.nome,
        uf: municipio.microrregiao.mesorregiao.UF.sigla,
        nomeCompleto: `${municipio.nome} - ${municipio.microrregiao.mesorregiao.UF.sigla}`,
      }));
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas - dados não mudam frequentemente
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 dias
  });
}

export function filterCidades(cidades: CidadeBrasil[], searchTerm: string, limit = 10): CidadeBrasil[] {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const normalizedSearch = searchTerm
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  
  return cidades
    .filter((cidade) => {
      const normalizedNome = cidade.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return normalizedNome.includes(normalizedSearch);
    })
    .slice(0, limit);
}
