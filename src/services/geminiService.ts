import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type MicrobeType = "Bacteria" | "Virus" | "Fungus" | "Parasite";

export interface MicrobeSection {
  title: string;
  content: string;
}

export interface MicrobeData {
  name: string;
  type: MicrobeType;
  sections: MicrobeSection[];
  imageUrl?: string;
  imageCaption?: string;
}

const BACTERIA_HEADINGS = [
  "Taxonomy & Classification",
  "Laboratory Identification (The 'Bench' Side)",
  "Pathogenesis & Virulence",
  "Clinical Features & Management",
  "Antimicrobial Susceptibility (High-Yield)",
  "Treatment & Stewardship (The 'Consultant' Side)",
  "Infection Prevention & Control (IPC)",
  "Public Health & Legislation"
];

const VIRUS_HEADINGS = [
  "Classification",
  "Replication Cycle",
  "Epidemiology & Transmission",
  "Pathogenesis",
  "Laboratory Diagnosis",
  "Antiviral Therapy",
  "Resistance Testing",
  "Vaccination & Prevention",
  "Infection Control"
];

const FUNGI_HEADINGS = [
  "Classification",
  "Microscopy & Morphology",
  "Culture Characteristics",
  "Virulence & Host Factors",
  "Pathology & Pathogenesis",
  "Clinical Features",
  "Non-Culture Diagnostics",
  "Antifungal Pharmacology",
  "Intrinsic Resistance",
  "Therapeutic Drug Monitoring (TDM)"
];

const PARASITE_HEADINGS = [
  "Classification",
  "Life Cycles",
  "Geographical Distribution",
  "Mode of Entry",
  "Laboratory ID",
  "Diagnostic Timing",
  "Pathology/Signs",
  "Management"
];

export async function fetchMicrobeData(query: string): Promise<MicrobeData> {
  const model = "gemini-3.1-pro-preview";

  const systemInstruction = `
    You are an expert clinical microbiologist providing high-yield reference data for FRCPath trainees.
    Your task is to synthesize data on the microbe requested.
    
    1. First, identify if the microbe is a Bacteria, Virus, Fungus, or Parasite.
    2. Based on the type, provide information under the following EXACT headings:
    
    For Bacteria:
    ${BACTERIA_HEADINGS.map((h, i) => `${i + 1}. ${h}`).join("\n")}
    
    For Virus:
    ${VIRUS_HEADINGS.map((h, i) => `${i + 1}. ${h}`).join("\n")}
    
    For Fungus:
    ${FUNGI_HEADINGS.map((h, i) => `${i + 1}. ${h}`).join("\n")}
    
    For Parasite:
    ${PARASITE_HEADINGS.map((h, i) => `${i + 1}. ${h}`).join("\n")}
    
    Prioritize information from UK SMIs, ClinMicroNow, CDC DPDx, Mycology Online (Adelaide), EUCAST, PubMed, and UKHSA guidelines.
    Use Markdown for formatting within each section. Be concise but high-yield.
    
    If the microbe is a Parasite, attempt to find a direct URL to a relevant lifecycle diagram from CDC DPDx (e.g., from https://www.cdc.gov/dpdx/).
    Include this in the 'imageUrl' field if found, along with a descriptive 'imageCaption'.
    
    Return the data in a structured JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: `Synthesize data for: ${query}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { 
            type: Type.STRING,
            enum: ["Bacteria", "Virus", "Fungus", "Parasite"]
          },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["title", "content"]
            }
          },
          imageUrl: { type: Type.STRING },
          imageCaption: { type: Type.STRING }
        },
        required: ["name", "type", "sections"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as MicrobeData;
}
