import { SectionCard } from "./SectionCard";

type EndpointsSectionProps = {
  endpoints: string[];
};

export function EndpointsSection({ endpoints }: EndpointsSectionProps) {
  return (
    <SectionCard title="Endpoints">
      <ul style={{ margin: 0 }}>
        {endpoints.map((endpoint) => (
          <li key={endpoint}>
            <code>POST {endpoint}</code>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
