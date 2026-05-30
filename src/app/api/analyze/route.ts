// TODO: integrar com Claude/IA para gerar a análise clínica real.
// Enquanto a integração não está pronta, o endpoint responde 501
// para evitar que a UI exiba dados fake.
export async function POST() {
  return Response.json(
    { error: 'Integração com IA ainda não configurada.' },
    { status: 501 }
  );
}
