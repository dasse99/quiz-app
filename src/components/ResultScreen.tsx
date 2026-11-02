import type { Question, QuizResult } from "@/lib/quiz";

type Props = {
  result: QuizResult;
  onRestart: () => void;
};

function optionText(question: Question, number: number) {
  return `${number}. ${question.options[number - 1]}`;
}

export function ResultScreen({ result, onRestart }: Props) {
  return (
    <section className="result">
      <div className="card score-card">
        <h1>결과</h1>
        <p className="score">{result.score}점</p>
        <p className="score-detail">
          {result.total}문항 중 {result.correctCount}문항을 맞혔습니다.
        </p>
      </div>

      <ol className="result-list">
        {result.results.map(({ question, selected, isCorrect }, index) => (
          <li key={index} className={isCorrect ? "card result-item correct" : "card result-item wrong"}>
            <p className="result-head">
              <span>{index + 1}번</span>
              <span className="mark">{isCorrect ? "맞음" : "틀림"}</span>
            </p>
            <p className="result-question">{question.question}</p>
            <dl className="result-info">
              <div>
                <dt>내가 고른 답</dt>
                <dd>{optionText(question, selected)}</dd>
              </div>
              <div>
                <dt>정답</dt>
                <dd>{optionText(question, question.correctAnswer)}</dd>
              </div>
              <div>
                <dt>해설</dt>
                <dd>{question.explanation}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>

      <button className="button primary" type="button" onClick={onRestart}>
        다른 파일 풀기
      </button>
    </section>
  );
}
