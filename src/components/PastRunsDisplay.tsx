'use client';

import type * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceStrict, parseISO } from 'date-fns';
import { CalendarDays, Clock, ListChecks } from 'lucide-react';

export interface RunData {
  id: string;
  startTime: string;
  endTime: string;
  narratives: string[]; // Kept for potential future "view full log" feature
  status: 'win' | 'loss';
  turns: number;
  finalFeedback?: string;
}

interface PastRunsDisplayProps {
  runs: RunData[];
}

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
        <ScrollArea className="h-[300px] pr-2"> {/* Reduced pr for tighter look */}
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
              
              return (
                <Card key={run.id} className="bg-background/50 border-border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-foreground/90">
                        Adventure Log
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
                    <div className="flex items-center text-muted-foreground mb-1">
                      <Clock className="h-4 w-4 mr-2 shrink-0" /> 
                      <span>Duration: {duration}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <ListChecks className="h-4 w-4 mr-2 shrink-0" />
                      <span>Turns: {run.turns}</span>
                    </div>
                    {run.finalFeedback && (
                      <p className="mt-2 text-xs italic text-foreground/70 border-l-2 border-accent/50 pl-2">
                        "{run.finalFeedback}"
                      </p>
                    )}
                  </CardContent>
                  {/* Optional: Add a footer for actions like "View Details"
                  <CardFooter className="px-4 py-2 border-t">
                    <Button variant="link" size="sm" className="p-0 h-auto">View Full Log</Button>
                  </CardFooter>
                  */}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
