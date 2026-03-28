import { TinyFish } from "@tiny-fish/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { mode, query, limit, urls } = await req.json();

    if (!process.env.TINYFISH_API_KEY) {
      return Response.json({ error: "Missing TINYFISH_API_KEY in .env" }, { status: 500 });
    }

    const requestLimit = typeof limit === "string" ? parseInt(limit) || 3 : limit || 3;
    const client = new TinyFish({ apiKey: process.env.TINYFISH_API_KEY });
    const encoder = new TextEncoder();

    async function* triModalStream() {
      const allCandidates: any[] = [];
      let discoveredUrls: string[] = [];
      
      yield encoder.encode(`data: {"type":"STARTED"}\n\n`);
      
      // ==========================================
      // STAGE 1: DISCOVERY ENGINE
      // ==========================================
      if (mode === 'DISCOVERY' || mode === 'E2E') {
        yield encoder.encode(`data: {"type":"PROGRESS","purpose":"[Agent 1: Discovery] Initializing search for ${requestLimit} portfolios matching '${query}'..."}\n\n`);
        
        const discoveryInstruction = `
You are a highly strict technical sourcer. Use the DuckDuckGo search bar layout to search specifically for "personal developer portfolio website ${query}".
CRITICAL DIRECTIVE: DO NOT navigate to any job boards (like LinkedIn, Indeed, Greenhouse, or Workday). You MUST ONLY find independent, custom-built personal developer websites (e.g., https://johndoe.com, https://janedoe.me).
Find exactly ${requestLimit} distinct personal developer portfolio URLs.
Return ONLY a JSON array of strings containing exactly ${requestLimit} URLs. Example: ["https://leerob.io", "https://brittanychiang.com"]. Do not return any other JSON structure or text.
        `.trim();
        
        try {
          const discStream = await client.agent.stream({ goal: discoveryInstruction, url: "https://duckduckgo.com" });
          for await (const chunk of discStream) {
            if (chunk.type === "COMPLETE") {
               const rawResult = chunk.result as any;
               let extractedUrls: string[] = [];

               if (Array.isArray(rawResult)) {
                   extractedUrls = rawResult.filter((s:any) => typeof s === 'string' && s.startsWith('http'));
               } else if (typeof rawResult === 'object' && rawResult !== null) {
                   for (const key in rawResult) {
                       if (Array.isArray(rawResult[key])) {
                           extractedUrls = rawResult[key].filter((s:any) => typeof s === 'string' && s.startsWith('http'));
                           break;
                       }
                   }
               }
               
               if (extractedUrls.length === 0) {
                   const strMap = JSON.stringify(rawResult);
                   const matches = strMap.match(/https?:\/\/[^\s"',\]}]+/g);
                   if (matches) extractedUrls = matches;
               }

               discoveredUrls = extractedUrls.length > 0 ? extractedUrls : [JSON.stringify(rawResult)];
               
               yield encoder.encode(`data: {"type":"PROGRESS","purpose":"[Agent 1: Discovery] Found ${discoveredUrls.length} portfolios!"}\n\n`);
               
               // If strictly DISCOVERY mode, we terminate here and return the URLs as a structured array
               if (mode === 'DISCOVERY') {
                   const discoveryResults = discoveredUrls.map(u => ({ "Discovered Portfolio URL": u }));
                   yield encoder.encode(`data: {"type":"COMPLETE","result":${JSON.stringify(discoveryResults)}}\n\n`);
                   return;
               } else {
                   yield encoder.encode(`data: {"type":"PROGRESS","purpose":"[Agent 1: Discovery] Handoff to Agent 2 Evaluator Array..."}\n\n`);
               }
            } else if (chunk.type !== "STARTED") {
               yield encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
            }
          }
        } catch(e: any) {
          yield encoder.encode(`data: {"type":"PROGRESS","purpose":"[Agent 1: Discovery] Failed finding portfolios: ${e.message}"}\n\n`);
          yield encoder.encode(`data: {"type":"COMPLETE","result":[]}\n\n`);
          return;
        }
      }

      // ==========================================
      // STAGE 2: EVALUATOR ORCHESTRATOR
      // ==========================================
      if (mode === 'EVALUATE' || mode === 'E2E') {
        const evalInstruction = `
You are the Evaluation Agent. Read this personal developer portfolio.
Extract: developerName, portfolioUrl, techStack (array of strings), topProject, projectUrl, and a 1-sentence summary what they build.
Return ONLY a single JSON object with these exact keys.
        `.trim();

        // Use direct URLs array if EVALUATE mode, otherwise use discoveredUrls from E2E stage
        const targetUrls = mode === 'EVALUATE' ? urls : discoveredUrls;
        const safeUrls = targetUrls.slice(0, Math.min(targetUrls.length, 10)); // Cap to prevent massive demo delays

        if (!safeUrls || safeUrls.length === 0) {
            yield encoder.encode(`data: {"type":"PROGRESS","purpose":"[Agent 2: Evaluator] No valid URLs found to evaluate."}\n\n`);
            yield encoder.encode(`data: {"type":"COMPLETE","result":[]}\n\n`);
            return;
        }

        for (let i = 0; i < safeUrls.length; i++) {
          const url = safeUrls[i];
          if (typeof url !== 'string' || !url.startsWith('http')) continue;
          
          yield encoder.encode(`data: {"type":"META","current":${i + 1},"total":${safeUrls.length},"etaSeconds":${(safeUrls.length - i) * 45}}\n\n`);
          yield encoder.encode(`data: {"type":"PROGRESS","purpose":"[Agent 2: Evaluator] Analyzing Candidate ${i + 1}/${safeUrls.length}: ${url}"}\n\n`);
          
          try {
            const evalStream = await client.agent.stream({ goal: evalInstruction, url });

            for await (const chunk of evalStream) {
              if (chunk.type === "COMPLETE") {
                 allCandidates.push(chunk.result);
                 yield encoder.encode(`data: {"type":"PROGRESS","purpose":"[Agent 2: Evaluator] Profile extracted for ${url}."}\n\n`);
              } else if (chunk.type !== "STARTED") {
                 yield encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
              }
            }
          } catch(e: any) {
               yield encoder.encode(`data: {"type":"PROGRESS","purpose":"[Agent 2: Evaluator] Failed on ${url}: ${e.message}"}\n\n`);
          }
        }
        
        // Final delivery of composite metrics
        yield encoder.encode(`data: {"type":"COMPLETE","result":${JSON.stringify(allCandidates)}}\n\n`);
      }
    }

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of triModalStream()) {
            controller.enqueue(chunk);
          }
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ERROR", message: err.message })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
