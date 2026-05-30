// TODO: integrar com Claude/IA para gerar respostas no modo chat.
// Enquanto a integração não está pronta, o endpoint responde 501.
export async function POST() {
  return Response.json(
    { error: 'Integração com IA ainda não configurada.' },
    { status: 501 }
  );
}
