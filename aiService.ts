
import { GoogleGenAI } from "@google/genai";
import { SmsType } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const beautifyDiagnosisText = async (rawText: string): Promise<string> => {
  try {
    const prompt = `
      Feladat: Fogalmazd át az alábbi autószerelői diagnózist barátságosabb, bizalomgerjesztő, de szakmai stílusra.
      Szabály: Ne változtass a tényeken, csak a stíluson. Legyen gördülékeny, magyaros mondat.
      Bemenet: "${rawText}"
      Kimenet: Csak az átfogalmazott szöveg.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text?.trim() || rawText;
  } catch (error) {
    console.error("AI Beautify Error:", error);
    return rawText;
  }
};

export const improveTemplateText = async (rawText: string): Promise<string> => {
  try {
    const prompt = `
      Feladat: Alakítsd át ezt a rövid szerelői jegyzetet egy profi, rövid "Gyors Diagnózis" gomb felirattá.
      Bemenet: "${rawText}"
      Példa bemenet: "büdös klíma" -> Példa kimenet: "Klímatisztítás és fertőtlenítés szükséges"
      Szabály: Max 4-6 szó legyen. Legyen szakmai.
      Kimenet: Csak a szöveg.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text?.trim() || rawText;
  } catch (error) {
    console.error("AI Template Error:", error);
    return rawText;
  }
};

export const generateStaticSms = (
  type: SmsType, 
  diagnosis: string, 
  plate: string, 
  cost: number | undefined, 
  partsCost: number | undefined,
  laborCost: number | undefined,
  useBreakdown: boolean | undefined,
  photoUrls: string[], 
  shopName: string
): string => {
  let costSection = '';
  const costStr = cost ? cost.toLocaleString('hu-HU') : '0';
  
  if (cost) {
    if (useBreakdown && (partsCost || laborCost)) {
      costSection = ` A várható költségek: Alkatrész: ${(partsCost || 0).toLocaleString('hu-HU')} Ft, Munkadíj: ${(laborCost || 0).toLocaleString('hu-HU')} Ft. Összesen: ${costStr} Ft.`;
    } else {
      costSection = ` A javítás várható költsége: ${costStr} Ft.`;
    }
  }

  let sms = '';

  if (type === 'DIAGNOSIS') {
    sms = `Üdvözlöm! Átvizsgáltuk a ${plate} autóját a ${shopName}-nél. A következő beavatkozás szükséges: ${diagnosis}.${costSection} Kérjük, válasz SMS-ben jelezze, hogy elfogadja-e a javítást!`;
  } else if (type === 'FINISHED') {
    const priceText = cost ? ` A fizetendő végösszeg: ${costStr} Ft.` : '';
    sms = `Tisztelt Ügyfelünk! A ${plate} rendszámú autója elkészült, a javítás befejeződött a ${shopName}-nél.${priceText} Várjuk szervizünkben, az autó átvehető. Üdvözlettel!`;
  } else if (type === 'START') {
    sms = `Tisztelt Ügyfelünk! Tájékoztatjuk, hogy a ${plate} rendszámú autóján a javítási munkálatokat megkezdtük a ${shopName}-nél. Amint elkészül, azonnal értesítjük.`;
  }

  if (photoUrls.length > 0 && type === 'DIAGNOSIS') {
    sms += `\n\nFotók a munkáról:\n${photoUrls.join('\n')}`;
  }

  return sms;
};
