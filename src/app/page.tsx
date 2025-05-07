'use client';

import * as React from 'react';
import { ArrowRight, Loader2, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { generateInitialScene } from '@/ai/flows/generate-initial-scene';
import { narrateAction } from '@/ai/flows/narrate-action';

const INITIAL_GAME_PROMPT = "The adventurer stands at the entrance of a long-forgotten dungeon, rumored to hold immense treasures and equally great dangers. The air is heavy with the scent of dust and decay.";

export default function TextVenturePage() {
  const [narratives, setNarratives] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(scrollToBottom, [narratives]);

  React.useEffect(() => {
    async function startGame() {
      setIsLoading(true);
      setError(null);
      try {
        const initialScene = await generateInitialScene({ prompt: INITIAL_GAME_PROMPT });
        setNarratives([initialScene.sceneDescription]);
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
    }
    startGame();
  }, [toast]);

  const handleSubmitAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const currentAction = inputValue.trim();
    setInputValue(''); // Clear input immediately for better UX
    setIsLoading(true);
    setError(null);

    // Optimistically add player action (optional, for flavor)
    // setNarratives(prev => [...prev, `> ${currentAction}`]);

    try {
      const previousNarrative = narratives.length > 0 ? narratives[narratives.length - 1] : INITIAL_GAME_PROMPT;
      const result = await narrateAction({ action: currentAction, previousNarrative });
      setNarratives(prev => [...prev, result.narrative]);
    } catch (e) {
      console.error('Error narrating action:', e);
      setError('The Dungeon Master seems confused. Try a different action.');
      toast({
        title: 'Error',
        description: 'Could not process your action.',
        variant: 'destructive',
      });
      // Optionally, put the input back if submission failed.
      // setInputValue(currentAction); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 md:p-8 font-serif">
      <main className="w-full max-w-3xl flex-grow flex flex-col">
        <Card className="shadow-2xl w-full h-full flex flex-col border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
            <CardTitle className="text-3xl font-bold text-accent">TextVenture</CardTitle>
            <Swords className="h-8 w-8 text-accent" data-ai-hint="fantasy weapon" />
          </CardHeader>

          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full w-full p-6 bg-background">
              {narratives.map((text, index) => (
                <p key={index} className="mb-4 animate-fadeIn text-lg leading-relaxed text-foreground/90">
                  {text}
                </p>
              ))}
              <div ref={messagesEndRef} />
              {isLoading && narratives.length === 0 && ( // Initial loading
                 <div className="flex items-center justify-center text-muted-foreground mt-4 h-full">
                   <Loader2 className="mr-2 h-8 w-8 animate-spin text-accent" />
                   <span>Crafting your epic...</span>
                 </div>
              )}
               {isLoading && narratives.length > 0 && ( // Subsequent loading
                 <div className="flex items-center text-muted-foreground mt-4 animate-fadeIn">
                   <Loader2 className="mr-2 h-5 w-5 animate-spin text-accent" />
                   <span>The Dungeon Master is pondering...</span>
                 </div>
              )}
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 border-t border-border">
            <form onSubmit={handleSubmitAction} className="flex w-full items-center gap-3">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What path will you choose?"
                className="flex-grow text-base bg-card text-card-foreground placeholder:text-muted-foreground focus:ring-accent"
                disabled={isLoading && narratives.length === 0} // Disable input during initial load
                aria-label="Player action input"
              />
              <Button 
                type="submit" 
                disabled={(isLoading && narratives.length === 0) || !inputValue.trim()} 
                variant="default" 
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isLoading && narratives.length > 0 ? (
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
        </Card>
        {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}
      </main>
    </div>
  );
}
