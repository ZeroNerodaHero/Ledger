import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section style={{ display: "grid", gap: 8, border: "1px solid #ddd", padding: 12 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {children}
    </section>
  );
}
