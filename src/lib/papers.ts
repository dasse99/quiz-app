import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parsePaperFile, type Paper } from "./quiz.ts";

export type PaperEntry = Paper & { fileName: string };

export type InvalidPaper = {
  fileName: string;
  errors: string[];
};

export type PaperList = {
  papers: PaperEntry[];
  invalidPapers: InvalidPaper[];
};

export async function loadPapers(
  directory = path.join(process.cwd(), "question-papers"),
): Promise<PaperList> {
  const entries = await readdir(directory, { withFileTypes: true });
  const fileNames = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "ko"));

  const papers: PaperEntry[] = [];
  const invalidPapers: InvalidPaper[] = [];

  for (const fileName of fileNames) {
    const parsed = parsePaperFile(await readFile(path.join(directory, fileName), "utf8"));
    if (parsed.ok) {
      papers.push({ fileName, title: parsed.title, questions: parsed.questions });
    } else {
      invalidPapers.push({ fileName, errors: parsed.errors });
    }
  }

  return { papers, invalidPapers };
}
