import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <section className="card">
        <h1>문제풀이</h1>
        <p className="lead">어떤 역할로 시작할지 선택하세요.</p>
        <div className="role-list">
          <Link className="paper-button" href="/teacher">
            교사로 시작하기
          </Link>
          <Link className="paper-button" href="/student">
            학생으로 시작하기
          </Link>
        </div>
      </section>
    </main>
  );
}
