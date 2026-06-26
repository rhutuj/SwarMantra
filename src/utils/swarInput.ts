export const SWAR_MAP: Record<string, string> = {
  s: 'S',
  r: 'R',
  g: 'G',
  m: 'M',
  p: 'P',
  d: 'D',
  n: 'N',
}

export const MODIFIER_KEYS = new Set(['q', 'a', 'k', 't'])

export const SWAR_LETTERS = new Set(['s', 'r', 'g', 'm', 'p', 'd', 'n'])

export const KOMAL_SWARAS = new Set(['r', 'g', 'd', 'n'])

export const TIVRA_SWARAS = new Set(['m'])

export function isSwarLetter(key: string): boolean {
  return SWAR_LETTERS.has(key.toLowerCase())
}

export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key.toLowerCase())
}

export function beep(): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 440
    osc.type = 'sine'
    gain.gain.value = 0.3
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.stop(ctx.currentTime + 0.1)
  } catch {
    // AudioContext not available, ignore
  }
}

export function flashElement(el: HTMLElement): void {
  el.classList.add('ring-2', 'ring-red-500')
  setTimeout(() => {
    el.classList.remove('ring-2', 'ring-red-500')
  }, 200)
}

export function isValidCombination(swarKey: string, mods: Set<string>): { valid: boolean; reason?: string } {
  if (mods.has('k') && !KOMAL_SWARAS.has(swarKey)) {
    return { valid: false, reason: 'Komal only applies to RE, GA, DHA, NI' }
  }
  if (mods.has('t') && !TIVRA_SWARAS.has(swarKey)) {
    return { valid: false, reason: 'Tivra only applies to MA' }
  }
  if (mods.has('q') && mods.has('a')) {
    return { valid: false, reason: 'Tar and Mandra cannot coexist' }
  }
  if (mods.has('t') && mods.has('k')) {
    return { valid: false, reason: 'Tivra and Komal cannot coexist' }
  }
  return { valid: true }
}

export function getUnicodeSwar(swarKey: string, mods: Set<string>): string {
  const base = SWAR_MAP[swarKey.toLowerCase()]
  if (!base) return swarKey.toUpperCase()

  let result = base

  // Order of combining marks matters for rendering
  // Komal first (macron below)
  if (mods.has('k')) {
    result += '\u0331'
  }

  // Tivra (macron above)
  if (mods.has('t')) {
    result += '\u0304'
  }

  // Saptak marks
  if (mods.has('q')) {
    result += '\u0307'
  }

  if (mods.has('a')) {
    result += '\u0323'
  }

  return result
}

export function processSwarKey(
  currentValue: string,
  cursorStart: number,
  cursorEnd: number,
  key: string,
  mods: Set<string>
): { newValue: string; newCursor: number } {
  const swarKey = key.toLowerCase()

  const validation = isValidCombination(swarKey, mods)
  const swar = validation.valid ? getUnicodeSwar(swarKey, mods) : SWAR_MAP[swarKey]

  const before = currentValue.slice(0, cursorStart)
  const after = currentValue.slice(cursorEnd)

  const newValue = before + swar + after
  const newCursor = cursorStart + swar.length

  return { newValue, newCursor }
}
