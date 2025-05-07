
'use client';

import type * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceStrict, parseISO } from 'date-fns';
import { CalendarDays, Clock, ListChecks, Package, BookOpen, Heart, Shield, Zap, Dumbbell, Brain } from 'lucide-react';
import type { CharacterStatsType } from '@/ai/flows/narrate-action'; // Import CharacterStatsType
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


export interface RunData {
  id: string;
  startTime: string;
  endTime: string;
  narratives: string[];
  status: 'win' | 'loss';
  turns: number;
  finalFeedback?: string;
  finalInventory: string[];
  finalSkills: string[];
  finalCharacterStats: CharacterStatsType;
}

interface PastRunsDisplayProps {
  runs: RunData[];
}

const DEFAULT_PAST_RUN_STATS: CharacterStatsType = {
  health: 0,
  strength: 0,
  agility: 0,
  intelligence: 0,
};

export function PastRunsDisplay({ runs }: PastRunsDisplayProps) {
  if (runs.length === 0) {
    return (
      <Card className="mt-8 shadow-lg border-accent/10 bg-card">
        <CardHeader>
          <CardTitle className="text-2xl text-accent flex items-center">
            <Clock className="mr-3 h-6 w-6" /> Past Adventures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No past adventures recorded yet. Embark on your first quest!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-lg border-accent/10 bg-card">
      <CardHeader>
        <CardTitle className="text-2xl text-accent flex items-center">
          <Clock className="mr-3 h-6 w-6" /> Past Adventures
        </CardTitle>
        <CardDescription>Review your previous journeys through the dungeon.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-2"> {/* Increased height */}
          <div className="space-y-4">
            {runs.slice().reverse().map((run) => {
              const startDate = parseISO(run.startTime);
              const endDate = parseISO(run.endTime);
              let duration = 'N/A';
              try {
                 duration = formatDistanceStrict(endDate, startDate);
              } catch (e) {
                console.warn("Error formatting date for run:", run.id, e);
              }
              
              const characterStatsToDisplay = run.finalCharacterStats || DEFAULT_PAST_RUN_STATS;

              return (
                <Card key={run.id} className="bg-background/50 border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-foreground/90">
                        Adventure Log #{runs.length - runs.indexOf(run)}
                      </CardTitle>
                      <Badge variant={run.status === 'win' ? 'default' : 'destructive'} className="capitalize text-xs px-2 py-0.5">
                        {run.status}
                      </Badge>
                    </div>
                     <CardDescription className="text-xs text-muted-foreground flex items-center pt-1">
                       <CalendarDays className="h-3 w-3 mr-1.5" /> {startDate.toLocaleDateString()} {startDate.toLocaleTimeString()}
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2 shrink-0" /> 
                        <span>Duration: {duration}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <ListChecks className="h-4 w-4 mr-2 shrink-0" />
                        <span>Turns: {run.turns}</span>
                      </div>
                    </div>
                    {run.finalFeedback && (
                      <p className="mb-2 text-xs italic text-foreground/70 border-l-2 border-accent/50 pl-2">
                        "{run.finalFeedback}"
                      </p>
                    )}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="details" className="border-b-0">
                        <AccordionTrigger className="text-xs py-1 hover:no-underline text-muted-foreground">View Final Stats & Items</AccordionTrigger>
                        <AccordionContent className="pt-2 space-y-2">
                          <div>
                            <h4 className="text-xs font-semibold text-foreground/80 mb-1 flex items-center"><Dumbbell className="mr-1.5 h-3 w-3" />Final Stats:</h4>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              <span><Heart className="inline mr-1 h-3 w-3 text-red-500" />H: {characterStatsToDisplay.health}</span>
                              <span><Shield className="inline mr-1 h-3 w-3 text-blue-500" />S: {characterStatsToDisplay.strength}</span>
                              <span><Zap className="inline mr-1 h-3 w-3 text-yellow-500" />A: {characterStatsToDisplay.agility}</span>
                              <span><Brain className="inline mr-1 h-3 w-3 text-purple-500" />I: {characterStatsToDisplay.intelligence}</span>
                            </div>
                          </div>
                          <Separator className="my-1" />
                           <div>
                            <h4 className="text-xs font-semibold text-foreground/80 mb-1 flex items-center"><Package className="mr-1.5 h-3 w-3" />Final Inventory:</h4>
                            {run.finalInventory && run.finalInventory.length > 0 ? (
                              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                                {run.finalInventory.map((item, i) => <li key={`inv-${i}`} className="capitalize">{item}</li>)}
                              </ul>
                            ) : <p className="text-xs text-muted-foreground italic">None</p>}
                          </div>
                          <Separator className="my-1" />
                          <div>
                            <h4 className="text-xs font-semibold text-foreground/80 mb-1 flex items-center"><BookOpen className="mr-1.5 h-3 w-3" />Final Skills:</h4>
                            {run.finalSkills && run.finalSkills.length > 0 ? (
                              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                                {run.finalSkills.map((skill, i) => <li key={`skill-${i}`} className="capitalize">{skill}</li>)}
                              </ul>
                            ) : <p className="text-xs text-muted-foreground italic">None</p>}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

