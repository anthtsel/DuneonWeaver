'use client';

import * as React from 'react';
import { ArrowRight, Loader2, Swords, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generateInitialScene } from '@/ai/flows/generate-initial-scene';
import { narrateAction } from '@/ai/flows/narrate-action';
import { PastRunsDisplay, type RunData as PastRunDataType } from '@/components/PastRunsDisplay';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge'; // Added import for Badge

const INITIAL_GAME_PROMPT = "The adventurer stands at the entrance of a long-forgotten dungeon, rumored to hold immense treasures and equally great dangers. The air is heavy with the scent of dust and decay.";
const STORAGE_KEY = 'dungeonWeaverRuns';

export default function DungeonWeaverPage() {
  const [narratives, setNarratives] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true); // Start true for initial load
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const [gameEnded, setGameEnded] = React.useState(false);
  const [gameResult, setGameResult] = React.useState<'win' | 'loss' | null>(null);
  const [turnCount, setTurnCount] = React.useState(0);
  const [currentFeedback, setCurrentFeedback] = React.useState<string | null>(null);
  const [finalOutcomeFeedback, setFinalOutcomeFeedback] = React.useState<string | null>(null);
  const [pastRuns, setPastRuns] = React.useState<PastRunDataType[]>([]);
  const gameStartTimeRef = React.useRef<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(scrollToBottom, [narratives, currentFeedback]);

  const startGameLogic = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNarratives([]);
    setInputValue('');
    setGameEnded(false);
    setGameResult(null);
    setTurnCount(0);
    setCurrentFeedback(null);
    setFinalOutcomeFeedback(null);

    try {
      gameStartTimeRef.current = new Date().toISOString();
      const initialScene = await generateInitialScene({ prompt: INITIAL_GAME_PROMPT });
      setNarratives([initialScene.sceneDescription]);
      setTurnCount(1); // Initial scene counts as turn 1
    } catch (e) {
      console.error('Error starting game:', e);
      setError('Failed to start the adventure. Please refresh and try again.');
      toast({
        title: 'Error',
        description: 'Could not generate the initial scene.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    startGameLogic();
    try {
      const loadedRuns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as PastRunDataType[];
      setPastRuns(loadedRuns);
    } catch (storageError) {
      console.error("Failed to load runs from localStorage:", storageError);
      toast({
        title: "Load Error",
        description: "Could not load past adventures.",
        variant: "destructive",
      });
    }
  }, [startGameLogic, toast]);

  const handleSubmitAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim() || isLoading || gameEnded) return;

    const currentAction = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setError(null);
    setCurrentFeedback(null); // Clear previous turn's feedback

    try {
      const previousNarrative = narratives.length > 0 ? narratives[narratives.length - 1] : INITIAL_GAME_PROMPT;
      const result = await narrateAction({ action: currentAction, previousNarrative });
      
      setNarratives(prev => [...prev, result.narrative]);
      const newTurnCount = turnCount + 1;
      setTurnCount(newTurnCount);

      if (result.feedback) {
        setCurrentFeedback(result.feedback);
      }

      if (result.gameOver) {
        const finalStatus = (result.gameStatus === 'win' || result.gameStatus === 'loss') ? result.gameStatus : 'loss';
        setGameEnded(true);
        setGameResult(finalStatus);
        setFinalOutcomeFeedback(result.feedback || null);

        const runEndTime = new Date().toISOString();
        const newRun: PastRunDataType = {
          id: gameStartTimeRef.current + '-' + runEndTime, 
          startTime: gameStartTimeRef.current,
          endTime: runEndTime,
          narratives: [...narratives, result.narrative],
          status: finalStatus,
          turns: newTurnCount,
          finalFeedback: result.feedback || undefined,
        };
        
        try {
          const existingRuns = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as PastRunDataType[];
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...existingRuns, newRun]));
          setPastRuns(prevRuns => [...prevRuns, newRun]);
        } catch (storageError) {
          console.error("Failed to save run to localStorage:", storageError);
          toast({
            title: "Save Error",
            description: "Could not save your game progress locally.",
            variant: "destructive",
          });
        }

        toast({
          title: finalStatus === 'win' ? "Victory!" : "Defeat!",
          description: result.feedback || (finalStatus === 'win' ? "You have conquered the dungeon!" : "Your adventure ends here."),
          variant: finalStatus === 'win' ? 'default' : 'destructive',
          duration: 7000,
        });
      }
    } catch (e) {
      console.error('Error narrating action:', e);
      setError('The Dungeon Master seems confused. Try a different action.');
      toast({
        title: 'Error',
        description: 'Could not process your action.',
        variant: 'destructive',
      });
      setInputValue(currentAction); 
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = () => {
    startGameLogic();
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 md:p-8 font-serif">
        <main className="w-full max-w-3xl flex-grow flex flex-col">
          <Card className="shadow-2xl w-full h-full flex flex-col border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
              <CardTitle className="text-3xl font-bold text-accent">Dungeon Weaver</CardTitle>
              <div className="flex items-center gap-2">
                {!gameEnded && turnCount > 0 && (
                   <Tooltip>
                     <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-sm font-mono">
                           Turn: {turnCount}
                        </Badge>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Current turn in your adventure.</p>
                     </TooltipContent>
                   </Tooltip>
                )}
                <Swords className="h-8 w-8 text-accent" data-ai-hint="fantasy weapon" />
              </div>
            </CardHeader>

            <CardContent className="flex-grow overflow-hidden p-0">
              <ScrollArea className="h-[400px] w-full p-6 bg-background"> {/* Increased height */}
                {narratives.map((text, index) => (
                  <p key={index} className="mb-4 animate-fadeIn text-lg leading-relaxed text-foreground/90">
                    {text}
                  </p>
                ))}
                {currentFeedback && !gameEnded && (
                  <p className="mb-4 animate-fadeIn text-md italic text-accent/90">
                    DM: {currentFeedback}
                  </p>
                )}
                <div ref={messagesEndRef} />
                {isLoading && narratives.length === 0 && (
                   <div className="flex items-center justify-center text-muted-foreground mt-4 h-full">
                     <Loader2 className="mr-2 h-8 w-8 animate-spin text-accent" />
                     <span>Crafting your epic...</span>
                   </div>
                )}
                 {isLoading && narratives.length > 0 && !gameEnded && (
                   <div className="flex items-center text-muted-foreground mt-4 animate-fadeIn">
                     <Loader2 className="mr-2 h-5 w-5 animate-spin text-accent" />
                     <span>The Dungeon Master is pondering...</span>
                   </div>
                )}
              </ScrollArea>
            </CardContent>

            {!gameEnded ? (
              <CardFooter className="p-4 border-t border-border">
                <form onSubmit={handleSubmitAction} className="flex w-full items-center gap-3">
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="What path will you choose?"
                    className="flex-grow text-base bg-card text-card-foreground placeholder:text-muted-foreground focus:ring-accent"
                    disabled={isLoading || gameEnded}
                    aria-label="Player action input"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !inputValue.trim() || gameEnded} 
                    variant="default" 
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wait...
                      </>
                    ) : (
                      <>
                        Act <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardFooter>
            ) : (
              <CardFooter className="p-4 border-t border-border flex-col items-center justify-center">
                <div className="text-center animate-fadeIn">
                  <h2 className={`text-2xl font-bold mb-2 ${gameResult === 'win' ? 'text-primary' : 'text-destructive'}`}>
                    {gameResult === 'win' ? 'You are Victorious!' : 'Game Over!'}
                  </h2>
                  {finalOutcomeFeedback && (
                    <p className="text-muted-foreground mb-4 italic">
                      {finalOutcomeFeedback}
                    </p>
                  )}
                  <p className="text-muted-foreground mb-4">Total turns: {turnCount}</p>
                  <Button onClick={handlePlayAgain} variant="default" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <History className="mr-2 h-4 w-4" /> Play Again?
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
          {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}
          
          <PastRunsDisplay runs={pastRuns} />
        </main>
      </div>
    </TooltipProvider>
  );
}
