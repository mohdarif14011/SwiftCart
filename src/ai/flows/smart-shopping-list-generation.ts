'use server';
/**
 * @fileOverview A GenAI tool that generates a personalized shopping list based on user input.
 *
 * - generateShoppingList - A function that handles the shopping list generation process.
 * - SmartShoppingListGenerationInput - The input type for the generateShoppingList function.
 * - SmartShoppingListGenerationOutput - The return type for the generateShoppingList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartShoppingListGenerationInputSchema = z
  .string()
  .describe(
    "User's free-text input describing meal ideas, dietary preferences, or pantry needs."
  );
export type SmartShoppingListGenerationInput = z.infer<
  typeof SmartShoppingListGenerationInputSchema
>;

const SmartShoppingListGenerationOutputSchema = z.object({
  shoppingList: z.array(z.string()).describe('An array of generated shopping list items.'),
});
export type SmartShoppingListGenerationOutput = z.infer<
  typeof SmartShoppingListGenerationOutputSchema
>;

export async function generateShoppingList(
  input: SmartShoppingListGenerationInput
): Promise<SmartShoppingListGenerationOutput> {
  return smartShoppingListGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartShoppingListGenerationPrompt',
  input: {schema: SmartShoppingListGenerationInputSchema},
  output: {schema: SmartShoppingListGenerationOutputSchema},
  prompt: `You are an intelligent shopping list generator. Based on the user's input, create a concise and practical shopping list.

Consider meal ideas, dietary preferences, and existing pantry items mentioned in the input to generate a personalized list.

Input: "{{{this}}}"

Generate the shopping list in JSON format, as an array of strings.`,
});

const smartShoppingListGenerationFlow = ai.defineFlow(
  {
    name: 'smartShoppingListGenerationFlow',
    inputSchema: SmartShoppingListGenerationInputSchema,
    outputSchema: SmartShoppingListGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
