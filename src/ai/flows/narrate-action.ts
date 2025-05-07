'use server';

/**
 * @fileOverview Narrates the action taken by the player in the text adventure game, incorporating inventory, skills, and character stats.
 *
 * - narrateAction - A function that takes player input and returns a vivid description of the game's next scene, along with game state.
 * - NarrateActionInput - The input type for the narrateAction function.
 * - NarrateActionOutput - The return type for the narrateAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CharacterStatsSchema = z.object({
  health: z.number().describe('Current health points of the player.'),
  strength: z.number().describe('Player\'s physical strength.'),
  agility: z.number().describe('Player\'s speed and dexterity.'),
  intelligence: z.number().describe('Player\'s knowledge and problem-solving ability.'),
});
export type CharacterStats = z.infer<typeof CharacterStatsSchema>;

const NarrateActionInputSchema = z.object({
  action: z.string().describe('The action the player takes in the game.'),
  previousNarrative: z.string().describe('The previous narrative context.'),
  inventory: z.array(z.string()).describe("Items currently in the player's inventory."),
  skills: z.array(z.string()).describe("Skills the player has acquired."),
  characterStats: CharacterStatsSchema.describe("Player character stats like health, strength, etc."),
  turnCount: z.number().describe("The current turn number in the game."),
});
export type NarrateActionInput = z.infer<typeof NarrateActionInputSchema>;

const NarrateActionOutputSchema = z.object({
  narrative: z.string().describe('A vivid description of what happens next in the game.'),
  gameOver: z.boolean().describe('Set to true if the game has ended (player won or lost).'),
  gameStatus: z.enum(["win", "loss", "ongoing"]).describe('The current status of the game. Set to "win" or "loss" if gameOver is true, otherwise "ongoing".'),
  feedback: z.string().optional().describe('Optional feedback. If the game ended, explain why (e.g., "You defeated the Dragon Lord!"). If ongoing, can be a hint, comment, or describe a non-fatal consequence like "You take a glancing blow! -10 Health. You\'re still in the fight." This can also include information about items found, skills learned, or stat changes.'),
  updatedInventory: z.array(z.string()).optional().describe("The player's inventory after the action. Include if changed."),
  updatedSkills: z.array(z.string()).optional().describe("The player's skills after the action. Include if changed."),
  updatedCharacterStats: CharacterStatsSchema.optional().describe("The player's character stats after the action. Include if changed."),
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
The adventure should consist of approximately 15-20 distinct challenges or encounters before a WIN condition can be met. These challenges can include combat, puzzles, environmental hazards, or difficult choices.
A WIN should represent the culmination of a significant journey, potentially involving overcoming puzzles, managing limited resources (implied through narrative and stat changes like health), clever use of acquired items and skills, and defeating a final challenging foe or obstacle.
Do NOT allow the player to win in the first 7-8 turns; the journey must feel substantial and earned.
A LOSS might involve the player character's health reaching zero, failing a critical objective across multiple stages, or falling into an unrecoverable situation after several poor choices or unlucky events.

**Crucially, do NOT end the game, especially with a LOSS, within the first few (e.g., 5-6) player actions, even if the action seems suboptimal.** The player needs a chance to get started and learn. For early missteps or non-optimal actions, provide setbacks (e.g., "You stumble in the dark, twisting your ankle slightly, -5 Health. It'll make quick movements harder for a bit." or "Your hasty search yields nothing but dust, and you hear a faint click from a nearby mechanism.") rather than an immediate game over. An early game over should only be considered if an action is *exceptionally reckless and obviously self-destructive* (e.g., "drink the bubbling green poison labeled 'Certain Death'") AND the player has already had at least 3-4 turns to understand the game's stakes. If an action is simply unhelpful or doesn't make sense in the current context, narrate a neutral or slightly negative outcome without ending the game.

Introduce tougher choices *as the game progresses*. Decisions should have meaningful consequences, positive or negative, that can affect later stages of the adventure.
Introduce setbacks like injuries (reducing Health in 'updatedCharacterStats'), loss of a temporary advantage, triggering non-lethal traps, or encountering environmental hazards. These setbacks should test the player's resilience but not immediately end the game unless Health reaches 0. The player should have opportunities to react, adapt, or attempt to recover from these *later game* setbacks.
Enemies and obstacles should scale in difficulty. Early encounters might be minor threats, while later stages present more formidable challenges requiring careful thought, strategic use of items/skills, or favorable stats.
The player should have a chance to react to danger and make strategic decisions.

**Game Mechanics:**
*   **Items:** You can introduce items for the player to find (e.g., 'a rusty key', 'a healing potion', 'a glowing sword'). When an item is found, include it in \`updatedInventory\`. If an item is used or lost, remove it from \`updatedInventory\`.
*   **Skills:** The player might learn new skills through their actions or by interacting with the environment (e.g., 'lockpicking', 'fire magic', 'stealth'). When a skill is learned, include it in \`updatedSkills\`.
*   **Character Stats:** Player actions or events can affect their stats (Health, Strength, Agility, Intelligence). Reflect these changes in \`updatedCharacterStats\`.
    *   Health is crucial; if it reaches 0, the game is a LOSS (set gameOver: true, gameStatus: "loss").
    *   Strength can influence combat effectiveness.
    *   Agility can help in avoiding traps or performing nimble actions.
    *   Intelligence can be used for solving puzzles or identifying magical properties.
    *   Stats can be increased by finding magical items, training, or special events.
*   **Influence:** The player's inventory, skills, and stats should influence the narrative and their ability to overcome challenges. For example, having a 'rope' in inventory might allow them to cross a chasm. Having 'stealth' skill might allow them to avoid an enemy. Higher 'strength' might mean they defeat an enemy easier. If a stat/item/skill is relevant, mention it in the narrative or feedback.
*   **Winning:** Winning the game should require significant progression and often the strategic use of several acquired items, skills, and favorable stats. Not all items/skills are *required*, but players who gather and utilize more of them will have a better chance of success.

**Player State:**
Turn: {{{turnCount}}}
Previous Narrative: {{{previousNarrative}}}
Inventory: {{#if inventory.length}} {{#each inventory}} "{{{this}}}" {{/each}} {{else}} Empty {{/if}}
Skills: {{#if skills.length}} {{#each skills}} "{{{this}}}" {{/each}} {{else}} None {{/if}}
Character Stats:
  Health: {{{characterStats.health}}}
  Strength: {{{characterStats.strength}}}
  Agility: {{{characterStats.agility}}}
  Intelligence: {{{characterStats.intelligence}}}

Player Action:
{{{action}}}

Based on the player's action, current state, and the previous narrative, considering the overall progress through the multi-stage adventure:
1.  Generate a vivid, concise description of what happens next (the 'narrative'). Keep it under 100 words.
2.  Update inventory, skills, and/or character stats if the action results in changes. If an item is used, remove it. If stats change, provide the new values.
3.  Determine if this action leads to the end of the game.
    - If the game ends (e.g., health <= 0, or final objective met), set 'gameOver' to true. Set 'gameStatus' to "win" or "loss". Remember, a "win" should only occur after significant progression through multiple challenges (aim for 15-20 encounters/turns). A "loss" should also generally result from accumulated failures or significant missteps after some progression, not on an initial action unless the strict criteria above are met.
    - If the game continues, set 'gameOver' to false and 'gameStatus' to "ongoing".
4.  Provide brief 'feedback'.
    - If the game ended with a WIN: Explain the culmination of their journey (e.g., "After a grueling journey, using your cunning and the powerful Sunstone Amulet you found, you vanquish the Lich King! Your name will be sung by bards for generations!").
    - If the game ended with a LOSS: Explain why their adventure ended (e.g., "The accumulated wounds from many battles and the final crushing blow from the Ogre Champion prove too much. Your Health drops to zero. Darkness takes you." or "Your reckless charge into the dragon's lair, without the Dragonbane Sword, was your last mistake.").
    - If ongoing: Provide a subtle hint for what the player might do next, a comment on their action, or describe a non-fatal consequence including any item/skill/stat changes (e.g., "You find a Healing Potion! It's added to your inventory." or "The goblin shaman's curse saps some of your strength, -2 Strength. The next fight will feel harder." or "You manage to decipher the ancient runes, gaining the 'Arcane Lore' skill!").

Stay in character as the dungeon master. Ensure the output strictly adheres to the NarrateActionOutputSchema.
The game needs to have an end result, good or bad, for the user depending on their actions over a significant series of challenges and encounters.
Ensure that if updatedCharacterStats is provided, all stat fields (health, strength, agility, intelligence) are included with their current values, even if some didn't change from the input.
If an item is found, add it to updatedInventory. If used/lost, remove it from updatedInventory.
If a skill is gained, add it to updatedSkills.
Do not repeat items/skills in the updated lists if they were already present and unchanged.
Return updatedInventory, updatedSkills, or updatedCharacterStats only if there was a change to them.
If Health drops to 0 or below, the game MUST end in a "loss".
`,
});

const narrateActionFlow = ai.defineFlow(
  {
    name: 'narrateActionFlow',
    inputSchema: NarrateActionInputSchema,
    outputSchema: NarrateActionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    if (output) {
        // Ensure that if gameOver is true, gameStatus is either 'win' or 'loss'.
        if (output.gameOver && output.gameStatus === 'ongoing') {
            output.gameStatus = 'loss'; 
        }
        // If health is 0 or less, and game isn't marked as over, mark it as a loss.
        if (output.updatedCharacterStats && output.updatedCharacterStats.health <= 0 && !output.gameOver) {
            output.gameOver = true;
            output.gameStatus = 'loss';
            if (!output.feedback) {
                output.feedback = "Your health has reached zero. The adventure ends."
            }
        }
    }
    return output!;
  }
);

export type { CharacterStats as CharacterStatsType };
