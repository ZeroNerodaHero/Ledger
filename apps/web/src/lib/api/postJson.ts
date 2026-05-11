export async function postJson(
  baseUrl: string,
  path: string,
  payload: Record<string, unknown>
): Promise<{ status: number; data: any }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  return { status: response.status, data };
}
