/**
 * Base de conhecimento: Critérios Diagnósticos (DSM-5 / CID-11)
 * Curadoria dos transtornos mais comuns em contexto clínico ambulatorial.
 */

export const diagnosticsKnowledge = `
## DIAGNÓSTICOS CLÍNICOS MAIS COMUNS

### TRANSTORNOS DE ANSIEDADE (DSM-5 Capítulo 5)

#### Transtorno de Ansiedade Generalizada (TAG) — F41.1
Critérios DSM-5: Ansiedade e preocupação excessivas, na maioria dos dias por ≥6 meses, sobre vários eventos/atividades. Dificuldade de controlar a preocupação. ≥3 dos seguintes: agitação/tensão, fatigabilidade, dificuldade de concentração, irritabilidade, tensão muscular, perturbação do sono. Prejuízo funcional significativo.
Conceito central: intolerância à incerteza (Dugas), preocupação como evitação experiencial.
Intervenções: Reestruturação cognitiva da preocupação, experimentos comportamentais com incerteza, exposição a estímulos ansiogênicos, relaxamento muscular progressivo, mindfulness.

#### Transtorno do Pânico — F41.0
Critérios DSM-5: Ataques de pânico recorrentes e inesperados (surto abrupto de medo ou desconforto intenso com ≥4 sintomas físicos/cognitivos: palpitações, sudorese, tremores, dispneia, sensação de sufocamento, dor torácica, náusea, tontura, calafrios, parestesias, desrealização, medo de perder o controle, medo de morrer).
Pelo menos 1 mês de: preocupação com novos ataques ou mudança de comportamento.
Modelo cognitivo (Clark, 1986): catastrofização de sensações físicas → ciclo de manutenção do pânico.
Intervenções: Psicoeducação sobre o ciclo do pânico, exposição interoceptiva, exposição situacional, reestruturação de interpretações catastróficas.

#### Fobia Social (Transtorno de Ansiedade Social) — F40.1
Critérios DSM-5: Medo/ansiedade acentuados de situações sociais onde pode ser avaliado negativamente. Medo de agir de forma humilhante. A exposição provoca ansiedade intensa. Evitação ou suportação com sofrimento. ≥6 meses.
Modelo de Clark & Wells (1995): processamento autofocado, comportamentos de segurança, pós-processamento negativo.
Intervenções: Abandono de comportamentos de segurança, exposição a situações sociais, trabalho com processamento autofocado, vídeo-feedback.

#### Fobia Específica — F40.2xx
Medo/ansiedade acentuados e persistentes de objeto/situação específica. Resposta imediata de medo. Evitação ativa. ≥6 meses.
Intervenções: Exposição gradual in vivo (padrão ouro), dessensibilização sistemática, psicoeducação.

---

### TRANSTORNOS DEPRESSIVOS (DSM-5 Capítulo 4)

#### Transtorno Depressivo Maior (TDM) — F32.x / F33.x
Critérios DSM-5: ≥5 sintomas por ≥2 semanas, sendo pelo menos 1: humor deprimido ou anedonia.
Sintomas: humor deprimido, anedonia, alteração de peso/apetite, insônia ou hipersonia, agitação ou lentidão psicomotora, fadiga, sentimentos de inutilidade/culpa excessiva, dificuldade de concentração/decisão, pensamentos de morte/suicídio.
Especificadores importantes: com características melancólicas, atípicas, psicóticas, peripartum, sazonal; episódio único vs. recorrente.
Avaliação de risco: sempre investigar ideação suicida, plano, intenção, acesso a meios.
Intervenções TCC: Ativação comportamental (Lewinsohn), reestruturação cognitiva da tríade depressiva de Beck (self-mundo-futuro), programação de atividades de domínio e prazer.

#### Transtorno Depressivo Persistente (Distimia) — F34.1
Humor deprimido na maioria dos dias por ≥2 anos + ≥2 sintomas: apetite pobre/hiperfagia, insônia/hipersonia, baixa energia, baixa autoestima, concentração prejudicada, desesperança.
Relevante: alto risco de sobreposição com TDM (depressão dupla). Cronificação e risco de desatenção clínica por naturalização.

---

### TRANSTORNO OBSESSIVO-COMPULSIVO (TOC) — F42

Critérios DSM-5: Obsessões (pensamentos, impulsos ou imagens recorrentes, persistentes, intrusivos, egodistônicos) e/ou compulsões (comportamentos ou atos mentais repetitivos executados para reduzir ansiedade ou de acordo com regras rígidas). Consome >1h/dia ou causa sofrimento/prejuízo.
Modelo cognitivo-comportamental: fusão pensamento-ação, superestimação de responsabilidade, intolerância à incerteza, perfeccionismo, significância inflada de pensamentos intrusivos.
Tratamento de escolha: Exposição com Prevenção de Resposta (EPR) + TCC ou ISRS.
Especificadores: grau de insight (bom/regular/pobre/ausente), com tiques.
Cuidado: contratransferência de reasseguramento — terapeuta que responde às dúvidas mantém o ciclo obsessivo.

---

### TRANSTORNO DE ESTRESSE PÓS-TRAUMÁTICO (TEPT) — F43.1

Critérios DSM-5: Exposição a evento(s) traumático(s) (morte, ameaça de morte, violência sexual, lesão grave). Sintomas nos 4 grupos: (1) intrusão (flashbacks, pesadelos, sofrimento psíquico/reatividade fisiológica a pistas); (2) evitação (pensamentos, sentimentos, lembretes externos); (3) alterações cognitivas e do humor (amnésia, crenças negativas, distorções cognitivas, estado emocional negativo persistente, anedonia, alienação, incapacidade de experienciar positivo); (4) alterações de excitabilidade (hipervigilância, resposta de sobressalto exagerada, irritabilidade, comportamento imprudente, perturbação do sono). ≥1 mês. Com ou sem dissociação.
Tratamentos com evidência: EMDR (Shapiro), Terapia de Processamento Cognitivo (TPC/CPT), Terapia de Exposição Prolongada (EP/PE).
Avaliação: PCL-5 (escala de rastreio), linha do tempo do trauma, janela de tolerância (Siegel).

---

### TRANSTORNOS DA PERSONALIDADE (DSM-5 Capítulo 17)

#### Cluster A (Excêntrico/Esquisito)
- **Paranoide (F60.0)**: desconfiança e suspeita pervasivas
- **Esquizoide (F60.1)**: distanciamento de relações sociais, amplitude restrita de expressão emocional
- **Esquizotípico (F21)**: desconforto em relações próximas, distorções cognitivas/perceptivas, excentricidades

#### Cluster B (Dramático/Emocional)
- **Antissocial (F60.2)**: desrespeito e violação de direitos alheios (≥18 anos, com história de TC antes dos 15)
- **Borderline (F60.3)**: instabilidade de relações interpessoais, autoimagem e afetos; impulsividade marcante; medo de abandono; pensamento dicotômico; automutilação; instabilidade de identidade. TDC (DBT de Linehan) é o tratamento de escolha.
- **Histriônico (F60.4)**: emocionalidade excessiva e busca de atenção
- **Narcisista (F60.81)**: grandiosidade, necessidade de admiração, falta de empatia

#### Cluster C (Ansioso/Medroso)
- **Esquivo (F60.6)**: inibição social, sentimentos de inadequação, hipersensibilidade à avaliação negativa
- **Dependente (F60.7)**: necessidade excessiva de cuidado, submissão e apego
- **Obsessivo-Compulsivo (F60.5)**: preocupação com ordem, perfecionismo, controle (diferente do TOC: egossintônico)

#### Terapia Dialético-Comportamental (DBT) — Linehan
Indicada primariamente para TPB. Quatro módulos de habilidades: mindfulness, efetividade interpessoal, regulação emocional, tolerância ao mal-estar. Valida e desafia simultaneamente (dialética).

---

### TRANSTORNOS RELACIONADOS A TRAUMA E LUTO

#### Luto prolongado (CID-11: 6B42)
Anhelo/saudade intensa persistente ≥6 meses pós-perda + comprometimento funcional. Diferente do luto normal: intensidade não reduz, isolamento, dificuldade de aceitar a morte, sensação de que parte do self morreu.
Modelos: Tarefas do Luto (Worden), Modelo Dual de Processos (Stroebe & Schut), Teoria do Vínculo Continuado (Klass).
Intervenções: Terapia do luto prolongado (Shear), Terapia Focada no Luto (Worden).

#### Transtorno de Adaptação — F43.2x
Sintomas emocionais ou comportamentais identificáveis em resposta a estressor identificável dentro de 3 meses. Sofrimento desproporcional ao estressor. Remissão em ≤6 meses após cessação do estressor.

---

### TRANSTORNOS ALIMENTARES

#### Anorexia Nervosa — F50.0x
Restrição da ingestão calórica → peso significativamente baixo. Medo intenso de ganhar peso. Perturbação na vivência do peso/forma corporal. Tipo restritivo vs. purgativo.
Risco de mortalidade elevado. Necessidade de avaliação médica e nutricional paralela.

#### Bulimia Nervosa — F50.2
Episódios recorrentes de compulsão alimentar + comportamentos compensatórios inadequados (vômito, laxantes, exercício excessivo, jejum). ≥1x/semana por ≥3 meses. Autoavaliação indevidamente influenciada por peso/forma.

#### Transtorno da Compulsão Alimentar (TCAP) — F50.81
Episódios de compulsão sem comportamentos compensatórios regulares. Associado a sofrimento significativo.

---

### TRANSTORNOS DO HUMOR BIPOLAR — F31.x

Transtorno Bipolar I: ≥1 episódio maníaco (≥7 dias ou hospitalizável, com humor elevado/expansivo/irritável + aumento de atividade + ≥3 sintomas adicionais). Pode haver episódios depressivos.
Transtorno Bipolar II: ≥1 episódio hipomaníaco + ≥1 episódio depressivo maior. Sem episódio maníaco completo.
Ciclotimia: períodos hipomaníacos e depressivos sublimiares por ≥2 anos.
Cuidado clínico: antidepressivos sem estabilizador podem induzir virada maníaca. Sempre avaliar polaridade predominante.
Psicoterapia adjuvante: Terapia Focada na Família (Miklowitz), Psicoeducação, Terapia do Ritmo Interpessoal e Social (IPSRT).

---

### AVALIAÇÃO DE RISCO SUICIDA

Fatores de risco: ideação suicida (intensidade, frequência, plano elaborado, acesso a meios, intenção), tentativas anteriores (maior preditor), diagnóstico de TDM/TAB/TP/TEPT, impulsividade, uso de substâncias, isolamento social, perdas recentes, dor psíquica intensa, desesperança (escala de Beck), anedonia.
Fatores protetores: suporte social, razões para viver, filhos, religiosidade, engajamento no tratamento, senso de futuro.
Escalas: Columbia Suicide Severity Rating Scale (C-SSRS), Escala de Desesperança de Beck.
Conduta: contrato de segurança (limitado), psicoeducação familiar, articulação com psiquiatria, avaliação de internação se risco iminente.
`;
