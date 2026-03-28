import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { parse } from "json2csv";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { evaluatePortfolio, Candidate } from "./agent";

dotenv.config();

const program = new Command();

program
  .name("hirescan")
  .description("Autonomous Developer Portfolio Evaluator using TinyFish Web Agent API")
  .version("1.0.0");

program
  .command("evaluate")
  .description("Feed a CSV list of developer portfolios and extract grade/tech stack")
  .requiredOption("-i, --input <path>", "Path to input CSV containing URLs")
  .option("-o, --output <path>", "Path to save CSV output", "candidates.csv")
  .action(async (options) => {
    if (!process.env.TINYFISH_API_KEY) {
      console.log(chalk.red("Error: TINYFISH_API_KEY environment variable is missing."));
      console.log(chalk.yellow("Create a .env file or set it in your environment."));
      process.exit(1);
    }

    const { input, output } = options;
    console.log(chalk.blue(`\n🔍 HireScan Initialization\n`));

    let urls: string[] = [];
    try {
      const fileContent = fs.readFileSync(input, 'utf-8');
      urls = fileContent.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    } catch(e) {
      console.error(chalk.red(`Could not read input file ${input}`));
      process.exit(1);
    }

    console.log(chalk.gray(`Will evaluate ${chalk.white(urls.length)} personal portfolios...`));
    
    const candidates: Candidate[] = [];

    for (const url of urls) {
      const spinner = ora(`Analyzing ${url}...`).start();
      try {
        const candidate = await evaluatePortfolio({ url }, (msg) => {
           spinner.text = chalk.cyan(`[${url}] ${msg}`);
        });
        candidates.push(candidate);
        spinner.succeed(chalk.green(`Evaluated: ${candidate.developerName} (Stack: ${candidate.techStack?.join(", ") || 'N/A'})`));
      } catch(err: any) {
        spinner.fail(chalk.red(`Failed on ${url}: ${err.message}`));
      }
    }

    if (candidates.length > 0) {
      console.log(chalk.gray("\nFinal AI Deliverables:"));
      console.dir(candidates, { depth: null, colors: true });

      const csv = parse(candidates);
      fs.writeFileSync(output, csv);
      console.log(chalk.green(`\nSaved output to ${output}`));
    } else {
      console.log(chalk.yellow("\nNo candidates were extracted."));
    }
  });

program.parse();
