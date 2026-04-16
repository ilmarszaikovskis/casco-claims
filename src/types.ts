/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ClaimData {
  lietas_id: string;
  produkts: string;
  polises_numurs: string;
  polises_redakcija: string;
  polise_no: string;
  polise_lidz: string;
  seguma_veids: string;
  pasrisks: string;
  negadijuma_datums: string;
  pieteikuma_datums: string;
  negadijuma_vieta: string;
  klienta_pieteiktais_notikums: string;
  konstatetie_fakti: string;
  iesniegtie_dokumenti: string;
  eksperta_info: string;
  pretrunas_riski: string;
  balcia_noteikumu_punkti: string;
  rules_urls: string[];
  rules_files: { name: string; data: string; mimeType: string }[];
  historical_documents: { name: string; data: string; mimeType: string }[];
  ltab_metodika: string;
  ieksejas_vadlinijas: string;
  papildu_uzdevums: string;
}

export interface EvaluationResult {
  lietas_kopsavilkums: string;
  konstatetie_fakti: string[];
  trukstosa_vai_neskaidra_informacija: string[];
  konstatetas_pretrunas_vai_riski: string[];
  attiecinamie_noteikumu_punkti: {
    punkts: string;
    skaidrojums: string;
  }[];
  attiecinama_metodika_vai_principi: string[];
  izvertejums: string;
  ieteicamais_lemuma_veids: 'izmaksāt' | 'izmaksāt daļēji' | 'atteikt' | 'pieprasīt papildinformāciju' | 'nodot manuālai izvērtēšanai';
  pamatojums: string;
  ieksejais_atzinuma_projekts: string;
  klientam_nosutama_lemuma_projekts: string;
  nepieciesama_cilveka_parbaude: 'Jā' | 'Nē';
  cilveka_parbaudes_pamatojums: string;
  parliecibas_limenis: 'zems' | 'vidējs' | 'augsts';
}
