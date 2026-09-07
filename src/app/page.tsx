import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Multi-Agent Orchestrator</CardTitle>
            <Badge variant="secondary">setup</Badge>
          </div>
          <CardDescription>
            Next.js 16, Tailwind 4, shadcn/ui, Drizzle, Postgres, and the
            Anthropic SDK. Pipeline and canvas come next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>Run pipeline</Button>
        </CardContent>
      </Card>
    </main>
  );
}
