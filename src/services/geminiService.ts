/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ClaimData, EvaluationResult } from "../types";
import { SYSTEM_PROMPTS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function evaluateClaim(data: ClaimData): Promise<EvaluationResult> {
  const textPart = {
    text: `
Lietas dati:
${JSON.stringify({
  ...data,
  rules_files: data.rules_files.map(f => f.name),
  historical_documents: data.historical_documents.map(f => f.name)
}, null, 2)}

Sagatavo izvērtējumu atbilstoši sistēmas instrukcijām. Izmanto sniegtos tekstus, pievienotos noteikumu failus/saites, kā arī vēsturiskos atzinumus/atteikumus kā paraugus un zināšanu bāzi, lai izprastu lēmumu pieņemšanas praksi.
`
  };

  const parts: any[] = [textPart];

  // Add PDF files as inlineData parts
  data.rules_files.forEach(file => {
    parts.push({
      inlineData: {
        data: file.data.split(',')[1] || file.data,
        mimeType: file.mimeType
      }
    });
  });

  // Add historical documents as inlineData parts
  data.historical_documents.forEach(file => {
    parts.push({
      inlineData: {
        data: file.data.split(',')[1] || file.data,
        mimeType: file.mimeType
      }
    });
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_PROMPTS.UNIVERSAL + "\n\nPapildus: Tev ir piekļuve pievienotajiem PDF failiem (noteikumi un vēsturiskie lēmumi) un tīmekļa saitēm. Izmanto noteikumus kā juridisko pamatu, bet vēsturiskos dokumentus kā paraugus lēmumu stilam un argumentācijai.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lietas_kopsavilkums: { type: Type.STRING },
          konstatetie_fakti: { type: Type.ARRAY, items: { type: Type.STRING } },
          trukstosa_vai_neskaidra_informacija: { type: Type.ARRAY, items: { type: Type.STRING } },
          konstatetas_pretrunas_vai_riski: { type: Type.ARRAY, items: { type: Type.STRING } },
          attiecinamie_noteikumu_punkti: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                punkts: { type: Type.STRING },
                skaidrojums: { type: Type.STRING }
              },
              required: ["punkts", "skaidrojums"]
            }
          },
          attiecinama_metodika_vai_principi: { type: Type.ARRAY, items: { type: Type.STRING } },
          izvertejums: { type: Type.STRING },
          ieteicamais_lemuma_veids: { type: Type.STRING },
          pamatojums: { type: Type.STRING },
          ieksejais_atzinuma_projekts: { type: Type.STRING },
          klientam_nosutama_lemuma_projekts: { type: Type.STRING },
          nepieciesama_cilveka_parbaude: { type: Type.STRING },
          cilveka_parbaudes_pamatojums: { type: Type.STRING },
          parliecibas_limenis: { type: Type.STRING }
        },
        required: [
          "lietas_kopsavilkums",
          "konstatetie_fakti",
          "trukstosa_vai_neskaidra_informacija",
          "konstatetas_pretrunas_vai_riski",
          "attiecinamie_noteikumu_punkti",
          "izvertejums",
          "ieteicamais_lemuma_veids",
          "pamatojums",
          "ieksejais_atzinuma_projekts",
          "klientam_nosutama_lemuma_projekts",
          "nepieciesama_cilveka_parbaude",
          "cilveka_parbaudes_pamatojums",
          "parliecibas_limenis"
        ]
      }
    }
  });

  if (!response.text) {
    throw new Error("Model failed to generate a response.");
  }

  try {
    return JSON.parse(response.text) as EvaluationResult;
  } catch (e) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("Invalid JSON response from model.");
  }
}
