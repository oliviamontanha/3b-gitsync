const MATRIX_PATH = '/storage/attack_matrix/matrix.json';

function respond(status: string, body: string, headers: string[] = []): void {
  process.stdout.write(
    [
      `HTTP/1.1 ${status}`,
      'Content-Type: application/json',
      `Content-Length: ${Buffer.byteLength(body)}`,
      ...headers,
      '',
      body,
    ].join('\r\n'),
  );
}

const file = Bun.file(MATRIX_PATH);
if (!(await file.exists())) {
  respond('404 Not Found', JSON.stringify({ error: 'No ATT&CK matrix cached yet. Run the Refresh ATT&CK step.' }));
} else {
  respond('200 OK', await file.text(), ['Cache-Control: public, max-age=300']);
}
