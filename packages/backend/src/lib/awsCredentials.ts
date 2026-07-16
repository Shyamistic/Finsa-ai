function cleanSecret(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/^['"]|['"]$/g, '');
}

export function getExplicitAwsCredentials():
  | { accessKeyId: string; secretAccessKey: string; sessionToken?: string }
  | undefined {
  const accessKeyId = cleanSecret(process.env.AWS_ACCESS_KEY_ID);
  const secretAccessKey = cleanSecret(process.env.AWS_SECRET_ACCESS_KEY);
  const sessionToken = cleanSecret(process.env.AWS_SESSION_TOKEN);

  if (!accessKeyId || !secretAccessKey) {
    return undefined;
  }

  return {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {}),
  };
}
