import type { AxiosError } from 'axios';

type ApiErrorBody = { error?: string };

export function getAuthErrorMessage(
  err: unknown,
  kind: 'login' | 'register' = 'login',
): string {
  const axiosErr = err as AxiosError<ApiErrorBody>;
  const status = axiosErr.response?.status;
  const apiMessage = axiosErr.response?.data?.error;

  if (!axiosErr.response) {
    return 'Service indisponible. Vérifiez votre connexion ou réessayez plus tard.';
  }

  if (status === 401 || status === 403) {
    if (kind === 'login') {
      return apiMessage
        || 'Identifiants incorrects. Pas encore de compte ? Inscrivez-vous.';
    }
    return apiMessage || 'Accès refusé.';
  }

  if (status === 409) {
    return apiMessage || 'Email ou téléphone déjà utilisé.';
  }

  if (status && status >= 500) {
    return 'Service indisponible. Réessayez dans quelques instants.';
  }

  if (kind === 'register') {
    return apiMessage || 'Erreur lors de l\'inscription. Réessayez ou contactez le support.';
  }

  return apiMessage || 'Identifiants incorrects. Pas encore de compte ? Inscrivez-vous.';
}
