import type { Metadata } from "next";
import { TeacherScreen } from "@/components/TeacherScreen";

export const metadata: Metadata = {
  title: "교사 화면 | 문제풀이",
};

export default function TeacherPage() {
  return <TeacherScreen />;
}
