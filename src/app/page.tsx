import { QuizApp } from "@/components/QuizApp";
import { loadPapers } from "@/lib/papers";

export default async function Home() {
  const { papers, invalidPapers } = await loadPapers();

  return <QuizApp papers={papers} invalidPapers={invalidPapers} />;
}
