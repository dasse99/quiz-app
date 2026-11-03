import type { PaperSummary } from "@/lib/records";

type Props = {
  papers: PaperSummary[] | null;
  error: string | null;
  onSelect: (paper: PaperSummary) => void;
  onRetry: () => void;
};

export function PaperListScreen({ papers, error, onSelect, onRetry }: Props) {
  return (
    <section className="card">
      <h1>문제풀이</h1>

      {papers === null && error === null && <p className="lead">문제지 목록을 불러오고 있습니다.</p>}

      {papers !== null &&
        (papers.length > 0 ? (
          <>
            <p className="lead">풀고 싶은 문제지를 선택하세요.</p>
            <ul className="paper-list">
              {papers.map((paper) => (
                <li key={paper.id}>
                  <button className="paper-button" type="button" onClick={() => onSelect(paper)}>
                    {paper.title}
                    <span className="paper-meta">{paper.questionCount}문항</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="lead">아직 공개된 문제지가 없습니다. 선생님이 문제지를 공개하면 여기에 나타납니다.</p>
        ))}

      {error !== null && (
        <div className="error-box" role="alert">
          <h2>문제지를 불러오지 못했습니다</h2>
          <p>{error}</p>
          <button className="button small retry" type="button" onClick={onRetry}>
            다시 불러오기
          </button>
        </div>
      )}
    </section>
  );
}
