import { TinyFish } from "@tiny-fish/sdk";

export interface TargetInput {
  url: string;
}

export interface Candidate {
  developerName: string;
  portfolioUrl: string;
  techStack: string[];
  topProject: string;
  projectUrl: string;
  summary: string;
}

export async function evaluatePortfolio(input: TargetInput, onProgress: (msg: string) => void): Promise<Candidate> {
  const client = new TinyFish();
  
  const instruction = `
You are 'HireScan', an autonomous technical recruiter.
1. Read the personal developer portfolio website at the given URL.
2. Navigate through their projects and experience sections.
3. Extract the developer's name, their primary tech stack (as an array of strings), the name of their most impressive project, a link to that project (if available), and a 1-sentence summary of what they build.
4. Return a single JSON object with the exact keys: 'developerName', 'portfolioUrl', 'techStack', 'topProject', 'projectUrl', 'summary'. Give me ONLY the JSON object.
  `.trim();

  const stream = await client.agent.stream({
    goal: instruction,
    url: input.url,
  });

  let latestData: any = null;

  for await (const event of stream) {
    if (event.type === "PROGRESS") {
      onProgress(event.purpose || "Processing step...");
    } else if (event.type === "STREAMING_URL") {
      if (event.streaming_url) {
        onProgress(`Browser View available at: ${event.streaming_url}`);
      }
    } else if (event.type === "COMPLETE") {
      latestData = event.result;
    }
  }
  
  if (!latestData) {
    throw new Error("Agent stream completed without returning data.");
  }
  
  return latestData as Candidate;
}
