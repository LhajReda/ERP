type AxiosLikeError = {
  message?: unknown;
  response?: {
    data?: {
      message?: unknown;
    };
  };
};

const stringifyMessage = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const merged = value.filter((item): item is string => typeof item === 'string').join(', ');
    return merged || null;
  }
  return null;
};

export const getErrorMessage = (
  error: unknown,
  fallback = 'Operation echouee.',
): string => {
  const direct = stringifyMessage(error);
  if (direct) return direct;

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const e = error as AxiosLikeError;
    const apiMessage = stringifyMessage(e.response?.data?.message);
    if (apiMessage) return apiMessage;
    const genericMessage = stringifyMessage(e.message);
    if (genericMessage) return genericMessage;
  }

  return fallback;
};
