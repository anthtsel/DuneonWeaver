'use server';

/**
 * @fileOverview Narrates the action taken by the player in the text adventure game.
 *
 * - narrateAction - A function that takes player input and returns a vivid description of the game's next scene.
 * - NarrateActionInput - The input type for the narrateAction function.
 * - NarrateActionOutput - The return type for the narrateAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NarrateActionInputSchema = z.object({
  action: z.string().describe('The action the player takes in the game.'),
  previousNarrative: z.string().describe('The previous narrative context.'),
});
export type NarrateActionInput = z.infer<typeof NarrateActionInputSchema>;

const NarrateActionOutputSchema = z.object({
  narrative: z.string().describe('A vivid description of what happens next in the game.'),
});
export type NarrateActionOutput = z.infer<typeof NarrateActionOutputSchema>;

export async function narrateAction(input: NarrateActionInput): Promise<NarrateActionOutput> {
  return narrateActionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'narrateActionPrompt',
  input: {schema: NarrateActionInputSchema},
  output: {schema: NarrateActionOutputSchema},
  prompt: `You are the narrator of a fast-paced, fantasy text-based adventure game. The player will type actions like 'look around', 'attack the goblin', or 'open the treasure chest'.

  Previous Narrative:
  {{previousNarrative}}

  Player Action:
  {{action}}

For each input, respond with a vivid, concise description of what happens next. Use an adventurous tone, throw in surprises, and occasionally introduce a twist or danger. Keep your responses under 80 words and end each one with a subtle hint of what the player might do next. Stay in character as the dungeon master. the game needs to have and end result good or bad for the user depending on their actions`,
});

const narrateActionFlow = ai.defineFlow(
  {
    name: 'narrateActionFlow',
    inputSchema: NarrateActionInputSchema,
    outputSchema: NarrateActionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
