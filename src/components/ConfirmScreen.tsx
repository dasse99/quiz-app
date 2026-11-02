type Props = {
  fileName: string;
  questionCount: number;
  onStart: () => void;
};

export function ConfirmScreen({ fileName, questionCount, onStart }: Props) {
  return (
    <section className="card">
      <h1>문항 확인</h1>
      <dl className="file-info">
        <div>
          <dt>파일 이름</dt>
          <dd>{fileName}</dd>
        </div>
        <div>
          <dt>문항 수</dt>
          <dd>{questionCount}문항</dd>
        </div>
      </dl>
      <button className="button primary" type="button" onClick={onStart}>
        풀이 시작
      </button>
    </section>
  );
}
