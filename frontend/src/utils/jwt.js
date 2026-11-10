/** Decodifica una parte (header o payload) de un JWT. Solo lectura: la firma la verifica el backend. */
function decodificarParte(parte) {
  const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  )
  return JSON.parse(json)
}

export function decodificarJwt(token) {
  try {
    const [header, payload, firma] = token.split('.')
    return { header: decodificarParte(header), payload: decodificarParte(payload), firma }
  } catch {
    return null
  }
}

/** Segundos que le quedan al token (0 si ya expiró) */
export function segundosRestantes(token) {
  const exp = decodificarJwt(token)?.payload?.exp
  return exp ? Math.max(0, Math.floor(exp - Date.now() / 1000)) : 0
}
