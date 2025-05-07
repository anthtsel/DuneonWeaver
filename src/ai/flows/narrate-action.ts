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
  feedback: z.string().optional().describe('Optional feedback. If the game ended, explain why (e.g., "You defeated the Dragon Lord!"). If ongoing, can be a hint or comment, or describe a non-fatal consequence like "You take a glancing blow! -10 Health. You\'re still in the fight."'),
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

Your goal is to guide the player through a multi-stage adventure that escalates in challenge and can ultimately result in a WIN or a LOSS.
The adventure should consist of approximately 6-10 distinct challenges or encounters before a WIN condition can be met. These challenges can include combat, puzzles, environmental hazards, or difficult choices.
A WIN should represent the culmination of a significant journey, potentially involving overcoming puzzles, managing limited resources (implied through narrative, not a formal system), and defeating a final challenging foe or obstacle.
Do NOT allow the player to win in the first 3-4 turns; the journey must feel substantial and earned.
A LOSS might involve the player character's demise due to accumulated damage/setbacks, failing a critical objective across multiple stages, or falling into an unrecoverable situation after several poor choices or unlucky events.

Avoid immediate game over states for initial actions unless the player's action is exceptionally reckless (e.g., attacking a clearly insurmountable foe without any preparation or trying to drink obvious poison).
Introduce tougher choices as the game progresses. Decisions should have meaningful consequences, positive or negative, that can affect later stages of the adventure.
Introduce setbacks like minor injuries (e.g., "You take a glancing blow! -10 Health. You're still in the fight." or "The acidic slime burns your gear, making things a bit tougher."), loss of a temporary advantage, triggering non-lethal traps, or encountering environmental hazards. These setbacks should test the player's resilience but not immediately end the game. The player should have opportunities to react, adapt, or attempt to recover.
Enemies and obstacles should scale in difficulty. Early encounters might be minor threats, while later stages present more formidable challenges requiring careful thought or previous preparations.
The player should have a chance to react to danger and make strategic decisions.

Previous Narrative:
{{{previousNarrative}}}

Player Action:
{{{action}}}

Based on the player's action and the previous narrative, considering the overall progress through the multi-stage adventure:
1.  Generate a vivid, concise description of what happens next (the 'narrative'). Keep it under 80 words.
2.  Determine if this action leads to the end of the game.
    - If the game ends, set 'gameOver' to true. Set 'gameStatus' to "win" or "loss". Remember, a "win" should only occur after significant progression through multiple challenges (aim for 6-10 encounters).
    - If the game continues, set 'gameOver' to false and 'gameStatus' to "ongoing".
3.  Provide brief 'feedback'.
    - If the game ended with a WIN: Explain the culmination of their journey (e.g., "After a grueling journey through treacherous halls and defeating the Shadow Lich, you finally claim the Sunstone Shard! Your name will be sung by bards for generations!").
    - If the game ended with a LOSS: Explain why their adventure ended (e.g., "The accumulated wounds from many battles and the final crushing blow from the Ogre Champion prove too much. Darkness takes you." or "Your reckless charge into the dragon's lair was your last mistake.").
    - If ongoing: Provide a subtle hint for what the player might do next, a comment on their action, or describe a non-fatal consequence (e.g., "The goblin shaman's curse saps some of your strength, making the next fight feel more draining." or "You spot a hidden inscription on the wall, barely visible in the torchlight.").

Stay in character as the dungeon master. Ensure the output strictly adheres to the NarrateActionOutputSchema.
The game needs to have an end result, good or bad, for the user depending on their actions over a significant series of challenges and encounters.`,
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

