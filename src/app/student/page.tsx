import type { Metadata } from "next";
import { StudentApp } from "@/components/StudentApp";

export const metadata: Metadata = {
  title: "학생 화면 | 문제풀이",
};

export default function StudentPage() {
  return <StudentApp />;
}
