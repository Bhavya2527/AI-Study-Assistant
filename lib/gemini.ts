import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_INSTRUCTION, buildStudySetPrompt, PromptOptions } from './prompts';
import { studySetOutputSchema, StudySetOutputValidated } from './validators';

/**
 * Strips code fences and isolates the top-level JSON object if necessary.
 */
function extractAndCleanJson(rawText: string): string {
  let text = rawText.trim();

  // Strip markdown code fences if present
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find outermost curly brackets
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    text = text.substring(startIndex, endIndex + 1);
  }

  return text;
}

/**
 * Calls Google Gemini (gemini-3.8-flash) server-side with structured prompt and JSON enforcement.
 * Includes automatic retry on invalid JSON.
 */
export async function generateStudySetFromGemini(
  options: PromptOptions
): Promise<StudySetOutputValidated> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured on the server.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Use gemini-3.8-flash with structured JSON responseMimeType
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.8-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2, // Low temperature for high factual accuracy
      topP: 0.8,
    },
  });

  const prompt = buildStudySetPrompt(options);

  // Attempt 1: Standard generation
  try {
    const result = await model.generateContent(prompt);
    const rawResponse = result.response.text();
    const cleaned = extractAndCleanJson(rawResponse);
    const parsed = JSON.parse(cleaned);
    const validated = studySetOutputSchema.parse(parsed);
    return validated;
  } catch (firstError) {
    console.warn('Initial Gemini generation or parsing failed, retrying once...', firstError);

    // Attempt 2: Retry with explicit formatting reinforcement
    try {
      const retryPrompt = `${prompt}\n\nIMPORTANT: The previous output failed JSON validation. Ensure you return ONLY valid, parseable JSON conforming strictly to the requested schema.`;
      const retryResult = await model.generateContent(retryPrompt);
      const retryRaw = retryResult.response.text();
      const retryCleaned = extractAndCleanJson(retryRaw);
      const retryParsed = JSON.parse(retryCleaned);
      const retryValidated = studySetOutputSchema.parse(retryParsed);
      return retryValidated;
    } catch (secondError: unknown) {
      console.error('Gemini retry attempt also failed:', secondError);
      const errMsg =
        secondError instanceof Error
          ? secondError.message
          : 'Invalid JSON output received from model';
      throw new Error(`Failed to generate structured study materials with Gemini: ${errMsg}`);
    }
  }
}
