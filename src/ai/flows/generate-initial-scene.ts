'use server';

/**
 * @fileOverview AI Dungeon Master initial scene generator.
 *
 * - generateInitialScene - A function that generates the initial scene for the game.
 * - GenerateInitialSceneInput - The input type for the generateInitialScene function.
 * - GenerateInitialSceneOutput - The return type for the generateInitialScene function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialSceneInputSchema = z.object({
  prompt: z.string().describe('The game prompt to base the scene on.'),
});
export type GenerateInitialSceneInput = z.infer<typeof GenerateInitialSceneInputSchema>;

const GenerateInitialSceneOutputSchema = z.object({
  sceneDescription: z.string().describe('A vivid description of the initial scene.'),
});
export type GenerateInitialSceneOutput = z.infer<typeof GenerateInitialSceneOutputSchema>;

export async function generateInitialScene(input: GenerateInitialSceneInput): Promise<GenerateInitialSceneOutput> {
  return generateInitialSceneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialScenePrompt',
  input: {schema: GenerateInitialSceneInputSchema},
  output: {schema: GenerateInitialSceneOutputSchema},
  prompt: `You are the narrator of a fast-paced, fantasy text-based adventure game. The player will type actions like 'look around', 'attack the goblin', or 'open the treasure chest'.

  Based on the following game prompt, generate a vivid, concise description of the initial scene. Use an adventurous tone, throw in surprises, and occasionally introduce a twist or danger. Keep your response under 80 words and end each one with a subtle hint of what the player might do next. Stay in character as the dungeon master.

  Game Prompt: {{{prompt}}}`,
});

const generateInitialSceneFlow = ai.defineFlow(
  {
    name: 'generateInitialSceneFlow',
    inputSchema: GenerateInitialSceneInputSchema,
    outputSchema: GenerateInitialSceneOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
