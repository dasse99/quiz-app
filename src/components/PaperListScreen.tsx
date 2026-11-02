import type { InvalidPaper, PaperEntry } from "@/lib/papers";

type Props = {
  papers: PaperEntry[];
  invalidPapers: InvalidPaper[];
  onSelect: (paper: PaperEntry) => void;
};

export function PaperListScreen({ papers, invalidPapers, onSelect }: Props) {
  return (
    <section className="card">
      <h1>문제풀이</h1>

      {papers.length > 0 ? (
        <>
          <p className="lead">풀고 싶은 문제지를 선택하세요.</p>
          <ul className="paper-list">
            {papers.map((paper) => (
              <li key={paper.fileName}>
                <button className="paper-button" type="button" onClick={() => onSelect(paper)}>
                  {paper.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="lead">아직 풀 수 있는 문제지가 없습니다.</p>
      )}

      {invalidPapers.length > 0 && (
        <div className="error-box" role="alert">
          <h2>열 수 없는 문제지가 있습니다</h2>
          {invalidPapers.map((paper) => (
            <div className="error-file" key={paper.fileName}>
              <h3>{paper.fileName}</h3>
              <ul>
                {paper.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ))}
          <p>question-papers 폴더의 파일을 고쳐 주세요.</p>
        </div>
      )}
    </section>
  );
}
