'use server';

/**
 * @fileOverview Narrates the action taken by the player in the text adventure game.
 *
 * - narrateAction - A function that takes player input and returns a vivid description of the game's next scene, along with game state.
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
  gameOver: z.boolean().describe('Set to true if the game has ended (player won or lost).'),
  gameStatus: z.enum(["win", "loss", "ongoing"]).describe('The current status of the game. Set to "win" or "loss" if gameOver is true, otherwise "ongoing".'),
  feedback: z.string().optional().describe('Optional feedback. If the game ended, explain why (e.g., "You defeated the Dragon Lord!"). If ongoing, can be a hint or comment, or describe a non-fatal consequence like "You step on a trap! -15 HP. You’re still alive but shaken."'),
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

Your goal is to guide the player through an adventure that can result in a WIN or a LOSS.
- A WIN might involve defeating a major boss, finding a legendary artifact, or escaping the dungeon.
- A LOSS might involve the player character's demise, failing a critical objective, or falling into an inescapable trap.

The game should generally allow for several turns of play. Avoid immediate game over states for initial actions unless the player's action is exceptionally reckless or directly leads to a pre-defined 'instant lose' condition (like directly attacking a vastly superior foe without preparation).
Introduce setbacks like minor injuries (e.g., "You step on a trap! -15 HP. You’re still alive but shaken."), loss of items, or triggering non-lethal traps before escalating to a full game over. The player should have a chance to react to danger.

Previous Narrative:
{{{previousNarrative}}}

Player Action:
{{{action}}}

Based on the player's action and the previous narrative:
1.  Generate a vivid, concise description of what happens next (the 'narrative'). Keep it under 80 words.
2.  Determine if this action leads to the end of the game.
    - If the game ends, set 'gameOver' to true. Set 'gameStatus' to "win" or "loss".
    - If the game continues, set 'gameOver' to false and 'gameStatus' to "ongoing".
3.  Provide brief 'feedback'.
    - If the game ended, explain why (e.g., "You defeated the Dragon Lord!" or "The poison was too potent.").
    - If ongoing, you can provide a subtle hint for what the player might do next, a comment on their action, or describe a non-fatal consequence (e.g., "You trigger a dart trap, taking a small amount of damage but can continue.").

Stay in character as the dungeon master. Ensure the output strictly adheres to the NarrateActionOutputSchema.
The game needs to have an end result, good or bad, for the user depending on their actions over time.`,
});

const narrateActionFlow = ai.defineFlow(
  {
    name: 'narrateActionFlow',
    inputSchema: NarrateActionInputSchema,
    outputSchema: NarrateActionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure that if gameOver is true, gameStatus is either 'win' or 'loss'.
    if (output && output.gameOver && output.gameStatus === 'ongoing') {
      // This is a fallback, ideally the LLM respects the prompt.
      // If the LLM says game is over but status is ongoing, assume a loss as a safe default.
      output.gameStatus = 'loss'; 
    }
    return output!;
  }
);

